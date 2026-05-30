const UTMIFY_TOKEN    = process.env["UTMIFY_TOKEN"] || "";
const UTMIFY_PLATFORM = "Hot - Vitálicio MAX";
const PRODUCT_ID      = "hot-assinatura-semanal-francis";
const PRODUCT_NAME    = "Hot - Assinatura semanal - Francis";

export interface UtmifyCustomer {
  name:     string;
  email:    string;
  phone:    string;
  document: string;
  ip?:      string;
}

export interface UtmifyTrackingParams {
  src:          string | null;
  sck:          string | null;
  utm_source:   string | null;
  utm_campaign: string | null;
  utm_medium:   string | null;
  utm_content:  string | null;
  utm_term:     string | null;
}

export interface UtmifyOrderPayload {
  orderId:       string;
  status:        "waiting_payment" | "paid";
  createdAt:     Date;
  approvedAt:    Date | null;
  customer:      UtmifyCustomer;
  amountInCents: number;
  tracking:      UtmifyTrackingParams;
}

function formatDate(date: Date): string {
  return date.toISOString().replace("T", " ").substring(0, 19);
}

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

/**
 * Envia um evento de pedido para a UTMify.
 * Retorna true se a UTMify confirmou (HTTP 2xx), false em qualquer falha.
 * NUNCA lança exceção — erros são sempre logados e suprimidos.
 */
export async function sendUtmifyOrder(payload: UtmifyOrderPayload): Promise<boolean> {
  try {
    if (!UTMIFY_TOKEN) {
      console.warn("[UTMify] UTMIFY_TOKEN não configurado — evento ignorado");
      return false;
    }

    const { amountInCents } = payload;
    const gatewayFeeInCents     = Math.round(amountInCents * 0.0599);
    const userCommissionInCents = amountInCents - gatewayFeeInCents;

    const body: Record<string, unknown> = {
      orderId:       payload.orderId,
      platform:      UTMIFY_PLATFORM,
      paymentMethod: "pix",
      status:        payload.status,
      createdAt:     formatDate(payload.createdAt),
      approvedDate:  payload.approvedAt ? formatDate(payload.approvedAt) : null,
      customer: {
        name:     payload.customer.name,
        email:    payload.customer.email || "",
        phone:    formatPhone(payload.customer.phone || ""),
        document: (payload.customer.document || "").replace(/\D/g, ""),
        country:  "BR",
        ...(payload.customer.ip ? { ip: payload.customer.ip } : {}),
      },
      products: [
        {
          id:           PRODUCT_ID,
          name:         PRODUCT_NAME,
          planId:       null,
          planName:     null,
          quantity:     1,
          priceInCents: amountInCents,
        },
      ],
      trackingParameters: {
        src:          payload.tracking.src          || null,
        sck:          payload.tracking.sck          || null,
        utm_source:   payload.tracking.utm_source   || null,
        utm_campaign: payload.tracking.utm_campaign || null,
        utm_medium:   payload.tracking.utm_medium   || null,
        utm_content:  payload.tracking.utm_content  || null,
        utm_term:     payload.tracking.utm_term     || null,
      },
      commission: {
        totalPriceInCents:      amountInCents,
        gatewayFeeInCents,
        userCommissionInCents,
      },
      isTest: false,
    };

    const controller = new AbortController();
    const timeout    = setTimeout(() => controller.abort(), 10000);

    const response = await fetch("https://api.utmify.com.br/api-credentials/orders", {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-token":  UTMIFY_TOKEN,
      },
      body:   JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "(sem corpo)");
      console.warn(`[UTMify] HTTP ${response.status} para pedido ${payload.orderId} (status=${payload.status}): ${errorText}`);
      return false;
    }

    console.log(`[UTMify] Evento '${payload.status}' confirmado: ${payload.orderId} R$ ${(amountInCents / 100).toFixed(2)}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(`[UTMify] Falha no envio do pedido ${payload.orderId} (status=${payload.status}): ${msg}`);
    return false;
  }
}
