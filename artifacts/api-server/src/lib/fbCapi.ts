import * as crypto from "crypto";
import { logger } from "./logger";

const PIXELS = [
  { id: process.env["FB_PIXEL_OITAVO"]     || "1507785031003753", token: process.env["FB_TOKEN_OITAVO"]     || "" },
  { id: process.env["FB_PIXEL_DECIMO"]     || "1308311710742436", token: process.env["FB_TOKEN_DECIMO"]     || "" },
  { id: process.env["FB_PIXEL_ONZE"]       || "2382122502268128", token: process.env["FB_TOKEN_ONZE"]       || "" },
  { id: process.env["FB_PIXEL_DOZE"]       || "2008889186664643", token: process.env["FB_TOKEN_DOZE"]       || "" },
  { id: process.env["FB_PIXEL_QUINZE"]     || "1678939216734559", token: process.env["FB_TOKEN_QUINZE"]     || "" },
  { id: process.env["FB_PIXEL_DEZESSEIS"]  || "1749927972852116", token: process.env["FB_TOKEN_DEZESSEIS"]  || "" },
  { id: process.env["FB_PIXEL_DEZESSETE"]  || "1702240477684465", token: process.env["FB_TOKEN_DEZESSETE"]  || "" },
  { id: process.env["FB_PIXEL_DEZOITO"]    || "1630098542452378", token: process.env["FB_TOKEN_DEZOITO"]    || "" },
  { id: process.env["FB_PIXEL_DEZENOVE"]   || "1453964659833693", token: process.env["FB_TOKEN_DEZENOVE"]   || "" },
];

const FB_API_VERSION = "v19.0";
const SOURCE_URL     = "https://apoio.felicidadefamiliar.info/";
const PRODUCT_ID     = "hot-assinatura-semanal-francis";
const PRODUCT_NAME   = "Hot - Assinatura semanal - Francis";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export interface FbCapiCustomer {
  email?:     string;
  phone?:     string;
  document?:  string; // CPF
  name?:      string;
  fbp?:       string;
  fbc?:       string;
}

export interface FbCapiParams {
  eventId:      string;
  eventTime:    number;   // Unix timestamp em segundos
  value:        number;   // em reais
  currency:     string;
  customer:     FbCapiCustomer;
  clientIp?:    string;
  clientAgent?: string;
  sourceUrl?:   string;
}

/** Monta o objeto user_data com todos os campos disponíveis */
function buildUserData(params: FbCapiParams): Record<string, string> {
  const ud: Record<string, string> = {};

  if (params.customer.email)    ud["em"]          = sha256(params.customer.email);
  if (params.customer.phone)    ud["ph"]          = sha256(normalizePhone(params.customer.phone));
  // CPF → external_id (identificador único estável — nunca usar "db" que é data de nascimento)
  if (params.customer.document) ud["external_id"] = sha256(params.customer.document.replace(/\D/g, ""));
  if (params.customer.fbp)      ud["fbp"]         = params.customer.fbp;
  if (params.customer.fbc)      ud["fbc"]         = params.customer.fbc;
  if (params.clientIp)          ud["client_ip_address"] = params.clientIp;
  if (params.clientAgent)       ud["client_user_agent"] = params.clientAgent;
  // Todos os clientes são brasileiros — sinal extra gratuito
  ud["country"] = sha256("br");

  if (params.customer.name) {
    const parts = params.customer.name.trim().split(/\s+/);
    ud["fn"] = sha256(parts[0] || "");
    if (parts.length > 1) ud["ln"] = sha256(parts.slice(1).join(" "));
  }

  return ud;
}

/** Envia um evento para todos os pixels configurados */
async function dispatchEvent(eventName: string, eventPayload: Record<string, unknown>): Promise<void> {
  await Promise.all(
    PIXELS.map(async (pixel) => {
      if (!pixel.token) {
        logger.warn({ pixelId: pixel.id }, `[FB CAPI] Token não configurado — pulando pixel (${eventName})`);
        return;
      }
      try {
        const controller = new AbortController();
        const timeout    = setTimeout(() => controller.abort(), 10_000);

        const url = `https://graph.facebook.com/${FB_API_VERSION}/${pixel.id}/events?access_token=${pixel.token}`;
        const res = await fetch(url, {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify({ data: [eventPayload] }),
          signal:  controller.signal,
        });

        clearTimeout(timeout);

        if (res.ok) {
          const json = await res.json() as Record<string, unknown>;
          logger.info(
            { pixelId: pixel.id, eventId: eventPayload["event_id"], events_received: json["events_received"] },
            `[FB CAPI] ${eventName} enviado com sucesso`,
          );
        } else {
          const text = await res.text().catch(() => "(sem corpo)");
          logger.warn({ pixelId: pixel.id, status: res.status, body: text }, `[FB CAPI] Erro HTTP ao enviar ${eventName}`);
        }
      } catch (err) {
        logger.warn({ pixelId: pixel.id, err: String(err) }, `[FB CAPI] Falha ao enviar ${eventName}`);
      }
    })
  );
}

/**
 * Envia evento Purchase para todos os pixels.
 * Inclui custom_data completo: contents, content_ids, content_type, num_items, order_id.
 * Nunca lança exceção.
 */
export async function sendFbCapiPurchase(params: FbCapiParams): Promise<void> {
  const payload = {
    event_name:       "Purchase",
    event_time:       params.eventTime,
    event_id:         params.eventId,
    event_source_url: params.sourceUrl || SOURCE_URL,
    action_source:    "website",
    user_data:        buildUserData(params),
    custom_data: {
      value:        params.value,
      currency:     params.currency,
      order_id:     params.eventId,              // ID da transação para relatórios
      content_ids:  [PRODUCT_ID],                // IDs dos produtos
      content_type: "product",                   // tipo de conteúdo
      num_items:    1,                           // quantidade de itens
      contents: [
        { id: PRODUCT_ID, quantity: 1, item_price: params.value },
      ],
    },
  };

  await dispatchEvent("Purchase", payload);
}

/**
 * Envia evento InitiateCheckout para todos os pixels.
 * Deve disparar quando o PIX é gerado (usuário iniciou o checkout).
 * Dá ao algoritmo do Facebook sinal de intenção de compra antes do pagamento.
 * Nunca lança exceção.
 */
export async function sendFbCapiInitiateCheckout(params: FbCapiParams): Promise<void> {
  const payload = {
    event_name:       "InitiateCheckout",
    event_time:       params.eventTime,
    event_id:         `checkout_${params.eventId}`,  // prefixo para não colidir com Purchase
    event_source_url: params.sourceUrl || SOURCE_URL,
    action_source:    "website",
    user_data:        buildUserData(params),
    custom_data: {
      value:        params.value,
      currency:     params.currency,
      content_ids:  [PRODUCT_ID],
      content_type: "product",
      num_items:    1,
      contents: [
        { id: PRODUCT_ID, quantity: 1, item_price: params.value },
      ],
    },
  };

  await dispatchEvent("InitiateCheckout", payload);
}
