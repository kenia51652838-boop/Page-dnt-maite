import { getPaidNotNotified, markUtmifyNotified } from "./txStore";
import { sendUtmifyOrder } from "./utmify";
import { logger } from "./logger";

const INTERVAL_MS = 10 * 1000; // 10 segundos

async function runRetry() {
  try {
    const pending = await getPaidNotNotified();
    if (pending.length === 0) return;

    logger.info({ count: pending.length }, "UTMify retry job: processando transações pendentes");

    for (const tx of pending) {
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
        logger.info({ orderId: tx.orderId, amount: tx.amountInCents }, "UTMify retry: evento paid confirmado e marcado");
      } else {
        logger.warn({ orderId: tx.orderId }, "UTMify retry: falhou, tentará novamente no próximo ciclo");
      }
    }
  } catch (err) {
    logger.error({ err }, "UTMify retry job: erro geral");
  }
}

export function startUtmifyRetryJob() {
  // Roda imediatamente na inicialização para pegar qualquer pendente
  setTimeout(() => { runRetry().catch(() => {}); }, 5_000);
  // Depois roda a cada 30 segundos
  setInterval(() => { runRetry().catch(() => {}); }, INTERVAL_MS);
  logger.info("UTMify retry job iniciado (intervalo: 30 segundos)");
}
