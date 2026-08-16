import { useState, useEffect, useRef } from "react";
import { apiUrl, safeJson, fetchWithRetry, pollPixJob } from "@/lib/api";
import Navbar from "@/components/Navbar";
import FomoNotification from "@/components/FomoNotification";
import PrivateFomoToast from "@/components/PrivateFomoToast";

const BILL_AMOUNT  = 37.45;
const DUE_DATE     = new Date("2026-05-05T08:00:00-03:00");
const CUT_DATE_STR = "06/05/2026 às 08h47";
const FOMO_UPSELL_KEY = "fomo_shown_upsell_v1";

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function daysOverdue() {
  const diff = Date.now() - DUE_DATE.getTime();
  return Math.max(1, Math.floor(diff / 86_400_000));
}

type Step = "story" | "pix" | "paid";

export default function ContaAtrasada() {
  const [step, setStep]           = useState<Step>("story");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [pixCode, setPixCode]     = useState("");
  const [txId, setTxId]           = useState("");
  const [copied, setCopied]       = useState(false);
  const [countdown, setCountdown] = useState("5:00");
  const [expired, setExpired]     = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);
  const [fomoData, setFomoData]   = useState<{ name: string; city: string; amount: number } | null>(null);
  const [fomoVisible, setFomoVisible] = useState(false);
  const [viewCount]               = useState(() => Math.floor(Math.random() * 18) + 34);
  const [donorName, setDonorName] = useState<string | null>(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresRef = useRef<number>(0);
  const clientIpRef = useRef<string | undefined>(undefined);

  function stopAll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (cdRef.current)   { clearInterval(cdRef.current);   cdRef.current   = null; }
  }
  useEffect(() => () => stopAll(), []);

  useEffect(() => {
    (async () => {
      try {
        const controller = new AbortController();
        const to = setTimeout(() => controller.abort(), 4000);
        const res = await fetch("https://api64.ipify.org?format=json", { signal: controller.signal });
        clearTimeout(to);
        const data = await res.json() as { ip: string };
        if (data.ip) clientIpRef.current = data.ip;
      } catch {}
    })();
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ds_recent_donor");
      if (!raw) return;
      const donor = JSON.parse(raw) as { nome: string; city?: string; valorNum: number; timestamp: number };
      if (Date.now() - donor.timestamp < 10 * 60 * 1000) {
        setFomoData({ name: donor.nome, city: donor.city || "", amount: donor.valorNum });
        setFomoVisible(true);
      }
      if (donor.nome && donor.nome.toLowerCase() !== "anônimo" && donor.nome.toLowerCase() !== "anonimo") {
        setDonorName(donor.nome.split(" ")[0]);
      }
    } catch {}
  }, []);

  function startCountdown() {
    expiresRef.current = Date.now() + 5 * 60 * 1000;
    stopAll();
    cdRef.current = setInterval(() => {
      const rem = expiresRef.current - Date.now();
      if (rem <= 0) { setCountdown("0:00"); setExpired(true); stopAll(); return; }
      const s = Math.ceil(rem / 1000);
      setCountdown(`${Math.floor(s / 60)}:${(s % 60) < 10 ? "0" : ""}${s % 60}`);
    }, 250);
  }

  function startPolling(id: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(apiUrl(`/api/pix/status/${id}`));
        const data = await res.json() as { status?: string };
        if (data.status === "paid") {
          try { (window as any).fbq?.("track", "Purchase", { value: BILL_AMOUNT, currency: "BRL" }, { eventID: id }); } catch {}
          stopAll(); setStep("paid");
        }
      } catch {}
    }, 5000);
  }

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const readFbp = (): string | undefined => { try { const m = document.cookie.match(/(^|;\s*)_fbp=([^;]+)/); return m ? m[2] : undefined; } catch { return undefined; } };
      const readFbc = (): string | undefined => { try { const m = document.cookie.match(/(^|;\s*)_fbc=([^;]+)/); if (m) return m[2]; const c = new URLSearchParams(window.location.search).get("fbclid"); return c ? `fb.1.${Date.now()}.${c}` : undefined; } catch { return undefined; } };

      const res = await fetchWithRetry(apiUrl("/api/pix/create-upsell"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({ amount: BILL_AMOUNT, fbp: readFbp(), fbc: readFbc(), client_ip: clientIpRef.current }),
      });
      const rawData = await safeJson<{ pix_code?: string; transaction_id?: string; error?: string; job_id?: string; status?: string }>(res);
      if (!res.ok || rawData.error) throw new Error(rawData.error || "Erro ao gerar PIX");
      const data = (rawData.job_id && rawData.status === "processing")
        ? { ...rawData, ...(await pollPixJob(rawData.job_id)) }
        : rawData;
      setPixCode(data.pix_code || "");
      setTxId(data.transaction_id || "");
      setExpired(false);
      try { (window as any).fbq?.("track", "InitiateCheckout", { value: BILL_AMOUNT, currency: "BRL", num_items: 1, content_ids: ["hot-assinatura-semanal-francis"] }, { eventID: `checkout_${data.transaction_id || ""}` }); } catch {}
      setStep("pix");
      startCountdown();
      startPolling(data.transaction_id || "");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar PIX");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!txId || verifying) return;
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const res  = await fetch(apiUrl(`/api/pix/status/${txId}`));
      const data = await res.json() as { status?: string };
      if (data.status === "paid") {
        try { (window as any).fbq?.("track", "Purchase", { value: BILL_AMOUNT, currency: "BRL" }, { eventID: txId }); } catch {}
        stopAll(); setStep("paid");
      } else setVerifyMsg("Pagamento ainda não identificado. Aguarde alguns instantes.");
    } catch { setVerifyMsg("Erro ao verificar. Tente novamente."); }
    finally  { setVerifying(false); }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  const BASE = import.meta.env.BASE_URL as string;

  const page: React.CSSProperties = {
    minHeight: "100dvh",
    background: "#f0f2f5",
    fontFamily: "'Montserrat', 'Lato', sans-serif",
  };

  const wrap: React.CSSProperties = {
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 1rem 3rem",
  };

  /* ── SUCESSO ──────────────────────────────────────────────────────────── */
  if (step === "paid") {
    return (
      <div style={page}>
        <Navbar onCreateCampaign={() => {}} />
        <div style={{ ...wrap, paddingTop: "2rem" }}>

          {/* Comprovante */}
          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1.5px solid #d1fae5",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(22,163,74,0.12)",
            marginBottom: "1.25rem",
          }}>
            {/* Topo verde */}
            <div style={{
              background: "linear-gradient(135deg,#16a34a,#22c55e)",
              padding: "1.5rem 1.25rem 1.25rem",
              textAlign: "center",
            }}>
              <div style={{
                width: 60, height: 60,
                background: "rgba(255,255,255,0.2)",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.75rem", margin: "0 auto 0.75rem",
              }}>✓</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "1.2rem", lineHeight: 1.3 }}>
                {donorName ? `Obrigado, ${donorName}!` : "Doação confirmada!"}
              </div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.82rem", marginTop: "4px" }}>
                Seu PIX foi processado com sucesso
              </div>
            </div>

            {/* Corpo do comprovante */}
            <div style={{ padding: "1.25rem" }}>
              {/* Linha decorativa tipo rasgo de papel */}
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                marginBottom: "1.1rem",
              }}>
                <div style={{ flex: 1, height: "1px", background: "repeating-linear-gradient(90deg,#e5e7eb 0,#e5e7eb 6px,transparent 6px,transparent 12px)" }} />
                <span style={{ fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Comprovante</span>
                <div style={{ flex: 1, height: "1px", background: "repeating-linear-gradient(90deg,#e5e7eb 0,#e5e7eb 6px,transparent 6px,transparent 12px)" }} />
              </div>

              <Row label="Beneficiária" value="Família de Maíte (Glaice)" />
              <Row label="Referência" value="Energia elétrica — conta em atraso" />
              <Row label="Valor pago" value={fmtBRL(BILL_AMOUNT)} highlight />
              <Row label="Situação da conta" value="QUITADA ✓" green />
              <Row label="Data" value={new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} />

              <div style={{
                marginTop: "1.1rem",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "0.85rem 1rem",
                fontSize: "0.83rem",
                color: "#15803d",
                lineHeight: 1.65,
              }}>
                ⚡ A distribuidora receberá o pagamento e a energia da família da Maíte será religada em até <strong>24h úteis</strong>. A Maíte vai dormir com luz esta noite.
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <a href="/" style={{ color: "#9ca3af", fontSize: "0.8rem", textDecoration: "underline" }}>
              Voltar para a campanha
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── PIX GERADO ───────────────────────────────────────────────────────── */
  if (step === "pix") {
    return (
      <div style={page}>
        <Navbar onCreateCampaign={() => {}} />
        <FomoNotification onDonate={() => {}} storageKey={FOMO_UPSELL_KEY} />

        <div style={{ ...wrap, paddingTop: "1.5rem" }}>

          {/* Timer */}
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: expired ? "#fef2f2" : "#fef9c3",
              border: `1.5px solid ${expired ? "#fca5a5" : "#fde047"}`,
              borderRadius: "999px", padding: "5px 16px",
              fontSize: "0.8rem", fontWeight: 700,
              color: expired ? "#dc2626" : "#854d0e",
            }}>
              ⏱ {expired ? "PIX expirado" : `PIX expira em ${countdown}`}
            </div>
          </div>

          {/* Mini conta */}
          <div style={{
            background: "#fff",
            borderRadius: "14px",
            border: "1.5px solid #e5e7eb",
            overflow: "hidden",
            marginBottom: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            {/* Header da conta */}
            <div style={{
              background: "#1e3a5f",
              padding: "10px 14px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase" as const }}>Distribuidora de Energia</div>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem" }}>Aviso de Débito em Atraso</div>
              </div>
              <div style={{
                background: "#ef4444", color: "#fff",
                fontSize: "0.6rem", fontWeight: 800,
                padding: "3px 8px", borderRadius: "4px",
                letterSpacing: "0.06em",
              }}>CORTE REALIZADO</div>
            </div>

            <div style={{ padding: "0.9rem 1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <MiniField label="Nome" value="Glaice (família da Maíte)" />
                <MiniField label="Vencimento" value="05/05/2026" />
                <MiniField label="Em atraso há" value={`${daysOverdue()} dias`} red />
                <MiniField label="Valor" value={fmtBRL(BILL_AMOUNT)} red bold />
              </div>
              <Barcode />
            </div>
          </div>

          {/* PIX code */}
          <div style={{
            background: "#fff",
            borderRadius: "14px",
            border: "1.5px solid #e5e7eb",
            padding: "1rem",
            marginBottom: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af", letterSpacing: "0.07em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
              Código PIX — copia e cola
            </div>
            <div style={{
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: "8px", padding: "10px 12px",
              fontSize: "0.7rem", color: "#374151",
              wordBreak: "break-all" as const, lineHeight: 1.6, marginBottom: "10px",
              fontFamily: "monospace", userSelect: "text" as const,
            }}>
              {pixCode}
            </div>
            <button
              onClick={handleCopy}
              disabled={expired}
              style={{
                width: "100%",
                background: copied ? "#16a34a" : "linear-gradient(135deg,#24CA68,#1aad56)",
                color: "#fff", border: "none", borderRadius: "10px",
                padding: "13px 16px", fontSize: "0.95rem", fontWeight: 700,
                cursor: expired ? "not-allowed" : "pointer",
                opacity: expired ? 0.5 : 1,
                boxShadow: expired || copied ? "none" : "0 4px 12px rgba(36,202,104,0.3)",
              }}
            >
              {copied ? "✅ Copiado!" : "📋 Copiar código PIX"}
            </button>

            <div style={{
              marginTop: "10px",
              display: "flex", alignItems: "center", gap: "6px",
              background: "#f0fdf4", borderRadius: "8px", padding: "8px 10px",
            }}>
              <span style={{ fontSize: "0.9rem" }}>🔒</span>
              <span style={{ fontSize: "0.73rem", color: "#15803d", lineHeight: 1.5 }}>
                Seu PIX paga diretamente a distribuidora de energia da família da Maíte
              </span>
            </div>
          </div>

          {expired ? (
            <div style={{
              background: "#fef2f2", border: "1.5px solid #fca5a5",
              borderRadius: "12px", padding: "1rem", textAlign: "center",
              color: "#dc2626", fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem",
            }}>
              ⏰ PIX expirado.{" "}
              <a href="/conta-atrasada" style={{ color: "#dc2626", textDecoration: "underline" }}>
                Gerar novamente
              </a>
            </div>
          ) : (
            <div>
              <button
                onClick={handleVerify}
                disabled={verifying}
                style={{
                  width: "100%", background: "#fff",
                  border: "1.5px solid #d1d5db", borderRadius: "10px",
                  padding: "12px 20px", fontSize: "0.875rem",
                  color: "#374151", cursor: "pointer", fontWeight: 600,
                  marginBottom: "0.4rem",
                }}
              >
                {verifying ? "Verificando..." : "Já paguei — confirmar"}
              </button>
              {verifyMsg && (
                <p style={{ color: "#6b7280", fontSize: "0.78rem", margin: "4px 0 0", textAlign: "center" }}>
                  {verifyMsg}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── HISTÓRIA / CTA ───────────────────────────────────────────────────── */
  return (
    <>
    <div style={page}>
      <Navbar onCreateCampaign={() => {}} />
      <FomoNotification onDonate={() => {}} storageKey={FOMO_UPSELL_KEY} />

      {/* ── Faixa de atenção ──────────────────────────────────────────────── */}
      <div style={{
        background: "#1e3a5f",
        padding: "9px 20px",
        textAlign: "center",
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: "0.78rem",
          color: "#fff",
          letterSpacing: "0.02em",
          lineHeight: 1.5,
        }}>
          ⚡ A conta de energia da família da Maíte chegou até você — ela ainda não foi quitada
        </p>
      </div>

      <div style={{ ...wrap, paddingTop: "1.5rem" }}>

        {/* ── Prova social ──────────────────────────────────────────────────── */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
          marginBottom: "1.1rem",
          fontSize: "0.75rem", color: "#6b7280", fontWeight: 600,
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            background: "#fff", border: "1px solid #e5e7eb",
            borderRadius: "999px", padding: "4px 12px",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          }}>
            👁 <span>{viewCount} pessoas viram esta conta hoje</span>
          </span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: "4px",
            background: "#fff7ed", border: "1px solid #fed7aa",
            borderRadius: "999px", padding: "4px 12px",
            color: "#92400e",
          }}>
            🕐 nenhuma ajudou ainda
          </span>
        </div>

        {/* ── Foto + urgência ───────────────────────────────────────────────── */}
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1.5px solid #e5e7eb",
          overflow: "hidden",
          marginBottom: "1.1rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{ position: "relative", height: "170px", overflow: "hidden" }}>
            <img
                src={`${BASE}img/maite.png`}
                alt="Maíte e sua mãe Glaice"
                style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 20%" }}
              />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, transparent 25%, rgba(0,0,0,0.72) 100%)",
            }} />
            <div style={{ position: "absolute", bottom: "12px", left: "14px", right: "14px" }}>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", lineHeight: 1.25, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
                Glaice — mãe da Maíte
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: "0.72rem", marginTop: "2px" }}>
                ONG Doação Solidária — Nordeste, Brasil
              </div>
            </div>
          </div>

          {/* Linha de status — energia cortada */}
          <div style={{
            padding: "0.7rem 1rem",
            display: "flex", alignItems: "center", gap: "10px",
            borderTop: "1.5px solid #fef2f2",
            background: "#fffbfb",
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#ef4444",
              boxShadow: "0 0 0 3px rgba(239,68,68,0.2)",
              flexShrink: 0,
              animation: "pulse 1.5s infinite",
            }} />
            <span style={{ fontSize: "0.75rem", color: "#dc2626", fontWeight: 700 }}>
              Energia cortada desde {CUT_DATE_STR} · {daysOverdue() - 1} dia{daysOverdue() - 1 !== 1 ? "s" : ""} sem luz
            </span>
          </div>
        </div>

        {/* ── Conta de energia (documento) ──────────────────────────────────── */}
        <div style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1.5px solid #e5e7eb",
          overflow: "hidden",
          marginBottom: "1.1rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          {/* Cabeçalho estilo distribuidora */}
          <div style={{
            background: "#1e3a5f",
            padding: "10px 14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>Distribuidora de Energia</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem" }}>Conta de Energia Elétrica</div>
            </div>
            <div style={{
              background: "#ef4444", color: "#fff",
              fontSize: "0.58rem", fontWeight: 800,
              padding: "3px 8px", borderRadius: "4px",
              letterSpacing: "0.06em", textTransform: "uppercase" as const,
            }}>CORTE REALIZADO</div>
          </div>

          <div style={{ padding: "0.9rem 1rem" }}>
            {/* Dados da conta */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px", marginBottom: "12px" }}>
              <MiniField label="Titular" value="Glaice (família da Maíte)" />
              <MiniField label="Nº da conta" value="3847-2" />
              <MiniField label="Competência" value="Abril / 2026" />
              <MiniField label="Vencimento" value="05/05/2026" />
              <MiniField label="Em atraso há" value={`${daysOverdue()} dias`} red />
              <MiniField label="Valor total" value={fmtBRL(BILL_AMOUNT)} red bold />
            </div>

            {/* Pendências */}
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: "8px", padding: "8px 10px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: "12px",
            }}>
              <div>
                <div style={{ fontSize: "0.73rem", fontWeight: 700, color: "#111827" }}>Energia Elétrica</div>
                <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "1px" }}>Venceu em 05/05/2026</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "#dc2626" }}>{fmtBRL(BILL_AMOUNT)}</div>
                <div style={{
                  fontSize: "0.58rem", fontWeight: 800,
                  padding: "1px 6px", borderRadius: "999px",
                  background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5",
                  display: "inline-block", marginTop: "2px",
                }}>EM ATRASO</div>
              </div>
            </div>

            <Barcode />
          </div>
        </div>

        {/* ── Copy emocional ─────────────────────────────────────────────────── */}
        <p style={{ fontSize: "1rem", color: "#111827", lineHeight: 1.75, fontWeight: 700, marginBottom: "0.6rem" }}>
          Essa conta chegou até você por um motivo.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#4b5563", lineHeight: 1.85, marginBottom: "0.8rem" }}>
          Desde {CUT_DATE_STR}, a energia da família da Maíte está cortada. A geladeira parou
          e a <strong>pequena Maíte</strong>, que precisa de seus equipamentos de reabilitação, está
          dormindo no escuro e no calor. A conta atrasou porque o dinheiro foi para o tratamento da Maíte.
        </p>
        <p style={{ fontSize: "0.88rem", color: "#4b5563", lineHeight: 1.85, marginBottom: "1.25rem" }}>
          A ONG identificou <strong>uma única conta</strong> pendente para este mês —
          e ela apareceu para você entre centenas de apoiadores. Quem quita, quita sozinho.
        </p>

        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: "12px", padding: "0.9rem 1rem",
          marginBottom: "1.75rem", display: "flex", alignItems: "flex-start", gap: "10px",
        }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "1px" }}>⚡</span>
          <p style={{ fontSize: "0.83rem", color: "#92400e", lineHeight: 1.7, margin: 0 }}>
            <strong>{fmtBRL(BILL_AMOUNT)}</strong> é o valor exato desta conta.
            Se você pagar agora, a energia volta <strong>ainda hoje</strong>.
            Esse gesto é seu — de mais ninguém.
          </p>
        </div>

        {/* ── CTA card ───────────────────────────────────────────────────────── */}
        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1.5px solid #e5e7eb",
          padding: "1.25rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
              Quitar esta conta via PIX
            </div>
            <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
              Sem cadastro. O código PIX é gerado em segundos.
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#fef2f2", border: "1px solid #fca5a5",
            borderRadius: "10px", padding: "10px 14px", marginBottom: "1rem",
          }}>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#374151", fontWeight: 700 }}>Energia elétrica — em atraso</div>
              <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: "2px" }}>{daysOverdue()} dias de atraso</div>
            </div>
            <span style={{ fontSize: "1.05rem", fontWeight: 800, color: "#dc2626" }}>{fmtBRL(BILL_AMOUNT)}</span>
          </div>

          {error && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fca5a5",
              borderRadius: "8px", padding: "9px 12px",
              color: "#dc2626", fontSize: "0.82rem", marginBottom: "0.75rem",
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#9ca3af" : "linear-gradient(135deg,#24CA68,#1aad56)",
              color: "#fff", border: "none", borderRadius: "12px",
              padding: "15px 20px", fontSize: "1rem", fontWeight: 800,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 14px rgba(36,202,104,0.35)",
              letterSpacing: "0.01em",
            }}
          >
            {loading ? "Gerando PIX..." : `⚡ Quitar conta — ${fmtBRL(BILL_AMOUNT)}`}
          </button>

          <div style={{
            marginTop: "10px",
            display: "flex", alignItems: "center", gap: "6px",
            background: "#f9fafb", borderRadius: "8px", padding: "8px 10px",
          }}>
            <span style={{ fontSize: "0.9rem" }}>🔒</span>
            <span style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.5 }}>
              Pagamento seguro via PIX · vai direto para a distribuidora de energia
            </span>
          </div>
        </div>

        {!txId && (
          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <a
              href="/"
              style={{
                color: "#9ca3af", fontSize: "0.8rem",
                textDecoration: "none", display: "inline-flex",
                alignItems: "center", gap: "4px",
              }}
            >
              ← Não dessa vez — voltar para o início
            </a>
          </div>
        )}

      </div>
    </div>

    {fomoVisible && fomoData && (
      <PrivateFomoToast
        name={fomoData.name}
        city={fomoData.city}
        amount={fomoData.amount}
        onDismiss={() => setFomoVisible(false)}
      />
    )}
    </>
  );
}

/* ── Componentes auxiliares ────────────────────────────────────────────── */

function MiniField({ label, value, red, bold }: { label: string; value: string; red?: boolean; bold?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: "0.6rem", color: "#9ca3af", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "2px" }}>
        {label}
      </div>
      <div style={{ fontSize: "0.78rem", fontWeight: bold ? 800 : 600, color: red ? "#dc2626" : "#111827" }}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, highlight, green }: { label: string; value: string; highlight?: boolean; green?: boolean }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "7px 0",
      borderBottom: "1px solid #f3f4f6",
    }}>
      <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{label}</span>
      <span style={{
        fontSize: "0.82rem",
        fontWeight: highlight || green ? 800 : 600,
        color: green ? "#16a34a" : highlight ? "#111827" : "#374151",
      }}>{value}</span>
    </div>
  );
}

function Barcode() {
  const bars = Array.from({ length: 48 }, (_, i) => ({
    w: [1, 2, 1, 3, 1, 2, 2, 1][i % 8],
    dark: i % 3 !== 2,
  }));
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        display: "inline-flex", alignItems: "flex-end", gap: "1.5px",
        height: "36px", padding: "0 4px",
      }}>
        {bars.map((b, i) => (
          <div key={i} style={{
            width: `${b.w * 2}px`,
            height: b.dark ? (i % 5 === 0 ? "100%" : "80%") : "60%",
            background: b.dark ? "#1e3a5f" : "#94a3b8",
            borderRadius: "1px",
          }} />
        ))}
      </div>
      <div style={{ fontSize: "0.6rem", color: "#9ca3af", marginTop: "3px", letterSpacing: "0.2em" }}>
        3847 2026 0505 {Math.floor(BILL_AMOUNT * 100).toString().padStart(6, "0")}
      </div>
    </div>
  );
}
