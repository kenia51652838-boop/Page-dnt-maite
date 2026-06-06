import { useState, useEffect, useRef } from "react";
import { apiUrl, safeJson, fetchWithRetry, pollPixJob } from "@/lib/api";
import Navbar from "@/components/Navbar";
import FomoNotification from "@/components/FomoNotification";
import PrivateFomoToast from "@/components/PrivateFomoToast";

const BILL_AMOUNT = 37.45;
const FOMO_UPSELL_KEY = "fomo_shown_upsell_v1";

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
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

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresRef = useRef<number>(0);

  function stopAll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (cdRef.current)   { clearInterval(cdRef.current);   cdRef.current   = null; }
  }
  useEffect(() => () => stopAll(), []);

  // Lê doador recente do localStorage e exibe o toast de confirmação
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ds_recent_donor");
      if (!raw) return;
      const donor = JSON.parse(raw) as { nome: string; city?: string; valorNum: number; timestamp: number };
      if (Date.now() - donor.timestamp < 10 * 60 * 1000) {
        setFomoData({ name: donor.nome, city: donor.city || "", amount: donor.valorNum });
        setFomoVisible(true);
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
          try { (window as any).fbq?.("track", "Purchase", { value: BILL_AMOUNT, currency: "BRL" }); } catch {}
          stopAll(); setStep("paid");
        }
      } catch {}
    }, 5000);
  }

  async function handleGenerate() {
    setError("");
    setLoading(true);
    try {
      const res = await fetchWithRetry(apiUrl("/api/pix/create-upsell"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": crypto.randomUUID(),
        },
        body: JSON.stringify({ amount: BILL_AMOUNT }),
      });
      const rawData = await safeJson<{ pix_code?: string; transaction_id?: string; error?: string; job_id?: string; status?: string }>(res);
      if (!res.ok || rawData.error) throw new Error(rawData.error || "Erro ao gerar PIX");
      const data = (rawData.job_id && rawData.status === "processing")
        ? { ...rawData, ...(await pollPixJob(rawData.job_id)) }
        : rawData;
      setPixCode(data.pix_code || "");
      setTxId(data.transaction_id || "");
      setExpired(false);
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
        try { (window as any).fbq?.("track", "Purchase", { value: BILL_AMOUNT, currency: "BRL" }); } catch {}
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
    background: "#f4f6f8",
    fontFamily: "'Montserrat', 'Lato', sans-serif",
  };

  const wrap: React.CSSProperties = {
    maxWidth: 480,
    margin: "0 auto",
    padding: "0 1rem 3rem",
  };

  const card: React.CSSProperties = {
    background: "#fff",
    borderRadius: "16px",
    border: "1.5px solid #e5e7eb",
    padding: "1.25rem",
    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
  };

  /* ── SUCESSO ──────────────────────────────────────────────────────────── */
  if (step === "paid") {
    return (
      <div style={page}>
        <Navbar onCreateCampaign={() => {}} />
        <div style={{ ...wrap, paddingTop: "2.5rem", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72,
            background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", margin: "0 auto 1.25rem",
          }}>💡</div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: "0 0 0.6rem" }}>
            A luz vai voltar hoje!
          </h1>
          <p style={{ color: "#4b5563", lineHeight: 1.75, fontSize: "0.925rem", margin: "0 0 1.5rem" }}>
            Seu pagamento de <strong>{fmtBRL(BILL_AMOUNT)}</strong> foi confirmado. O Sr.&nbsp;
            Francivaldo e seus 4 filhos vão dormir com a energia funcionando esta noite.
          </p>

          <div style={{
            ...card,
            display: "flex", alignItems: "center", gap: "12px",
            textAlign: "left", marginBottom: "1.75rem",
            border: "1.5px solid #d1fae5",
          }}>
            <div style={{
              width: 38, height: 38, flexShrink: 0,
              background: "#24CA68", borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "1rem",
            }}>✓</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>
                Energia elétrica — {fmtBRL(BILL_AMOUNT)}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#16a34a", marginTop: "2px" }}>
                Pendência quitada com sucesso
              </div>
            </div>
          </div>

          <a href="/" style={{ color: "#9ca3af", fontSize: "0.82rem", textDecoration: "underline" }}>
            Voltar para a campanha
          </a>
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
          <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#fef9c3", border: "1.5px solid #fde047",
              borderRadius: "999px", padding: "5px 14px", marginBottom: "0.75rem",
              fontSize: "0.8rem", fontWeight: 700, color: "#854d0e",
            }}>
              ⏱ PIX expira em {countdown}
            </div>
            <h1 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#111827", margin: "0 0 0.25rem" }}>
              PIX gerado — copie e pague
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: 0 }}>
              Valor: <strong style={{ color: "#111827" }}>{fmtBRL(BILL_AMOUNT)}</strong> · Energia elétrica do Sr. Francivaldo
            </p>
          </div>

          <div style={{ ...card, marginBottom: "1rem" }}>
            <PendenciaItem />

            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem", marginTop: "1rem" }}>
              <div style={{
                fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af",
                letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "8px",
              }}>
                Código PIX — copia e cola
              </div>
              <div style={{
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: "8px", padding: "10px 12px",
                fontSize: "0.7rem", color: "#374151",
                wordBreak: "break-all", lineHeight: 1.6, marginBottom: "10px",
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

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <a href="/" style={{ color: "#9ca3af", fontSize: "0.78rem", textDecoration: "underline" }}>
              Voltar para a campanha
            </a>
          </div>
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
        background: "#dc2626",
        padding: "9px 20px",
        textAlign: "center",
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: "0.8rem",
          color: "#fff",
          letterSpacing: "0.02em",
          lineHeight: 1.5,
        }}>
          🔔 Você foi selecionado(a) para algo importante. Não feche esta página.
        </p>
      </div>

      <div style={{ ...wrap, paddingTop: "1.5rem" }}>

        {/* ── Campanha card (foto + progresso) ─────────────────────────── */}
        <div style={{ ...card, padding: 0, overflow: "hidden", marginBottom: "1.25rem" }}>

          {/* Foto hero */}
          <div style={{ position: "relative", height: "160px", overflow: "hidden" }}>
            <picture>
              <source srcSet={`${BASE}img/francivaldo.webp`} type="image/webp" />
              <img
                src={`${BASE}img/francivaldo.jpg`}
                alt="Sr. Francivaldo Pereira Ricardo"
                style={{
                  width: "100%", height: "100%", objectFit: "cover",
                  objectPosition: "center 20%",
                }}
              />
            </picture>
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.65) 100%)",
            }} />
            <div style={{
              position: "absolute", bottom: "12px", left: "14px", right: "14px",
            }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "5px",
                background: "rgba(36,202,104,0.9)", borderRadius: "999px",
                padding: "3px 10px", fontSize: "0.68rem", fontWeight: 800,
                color: "#fff", letterSpacing: "0.05em", marginBottom: "5px",
              }}>
                🟢 CAMPANHA ATIVA
              </div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: "1rem", lineHeight: 1.25, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                Sr. Francivaldo Pereira Ricardo
              </div>
              <div style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.72rem", marginTop: "2px" }}>
                ONG Doação Solidária
              </div>
            </div>
          </div>

          {/* Rodapé do card */}
          <div style={{ padding: "0.75rem 1.125rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#24CA68",
              boxShadow: "0 0 0 3px rgba(36,202,104,0.2)",
              flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.75rem", color: "#4b5563", fontWeight: 600 }}>
              Pendência identificada · aguardando o doador selecionado
            </span>
          </div>
        </div>

        {/* ── Pendências card ────────────────────────────────────────────── */}
        <div style={{ ...card, marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
            <div>
              <div style={{ fontSize: "0.68rem", fontWeight: 800, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" as const, marginBottom: "2px" }}>
                Pendências do beneficiário
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", lineHeight: 1.3 }}>
                Francivaldo Pereira Ricardo
              </div>
              <div style={{ fontSize: "0.73rem", color: "#9ca3af", marginTop: "1px" }}>
                ONG Doação Solidária · Campanha ativa
              </div>
            </div>
            <div style={{
              background: "#fef2f2", color: "#dc2626",
              fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em",
              padding: "4px 10px", borderRadius: "999px",
              border: "1px solid #fca5a5", flexShrink: 0, marginLeft: "8px",
            }}>
              1 PENDENTE
            </div>
          </div>

          <PendenciaItem />

          <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "0.75rem", marginTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Total em aberto</span>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#dc2626" }}>{fmtBRL(BILL_AMOUNT)}</span>
          </div>
        </div>

        {/* ── Copy emocional ─────────────────────────────────────────────── */}
        <p style={{ fontSize: "1rem", color: "#111827", lineHeight: 1.75, fontWeight: 600, marginBottom: "0.75rem" }}>
          Essa conta de luz estava aqui, esperando.<br />
          <strong>Esperando por você.</strong>
        </p>
        <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.8, marginBottom: "0.9rem" }}>
          Nesse exato momento a energia do Sr. Francivaldo está cortada. Sem luz, a geladeira parou,
          o ventilador que foi recebido por doações também parou — e seus <strong>4 filhos</strong>, o menor com 6 anos,
          estão agora no escuro. Ele deixou a conta atrasar tentando não deixar faltar comida para as crianças.
        </p>
        <p style={{ fontSize: "0.9rem", color: "#4b5563", lineHeight: 1.8, marginBottom: "1.25rem" }}>
          Poucas pessoas chegam até esta página. A ONG separou <strong>uma única conta</strong> —
          e ela apareceu para você. Não foi por acaso.
        </p>

        <div style={{
          background: "#fff7ed", border: "1px solid #fed7aa",
          borderRadius: "12px", padding: "0.9rem 1rem",
          marginBottom: "1.75rem", display: "flex", alignItems: "flex-start", gap: "10px",
        }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "1px" }}>⚡</span>
          <p style={{ fontSize: "0.85rem", color: "#92400e", lineHeight: 1.7, margin: 0 }}>
            <strong>{fmtBRL(BILL_AMOUNT)}</strong> é o valor exato desta conta.
            Se você pagar agora, a energia do Sr. Francivaldo volta <strong>ainda hoje</strong>.
            Esse gesto é seu — de mais ninguém.
          </p>
        </div>

        {/* ── CTA card ───────────────────────────────────────────────────── */}
        <div style={card}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: "1rem", fontWeight: 800, color: "#111827", marginBottom: "4px" }}>
              Quitar pendência via PIX
            </div>
            <div style={{ fontSize: "0.82rem", color: "#6b7280" }}>
              Um clique — sem cadastro. O PIX é gerado na hora.
            </div>
          </div>

          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: "#f9fafb", borderRadius: "10px",
            padding: "10px 14px", marginBottom: "1rem",
          }}>
            <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: 600 }}>Energia elétrica — em atraso</span>
            <span style={{ fontSize: "1rem", fontWeight: 800, color: "#111827" }}>{fmtBRL(BILL_AMOUNT)}</span>
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
            {loading ? "Gerando PIX..." : `⚡ Gerar PIX — ${fmtBRL(BILL_AMOUNT)}`}
          </button>
        </div>

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

function PendenciaItem() {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "12px",
      background: "#fafafa", border: "1px solid #f3f4f6",
      borderRadius: "12px", padding: "12px 14px",
    }}>
      <div style={{
        width: 42, height: 42, flexShrink: 0,
        background: "#fef2f2", borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.15rem",
      }}>⚡</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#111827", marginBottom: "2px" }}>
          Energia Elétrica
        </div>
        <div style={{ fontSize: "0.73rem", color: "#6b7280" }}>
          Venceu em 05/05/2026
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#dc2626", marginBottom: "4px" }}>
          {fmtBRL(BILL_AMOUNT)}
        </div>
        <div style={{
          display: "inline-block", fontSize: "0.62rem", fontWeight: 800,
          letterSpacing: "0.06em", padding: "2px 7px", borderRadius: "999px",
          background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5",
        }}>
          EM ATRASO
        </div>
      </div>
    </div>
  );
}
