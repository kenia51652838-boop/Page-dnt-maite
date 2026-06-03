const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const apiUrl = (path: string): string => `${base}${path}`;

export async function pollPixJob(jobId: string): Promise<{
  pix_code: string;
  transaction_id: string;
  expires_at: string;
  created_at: string;
  status: string;
}> {
  const MAX_ATTEMPTS = 60; // 60 × 2 s = 2 min máx
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    await new Promise(r => setTimeout(r, 2000));
    try {
      const res  = await fetch(apiUrl(`/api/pix/job/${jobId}`));
      const data = await safeJson<{ status: string; result?: Record<string, string>; error?: string }>(res);
      if (data.status === "done" && data.result) return data.result as { pix_code: string; transaction_id: string; expires_at: string; created_at: string; status: string };
      if (data.status === "error") throw new Error(data.error || "Erro ao gerar PIX");
    } catch (err) {
      if (err instanceof Error && err.message !== "Instabilidade temporária. Aguarde alguns segundos e tente novamente.") throw err;
      // instabilidade temporária → continua tentando
    }
  }
  throw new Error("Tempo esgotado ao aguardar geração do PIX. Tente novamente.");
}

export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  delayMs = 2500
): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("json") && attempt < retries) {
        await new Promise(r => setTimeout(r, delayMs));
        continue;
      }
      return res;
    } catch {
      if (attempt === retries) {
        throw new Error("Instabilidade temporária. Aguarde alguns segundos e tente novamente.");
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error("Instabilidade temporária. Aguarde alguns segundos e tente novamente.");
}

export async function safeJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    const text = await res.text().catch(() => "");
    if (text.trim().startsWith("<")) {
      throw new Error("Instabilidade temporária. Aguarde alguns segundos e tente novamente.");
    }
    throw new Error("Resposta inesperada do servidor. Tente novamente.");
  }
  try {
    return await res.json() as T;
  } catch {
    throw new Error("Instabilidade temporária. Aguarde alguns segundos e tente novamente.");
  }
}
