const BASE_URL = "https://api.luminapagamentos.com.br/api/v1";

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
  if (r && r.data && typeof r.data === "object") return r.data as Record<string, unknown>;
  return r;
}

export interface CreatePixResult {
  transaction_id: string;
  external_id: string;
  pix_code: string;
  expires_at: string;
  created_at: string;
  status: string;
}

export async function createPixTransaction(data: {
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string;
  postback_url: string;
  external_id: string;
}): Promise<CreatePixResult> {
  const amountInCents = Math.round(data.amount * 100);

  const payload = {
    name: data.customer_name,
    email: data.customer_email,
    document: {
      number: data.customer_cpf.replace(/\D/g, ""),
      type: "cpf",
    },
    phone: data.customer_phone.replace(/\D/g, ""),
    paymentMethod: "PIX",
    amount: amountInCents,
    traceable: true,
    items: [
      {
        title: "Hot - Assinatura semanal - Francis",
        unitPrice: amountInCents,
        quantity: 1,
        tangible: false,
      },
    ],
    cep: "01001000",
    street: "Rua Padrão",
    number: "1",
    complement: "",
    district: "Centro",
    city: "São Paulo",
    state: "SP",
    externalId: data.external_id,
    postbackUrl: data.postback_url,
  };

  const response = await fetch(`${BASE_URL}/transaction.pixPayments`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });

  const raw = await response.json() as unknown;

  // Log completo da resposta para diagnóstico
  console.log(`[Lumina createPix] httpStatus=${response.status} rawBody=${JSON.stringify(raw).slice(0, 800)}`);

  const txData = extractBody(raw);

  if (!response.ok && response.status !== 201) {
    throw new Error(`Lumina API error ${response.status}: ${JSON.stringify(txData)}`);
  }

  const pixObj = txData.pix as Record<string, unknown> | undefined;
  const pixCode = (pixObj?.qrCode || pixObj?.qrcode || pixObj?.code || "") as string;
  const txId = (txData.id || txData.transactionId || "") as string;
  const timestamps = txData.timestamps as Record<string, string> | undefined;

  console.log(`[Lumina createPix] txId="${txId}" externalId="${data.external_id}" pixCode=${pixCode ? "OK" : "MISSING"}`);

  if (!pixCode) {
    throw new Error(`QR Code PIX não retornado pela Lumina. Resposta: ${JSON.stringify(raw)}`);
  }

  return {
    transaction_id: txId,
    external_id: data.external_id,
    pix_code: pixCode,
    expires_at: timestamps?.expiresAt || new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    created_at: timestamps?.createdAt || new Date().toISOString(),
    status: (txData.status as string) || "PENDING",
  };
}

export async function checkPixStatus(transactionId: string, externalId?: string) {
  const PAID    = ["APPROVED"];
  const EXPIRED = ["DECLINED", "REFUNDED", "CANCELLED", "CANCELED"];

  async function queryLumina(url: string, label: string) {
    const response = await fetch(url, { method: "GET", headers: getHeaders() });
    const raw = await response.json() as unknown;
    const txData = extractBody(raw);
    const rawStatus = ((txData.status as string) || "PENDING").toUpperCase();
    console.log(`[Lumina checkPixStatus] ${label} httpStatus=${response.status} rawStatus=${rawStatus} body=${JSON.stringify(raw).slice(0, 400)}`);
    if (response.status === 404 || (txData as Record<string, unknown>).error) return null;
    return { rawStatus, txData };
  }

  // 1. Tenta por ID da transação (Lumina ID)
  let result = await queryLumina(
    `${BASE_URL}/transaction.getPayment?id=${encodeURIComponent(transactionId)}`,
    `byId(${transactionId})`
  );

  // 2. Fallback: tenta por externalId (nosso ID)
  if (!result && externalId) {
    result = await queryLumina(
      `${BASE_URL}/transaction.getByExternalId?id=${encodeURIComponent(externalId)}`,
      `byExternalId(${externalId})`
    );
  }

  if (!result) {
    throw new Error(`Transação não encontrada na Lumina: txId=${transactionId} externalId=${externalId}`);
  }

  const { rawStatus } = result;
  const mapped = PAID.includes(rawStatus) ? "paid" : EXPIRED.includes(rawStatus) ? "expired" : "pending";

  return {
    status: mapped,
    raw_status: rawStatus,
    transaction_id: transactionId,
  };
}

export interface LuminaTransactionFull {
  id:           string;
  externalId:   string;
  status:       string;
  isPaid:       boolean;
  amountInCents: number;
  createdAt:    Date;
  customer: {
    name:     string;
    email:    string;
    phone:    string;
    document: string;
  };
  rawBody: Record<string, unknown>;
}

export async function getTransactionFull(transactionId: string): Promise<LuminaTransactionFull> {
  const url = `${BASE_URL}/transaction.getPayment?id=${encodeURIComponent(transactionId)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: getHeaders(),
  });

  const raw = await response.json() as unknown;
  const txData = extractBody(raw);

  const rawStatus = ((txData.status as string) || "").toUpperCase();
  const PAID = ["APPROVED"];

  const amount = txData.amount as number | undefined;
  const amountInCents = amount ? (amount > 1000 ? amount : Math.round(amount * 100)) : 0;

  const timestamps = txData.timestamps as Record<string, string> | undefined;
  const createdAtStr = timestamps?.createdAt || timestamps?.created_at || txData.created_at as string || txData.createdAt as string || "";

  const custObj = (txData.customer || txData.buyer || txData) as Record<string, unknown>;
  const docObj  = (custObj.document || custObj.cpf || {}) as Record<string, unknown>;

  return {
    id:            (txData.id || txData.transactionId || transactionId) as string,
    externalId:    (txData.externalId || txData.external_id || "") as string,
    status:        rawStatus,
    isPaid:        PAID.includes(rawStatus),
    amountInCents,
    createdAt:     createdAtStr ? new Date(createdAtStr) : new Date(),
    customer: {
      name:     ((custObj.name || txData.name || "Desconhecido") as string),
      email:    ((custObj.email || txData.email || "") as string),
      phone:    ((custObj.phone || txData.phone || "") as string),
      document: ((typeof docObj === "string" ? docObj : (docObj.number || custObj.cpf || txData.document || "")) as string),
    },
    rawBody: txData,
  };
}
