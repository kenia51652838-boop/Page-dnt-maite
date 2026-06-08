# Guia Completo: Facebook Pixel + UTMify + CAPI Server-Side

Este guia documenta a arquitetura completa de rastreamento usada no projeto Doação Solidária.
Pode ser replicado em qualquer projeto Replit + Railway com stack React/Vite + Express.

---

## Visão geral da arquitetura

```
Usuário acessa a página
    └── Browser carrega pixels (PageView) — index.html

Usuário conclui pagamento PIX
    ├── BROWSER-SIDE
    │   └── fbq('Purchase', { eventID: txId })   ← dispara no polling/confirmação
    │
    └── SERVER-SIDE (webhook de pagamento confirmado)
        ├── FB CAPI direto → graph.facebook.com  ← tempo real, nunca bloqueado
        └── UTMify → CAPI deles                  ← atribuição UTM + backup

Facebook recebe dos 3 canais, usa event_id para deduplicar → conta 1 conversão
```

---

## PARTE 1 — O que você precisa coletar antes de começar

### 1.1 Pixels do Facebook
Para cada pixel que você quer rastrear, pegue:
- **Pixel ID**: número de 16 dígitos (ex: `1507785031003753`)
- **Token de acesso**: gerado no Meta Business Manager

**Como gerar o token de acesso:**
1. Acesse business.facebook.com → Configurações do negócio
2. Usuários do sistema → Criar usuário do sistema (Admin)
3. Adicionar ativos → Pixel → selecione o pixel → permissão "Gerenciar"
4. Gerar token → marcar permissões: `ads_management`, `ads_read`
5. Copiar o token gerado (ele só aparece uma vez)

### 1.2 Token da UTMify
1. Acesse utmify.com.br → sua conta
2. Configurações → API → copiar o token

### 1.3 IDs de pixel da UTMify
Cada pixel UTMify tem um ID próprio (diferente do ID do Facebook):
- Acesse utmify.com.br → Pixels → copiar o ID de cada pixel
- Formato: `6a1a42664ab0aa7b96fc07a7` (24 caracteres hexadecimais)

---

## PARTE 2 — Variáveis de ambiente

### No Replit (Secrets + Configurations)

**Secrets** (aba Secrets — valores sensíveis, nunca visíveis):
```
FB_TOKEN_PIXEL1    = EAAVpzhZ...   (token de acesso do pixel 1)
FB_TOKEN_PIXEL2    = EAAXZBwX...   (token de acesso do pixel 2)
FB_TOKEN_PIXEL3    = EAAN2BG5...   (token de acesso do pixel 3)
UTMIFY_TOKEN       = seu-token-da-utmify
```

**Configurations** (aba Configurations — valores não-sensíveis, públicos):
```
FB_PIXEL_1    = 1507785031003753
FB_PIXEL_2    = 1308311710742436
FB_PIXEL_3    = 2382122502268128
```

> Os IDs dos pixels não precisam ser secrets pois já ficam expostos no HTML público do site.

### Na Railway (serviço de produção)

Vá em: serviço → Variables → adicione todas as mesmas variáveis acima.
Sem isso, o CAPI direto não funciona em produção mesmo que funcione no Replit.

---

## PARTE 3 — Frontend (index.html)

### 3.1 Pixels UTMify
Adicione antes do `</head>`, após outros scripts:
```html
<script>
  window.pixelId = ["ID_UTMIFY_1", "ID_UTMIFY_2", "ID_UTMIFY_3"];
  var a = document.createElement("script");
  a.setAttribute("async", "");
  a.setAttribute("defer", "");
  a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
  document.head.appendChild(a);
</script>
```

### 3.2 Pixels do Facebook
Adicione logo após os pixels UTMify:
```html
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
  n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window,document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'SEU_PIXEL_ID_1');
  fbq('init', 'SEU_PIXEL_ID_2');
  fbq('init', 'SEU_PIXEL_ID_3');
  fbq('track', 'PageView');
</script>
```

### 3.3 Tags noscript (fallback)
Adicione no `<body>` logo após `<div id="root">`:
```html
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=SEU_PIXEL_ID_1&ev=PageView&noscript=1"/></noscript>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=SEU_PIXEL_ID_2&ev=PageView&noscript=1"/></noscript>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=SEU_PIXEL_ID_3&ev=PageView&noscript=1"/></noscript>
```

---

## PARTE 4 — Frontend (React — captura de fbp/fbc e evento Purchase)

### 4.1 Funções auxiliares de cookie (adicione no componente onde gera o PIX)
```ts
// Lê o cookie _fbp (criado automaticamente pelo pixel do Facebook)
const readFbp = (): string | undefined => {
  try {
    const m = document.cookie.match(/(^|;\s*)_fbp=([^;]+)/);
    return m ? m[2] : undefined;
  } catch { return undefined; }
};

// Lê o cookie _fbc ou constrói a partir do fbclid na URL
const readFbc = (): string | undefined => {
  try {
    const m = document.cookie.match(/(^|;\s*)_fbc=([^;]+)/);
    if (m) return m[2];
    const c = new URLSearchParams(window.location.search).get("fbclid");
    return c ? `fb.1.${Date.now()}.${c}` : undefined;
  } catch { return undefined; }
};
```

### 4.2 Envio ao criar o PIX (inclua fbp/fbc no body da requisição)
```ts
const res = await fetch('/api/pix/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: valorEmReais,
    customer_name: nome,
    customer_email: email,
    customer_phone: telefone,
    customer_cpf: cpf,
    fbp: readFbp(),   // ← captura antes do usuário sair da página
    fbc: readFbc(),   // ← captura antes do usuário sair da página
    utm: { /* parâmetros UTM da URL */ },
  }),
});
const data = await res.json();
const txId = data.txId; // guarde o txId para usar no evento Purchase
```

### 4.3 Evento Purchase (dispare quando confirmar o pagamento)
```ts
// Quando o polling confirmar status "paid":
try {
  (window as any).fbq?.(
    "track",
    "Purchase",
    { value: valorPago, currency: "BRL" },
    { eventID: txId }  // ← OBRIGATÓRIO para deduplicação
  );
} catch {}
```

> **Atenção**: o `eventID` deve ser exatamente o mesmo ID da transação enviado ao servidor
> e ao UTMify. Sem isso a deduplicação fica em 0%.

---

## PARTE 5 — Backend: módulo UTMify (`src/lib/utmify.ts`)

```ts
const UTMIFY_TOKEN    = process.env["UTMIFY_TOKEN"] || "";
const UTMIFY_PLATFORM = "Nome da Plataforma";  // ← personalize
const PRODUCT_ID      = "id-do-produto";        // ← personalize
const PRODUCT_NAME    = "Nome do Produto";      // ← personalize

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
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  return `55${digits}`;
}

export async function sendUtmifyOrder(payload: UtmifyOrderPayload): Promise<boolean> {
  try {
    if (!UTMIFY_TOKEN) return false;

    const { amountInCents } = payload;
    const gatewayFeeInCents     = Math.round(amountInCents * 0.0599); // ajuste % da sua gateway
    const userCommissionInCents = amountInCents - gatewayFeeInCents;

    const body = {
      orderId:      payload.orderId,
      eventId:      payload.orderId,  // ← OBRIGATÓRIO para deduplicação com browser pixel
      platform:     UTMIFY_PLATFORM,
      paymentMethod: "pix",
      status:       payload.status,
      createdAt:    formatDate(payload.createdAt),
      approvedDate: payload.approvedAt ? formatDate(payload.approvedAt) : null,
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
      headers: { "Content-Type": "application/json", "x-api-token": UTMIFY_TOKEN },
      body:    JSON.stringify(body),
      signal:  controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[UTMify] HTTP ${response.status} para ${payload.orderId}`);
      return false;
    }

    console.log(`[UTMify] ${payload.status} confirmado: ${payload.orderId}`);
    return true;
  } catch (err) {
    console.warn(`[UTMify] Falha: ${payload.orderId} — ${err}`);
    return false;
  }
}
```

---

## PARTE 6 — Backend: módulo CAPI direto (`src/lib/fbCapi.ts`)

```ts
import * as crypto from "crypto";

// Configure seus pixels aqui — IDs como fallback, tokens via env
const PIXELS = [
  { id: process.env["FB_PIXEL_1"] || "SEU_PIXEL_ID_1", token: process.env["FB_TOKEN_PIXEL1"] || "" },
  { id: process.env["FB_PIXEL_2"] || "SEU_PIXEL_ID_2", token: process.env["FB_TOKEN_PIXEL2"] || "" },
  { id: process.env["FB_PIXEL_3"] || "SEU_PIXEL_ID_3", token: process.env["FB_TOKEN_PIXEL3"] || "" },
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
  eventId:      string;        // mesmo txId usado no browser fbq eventID
  eventTime:    number;        // Math.floor(Date.now() / 1000)
  value:        number;        // em reais (ex: 30.00)
  currency:     string;        // "BRL"
  customer: {
    email?:     string;
    phone?:     string;
    document?:  string;        // CPF (só dígitos)
    name?:      string;
    fbp?:       string;
    fbc?:       string;
  };
  clientIp?:    string;
  clientAgent?: string;
  sourceUrl?:   string;        // URL da página de vendas
}

/**
 * Envia Purchase para todos os pixels via CAPI direto.
 * Nunca lança exceção — falhas são apenas logadas.
 */
export async function sendFbCapiPurchase(params: FbCapiPurchaseParams): Promise<void> {
  const userData: Record<string, string> = {};

  if (params.customer.email)    userData["em"]  = sha256(params.customer.email);
  if (params.customer.phone)    userData["ph"]  = sha256(normalizePhone(params.customer.phone));
  if (params.customer.document) userData["db"]  = sha256(params.customer.document.replace(/\D/g, ""));
  if (params.customer.fbp)      userData["fbp"] = params.customer.fbp;   // não hashear
  if (params.customer.fbc)      userData["fbc"] = params.customer.fbc;   // não hashear
  if (params.clientIp)          userData["client_ip_address"] = params.clientIp;
  if (params.clientAgent)       userData["client_user_agent"] = params.clientAgent;

  if (params.customer.name) {
    const parts = params.customer.name.trim().split(/\s+/);
    userData["fn"] = sha256(parts[0] || "");
    if (parts.length > 1) userData["ln"] = sha256(parts.slice(1).join(" "));
  }

  const eventPayload = {
    event_name:       "Purchase",
    event_time:       params.eventTime,
    event_id:         params.eventId,    // ← chave para deduplicação
    event_source_url: params.sourceUrl || "https://seu-dominio.com/",
    action_source:    "website",
    user_data:        userData,
    custom_data: {
      value:    params.value,
      currency: params.currency,
    },
  };

  await Promise.all(
    PIXELS.map(async (pixel) => {
      if (!pixel.token) {
        console.warn(`[FB CAPI] Token não configurado para pixel ${pixel.id}`);
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
          console.log(`[FB CAPI] Purchase OK pixel ${pixel.id} — events_received: ${json["events_received"]}`);
        } else {
          const text = await res.text().catch(() => "(sem corpo)");
          console.warn(`[FB CAPI] Erro HTTP ${res.status} pixel ${pixel.id}: ${text}`);
        }
      } catch (err) {
        console.warn(`[FB CAPI] Falha pixel ${pixel.id}: ${err}`);
      }
    })
  );
}
```

---

## PARTE 7 — Backend: rota de criação do PIX (`/api/pix/create`)

### No handler POST, extraia e salve fbp/fbc:
```ts
import { sendUtmifyOrder } from "../lib/utmify";
import { sendFbCapiPurchase } from "../lib/fbCapi";

router.post("/pix/create", async (req, res) => {
  const {
    amount, customer_name, customer_email,
    customer_phone, customer_cpf, utm,
    fbp, fbc   // ← recebe do frontend
  } = req.body;

  const clientIp = ((req.headers["x-forwarded-for"] as string) || "")
    .split(",")[0].trim() || undefined;
  const clientUa = (req.headers["user-agent"] as string) || undefined;
  const clientFbp = (fbp as string) || undefined;
  const clientFbc = (fbc as string) || undefined;

  // ... cria transação na gateway ...

  // Salva no banco incluindo fbp/fbc no campo customer
  await saveTx({
    orderId: txId,
    customer: {
      name:     customer_name,
      email:    customer_email,
      phone:    customer_phone,
      document: customer_cpf,
      ip:       clientIp,
      userAgent: clientUa,
      fbp:      clientFbp,   // ← salvo para usar no webhook
      fbc:      clientFbc,   // ← salvo para usar no webhook
    },
    // ...
  });

  // Envia waiting_payment para UTMify (para rastreamento de abandono)
  sendUtmifyOrder({
    orderId:    txId,
    status:     "waiting_payment",
    createdAt:  new Date(),
    approvedAt: null,
    customer: {
      name: customer_name, email: customer_email,
      phone: customer_phone, document: customer_cpf,
      ip: clientIp, userAgent: clientUa,
      fbp: clientFbp, fbc: clientFbc,
    },
    amountInCents,
    tracking,
  }).catch(() => {});

  res.json({ success: true, txId, /* qrcode, etc */ });
});
```

---

## PARTE 8 — Backend: webhook de pagamento confirmado

```ts
// Quando o webhook da gateway chegar com status PAID/APPROVED:

// 1. Busca transação no banco (que já tem fbp/fbc/userAgent salvos)
const tx = await markPaid(txId);

if (tx) {
  // 2. FB CAPI direto — tempo real, vai para o Facebook agora
  sendFbCapiPurchase({
    eventId:    tx.orderId,
    eventTime:  Math.floor(Date.now() / 1000),
    value:      tx.amountInCents / 100,
    currency:   "BRL",
    customer:   tx.customer,   // inclui fbp, fbc, email, phone, etc.
    clientIp:   tx.customer.ip,
    clientAgent: tx.customer.userAgent,
    sourceUrl:  "https://seu-dominio.com/",
  }).catch(() => {});

  // 3. UTMify — atribuição UTM + backup do CAPI
  const utmOk = await sendUtmifyOrder({
    orderId:    tx.orderId,
    status:     "paid",
    createdAt:  tx.createdAt,
    approvedAt: new Date(),
    customer:   tx.customer,
    amountInCents: tx.amountInCents,
    tracking:   tx.tracking,
  });

  if (utmOk) await markUtmifyNotified(tx.orderId);
}
```

---

## PARTE 9 — Job de retry UTMify (opcional, recomendado)

Arquivo: `src/lib/utmifyRetryJob.ts`

```ts
import { getPaidNotNotified, markUtmifyNotified } from "./txStore";
import { sendUtmifyOrder } from "./utmify";

export function startUtmifyRetryJob() {
  // Tenta imediatamente ao iniciar (pega pendentes de restart)
  setTimeout(() => runRetry().catch(() => {}), 5_000);
  // Repete a cada 30 segundos
  setInterval(() => runRetry().catch(() => {}), 30_000);
}

async function runRetry() {
  const pending = await getPaidNotNotified();
  for (const tx of pending) {
    const ok = await sendUtmifyOrder({
      orderId:    tx.orderId,
      status:     "paid",
      createdAt:  tx.createdAt,
      approvedAt: new Date(),
      customer:   tx.customer,
      amountInCents: tx.amountInCents,
      tracking:   tx.tracking,
    });
    if (ok) await markUtmifyNotified(tx.orderId);
  }
}
```

No `index.ts` principal:
```ts
import { startUtmifyRetryJob } from "./lib/utmifyRetryJob";
startUtmifyRetryJob();
```

---

## PARTE 10 — Checklist de verificação

### No Facebook Events Manager (Gerenciador de Eventos):
1. **Deduplicação de evento** → "Identificação do evento" deve estar 100% nos dois lados (browser + servidor)
2. **Cobertura de deduplicação** → meta: ≥ 75% (leva 7 dias para acumular após configurar)
3. **Parâmetros compartilhados** → Email, Telefone, Nome: devem estar em 100%
4. **Atualidade dos dados** → deve aparecer "Tempo real" após deploy em produção

### Sinais de que algo está errado:
| Sintoma | Causa provável |
|---|---|
| Cobertura de dedup = 0% | `eventID` no browser ≠ `eventId`/`orderId` no servidor |
| fbp = 0% no servidor | fbp não está sendo extraído do cookie e enviado |
| Atualidade = "Por hora" | Tokens não configurados na Railway (CAPI direto não funciona) |
| Eventos duplicados | `eventId` não está sendo enviado à UTMify |

---

## Resumo das variáveis de ambiente necessárias

| Variável | Onde colocar | Tipo | Descrição |
|---|---|---|---|
| `FB_PIXEL_1` | Replit + Railway | Config | ID do pixel 1 |
| `FB_PIXEL_2` | Replit + Railway | Config | ID do pixel 2 |
| `FB_PIXEL_3` | Replit + Railway | Config | ID do pixel 3 |
| `FB_TOKEN_PIXEL1` | Replit + Railway | **Secret** | Token de acesso pixel 1 |
| `FB_TOKEN_PIXEL2` | Replit + Railway | **Secret** | Token de acesso pixel 2 |
| `FB_TOKEN_PIXEL3` | Replit + Railway | **Secret** | Token de acesso pixel 3 |
| `UTMIFY_TOKEN` | Replit + Railway | **Secret** | Token da UTMify |
| `WEBHOOK_BASE_URL` | Railway | Config | URL base do servidor de produção |
