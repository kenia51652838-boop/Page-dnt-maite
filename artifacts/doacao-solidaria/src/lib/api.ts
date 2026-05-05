const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const apiUrl = (path: string): string => `${base}${path}`;
