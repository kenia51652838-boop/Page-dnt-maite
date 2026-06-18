import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

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
const ALLOWED_ORIGINS = [
  "https://salvar.esperancaunida.click",
  "https://francis-production.up.railway.app",
  /^https?:\/\/localhost(:\d+)?$/,
  /\.replit\.dev$/,
  /\.riker\.replit\.dev$/,
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      const allowed = ALLOWED_ORIGINS.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin),
      );
      cb(allowed ? null : new Error("Not allowed by CORS"), allowed);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", ts: Date.now() });
});

app.use("/api", router);

// Error handler global para rotas /api — garante que erros sempre retornam JSON
app.use("/api", (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled API error");
  if (!res.headersSent) {
    res.status(500).json({ error: "Erro interno. Tente novamente em alguns segundos." });
  }
});

// Em produção, serve o frontend estático e fallback para SPA
// process.cwd() = artifacts/api-server (pnpm muda o cwd para o pacote)
// ../../ volta para a raiz do workspace
if (process.env.NODE_ENV === "production") {
  const staticDir = path.resolve(process.cwd(), "../../artifacts/doacao-solidaria/dist/public");
  app.use(express.static(staticDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });
}

export default app;
