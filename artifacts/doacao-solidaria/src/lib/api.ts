const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const apiUrl = (path: string): string => `${base}${path}`;

export async function safeJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("json")) {
    const text = await res.text().catch(() => "");
    if (text.trim().startsWith("<")) {
      throw new Error("Instabilidade temporária. Aguarde alguns segundos e tente novamente.");
    }
    throw new Error("Resposta inesperada do servidor. Tente novamente.");
  }
  return res.json() as Promise<T>;
}
