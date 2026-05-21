import { Router } from "express";
import { createPixTransaction, checkPixStatus, getTransactionFull } from "../lib/lumina";
import { logger } from "../lib/logger";
import { sendUtmifyOrder, type UtmifyTrackingParams } from "../lib/utmify";
import { saveTx, getTx, markPaid, markPaidByExternalId, markUtmifyNotified, logWebhook, getWebhookLogs, logError } from "../lib/txStore";

const router = Router();

// POST /api/pix/create
router.post("/pix/create", async (req, res) => {
  try {
    const {
      amount,
      customer_name,
      customer_email,
      customer_phone,
      customer_cpf,
      utm,
    } = req.body as Record<string, unknown>;

    if (!amount || !customer_name || !customer_email || !customer_phone || !customer_cpf) {
      res.status(400).json({ error: "Campos obrigatórios: amount, customer_name, customer_email, customer_phone, customer_cpf" });
      return;
    }

    const webhookBase = process.env["WEBHOOK_BASE_URL"]?.replace(/\/$/, "");
    const host = req.headers.host || "";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const postback_url = webhookBase
      ? `${webhookBase}/api/webhook/lumina`
      : `${protocol}://${host}/api/webhook/lumina`;
    const external_id = `hot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    logger.info({ postback_url, external_id }, "Criando transação PIX — postback URL enviado à Lumina");

    const result = await createPixTransaction({
      amount: Number(amount),
      customer_name: String(customer_name),
      customer_email: String(customer_email),
      customer_phone: String(customer_phone),
      customer_cpf: String(customer_cpf),
      postback_url,
      external_id,
    });

    const amountInCents = Math.round(Number(amount) * 100);
    const tracking: UtmifyTrackingParams = {
      src:          (utm as Record<string, string>)?.src          || null,
      sck:          (utm as Record<string, string>)?.sck          || null,
      utm_source:   (utm as Record<string, string>)?.utm_source   || null,
      utm_campaign: (utm as Record<string, string>)?.utm_campaign || null,
      utm_medium:   (utm as Record<string, string>)?.utm_medium   || null,
      utm_content:  (utm as Record<string, string>)?.utm_content  || null,
      utm_term:     (utm as Record<string, string>)?.utm_term     || null,
    };

    const clientIp = ((req.headers["x-forwarded-for"] as string) || "")
      .split(",")[0].trim() || undefined;

    // Usa o ID da Lumina se disponível, senão usa nosso external_id como fallback
    const txId = result.transaction_id || external_id;

    await saveTx({
      orderId:       txId,
      externalId:    external_id,
      status:        "waiting_payment",
      createdAt:     new Date(),
      amountInCents,
      customer: {
        name:     String(customer_name),
        email:    String(customer_email),
        phone:    String(customer_phone),
        document: String(customer_cpf).replace(/\D/g, ""),
        ...(clientIp ? { ip: clientIp } : {}),
      },
      tracking,
    });

    logger.info({ txId, externalId: external_id }, "Transação PIX criada e salva");

    sendUtmifyOrder({
      orderId:       txId,
      status:        "waiting_payment",
      createdAt:     new Date(),
      approvedAt:    null,
      customer: {
        name:     String(customer_name),
        email:    String(customer_email),
        phone:    String(customer_phone),
        document: String(customer_cpf).replace(/\D/g, ""),
        ...(clientIp ? { ip: clientIp } : {}),
      },
      amountInCents,
      tracking,
    }).catch((err) => {
      logger.warn({ err }, "UTMify waiting_payment falhou silenciosamente");
    });

    res.json({ success: true, ...result });
  } catch (err) {
    const userIp = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || undefined;
    logger.error({ err }, "Erro ao criar transação PIX");
    logError("POST /api/pix/create", err, userIp, {
      amount: req.body?.amount,
      utm: req.body?.utm,
    }).catch(() => {});
    const msg = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: msg });
  }
});

// POST /api/pix/create-upsell  (conta de energia — sem dados do cliente)
router.post("/pix/create-upsell", async (req, res) => {
  try {
    const amount = Number((req.body as Record<string, unknown>).amount) || 26.49;

    // Gera cliente anônimo no servidor — mesma lógica do frontend
    const FIRST = ["Ana","Beatriz","Camila","Daniela","Fernanda","Gabriela","Helena","Juliana","Larissa","Mariana","Natália","Patrícia","Rafaela","Sabrina","Tatiane","Vanessa","Carlos","Daniel","Eduardo","Felipe","Gabriel","Henrique","João","Lucas","Marcos","Pedro","Rafael","Rodrigo","Thiago","Vitor","André","Bruno","Caio","Diego","Gustavo","Leonardo","Mateus","Renan","Samuel","Vinícius"];
    const LAST  = ["Silva","Santos","Oliveira","Souza","Lima","Costa","Ferreira","Rodrigues","Alves","Pereira","Martins","Ribeiro","Carvalho","Gomes","Barbosa","Rocha","Dias","Monteiro","Nunes","Araújo","Correia","Cardoso","Melo","Nascimento","Andrade","Barros","Duarte","Freitas","Lopes","Leite","Mendes","Teixeira","Vieira","Soares","Torres","Braga","Gonçalves","Reis","Brito","Caldas"];
    const pick  = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

    const firstName = pick(FIRST);
    const lastName  = pick(LAST);
    const fullName  = `${firstName} ${lastName}`;
    const slug      = fullName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
    const phone     = `119${String(Math.floor(10000000 + Math.random() * 89999999))}`;
    const email     = `${slug}${Math.floor(100 + Math.random() * 900)}@gmail.com`;

    // CPF válido
    const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
    let sum = digits.reduce((acc, v, i) => acc + v * (10 - i), 0);
    const d1 = (sum * 10) % 11; digits.push(d1 < 10 ? d1 : 0);
    sum = digits.reduce((acc, v, i) => acc + v * (11 - i), 0);
    const d2 = (sum * 10) % 11; digits.push(d2 < 10 ? d2 : 0);
    const cpf = digits.join("");

    const webhookBase = process.env["WEBHOOK_BASE_URL"]?.replace(/\/$/, "");
    const host        = req.headers.host || "";
    const protocol    = req.headers["x-forwarded-proto"] || "https";
    const postback_url = webhookBase
      ? `${webhookBase}/api/webhook/lumina`
      : `${protocol}://${host}/api/webhook/lumina`;

    const external_id = `upsell_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    logger.info({ external_id, amount }, "Criando PIX upsell (conta energia)");

    const result = await createPixTransaction({
      amount,
      customer_name:  fullName,
      customer_email: email,
      customer_phone: phone,
      customer_cpf:   cpf,
      postback_url,
      external_id,
      product_title:  "Hot - Assinatura quente",
    });

    const amountInCents = Math.round(amount * 100);
    const txId = result.transaction_id || external_id;

    await saveTx({
      orderId:       txId,
      externalId:    external_id,
      status:        "waiting_payment",
      createdAt:     new Date(),
      amountInCents,
      customer: { name: fullName, email, phone, document: cpf },
      tracking:      {},
    });

    sendUtmifyOrder({
      orderId:       txId,
      status:        "waiting_payment",
      createdAt:     new Date(),
      approvedAt:    null,
      customer: { name: fullName, email, phone, document: cpf },
      amountInCents,
      tracking:      {},
    }).catch((err) => logger.warn({ err }, "UTMify upsell waiting falhou silenciosamente"));

    res.json({ success: true, ...result });
  } catch (err) {
    const userIp = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || undefined;
    logger.error({ err }, "Erro ao criar PIX upsell");
    logError("POST /api/pix/create-upsell", err, userIp, {
      amount: (req.body as Record<string, unknown>)?.amount,
    }).catch(() => {});
    res.status(500).json({ error: err instanceof Error ? err.message : "Erro interno" });
  }
});

// GET /api/pix/debug/:id — diagnóstico temporário
router.get("/pix/debug/:id", async (req, res) => {
  const { id } = req.params;
  const key = process.env["LUMINA_SECRET_KEY"] || "";
  const BASE = "https://api.luminapagamentos.com.br/api/v1";
  const localTx = await getTx(id).catch(() => null);
  const externalId = localTx?.externalId;
  const results: Record<string, unknown> = { has_key: !!key, key_prefix: key.slice(0, 8), local_tx: localTx };
  for (const [label, url] of [
    ["getPayment_byId", `${BASE}/transaction.getPayment?id=${encodeURIComponent(id)}`],
    ["getByExternalId", externalId ? `${BASE}/transaction.getByExternalId?id=${encodeURIComponent(externalId)}` : null],
  ] as [string, string | null][]) {
    if (!url) { results[label] = "no_external_id"; continue; }
    try {
      const r = await fetch(url, { headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" } });
      const body = await r.json();
      results[label] = { http_status: r.status, body };
    } catch (e) {
      results[label] = { error: String(e) };
    }
  }
  res.json(results);
});

// GET /api/pix/status/:id
router.get("/pix/status/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Checa banco local primeiro — atualizado pelo webhook da Lumina
    const localTx = await getTx(id);
    if (localTx?.status === "paid") {
      logger.info({ txId: id }, "Polling: pagamento detectado via banco local (webhook já processado)");

      // Garante UTMify notificado
      if (!localTx.utmifyNotifiedAt) {
        const utmOk = await sendUtmifyOrder({
          orderId:       id,
          status:        "paid",
          createdAt:     localTx.createdAt,
          approvedAt:    new Date(),
          customer:      localTx.customer,
          amountInCents: localTx.amountInCents,
          tracking:      localTx.tracking,
        });
        if (utmOk) {
          await markUtmifyNotified(id);
          logger.info({ txId: id }, "UTMify paid confirmado via polling (banco local)");
        }
      }

      res.json({ success: true, status: "paid", raw_status: "PAID_LOCAL", transaction_id: id });
      return;
    }

    // 2. Fallback: tenta consultar a Lumina (pode falhar silenciosamente)
    try {
      const externalId = localTx?.externalId || undefined;
      const result = await checkPixStatus(id, externalId);
      logger.info({ txId: id, externalId, luminaStatus: result.raw_status, mappedStatus: result.status }, "Polling status PIX via Lumina");

      if (result.status === "paid") {
        const tx = await markPaid(id);
        if (tx) {
          logger.info({ txId: id }, "Transação marcada como paga via polling Lumina — disparando UTMify");
          const utmOk = await sendUtmifyOrder({
            orderId:       id,
            status:        "paid",
            createdAt:     tx.createdAt,
            approvedAt:    new Date(),
            customer:      tx.customer,
            amountInCents: tx.amountInCents,
            tracking:      tx.tracking,
          });
          if (utmOk) {
            await markUtmifyNotified(id);
            logger.info({ txId: id }, "UTMify paid confirmado e marcado via polling Lumina");
          } else {
            logger.warn({ txId: id }, "UTMify paid FALHOU via polling Lumina — retry job tentará novamente");
          }
        }
      }

      res.json({ success: true, ...result });
    } catch (luminaErr) {
      // Lumina inacessível — retorna pending sem erro para o cliente continuar polando
      logger.warn({ txId: id, err: luminaErr }, "Lumina inacessível no polling — aguardando webhook");
      res.json({ success: true, status: "pending", raw_status: "LUMINA_UNREACHABLE", transaction_id: id });
    }
  } catch (err) {
    logger.error({ err }, "Erro ao consultar status PIX");
    const msg = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: msg });
  }
});

// GET /api/webhook/logs — consulta logs de webhooks recebidos
router.get("/webhook/logs", async (_req, res) => {
  try {
    const logs = await getWebhookLogs(30);
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

// POST /api/webhook/lumina
router.post("/webhook/lumina", async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>;

    // Salva payload bruto no banco para diagnóstico
    const safeHeaders: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(req.headers)) safeHeaders[k] = v;
    await logWebhook("lumina", safeHeaders, body).catch(() => {});

    // Log completo do payload para facilitar debug
    logger.info({ rawBody: JSON.stringify(body) }, "Webhook Lumina - payload completo");

    // ── Formato real da Lumina (v2) ──────────────────────────────────────
    // A Lumina envia event_type no root e os dados dentro de "transaction".
    // transaction.status permanece "pending" mesmo em pagamentos aprovados;
    // o campo correto para checar aprovação é event_type = "transaction.approved".
    const eventType = (body["event_type"] as string || "").toLowerCase();
    const txObj = (body["transaction"] || {}) as Record<string, unknown>;

    // ID: preferência para body.transaction.id (formato v2), com fallbacks
    const candidates = [
      txObj,
      body,
      body["_body"],
      body["data"],
      body["order"],
    ].filter(Boolean) as Record<string, unknown>[];

    let txId = "";
    for (const candidate of candidates) {
      if (typeof candidate !== "object") continue;
      const c = candidate as Record<string, unknown>;
      txId = txId || (
        c["id"]             ||
        c["transactionId"]  ||
        c["transaction_id"] ||
        c["externalId"]     ||
        c["external_id"]    ||
        c["orderId"]        ||
        c["order_id"]       ||
        ""
      ) as string;
      if (txId) break;
    }

    // Status: event_type tem precedência sobre transaction.status
    let rawStatus = "";
    if (eventType === "transaction.approved") {
      rawStatus = "APPROVED";
    } else if (eventType === "transaction.pending") {
      rawStatus = "PENDING";
    } else if (eventType) {
      rawStatus = eventType.replace("transaction.", "").toUpperCase();
    } else {
      // Fallback para formatos sem event_type
      for (const candidate of candidates) {
        if (typeof candidate !== "object") continue;
        const c = candidate as Record<string, unknown>;
        const s = (c["status"] || c["payment_status"] || c["paymentStatus"] || "") as string;
        if (s) { rawStatus = s.toUpperCase(); break; }
      }
    }

    const PAID_STATUSES = ["APPROVED", "PAID", "COMPLETED", "AUTHORIZED"];
    const isPaid = PAID_STATUSES.includes(rawStatus);

    logger.info({ txId, rawStatus, isPaid }, "Webhook Lumina processado");

    if (isPaid && txId) {
      // Tenta pelo order_id (ID Lumina) primeiro, depois pelo externalId (nosso ID)
      let tx = await markPaid(txId);
      if (!tx) {
        tx = await markPaidByExternalId(txId);
        if (tx) logger.info({ txId }, "Transação encontrada via externalId no webhook");
      }

      if (tx) {
        logger.info({ txId, orderId: tx.orderId }, "Disparando UTMify paid via webhook");
        const utmOk = await sendUtmifyOrder({
          orderId:       tx.orderId,
          status:        "paid",
          createdAt:     tx.createdAt,
          approvedAt:    new Date(),
          customer:      tx.customer,
          amountInCents: tx.amountInCents,
          tracking:      tx.tracking,
        });
        if (utmOk) {
          await markUtmifyNotified(tx.orderId);
          logger.info({ orderId: tx.orderId }, "UTMify paid confirmado e marcado via webhook");
        } else {
          logger.warn({ orderId: tx.orderId }, "UTMify paid FALHOU via webhook — transação ficará pendente para retry");
        }
      } else {
        // Transação não encontrada no banco local — tenta recuperar direto da Lumina
        logger.warn({ txId }, "Webhook paid: transação não encontrada no banco — tentando recuperar da Lumina");
        try {
          const lumina = await getTransactionFull(txId);
          if (lumina.isPaid) {
            // Salva no banco para referência futura
            await saveTx({
              orderId:       txId,
              externalId:    lumina.externalId || undefined,
              status:        "waiting_payment",
              createdAt:     lumina.createdAt,
              amountInCents: lumina.amountInCents,
              customer: {
                name:     lumina.customer.name,
                email:    lumina.customer.email,
                phone:    lumina.customer.phone,
                document: lumina.customer.document.replace(/\D/g, ""),
              },
              tracking: { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null },
            }).catch(() => {});

            const utmOk = await sendUtmifyOrder({
              orderId:       txId,
              status:        "paid",
              createdAt:     lumina.createdAt,
              approvedAt:    new Date(),
              customer: {
                name:     lumina.customer.name,
                email:    lumina.customer.email,
                phone:    lumina.customer.phone,
                document: lumina.customer.document.replace(/\D/g, ""),
              },
              amountInCents: lumina.amountInCents,
              tracking: { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null },
            });
            if (utmOk) {
              await markPaid(txId).catch(() => {});
              await markUtmifyNotified(txId).catch(() => {});
              logger.info({ txId }, "UTMify paid confirmado via recuperação Lumina no webhook");
            } else {
              logger.warn({ txId }, "UTMify rejeitou o evento recovered da Lumina — ficará sem notificação");
            }
          } else {
            logger.warn({ txId, luminaStatus: lumina.status }, "Webhook paid mas Lumina não confirma pagamento — ignorado");
          }
        } catch (recErr) {
          logger.error({ err: recErr, txId }, "Falha ao recuperar transação da Lumina no webhook");
        }
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    logger.error({ err }, "Erro ao processar webhook Lumina");
    res.status(200).json({ success: true });
  }
});

// POST /api/pix/create-vip
router.post("/pix/create-vip", async (req, res) => {
  try {
    const { name, email, phone, utm } = req.body as Record<string, unknown>;

    if (!name || !email || !phone) {
      res.status(400).json({ error: "Campos obrigatórios: name, email, phone" });
      return;
    }

    // Gera CPF anônimo válido
    const digits: number[] = Array.from({ length: 9 }, () => Math.floor(Math.random() * 9));
    let s1 = digits.reduce((acc, v, i) => acc + v * (10 - i), 0);
    const d1 = (s1 * 10) % 11; digits.push(d1 < 10 ? d1 : 0);
    let s2 = digits.reduce((acc, v, i) => acc + v * (11 - i), 0);
    const d2 = (s2 * 10) % 11; digits.push(d2 < 10 ? d2 : 0);
    const cpf = digits.join("");

    const webhookBase = process.env["WEBHOOK_BASE_URL"]?.replace(/\/$/, "");
    const host = req.headers.host || "";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const postback_url = webhookBase
      ? `${webhookBase}/api/webhook/lumina`
      : `${protocol}://${host}/api/webhook/lumina`;
    const external_id = `vip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const VIP_AMOUNT = 50;
    logger.info({ postback_url, external_id }, "Criando transação PIX VIP");

    const result = await createPixTransaction({
      amount: VIP_AMOUNT,
      customer_name: String(name),
      customer_email: String(email),
      customer_phone: String(phone).replace(/\D/g, ""),
      customer_cpf: cpf,
      postback_url,
      external_id,
      product_title: "Hot - Assinatura mensal",
    });

    const amountInCents = VIP_AMOUNT * 100;
    const clientIp = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || undefined;
    const txId = result.transaction_id || external_id;

    const tracking: UtmifyTrackingParams = {
      src:          (utm as Record<string, string>)?.src          || null,
      sck:          (utm as Record<string, string>)?.sck          || null,
      utm_source:   (utm as Record<string, string>)?.utm_source   || null,
      utm_campaign: (utm as Record<string, string>)?.utm_campaign || null,
      utm_medium:   (utm as Record<string, string>)?.utm_medium   || null,
      utm_content:  (utm as Record<string, string>)?.utm_content  || null,
      utm_term:     (utm as Record<string, string>)?.utm_term     || null,
    };

    await saveTx({
      orderId:       txId,
      externalId:    external_id,
      status:        "waiting_payment",
      createdAt:     new Date(),
      amountInCents,
      customer: {
        name:     String(name),
        email:    String(email),
        phone:    String(phone).replace(/\D/g, ""),
        document: cpf,
        ...(clientIp ? { ip: clientIp } : {}),
      },
      tracking,
    });

    sendUtmifyOrder({
      orderId:       txId,
      status:        "waiting_payment",
      createdAt:     new Date(),
      approvedAt:    null,
      customer: {
        name:     String(name),
        email:    String(email),
        phone:    String(phone).replace(/\D/g, ""),
        document: cpf,
        ...(clientIp ? { ip: clientIp } : {}),
      },
      amountInCents,
      tracking,
    }).catch((err) => logger.warn({ err }, "UTMify VIP waiting_payment falhou silenciosamente"));

    logger.info({ txId, externalId: external_id }, "Transação PIX VIP criada");
    res.json({ success: true, ...result });
  } catch (err) {
    const userIp = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || undefined;
    logger.error({ err }, "Erro ao criar transação PIX VIP");
    logError("POST /api/pix/create-vip", err, userIp, {
      utm: (req.body as Record<string, unknown>)?.utm,
    }).catch(() => {});
    const msg = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: msg });
  }
});

export default router;
