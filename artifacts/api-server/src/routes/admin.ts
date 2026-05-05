import { Router } from "express";
import { getTransactionFull } from "../lib/lumina";
import { logger } from "../lib/logger";
import { sendUtmifyOrder } from "../lib/utmify";
import { markPaid, getTx, getTxByExternalId, markUtmifyNotified } from "../lib/txStore";

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
        // 2. Não está no banco — tenta buscar na Lumina como fallback
        const lumina = await getTransactionFull(txId);
        entry.luminaStatus = lumina.status;

        if (!lumina.isPaid) {
          entry.skipped = "não encontrada no banco nem confirmada como paga na Lumina";
          results.push(entry);
          continue;
        }

        const utmOk = await sendUtmifyOrder({
          orderId:       txId,
          status:        "paid",
          createdAt:     lumina.createdAt,
          approvedAt:    new Date(),
          customer:      {
            name:     lumina.customer.name,
            email:    lumina.customer.email,
            phone:    lumina.customer.phone,
            document: lumina.customer.document.replace(/\D/g, ""),
          },
          amountInCents: lumina.amountInCents,
          tracking: { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null },
        });

        entry.utmifyFired = utmOk;
        entry.amount      = `R$ ${(lumina.amountInCents / 100).toFixed(2)}`;
        if (utmOk) {
          logger.info({ txId }, "Admin: UTMify paid confirmado via Lumina API");
        } else {
          entry.note = "UTMify rejeitou o evento via Lumina — verifique os logs";
          logger.warn({ txId }, "Admin: UTMify recusou o evento paid via Lumina");
        }
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
    const [lumina, dbTx] = await Promise.all([
      getTransactionFull(txId),
      getTx(txId),
    ]);

    res.json({
      txId,
      lumina: {
        status:      lumina.status,
        isPaid:      lumina.isPaid,
        amount:      `R$ ${(lumina.amountInCents / 100).toFixed(2)}`,
        customer:    lumina.customer,
        createdAt:   lumina.createdAt,
        rawBody:     lumina.rawBody,
      },
      database: dbTx ? {
        status:      dbTx.status,
        amount:      `R$ ${(dbTx.amountInCents / 100).toFixed(2)}`,
        customer:    dbTx.customer,
        tracking:    dbTx.tracking,
        createdAt:   dbTx.createdAt,
      } : null,
    });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

export default router;
