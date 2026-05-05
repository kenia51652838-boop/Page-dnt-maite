import { Router } from "express";
import { saveLead, getAllLeads } from "../lib/leadsStore";
import { sendSms, buildSmsMessage } from "../lib/sms";
import { logger } from "../lib/logger";

const router = Router();

// POST /api/leads
router.post("/leads", async (req, res) => {
  try {
    const { name, phone, message, amount } = req.body as Record<string, unknown>;

    if (!name || !phone) {
      res.status(400).json({ error: "name e phone são obrigatórios" });
      return;
    }

    const lead = await saveLead({
      name:    String(name).trim(),
      phone:   String(phone).replace(/\D/g, ""),
      message: String(message || "").trim(),
      amount:  Number(amount) || 0,
    });

    logger.info({ leadId: lead.id, name: lead.name }, "Novo lead salvo no banco");

    // Dispara SMS em background (não bloqueia a resposta)
    const firstName = lead.name.split(/\s+/)[0] || lead.name;
    const smsMsg = buildSmsMessage(firstName);

    sendSms(lead.phone, smsMsg)
      .then(() => logger.info({ leadId: lead.id }, "SMS enviado com sucesso"))
      .catch((err) => logger.error({ err, leadId: lead.id }, "Falha ao enviar SMS"));

    res.json({ success: true, lead_id: lead.id });
  } catch (err) {
    logger.error({ err }, "Erro ao salvar lead");
    const msg = err instanceof Error ? err.message : "Erro interno";
    res.status(500).json({ error: msg });
  }
});

// GET /api/leads
router.get("/leads", async (_req, res) => {
  try {
    const leads = await getAllLeads();
    res.json({ leads });
  } catch (err) {
    logger.error({ err }, "Erro ao buscar leads");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
