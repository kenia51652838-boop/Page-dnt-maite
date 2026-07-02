import { Router } from "express";
import { logger } from "../lib/logger";
import { sendFbCapiPageView } from "../lib/fbCapi";

const router = Router();

// POST /api/events/pageview
// Recebe o pvId gerado pelo browser e dispara CAPI PageView para todos os pixels.
// Garante cobertura mesmo quando fbevents.js é bloqueado (iOS ITP, Safari, ad-blockers).
router.post("/events/pageview", async (req, res) => {
  try {
    const {
      event_id,
      event_source_url,
      fbp,
      fbc,
      client_user_agent,
    } = req.body as Record<string, unknown>;

    if (!event_id || typeof event_id !== "string") {
      res.status(400).json({ error: "event_id obrigatório" });
      return;
    }

    const clientIp =
      (req.body as Record<string, unknown>).client_ip as string | undefined ||
      req.ip ||
      undefined;

    const ua = (client_user_agent as string | undefined) ||
      (req.headers["user-agent"] as string | undefined);

    sendFbCapiPageView({
      eventId:      event_id,
      eventTime:    Math.floor(Date.now() / 1000),
      sourceUrl:    (event_source_url as string | undefined),
      clientIp:     clientIp,
      clientAgent:  ua,
      fbp:          (fbp as string | undefined),
      fbc:          (fbc as string | undefined),
    }).catch((err) => logger.warn({ err }, "[CAPI PageView] falha silenciosa"));

    res.json({ ok: true });
  } catch (err) {
    logger.warn({ err }, "[CAPI PageView] erro no endpoint");
    res.json({ ok: false });
  }
});

export default router;
