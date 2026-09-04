import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import { fileURLToPath } from "url";
import router from "./routes";
import { logger } from "./lib/logger";
import { checkDatabase } from "./lib/database";

const app: Express = express();

// Necessário para Railway (e qualquer proxy reverso): garante que req.ip e
// x-forwarded-for reflitam o IP real do cliente, incluindo endereços IPv6.
app.set("trust proxy", true);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function healthHandler(_req: Request, res: Response) {
  const databaseReady = await checkDatabase();
  res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "unavailable",
    database: databaseReady ? "ready" : "unavailable",
    ts: Date.now(),
  });
}

app.get("/api/health", healthHandler);
app.get("/api/healthz", healthHandler);

app.use("/api", router);

app.use("/api", (_req, res) => {
  res.status(404).json({ error: "API route not found" });
});

// Error handler global para rotas /api — garante que erros sempre retornam JSON
app.use("/api", (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled API error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Erro interno. Tente novamente em alguns segundos." });
  }
});

// Em produção, serve o frontend estático e fallback para SPA
if (process.env.NODE_ENV === "production") {
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));
  const staticDir = path.resolve(moduleDir, "../../doacao-solidaria/dist/public");
  app.use(express.static(staticDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
