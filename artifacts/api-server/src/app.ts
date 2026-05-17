import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import path from "path";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

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
