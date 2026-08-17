const BASE_URL          = "https://api.luminapagamentos.com.br/api/v1";
const LUMINA_TIMEOUT_MS = 25_000;  // 25 s — Lumina pode ser lenta
const MAX_RETRIES       = 2;       // 3 tentativas no total (inicial + 2 retries)

function getHeaders() {
  const key = process.env["LUMINA_SECRET_KEY"];
  if (!key) throw new Error("LUMINA_SECRET_KEY não configurada");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function extractBody(raw: unknown): Record<string, unknown> {
  const r = raw as Record<string, unknown>;
  if (r && r._body && typeof r._body === "object") return r._body as Record<string, unknown>;
  if (r && r.data  && typeof r.data  === "object") return r.data  as Record<string, unknown>;
  return r;
}

// ── Safe fetch com timeout ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LUMINA_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Lumina não respondeu em ${LUMINA_TIMEOUT_MS / 1000}s (timeout)`);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Safe JSON parser — lê como texto primeiro, depois faz JSON.parse ────────
// Evita "Unexpected end of JSON input" vazar direto para o usuário.

async function safeParseJson(response: Response, label: string): Promise<unknown> {
  let text = "";
  try {
    text = await response.text();
  } catch (err) {
    throw new Error(`Lumina [${label}] HTTP ${response.status}: falha ao ler corpo da resposta — ${String(err)}`);
  }

  if (!text.trim()) {
    throw new Error(`Lumina [${label}] HTTP ${response.status}: resposta vazia`);
  }
  if (text.trim().startsWith("<")) {
    throw new Error(`Lumina [${label}] HTTP ${response.status}: servidor retornou HTML (sobrecarregado ou em manutenção)`);
  }

  try {
    return JSON.parse(text);
  } catch {
    // JSON truncado ou malformado — loga o trecho para diagnóstico
    console.error(`[Lumina ${label}] JSON inválido HTTP=${response.status} body="${text.slice(0, 400)}"`);
    throw new Error(`Lumina [${label}] HTTP ${response.status}: resposta JSON incompleta — serviço instável`);
  }
}

// ── Tipos públicos ─────────────────────────────────────────────────────────

export interface CreatePixResult {
  transaction_id: string;
  external_id:    string;
  pix_code:       string;
  expires_at:     string;
  created_at:     string;
  status:         string;
}

// ── createPixTransaction — com retry automático ────────────────────────────

export async function createPixTransaction(data: {
  amount:          number;
  customer_name:   string;
  customer_email:  string;
  customer_phone:  string;
  customer_cpf:    string;
  postback_url:    string;
  external_id:     string;
  product_title?:  string;
}): Promise<CreatePixResult> {
  const amountInCents = Math.round(data.amount * 100);

  const payload = {
    name:          data.customer_name,
    email:         data.customer_email,
    document:      { number: data.customer_cpf.replace(/\D/g, ""), type: "cpf" },
    phone:         data.customer_phone.replace(/\D/g, ""),
    paymentMethod: "PIX",
    amount:        amountInCents,
    items: [{
      title:     data.product_title || "Doação - Tratamento Maíte",
      unitPrice: amountInCents,
      quantity:  1,
      tangible:  false,
    }],
    cep:        "01001000",
    street:     "Rua Padrão",
    number:     "1",
    complement: "",
    district:   "Centro",
    city:       "São Paulo",
    state:      "SP",
    externalId:  data.external_id,
    postbackUrl: data.postback_url,
  };

  // Log do payload completo antes de enviar — diagnóstico
  console.log(`[Lumina createPix] PAYLOAD ENVIADO: ${JSON.stringify({ ...payload, document: { number: payload.document.number.slice(0, 3) + "***", type: "cpf" } })}`);


  let lastError: Error = new Error("Erro desconhecido ao criar PIX");

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      const delayMs = 3_000 * attempt; // 3s, 6s
      console.warn(`[Lumina createPix] Retentativa ${attempt}/${MAX_RETRIES} em ${delayMs}ms — erro: ${lastError.message}`);
      await new Promise(r => setTimeout(r, delayMs));
    }

    try {
      const response = await fetchWithTimeout(`${BASE_URL}/transaction.pixPayments`, {
        method:  "POST",
        headers: getHeaders(),
        body:    JSON.stringify(payload),
      });

      const raw    = await safeParseJson(response, "createPix");
      const txData = extractBody(raw);

      // Log completo para diagnóstico no Railway — não truncar
      console.log(`[Lumina createPix] attempt=${attempt} HTTP=${response.status} FULL_BODY=${JSON.stringify(raw)}`);

      if (!response.ok && response.status !== 201) {
        // Erros 4xx são permanentes — não tem sentido fazer retry
        const is4xx = response.status >= 400 && response.status < 500;
        const errMsg = `Lumina API error ${response.status}: ${JSON.stringify(txData)}`;
        if (is4xx) throw Object.assign(new Error(errMsg), { permanent: true });
        throw new Error(errMsg);
      }

      const pixObj = txData.pix as Record<string, unknown> | undefined;

      // Lumina pode usar vários nomes para o campo do QR code — testamos todos
      const pixCode = (
        pixObj?.qrCode     ||
        pixObj?.qrcode     ||
        pixObj?.emv        ||
        pixObj?.payload    ||
        pixObj?.brcode     ||
        pixObj?.code       ||
        pixObj?.copy_paste ||
        txData.qrCode      ||
        txData.qrcode      ||
        txData.emv         ||
        txData.payload     ||
        ""
      ) as string;

      const txId   = (txData.id || txData.transactionId || "") as string;
      const stamps = txData.timestamps as Record<string, string> | undefined;

      console.log(`[Lumina createPix] txId="${txId}" externalId="${data.external_id}" pixCode=${pixCode ? "OK("+pixCode.slice(0,20)+"...)" : "MISSING"}`);

      if (!pixCode) {
        // QR Code ausente — a Lumina não oferece endpoint de consulta, então lança erro direto
        console.error(`[Lumina createPix] QR CODE AUSENTE — BODY COMPLETO: ${JSON.stringify(raw)}`);
        throw new Error(`QR Code PIX ausente na resposta da Lumina. Body: ${JSON.stringify(raw)}`);
      }

      return {
        transaction_id: txId,
        external_id:    data.external_id,
        pix_code:       pixCode,
        expires_at:     stamps?.expiresAt || new Date(Date.now() + 30 * 60_000).toISOString(),
        created_at:     stamps?.createdAt || new Date().toISOString(),
        status:         (txData.status as string) || "PENDING",
      };

    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // Erro permanente (4xx) — não faz retry
      if ((err as NodeJS.ErrnoException & { permanent?: boolean }).permanent) break;
    }
  }

  // Todas as tentativas falharam — lança com mensagem amigável ao usuário
  const detail = lastError.message;
  console.error(`[Lumina createPix] TODAS as tentativas falharam: ${detail}`);
  throw new Error(
    "Serviço de pagamento temporariamente indisponível. Aguarde alguns instantes e tente novamente."
  );
}

// Nota: a Lumina não oferece endpoints de consulta de status.
// O status dos pagamentos chega exclusivamente via webhook (POST /api/webhook/lumina).
