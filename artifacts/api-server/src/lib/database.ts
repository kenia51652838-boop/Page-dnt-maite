import pg from "pg";
import { logger } from "./logger";

const isProduction = process.env.NODE_ENV === "production";
const rawDatabaseUrl = process.env.DATABASE_URL?.trim();

function validateDatabaseUrl(value: string): string {
  if (value.includes("${") || value.includes("$")) {
    throw new Error("DATABASE_URL contains an unresolved environment variable reference");
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("DATABASE_URL is not a valid URL");
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error("DATABASE_URL must use the postgres:// or postgresql:// protocol");
  }
  if (!parsed.hostname || !parsed.pathname.slice(1)) {
    throw new Error("DATABASE_URL must include a host and database name");
  }

  return value;
}

if (isProduction && !rawDatabaseUrl) {
  throw new Error("DATABASE_URL is required in production");
}

let databaseUrl: string | null = null;

if (rawDatabaseUrl) {
  try {
    databaseUrl = validateDatabaseUrl(rawDatabaseUrl);
  } catch (err) {
    if (isProduction) throw err;
    logger.warn({ err }, "Ignoring invalid DATABASE_URL in development; using in-memory storage");
  }
}

export const databasePool = databaseUrl
  ? new pg.Pool({
      connectionString: databaseUrl,
      max: 10,
      connectionTimeoutMillis: 10_000,
      idleTimeoutMillis: 30_000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10_000,
    })
  : null;

databasePool?.on("error", (err) => {
  logger.error({ err }, "Unexpected PostgreSQL pool error");
});

export async function checkDatabase(): Promise<boolean> {
  if (!databasePool) return !isProduction;

  try {
    await databasePool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export async function connectDatabase(): Promise<void> {
  if (!databasePool) {
    logger.warn("DATABASE_URL is not configured; using in-memory storage in development");
    return;
  }

  await databasePool.query("SELECT 1");
  logger.info("PostgreSQL connection established");
}
