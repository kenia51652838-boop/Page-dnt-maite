import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const ALLOWED_HOSTS = [
  "apoio.uniaosolidaria.digital",
  "apoio.familiasolidaria.digital",
  "apoio.esperancaviva.digital",
  "apoio.felicidadefamiliar.info",
  "salvar.esperancaunida.click",
  "francis-production.up.railway.app",
];

const DEV_PATTERNS = [
  "localhost",
  "127.0.0.1",
  ".replit.dev",
  ".repl.co",
  ".replit.app",
];

function isAllowedHost(hostname: string): boolean {
  if (ALLOWED_HOSTS.includes(hostname)) return true;
  if (DEV_PATTERNS.some((p) => hostname === p || hostname.endsWith(p))) return true;
  return false;
}

if (!isAllowedHost(window.location.hostname)) {
  const target =
    "https://apoio.uniaosolidaria.digital" +
    window.location.pathname +
    window.location.search;
  window.location.replace(target);
} else {
  createRoot(document.getElementById("root")!).render(<App />);
}
