import pg from "pg";
import { logger } from "./logger";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  message: string;
  amount: number;
  createdAt: string;
}

const dbUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;
const pool = dbUrl
  ? new pg.Pool({
      connectionString: dbUrl,
      max: 5,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
      idleTimeoutMillis: 0,
    })
  : null;

if (pool) {
  pool
    .query(`
      CREATE TABLE IF NOT EXISTS leads (
        id            TEXT        PRIMARY KEY,
        name          TEXT        NOT NULL,
        phone         TEXT        NOT NULL,
        message       TEXT        NOT NULL DEFAULT '',
        amount        INTEGER     NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
    .then(() => logger.info("Tabela leads pronta"))
    .catch((err) => logger.error({ err }, "Erro ao criar tabela leads"));
}

// Fallback em memória quando não há banco configurado
const memLeads: Lead[] = [];

export async function saveLead(data: Omit<Lead, "id" | "createdAt">): Promise<Lead> {
  const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();

  if (!pool) {
    const lead: Lead = { id, createdAt, ...data };
    memLeads.push(lead);
    return lead;
  }

  await pool.query(
    `INSERT INTO leads (id, name, phone, message, amount, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())`,
    [id, data.name, data.phone, data.message, data.amount],
  );

  return { id, createdAt, ...data };
}

export async function getAllLeads(): Promise<Lead[]> {
  if (!pool) return [...memLeads];

  const result = await pool.query(
    `SELECT id, name, phone, message, amount, created_at FROM leads ORDER BY created_at DESC`,
  );

  return result.rows.map((row) => ({
    id:        row.id as string,
    name:      row.name as string,
    phone:     row.phone as string,
    message:   row.message as string,
    amount:    row.amount as number,
    createdAt: (row.created_at as Date).toISOString(),
  }));
}
