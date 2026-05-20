import { useState, useEffect, useRef } from "react";
import { apiUrl, safeJson, fetchWithRetry } from "@/lib/api";

const BILL_AMOUNT = 26.49;

function fmtBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function fmtPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function fmtCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

type Step = "story" | "pix" | "paid";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
  background: "#fff",
  boxSizing: "border-box",
  color: "#111827",
  transition: "border-color 0.15s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.78rem",
  fontWeight: 700,
  color: "#374151",
  marginBottom: "5px",
  letterSpacing: "0.01em",
};

export default function ContaAtrasada() {
  const [step, setStep] = useState<Step>("story");
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf]     = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading]   = useState(false);
  const [pixCode, setPixCode]   = useState("");
  const [txId, setTxId]         = useState("");
  const [copied, setCopied]     = useState(false);
  const [countdown, setCountdown] = useState("5:00");
  const [expired, setExpired]   = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const pollRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresRef = useRef<number>(0);

  function stopAll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (cdRef.current)   { clearInterval(cdRef.current);   cdRef.current   = null; }
  }
  useEffect(() => () => stopAll(), []);

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
        if (data.status === "paid") { stopAll(); setStep("paid"); }
      } catch {}
    }, 5000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || name.trim().split(" ").filter(Boolean).length < 2) {
      setError("Digite seu nome completo."); return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Digite um e-mail válido."); return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Digite seu celular com DDD."); return;
    }
    if (cpf.replace(/\D/g, "").length < 11) {
      setError("CPF inválido — verifique os 11 dígitos."); return;
    }
    setLoading(true);
    try {
      const res = await fetchWithRetry(apiUrl("/api/pix/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: BILL_AMOUNT,
          customer_name:  name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.replace(/\D/g, ""),
          customer_cpf:   cpf.replace(/\D/g, ""),
        }),
      });
      const data = await safeJson<{ pix_code?: string; transaction_id?: string; error?: string }>(res);
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao gerar PIX");
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
      if (data.status === "paid") { stopAll(); setStep("paid"); }
      else setVerifyMsg("Pagamento ainda não identificado. Aguarde alguns instantes.");
    } catch { setVerifyMsg("Erro ao verificar. Tente novamente."); }
    finally  { setVerifying(false); }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

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

  if (step === "paid") {
    return (
      <div style={page}>
        <ConfirmedBar />
        <div style={{ ...wrap, paddingTop: "2.5rem", textAlign: "center" }}>
          <div style={{
            width: 72, height: 72,
            background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", margin: "0 auto 1.25rem",
          }}>
            💡
          </div>

          <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", margin: "0 0 0.6rem" }}>
            A luz vai voltar hoje!
          </h1>
          <p style={{ color: "#4b5563", lineHeight: 1.75, fontSize: "0.9rem", margin: "0 0 1.5rem" }}>
            Seu pagamento de <strong>{fmtBRL(BILL_AMOUNT)}</strong> foi confirmado.
            O Sr. Francivaldo e seus 4 filhos vão dormir com a energia funcionando esta noite.
            Você foi além — e isso importa demais.
          </p>

          <div style={{
            background: "#fff",
            border: "1.5px solid #d1fae5",
            borderRadius: "14px",
            padding: "1.1rem 1.25rem",
            marginBottom: "1.75rem",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            textAlign: "left",
          }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0,
              background: "#24CA68",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontSize: "1rem",
            }}>✓</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827" }}>
                Energia elétrica — {fmtBRL(BILL_AMOUNT)}
              </div>
              <div style={{ fontSize: "0.77rem", color: "#16a34a", marginTop: "2px" }}>
                Pendência quitada com sucesso
              </div>
            </div>
          </div>

          <a href="/" style={{
            display: "inline-block",
            color: "#6b7280",
            fontSize: "0.82rem",
            textDecoration: "none",
            borderBottom: "1px solid #d1d5db",
            paddingBottom: "1px",
          }}>
            Voltar para a campanha
          </a>
        </div>
      </div>
    );
  }

  if (step === "pix") {
    return (
      <div style={page}>
        <ConfirmedBar />
        <div style={{ ...wrap, paddingTop: "1.5rem" }}>

          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#fef9c3", border: "1.5px solid #fde047",
              borderRadius: "999px", padding: "5px 14px",
              fontSize: "0.78rem", fontWeight: 700, color: "#854d0e",
              marginBottom: "0.75rem",
            }}>
              ⏱ PIX expira em {countdown}
            </div>
            <h1 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#111827", margin: "0 0 0.25rem" }}>
              PIX gerado
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: 0 }}>
              Copie o código e pague {fmtBRL(BILL_AMOUNT)} no seu banco
            </p>
          </div>

          <div style={{
            background: "#fff",
            borderRadius: "16px",
            border: "1.5px solid #e5e7eb",
            padding: "1.25rem",
            marginBottom: "1rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}>
            <PendenciaItem paid />

            <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "1rem", marginTop: "1rem" }}>
              <div style={{
                fontSize: "0.7rem", fontWeight: 700, color: "#9ca3af",
                letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "8px",
              }}>
                Código PIX — copia e cola
              </div>
              <div style={{
                background: "#f9fafb",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                padding: "10px 12px",
                fontSize: "0.7rem",
                color: "#374151",
                wordBreak: "break-all",
                lineHeight: 1.55,
                marginBottom: "10px",
                fontFamily: "monospace",
                userSelect: "text",
              }}>
                {pixCode}
              </div>
              <button
                onClick={handleCopy}
                disabled={expired}
                style={{
                  width: "100%",
                  background: copied
                    ? "#16a34a"
                    : "linear-gradient(135deg,#24CA68,#1aad56)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "13px 16px",
                  fontSize: "0.95rem",
                  fontWeight: 700,
                  cursor: expired ? "not-allowed" : "pointer",
                  opacity: expired ? 0.5 : 1,
                  transition: "background 0.2s",
                  boxShadow: expired ? "none" : "0 4px 12px rgba(36,202,104,0.3)",
                }}
              >
                {copied ? "✅ Copiado!" : "📋 Copiar código PIX"}
              </button>
            </div>
          </div>

          {expired ? (
            <div style={{
              background: "#fef2f2", border: "1.5px solid #fca5a5",
              borderRadius: "12px", padding: "1rem",
              textAlign: "center", color: "#dc2626",
              fontSize: "0.85rem", fontWeight: 600, marginBottom: "1rem",
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
                  width: "100%",
                  background: "#fff",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "11px 20px",
                  fontSize: "0.85rem",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: 600,
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

  return (
    <div style={page}>
      <ConfirmedBar />

      <div style={{ ...wrap, paddingTop: "1.5rem" }}>

        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1.5px solid #e5e7eb",
          padding: "1.25rem",
          marginBottom: "1.25rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "0.9rem",
          }}>
            <div>
              <div style={{
                fontSize: "0.68rem", fontWeight: 800, color: "#9ca3af",
                letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "2px",
              }}>
                Pendências do beneficiário
              </div>
              <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#111827" }}>
                Francivaldo Pereira Ricardo
              </div>
              <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                ONG Abelhinhas do Amor · Campanha ativa
              </div>
            </div>
            <div style={{
              background: "#fef2f2",
              color: "#dc2626",
              fontSize: "0.68rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              padding: "4px 10px",
              borderRadius: "999px",
              border: "1px solid #fca5a5",
              flexShrink: 0,
            }}>
              1 PENDENTE
            </div>
          </div>

          <PendenciaItem />

          <div style={{
            borderTop: "1px solid #f3f4f6",
            paddingTop: "0.75rem",
            marginTop: "0.75rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
              Total de pendências
            </span>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#dc2626" }}>
              {fmtBRL(BILL_AMOUNT)}
            </span>
          </div>
        </div>

        <p style={{
          fontSize: "0.95rem",
          color: "#111827",
          lineHeight: 1.75,
          fontWeight: 500,
          marginBottom: "0.75rem",
        }}>
          Neste exato momento,{" "}
          <strong>a energia elétrica da casa do Sr. Francivaldo está cortada.</strong>
        </p>

        <p style={{
          fontSize: "0.875rem",
          color: "#4b5563",
          lineHeight: 1.75,
          marginBottom: "1.5rem",
        }}>
          Sem luz, a geladeira parou. O ventilador parou. Seus <strong>4 filhos</strong> —
          a menor tem apenas 6 anos — estão em casa sem energia. Ele atrasou a conta
          para não deixar os filhos sem comida. Agora, a luz foi cortada.
        </p>

        <div style={{
          background: "#fff7ed",
          border: "1px solid #fed7aa",
          borderRadius: "12px",
          padding: "0.9rem 1rem",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "10px",
        }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0, marginTop: "1px" }}>⚡</span>
          <p style={{ fontSize: "0.82rem", color: "#92400e", lineHeight: 1.65, margin: 0 }}>
            <strong>{fmtBRL(BILL_AMOUNT)}</strong> é o valor exato para quitar essa pendência
            e religar a energia hoje. Você acabou de ajudar com muito mais do que isso —
            este é o próximo passo.
          </p>
        </div>

        <div style={{
          background: "#fff",
          borderRadius: "16px",
          border: "1.5px solid #e5e7eb",
          padding: "1.25rem",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
        }}>
          <h2 style={{
            fontSize: "0.95rem",
            fontWeight: 800,
            color: "#111827",
            margin: "0 0 1rem",
          }}>
            Quitar pendência — {fmtBRL(BILL_AMOUNT)} via PIX
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input
                style={inputStyle}
                type="text"
                placeholder="Nome Sobrenome"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label style={labelStyle}>CPF</label>
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(fmtCPF(e.target.value))}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div>
                <label style={labelStyle}>E-mail</label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div>
                <label style={labelStyle}>Celular (DDD)</label>
                <input
                  style={inputStyle}
                  type="tel"
                  inputMode="numeric"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={e => setPhone(fmtPhone(e.target.value))}
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && (
              <div style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "9px 12px",
                color: "#dc2626",
                fontSize: "0.82rem",
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg,#24CA68,#1aad56)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "15px 20px",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                boxShadow: loading ? "none" : "0 4px 14px rgba(36,202,104,0.35)",
                letterSpacing: "0.01em",
                marginTop: "2px",
              }}
            >
              {loading ? "Gerando PIX..." : `Gerar PIX — ${fmtBRL(BILL_AMOUNT)}`}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/" style={{
            color: "#9ca3af",
            fontSize: "0.78rem",
            textDecoration: "none",
            borderBottom: "1px solid #e5e7eb",
            paddingBottom: "1px",
          }}>
            Não consigo ajudar agora →
          </a>
        </div>
      </div>
    </div>
  );
}

function ConfirmedBar() {
  return (
    <div style={{
      background: "linear-gradient(90deg,#16a34a,#15803d)",
      color: "#fff",
      textAlign: "center",
      padding: "11px 16px",
      fontSize: "0.82rem",
      fontWeight: 700,
      letterSpacing: "0.01em",
    }}>
      ✅ Doação confirmada — obrigado por apoiar o Sr. Francivaldo 💚
    </div>
  );
}

function PendenciaItem({ paid = false }: { paid?: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: "12px",
      background: paid ? "#f0fdf4" : "#fafafa",
      border: `1px solid ${paid ? "#bbf7d0" : "#f3f4f6"}`,
      borderRadius: "12px",
      padding: "12px 14px",
    }}>
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: paid ? "#dcfce7" : "#fef2f2",
        borderRadius: "10px",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "1.1rem",
      }}>
        ⚡
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.85rem", fontWeight: 700,
          color: "#111827", marginBottom: "2px",
        }}>
          Energia Elétrica
        </div>
        <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>
          Venceu em 05/05/2026
        </div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: "0.9rem", fontWeight: 800,
          color: paid ? "#16a34a" : "#dc2626",
          marginBottom: "4px",
        }}>
          {fmtBRL(BILL_AMOUNT)}
        </div>
        <div style={{
          display: "inline-block",
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.06em",
          padding: "2px 7px",
          borderRadius: "999px",
          background: paid ? "#dcfce7" : "#fef2f2",
          color: paid ? "#15803d" : "#dc2626",
          border: `1px solid ${paid ? "#86efac" : "#fca5a5"}`,
        }}>
          {paid ? "QUITADA" : "EM ATRASO"}
        </div>
      </div>
    </div>
  );
}
