const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const apiUrl = (path: string): string => `${base}${path}`;

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
