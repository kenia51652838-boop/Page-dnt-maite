import app from "./app";
import { logger } from "./lib/logger";
import { startUtmifyRetryJob } from "./lib/utmifyRetryJob";
import { connectDatabase } from "./lib/database";
import { initializeTxStore } from "./lib/txStore";
import { initializeLeadsStore } from "./lib/leadsStore";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start(): Promise<void> {
  try {
    await connectDatabase();
    await initializeTxStore();
    await initializeLeadsStore();
  } catch (err) {
    logger.fatal({ err }, "Database initialization failed; server will not start");
    process.exit(1);
  }

  app.listen(port, (err) => {
    if (err) {
      logger.error({ err }, "Error listening on port");
      process.exit(1);
    }

    logger.info({ port }, "Server listening");
    startUtmifyRetryJob();
  });
}

start().catch((err) => {
  logger.fatal({ err }, "Unexpected startup error");
  process.exit(1);
});
