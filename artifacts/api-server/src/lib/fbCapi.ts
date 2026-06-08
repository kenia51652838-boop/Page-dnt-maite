import * as crypto from "crypto";
import { logger } from "./logger";

// Pixels configurados: { pixelId, accessToken }
const PIXELS = [
  { id: process.env["FB_PIXEL_OITAVO"] || "1507785031003753", token: process.env["FB_TOKEN_OITAVO"] || "" },
  { id: process.env["FB_PIXEL_DECIMO"] || "1308311710742436", token: process.env["FB_TOKEN_DECIMO"] || "" },
  { id: process.env["FB_PIXEL_ONZE"]   || "2382122502268128", token: process.env["FB_TOKEN_ONZE"]   || "" },
];

const FB_API_VERSION = "v19.0";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export interface FbCapiPurchaseParams {
  eventId:       string;
  eventTime:     number; // Unix timestamp (segundos)
  value:         number; // em reais
  currency:      string;
  customer: {
    email?:    string;
    phone?:    string;
    document?: string; // CPF
    name?:     string;
    fbp?:      string;
    fbc?:      string;
  };
  clientIp?:     string;
  clientAgent?:  string;
  sourceUrl?:    string;
}

/**
 * Envia evento Purchase para todos os pixels via Facebook Conversions API diretamente.
 * Nunca lança exceção — falhas são apenas logadas.
 */
export async function sendFbCapiPurchase(params: FbCapiPurchaseParams): Promise<void> {
  const userData: Record<string, string | string[]> = {};

  if (params.customer.email)    userData["em"]          = sha256(params.customer.email);
  if (params.customer.phone)    userData["ph"]          = sha256(normalizePhone(params.customer.phone));
  // CPF → external_id (identificador único estável do usuário, +4.93% conversões)
  // NUNCA usar "db" para CPF — "db" é date of birth (YYYYMMDD) no Facebook
  if (params.customer.document) userData["external_id"] = sha256(params.customer.document.replace(/\D/g, ""));
  if (params.customer.fbp)      userData["fbp"]         = params.customer.fbp;
  if (params.customer.fbc)      userData["fbc"]         = params.customer.fbc;
  if (params.clientIp)          userData["client_ip_address"] = params.clientIp;
  if (params.clientAgent)       userData["client_user_agent"] = params.clientAgent;
  // Todos os clientes são brasileiros — melhora o match sem coleta extra
  userData["country"] = sha256("br");

  if (params.customer.name) {
    const parts = params.customer.name.trim().split(/\s+/);
    userData["fn"] = sha256(parts[0] || "");
    if (parts.length > 1) userData["ln"] = sha256(parts.slice(1).join(" "));
  }

  const eventPayload = {
    event_name:        "Purchase",
    event_time:        params.eventTime,
    event_id:          params.eventId,
    event_source_url:  params.sourceUrl || "https://apoio.felicidadefamiliar.info/",
    action_source:     "website",
    user_data:         userData,
    custom_data: {
      value:    params.value,
      currency: params.currency,
    },
  };

  await Promise.all(
    PIXELS.map(async (pixel) => {
      if (!pixel.token) {
        logger.warn({ pixelId: pixel.id }, "[FB CAPI] Token não configurado — pulando pixel");
        return;
      }

      const body = {
        data:         [eventPayload],
        test_event_code: undefined as string | undefined,
      };

      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 10_000);

        const url = `https://graph.facebook.com/${FB_API_VERSION}/${pixel.id}/events?access_token=${pixel.token}`;
        const res = await fetch(url, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(body),
          signal:  controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json() as Record<string, unknown>;
          logger.info({ pixelId: pixel.id, eventId: params.eventId, events_received: json["events_received"] }, "[FB CAPI] Purchase enviado com sucesso");
        } else {
          const text = await res.text().catch(() => "(sem corpo)");
          logger.warn({ pixelId: pixel.id, status: res.status, body: text }, "[FB CAPI] Erro HTTP ao enviar Purchase");
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.warn({ pixelId: pixel.id, err: msg }, "[FB CAPI] Falha ao enviar Purchase");
      }
    })
  );
}
