# Guia Completo: Facebook Pixel + CAPI + UTMify
**Versão atualizada — Junho 2026**
Stack: React + Vite (frontend) + Express + TypeScript (API) + deploy Railway

---

## Visão geral da arquitetura

```
Usuário no navegador
  │
  ├── fbq('PageView')          ← pixel browser, automático ao carregar
  ├── fbq('InitiateCheckout')  ← pixel browser, quando PIX é gerado
  └── fbq('Purchase')          ← pixel browser, quando pagamento confirmado
          │
          ▼
  API Server (Express)
  ├── POST /api/pix/create      → UTMify (waiting_payment) + CAPI (InitiateCheckout)
  ├── POST /api/pix/create-upsell → idem
  └── POST /api/webhook/lumina  → UTMify (paid) + CAPI (Purchase)
          │
          ├── UTMify API  (eventId = txId → deduplica)
          └── Facebook CAPI (event_id = txId → deduplica com browser)
```

**Deduplicação:** browser e servidor usam o mesmo `event_id` / `eventID` (o txId da gateway). O Facebook recebe o evento dos dois canais e conta apenas 1.

---

## PARTE 1 — Variáveis de Ambiente

### No Replit (Secrets)

Vá em **Tools → Secrets** e crie:

| Nome do Secret | O que é | Onde pegar |
|---|---|---|
| `UTMIFY_TOKEN` | Token da API da UTMify | UTMify → Configurações → API |
| `FB_TOKEN_PIXEL1` | Token de acesso do Pixel 1 | Facebook → Events Manager → Pixel → Configurações → Token de acesso da API de Conversões |
| `FB_TOKEN_PIXEL2` | Token de acesso do Pixel 2 | idem para o segundo pixel |
| `FB_TOKEN_PIXEL3` | Token de acesso do Pixel 3 | idem para o terceiro pixel (se houver) |

> **Atenção:** Os IDs dos pixels podem ficar hardcoded no código como fallback (não são segredos). Os **tokens de acesso** são segredos e nunca devem ir para o código.

### Na Railway (Produção)

No painel da Railway → serviço → **Variables**, adicione os mesmos secrets:
```
UTMIFY_TOKEN=xxxx
FB_TOKEN_PIXEL1=xxxx
FB_TOKEN_PIXEL2=xxxx
FB_TOKEN_PIXEL3=xxxx
```

---

## PARTE 2 — Facebook: onde pegar o Token de Acesso da CAPI

1. Acesse **business.facebook.com**
2. Vá em **Events Manager**
3. Selecione o Pixel desejado
4. Clique em **Configurações**
5. Role até **API de Conversões**
6. Clique em **Gerar token de acesso**
7. Copie o token — ele começa com `EAA...`

> Faça isso para cada pixel. Cada pixel tem seu próprio token.

---

## PARTE 3 — UTMify: onde pegar o Token

1. Acesse **app.utmify.com.br**
2. Vá em **Configurações → Credenciais de API**
3. Gere ou copie o token existente

---

## PARTE 4 — Frontend: `index.html`

### 4.1 Script do Pixel UTMify

Cole antes do `</head>`:

```html
<script>
  window.pixelId = ["ID_UTMIFY_PIXEL1", "ID_UTMIFY_PIXEL2", "ID_UTMIFY_PIXEL3"];
  var a = document.createElement("script");
  a.setAttribute("async", "");
  a.setAttribute("defer", "");
  a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
  document.head.appendChild(a);
</script>
```

> Os IDs da UTMify ficam em `window.pixelId`. São diferentes dos IDs do Facebook. Pegue em UTMify → Pixels.

### 4.2 Script do Facebook Pixel (base)

Cole logo após o script da UTMify:

```html
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
  n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'ID_PIXEL_1');
  fbq('init', 'ID_PIXEL_2');
  fbq('init', 'ID_PIXEL_3');
  fbq('track', 'PageView');
</script>
```

### 4.3 Tags noscript (para usuários sem JS)

Cole logo após a `<div id="root">` no `<body>`:

```html
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=ID_PIXEL_1&ev=PageView&noscript=1"/></noscript>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=ID_PIXEL_2&ev=PageView&noscript=1"/></noscript>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=ID_PIXEL_3&ev=PageView&noscript=1"/></noscript>
```

---

## PARTE 5 — Frontend: captura de `fbp` e `fbc`

Adicione essa função nos componentes que geram PIX (página de checkout):

```ts
const readFbp = (): string | undefined => {
  try {
    const m = document.cookie.match(/(^|;\s*)_fbp=([^;]+)/);
    return m ? m[2] : undefined;
  } catch { return undefined; }
};

const readFbc = (): string | undefined => {
  try {
    const m = document.cookie.match(/(^|;\s*)_fbc=([^;]+)/);
    if (m) return m[2];
    const c = new URLSearchParams(window.location.search).get("fbclid");
    return c ? `fb.1.${Date.now()}.${c}` : undefined;
  } catch { return undefined; }
};
```

Passe `fbp` e `fbc` no body da requisição que cria o PIX:

```ts
body: JSON.stringify({
  amount: valor,
  // ... outros campos
  fbp: readFbp(),
  fbc: readFbc(),
})
```

---

## PARTE 6 — Frontend: eventos `fbq` no fluxo de pagamento

### Quando o QR Code PIX é exibido → `InitiateCheckout`

```ts
// Logo após receber o transaction_id da API e exibir o QR Code:
try {
  (window as any).fbq?.(
    "track",
    "InitiateCheckout",
    {
      value: valorEmReais,
      currency: "BRL",
      num_items: 1,
      content_ids: ["id-do-seu-produto"],
    },
    { eventID: `checkout_${transaction_id}` }  // prefixo obrigatório para não colidir com Purchase
  );
} catch {}
```

### Quando o pagamento é confirmado → `Purchase`

```ts
// Logo após confirmar que o pagamento foi aprovado (polling ou webhook):
try {
  (window as any).fbq?.(
    "track",
    "Purchase",
    {
      value: valorEmReais,
      currency: "BRL",
    },
    { eventID: transaction_id }  // mesmo txId que o servidor vai usar na CAPI
  );
} catch {}
```

> **Regra de ouro da deduplicação:**
> - `InitiateCheckout` browser: `eventID: "checkout_" + txId`
> - `Purchase` browser: `eventID: txId`
> - `InitiateCheckout` CAPI: `event_id: "checkout_" + txId`
> - `Purchase` CAPI: `event_id: txId`

---

## PARTE 7 — Backend: `src/lib/fbCapi.ts`

Crie o arquivo completo:

```ts
import * as crypto from "crypto";
import { logger } from "./logger"; // substitua pelo seu logger

const PIXELS = [
  { id: process.env["FB_PIXEL_ID1"] || "SEU_ID_PIXEL_1", token: process.env["FB_TOKEN_PIXEL1"] || "" },
  { id: process.env["FB_PIXEL_ID2"] || "SEU_ID_PIXEL_2", token: process.env["FB_TOKEN_PIXEL2"] || "" },
  // adicione mais pixels conforme necessário
];

const FB_API_VERSION = "v19.0";
const SOURCE_URL     = "https://seusite.com/";
const PRODUCT_ID     = "id-do-seu-produto";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export interface FbCapiCustomer {
  email?:    string;
  phone?:    string;
  document?: string; // CPF — vai para external_id (NUNCA para o campo "db")
  name?:     string;
  fbp?:      string;
  fbc?:      string;
}

export interface FbCapiParams {
  eventId:      string;
  eventTime:    number;   // Unix timestamp em segundos: Math.floor(Date.now() / 1000)
  value:        number;   // valor em reais
  currency:     string;   // "BRL"
  customer:     FbCapiCustomer;
  clientIp?:    string;
  clientAgent?: string;
  sourceUrl?:   string;
}

function buildUserData(params: FbCapiParams): Record<string, string> {
  const ud: Record<string, string> = {};

  if (params.customer.email)    ud["em"]          = sha256(params.customer.email);
  if (params.customer.phone)    ud["ph"]          = sha256(normalizePhone(params.customer.phone));
  // CPF → external_id. NUNCA usar "db" — no Facebook "db" significa date of birth (YYYYMMDD)
  if (params.customer.document) ud["external_id"] = sha256(params.customer.document.replace(/\D/g, ""));
  if (params.customer.fbp)      ud["fbp"]         = params.customer.fbp;
  if (params.customer.fbc)      ud["fbc"]         = params.customer.fbc;
  if (params.clientIp)          ud["client_ip_address"] = params.clientIp;
  if (params.clientAgent)       ud["client_user_agent"] = params.clientAgent;
  ud["country"] = sha256("br"); // todos os clientes são brasileiros

  if (params.customer.name) {
    const parts = params.customer.name.trim().split(/\s+/);
    ud["fn"] = sha256(parts[0] || "");
    if (parts.length > 1) ud["ln"] = sha256(parts.slice(1).join(" "));
  }

  return ud;
}

async function dispatchEvent(eventName: string, eventPayload: Record<string, unknown>): Promise<void> {
  await Promise.all(
    PIXELS.map(async (pixel) => {
      if (!pixel.token) {
        console.warn(`[FB CAPI] Token não configurado para pixel ${pixel.id} — pulando`);
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
          console.log(`[FB CAPI] ${eventName} enviado — pixel ${pixel.id} — events_received: ${json["events_received"]}`);
        } else {
          const text = await res.text().catch(() => "(sem corpo)");
          console.warn(`[FB CAPI] Erro HTTP ${res.status} ao enviar ${eventName} para pixel ${pixel.id}: ${text}`);
        }
      } catch (err) {
        console.warn(`[FB CAPI] Falha ao enviar ${eventName} para pixel ${pixel.id}:`, String(err));
      }
    })
  );
}

/** Dispara Purchase via CAPI — chamar no webhook de pagamento confirmado */
export async function sendFbCapiPurchase(params: FbCapiParams): Promise<void> {
  await dispatchEvent("Purchase", {
    event_name:       "Purchase",
    event_time:       params.eventTime,
    event_id:         params.eventId,                     // txId da gateway
    event_source_url: params.sourceUrl || SOURCE_URL,
    action_source:    "website",
    user_data:        buildUserData(params),
    custom_data: {
      value:        params.value,
      currency:     params.currency,
      order_id:     params.eventId,
      content_ids:  [PRODUCT_ID],
      content_type: "product",
      num_items:    1,
      contents:     [{ id: PRODUCT_ID, quantity: 1, item_price: params.value }],
    },
  });
}

/** Dispara InitiateCheckout via CAPI — chamar quando PIX é gerado */
export async function sendFbCapiInitiateCheckout(params: FbCapiParams): Promise<void> {
  await dispatchEvent("InitiateCheckout", {
    event_name:       "InitiateCheckout",
    event_time:       params.eventTime,
    event_id:         `checkout_${params.eventId}`,       // prefixo para não colidir com Purchase
    event_source_url: params.sourceUrl || SOURCE_URL,
    action_source:    "website",
    user_data:        buildUserData(params),
    custom_data: {
      value:        params.value,
      currency:     params.currency,
      content_ids:  [PRODUCT_ID],
      content_type: "product",
      num_items:    1,
      contents:     [{ id: PRODUCT_ID, quantity: 1, item_price: params.value }],
    },
  });
}
```

---

## PARTE 8 — Backend: `src/lib/utmify.ts`

```ts
const UTMIFY_TOKEN    = process.env["UTMIFY_TOKEN"] || "";
const UTMIFY_PLATFORM = "Nome da Plataforma";  // ex: "Hot - Vitálicio MAX"
const PRODUCT_ID      = "id-do-produto";
const PRODUCT_NAME    = "Nome do Produto";

export interface UtmifyCustomer {
  name:       string;
  email:      string;
  phone:      string;
  document:   string;
  ip?:        string;
  userAgent?: string;
  fbp?:       string;
  fbc?:       string;
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

export async function sendUtmifyOrder(payload: UtmifyOrderPayload): Promise<boolean> {
  try {
    if (!UTMIFY_TOKEN) {
      console.warn("[UTMify] UTMIFY_TOKEN não configurado — evento ignorado");
      return false;
    }

    const { amountInCents } = payload;
    // Taxa da gateway (ajuste conforme seu contrato — aqui 5.99%)
    const gatewayFeeInCents     = Math.round(amountInCents * 0.0599);
    const userCommissionInCents = amountInCents - gatewayFeeInCents;

    const body = {
      orderId:       payload.orderId,
      eventId:       payload.orderId,   // mesmo orderId → deduplicação na UTMify
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
        ...(payload.customer.ip        ? { ip:        payload.customer.ip        } : {}),
        ...(payload.customer.userAgent ? { userAgent: payload.customer.userAgent } : {}),
        ...(payload.customer.fbp       ? { fbp:       payload.customer.fbp       } : {}),
        ...(payload.customer.fbc       ? { fbc:       payload.customer.fbc       } : {}),
      },
      products: [{
        id:           PRODUCT_ID,
        name:         PRODUCT_NAME,
        planId:       null,
        planName:     null,
        quantity:     1,
        priceInCents: amountInCents,
      }],
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
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => "(sem corpo)");
      console.warn(`[UTMify] HTTP ${response.status} — pedido ${payload.orderId}: ${errorText}`);
      return false;
    }

    console.log(`[UTMify] '${payload.status}' confirmado: ${payload.orderId} R$ ${(amountInCents / 100).toFixed(2)}`);
    return true;
  } catch (err) {
    console.warn(`[UTMify] Falha no pedido ${payload.orderId}:`, String(err));
    return false;
  }
}
```

---

## PARTE 9 — Backend: chamadas nas rotas

### Quando o PIX é criado com sucesso (rota `/pix/create`)

```ts
import { sendFbCapiInitiateCheckout } from "../lib/fbCapi";
import { sendUtmifyOrder } from "../lib/utmify";

// Após PIX gerado pela gateway:
const clientIp    = req.headers["x-forwarded-for"]?.toString().split(",")[0].trim();
const clientAgent = req.headers["user-agent"] as string | undefined;
const clientFbp   = req.body.fbp as string | undefined;
const clientFbc   = req.body.fbc as string | undefined;

// UTMify — evento "aguardando pagamento"
sendUtmifyOrder({
  orderId:       txId,
  status:        "waiting_payment",
  createdAt:     new Date(),
  approvedAt:    null,
  customer:      { name, email, phone, document: cpf, ip: clientIp, userAgent: clientAgent, fbp: clientFbp, fbc: clientFbc },
  amountInCents,
  tracking,
}).catch(() => {});

// FB CAPI — InitiateCheckout
sendFbCapiInitiateCheckout({
  eventId:    txId,
  eventTime:  Math.floor(Date.now() / 1000),
  value:      amountInCents / 100,
  currency:   "BRL",
  customer:   { name, email, phone, document: cpf, fbp: clientFbp, fbc: clientFbc },
  clientIp,
  clientAgent,
}).catch(() => {});
```

### Quando o webhook confirma pagamento

```ts
import { sendFbCapiPurchase } from "../lib/fbCapi";

// Dentro do handler do webhook (event_type === "transaction.approved"):
const paidAt = new Date(webhookData.transaction.paid_at);

// UTMify — evento "pago"
sendUtmifyOrder({
  orderId:       txId,
  status:        "paid",
  createdAt:     txFromDb.created_at,
  approvedAt:    paidAt,
  customer:      txFromDb.customer, // recuperado do banco
  amountInCents: txFromDb.amount_in_cents,
  tracking:      txFromDb.tracking,
}).catch(() => {});

// FB CAPI — Purchase
sendFbCapiPurchase({
  eventId:    txId,
  eventTime:  Math.floor(paidAt.getTime() / 1000),
  value:      amountInCents / 100,
  currency:   "BRL",
  customer:   txFromDb.customer,
  clientIp:   txFromDb.customer.ip,
  clientAgent: txFromDb.customer.userAgent,
}).catch(() => {});
```

---

## PARTE 10 — Facebook Events Manager: configuração da CAPI

Para que o Facebook reconheça os eventos servidor como "verificados":

1. **Events Manager → seu Pixel → Configurações**
2. Em **API de Conversões**, clique em **Verificar conexão**
3. Em **Origens de dados conectadas**, certifique-se que o domínio do site está verificado
4. **Verificação do domínio:** acesse Business Manager → Brand Safety → Domínios → adicione seu domínio e siga as instruções do meta-tag

---

## PARTE 11 — UTMify: configuração dos Pixels

1. Acesse **app.utmify.com.br → Pixels**
2. Crie um pixel para cada conta de anúncio que você usa
3. Copie os IDs gerados e coloque em `window.pixelId = [...]` no `index.html`
4. Certifique-se que o pixel do Facebook correspondente está vinculado ao pixel da UTMify dentro da plataforma

---

## PARTE 12 — Checklist de verificação

Após configurar tudo, verifique:

- [ ] `UTMIFY_TOKEN` configurado no Replit Secrets e na Railway
- [ ] `FB_TOKEN_PIXEL1/2/3` configurados no Replit Secrets e na Railway
- [ ] IDs dos pixels do Facebook corretos no `index.html`
- [ ] IDs dos pixels da UTMify corretos no `window.pixelId` do `index.html`
- [ ] Tags noscript presentes no `<body>`
- [ ] `fbp` e `fbc` sendo capturados e passados na requisição de criação do PIX
- [ ] `fbq('InitiateCheckout', ..., { eventID: 'checkout_' + txId })` disparando quando QR Code aparece
- [ ] `fbq('Purchase', ..., { eventID: txId })` disparando quando pagamento confirmado
- [ ] CAPI `InitiateCheckout` disparando no servidor quando PIX é criado
- [ ] CAPI `Purchase` disparando no servidor quando webhook confirma pagamento
- [ ] Logs do servidor mostrando `events_received: 1` para cada pixel

---

## Armadilhas críticas — não repita esses erros

| Erro | Consequência | Correto |
|---|---|---|
| Enviar CPF no campo `db` | Facebook interpreta como data de nascimento | CPF vai em `external_id` |
| `eventID` browser diferente do `event_id` CAPI | Sem deduplicação — compra contada 2x ou 3x | Usar o mesmo txId nos dois |
| `InitiateCheckout` sem prefixo `checkout_` | Colide com `Purchase`, Facebook pode confundir | Usar `checkout_${txId}` |
| Token de acesso no código-fonte | Vazamento de segurança | Sempre em variáveis de ambiente |
| Não passar `user-agent` no upsell | Cobertura de UA cai para ~31% | Capturar `req.headers["user-agent"]` em todas as rotas |
| Taxa da gateway errada na UTMify | Comissão calculada errada nos relatórios | Ajustar o percentual conforme contrato da gateway |
