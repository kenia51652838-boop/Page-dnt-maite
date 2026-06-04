import { Router } from "express";
import { logger } from "../lib/logger";
import { sendUtmifyOrder } from "../lib/utmify";
import { markPaid, getTx, getTxByExternalId, markUtmifyNotified, getErrorLogs } from "../lib/txStore";

const router = Router();

// Verifica o token de admin (usa SESSION_SECRET como senha)
function checkAdminToken(req: import("express").Request, res: import("express").Response): boolean {
  const secret = process.env["SESSION_SECRET"];
  const token  = (req.headers["x-admin-token"] as string) || req.query["token"] as string || "";
  if (!secret || token !== secret) {
    res.status(401).json({ error: "Token de admin inválido" });
    return false;
  }
  return true;
}

/**
 * POST /api/admin/recover-sales
 * Body: { txIds: string[] }
 * Header: x-admin-token: <SESSION_SECRET>
 *
 * Para cada txId da Lumina:
 * 1. Busca detalhes completos na Lumina
 * 2. Verifica se já está no nosso banco
 * 3. Marca como pago
 * 4. Dispara evento paid no UTMify
 */
router.post("/admin/recover-sales", async (req, res) => {
  if (!checkAdminToken(req, res)) return;

  const { txIds } = req.body as { txIds?: string[] };

  if (!Array.isArray(txIds) || txIds.length === 0) {
    res.status(400).json({ error: "Envie um array txIds com os IDs da Lumina" });
    return;
  }

  const results: Record<string, unknown>[] = [];

  for (const rawId of txIds) {
    const txId = String(rawId).trim();
    if (!txId) continue;

    const entry: Record<string, unknown> = { txId, utmifyFired: false };

    try {
      logger.info({ txId }, "Admin: recuperando venda");

      // 1. Verifica o banco local — tenta por order_id e depois por external_id
      const dbTx = (await getTx(txId)) ?? (await getTxByExternalId(txId));

      if (dbTx) {
        // Transação está no banco — se ainda está pendente, marca como paga agora
        if (dbTx.status === "waiting_payment") {
          await markPaid(dbTx.orderId);
          entry.markedInDb = true;
        } else {
          entry.markedInDb = false;
          entry.note = "já estava paga no banco";
        }

        // Dispara UTMify com os dados completos do banco (usa orderId real, não o txId passado)
        const utmOk = await sendUtmifyOrder({
          orderId:       dbTx.orderId,
          status:        "paid",
          createdAt:     dbTx.createdAt,
          approvedAt:    new Date(),
          customer:      dbTx.customer,
          amountInCents: dbTx.amountInCents,
          tracking:      dbTx.tracking,
        });

        if (utmOk) {
          await markUtmifyNotified(dbTx.orderId);
          entry.utmifyFired = true;
          logger.info({ txId, realOrderId: dbTx.orderId, amount: dbTx.amountInCents }, "Admin: UTMify paid confirmado (via banco)");
        } else {
          entry.utmifyFired = false;
          entry.note = "UTMify rejeitou o evento — verifique os logs";
          logger.warn({ txId, realOrderId: dbTx.orderId }, "Admin: UTMify recusou o evento paid (via banco)");
        }

        entry.realOrderId = dbTx.orderId;
        entry.amount      = `R$ ${(dbTx.amountInCents / 100).toFixed(2)}`;
        entry.customer    = dbTx.customer.name;

      } else {
        // 2. Não está no banco — Lumina não oferece endpoint de consulta, não é possível recuperar
        entry.skipped = "não encontrada no banco local (Lumina não possui endpoint de consulta)";
        results.push(entry);
        continue;
      }

    } catch (err) {
      entry.error = err instanceof Error ? err.message : String(err);
      logger.error({ err, txId }, "Admin: erro ao recuperar venda");
    }

    results.push(entry);
  }

  const fired   = results.filter(r => r.utmifyFired).length;
  const skipped = results.filter(r => r.skipped || r.error).length;

  res.json({
    summary: `${fired} eventos disparados, ${skipped} ignorados/erros`,
    results,
  });
});

/**
 * GET /api/admin/check-sale?txId=XXX&token=YYY
 * Consulta os detalhes de uma transação na Lumina + banco local
 */
router.get("/admin/check-sale", async (req, res) => {
  if (!checkAdminToken(req, res)) return;

  const txId = String(req.query["txId"] || "").trim();
  if (!txId) {
    res.status(400).json({ error: "Parâmetro txId obrigatório" });
    return;
  }

  try {
    const dbTx = await getTx(txId);

    res.json({
      txId,
      note: "A Lumina não oferece endpoint de consulta — status disponível apenas via banco local (atualizado pelo webhook).",
      database: dbTx ? {
        status:      dbTx.status,
        amount:      `R$ ${(dbTx.amountInCents / 100).toFixed(2)}`,
        customer:    dbTx.customer,
        tracking:    dbTx.tracking,
        createdAt:   dbTx.createdAt,
        paidAt:      dbTx.paidAt ?? null,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

/**
 * GET /api/admin/errors?token=YYY&limit=50
 * Lista os últimos erros registrados no banco
 */
router.get("/admin/errors", async (req, res) => {
  if (!checkAdminToken(req, res)) return;

  const limit = Math.min(Number(req.query["limit"] || 50), 200);

  try {
    const logs = await getErrorLogs(limit);
    res.json({
      count: logs.length,
      errors: logs.map(r => ({
        id:          r.id,
        occurred_at: r.occurred_at,
        route:       r.route,
        error_msg:   r.error_msg,
        user_ip:     r.user_ip,
        context:     r.context,
        stack:       r.error_stack,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
