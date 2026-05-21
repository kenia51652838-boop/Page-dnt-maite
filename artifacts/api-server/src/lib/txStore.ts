import pg from "pg";
import { logger } from "./logger";
import type { UtmifyCustomer, UtmifyTrackingParams } from "./utmify";

export interface StoredTx {
  orderId:            string;
  externalId?:        string;
  status:             "waiting_payment" | "paid";
  createdAt:          Date;
  amountInCents:      number;
  customer:           UtmifyCustomer;
  tracking:           UtmifyTrackingParams;
  utmifyNotifiedAt?:  Date | null;
}

const memStore   = new Map<string, StoredTx>();
const memByExtId = new Map<string, string>();

const dbUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;
const pool = dbUrl
  ? new pg.Pool({ connectionString: dbUrl, max: 5 })
  : null;

async function runMigrations() {
  if (!pool) {
    logger.warn("[txStore] Sem banco configurado — usando memória");
    return;
  }
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        order_id            TEXT PRIMARY KEY,
        external_id         TEXT,
        status              TEXT NOT NULL DEFAULT 'waiting_payment',
        amount_in_cents     INTEGER NOT NULL,
        customer            JSONB NOT NULL,
        tracking            JSONB NOT NULL,
        created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        paid_at             TIMESTAMPTZ,
        utmify_notified_at  TIMESTAMPTZ
      )
    `);
    logger.info("[txStore] Tabela transactions pronta");

    await Promise.all([
      pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS external_id TEXT`),
      pool.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS utmify_notified_at TIMESTAMPTZ`),
      pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_id)`),
      pool.query(`CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`),
    ]);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id          SERIAL PRIMARY KEY,
        received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        source      TEXT NOT NULL DEFAULT 'lumina',
        headers     JSONB,
        body        JSONB
      )
    `);
    logger.info("[txStore] Tabela webhook_logs pronta");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS error_logs (
        id           SERIAL PRIMARY KEY,
        occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        route        TEXT NOT NULL,
        error_msg    TEXT NOT NULL,
        error_stack  TEXT,
        user_ip      TEXT,
        context      JSONB
      )
    `);
    logger.info("[txStore] Tabela error_logs pronta");
  } catch (err) {
    logger.error({ err }, "[txStore] Erro nas migrations");
  }
}

runMigrations();

function rowToTx(row: Record<string, unknown>): StoredTx {
  return {
    orderId:           row.order_id as string,
    externalId:        row.external_id as string | undefined,
    status:            row.status as "waiting_payment" | "paid",
    createdAt:         new Date(row.created_at as string),
    amountInCents:     row.amount_in_cents as number,
    customer:          row.customer as UtmifyCustomer,
    tracking:          row.tracking as UtmifyTrackingParams,
    utmifyNotifiedAt:  row.utmify_notified_at ? new Date(row.utmify_notified_at as string) : null,
  };
}

export async function saveTx(tx: StoredTx): Promise<void> {
  if (!pool) {
    memStore.set(tx.orderId, tx);
    if (tx.externalId) memByExtId.set(tx.externalId, tx.orderId);
    return;
  }
  await pool.query(
    `INSERT INTO transactions (order_id, external_id, status, amount_in_cents, customer, tracking, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (order_id) DO NOTHING`,
    [tx.orderId, tx.externalId ?? null, tx.status, tx.amountInCents, tx.customer, tx.tracking, tx.createdAt],
  );
}

export async function getTx(orderId: string): Promise<StoredTx | undefined> {
  if (!pool) return memStore.get(orderId);
  const result = await pool.query(`SELECT * FROM transactions WHERE order_id = $1`, [orderId]);
  return result.rows[0] ? rowToTx(result.rows[0]) : undefined;
}

export async function getTxByExternalId(externalId: string): Promise<StoredTx | undefined> {
  if (!pool) {
    const orderId = memByExtId.get(externalId);
    if (!orderId) return undefined;
    return memStore.get(orderId);
  }
  const result = await pool.query(`SELECT * FROM transactions WHERE external_id = $1`, [externalId]);
  return result.rows[0] ? rowToTx(result.rows[0]) : undefined;
}

export async function markPaid(orderId: string): Promise<StoredTx | undefined> {
  if (!pool) {
    const tx = memStore.get(orderId);
    if (!tx || tx.status === "paid") return undefined;
    tx.status = "paid";
    memStore.set(orderId, tx);
    return tx;
  }
  const result = await pool.query(
    `UPDATE transactions SET status = 'paid', paid_at = NOW()
     WHERE order_id = $1 AND status = 'waiting_payment' RETURNING *`,
    [orderId],
  );
  return result.rows[0] ? rowToTx(result.rows[0]) : undefined;
}

export async function markPaidByExternalId(externalId: string): Promise<StoredTx | undefined> {
  if (!pool) {
    const orderId = memByExtId.get(externalId);
    if (!orderId) return undefined;
    return markPaid(orderId);
  }
  const result = await pool.query(
    `UPDATE transactions SET status = 'paid', paid_at = NOW()
     WHERE external_id = $1 AND status = 'waiting_payment' RETURNING *`,
    [externalId],
  );
  return result.rows[0] ? rowToTx(result.rows[0]) : undefined;
}

// Marca que o UTMify foi notificado com sucesso para esta transação
export async function markUtmifyNotified(orderId: string): Promise<void> {
  if (!pool) {
    const tx = memStore.get(orderId);
    if (tx) { tx.utmifyNotifiedAt = new Date(); memStore.set(orderId, tx); }
    return;
  }
  await pool.query(
    `UPDATE transactions SET utmify_notified_at = NOW() WHERE order_id = $1`,
    [orderId],
  );
}

// Salva payload bruto de webhook para diagnóstico
export async function logWebhook(source: string, headers: Record<string, unknown>, body: unknown): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(
      `INSERT INTO webhook_logs (source, headers, body) VALUES ($1, $2, $3)`,
      [source, JSON.stringify(headers), JSON.stringify(body)],
    );
  } catch (err) {
    console.error("[txStore] logWebhook error:", err);
  }
}

// Retorna últimos logs de webhook
export async function getWebhookLogs(limit = 20): Promise<Array<Record<string, unknown>>> {
  if (!pool) return [];
  const result = await pool.query(
    `SELECT id, received_at, source, headers, body FROM webhook_logs ORDER BY received_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
}

// Salva um erro de servidor para diagnóstico
export async function logError(
  route: string,
  err: unknown,
  userIp?: string,
  context?: Record<string, unknown>,
): Promise<void> {
  const msg   = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? (err.stack ?? null) : null;
  if (!pool) {
    console.error(`[errorLog] ${route}: ${msg}`);
    return;
  }
  try {
    await pool.query(
      `INSERT INTO error_logs (route, error_msg, error_stack, user_ip, context)
       VALUES ($1, $2, $3, $4, $5)`,
      [route, msg, stack, userIp ?? null, context ? JSON.stringify(context) : null],
    );
  } catch (e) {
    console.error("[txStore] logError falhou:", e);
  }
}

// Retorna últimos erros registrados
export async function getErrorLogs(limit = 50): Promise<Array<Record<string, unknown>>> {
  if (!pool) return [];
  const result = await pool.query(
    `SELECT id, occurred_at, route, error_msg, error_stack, user_ip, context
     FROM error_logs ORDER BY occurred_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
}

// Retorna transações pagas que ainda não foram notificadas ao UTMify
export async function getPaidNotNotified(): Promise<StoredTx[]> {
  if (!pool) {
    return Array.from(memStore.values()).filter(
      tx => tx.status === "paid" && !tx.utmifyNotifiedAt,
    );
  }
  const result = await pool.query(
    `SELECT * FROM transactions
     WHERE status = 'paid' AND utmify_notified_at IS NULL
     ORDER BY created_at ASC LIMIT 50`,
  );
  return result.rows.map(rowToTx);
}
