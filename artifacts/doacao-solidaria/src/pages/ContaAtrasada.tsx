import { useState, useEffect, useRef } from "react";
import { apiUrl, safeJson, fetchWithRetry } from "@/lib/api";

const BILL_AMOUNT = 26.49;

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}
function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}
function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

type Step = "story" | "pix" | "paid";

const inp: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
  background: "#f9fafb",
  boxSizing: "border-box",
  color: "#111827",
};

export default function ContaAtrasada() {
  const [step, setStep] = useState<Step>("story");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState("");
  const [txId, setTxId] = useState("");
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState("5:00");
  const [expired, setExpired] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const expiresRef = useRef<number>(0);
  const formRef = useRef<HTMLDivElement>(null);

  function stopAll() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (cdRef.current) { clearInterval(cdRef.current); cdRef.current = null; }
  }
  useEffect(() => () => stopAll(), []);

  function startCountdown() {
    expiresRef.current = Date.now() + 5 * 60 * 1000;
    stopAll();
    cdRef.current = setInterval(() => {
      const rem = expiresRef.current - Date.now();
      if (rem <= 0) {
        setCountdown("0:00"); setExpired(true); stopAll(); return;
      }
      const s = Math.ceil(rem / 1000);
      setCountdown(`${Math.floor(s / 60)}:${(s % 60) < 10 ? "0" : ""}${s % 60}`);
    }, 250);
  }

  function startPolling(id: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/pix/status/${id}`));
        const data = await res.json() as { status?: string };
        if (data.status === "paid") { stopAll(); setStep("paid"); }
      } catch {}
    }, 5000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim() || name.trim().split(" ").filter(Boolean).length < 2) {
      setError("Por favor, digite seu nome completo."); return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Por favor, digite um e-mail válido."); return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Digite um celular com DDD."); return;
    }
    if (cpf.replace(/\D/g, "").length < 11) {
      setError("CPF inválido — digite os 11 dígitos."); return;
    }
    setLoading(true);
    try {
      const res = await fetchWithRetry(apiUrl("/api/pix/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: BILL_AMOUNT,
          customer_name: name.trim(),
          customer_email: email.trim(),
          customer_phone: phone.replace(/\D/g, ""),
          customer_cpf: cpf.replace(/\D/g, ""),
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
      const res = await fetch(apiUrl(`/api/pix/status/${txId}`));
      const data = await res.json() as { status?: string };
      if (data.status === "paid") { stopAll(); setStep("paid"); }
      else setVerifyMsg("Ainda não identificamos o pagamento. Aguarde alguns instantes.");
    } catch { setVerifyMsg("Erro ao verificar. Tente novamente."); }
    finally { setVerifying(false); }
  }

  function handleCopy() {
    navigator.clipboard?.writeText(pixCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  }

  function scrollToForm() {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const pageStyle: React.CSSProperties = {
    minHeight: "100dvh",
    background: "#f8fafc",
    fontFamily: "'Montserrat', 'Lato', sans-serif",
  };

  if (step === "paid") {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "2rem 1rem", textAlign: "center" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>💡</div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", marginBottom: "0.75rem" }}>
            A luz vai voltar hoje!
          </h1>
          <p style={{ color: "#374151", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Seu pagamento de <strong>{formatBRL(BILL_AMOUNT)}</strong> foi confirmado.
            Graças a você, o Sr. Francivaldo e seus 4 filhos vão dormir com a energia funcionando esta noite.
          </p>
          <div style={{
            background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
            border: "1.5px solid #86efac",
            borderRadius: "16px",
            padding: "1.25rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{ fontSize: "0.85rem", color: "#15803d", fontWeight: 700 }}>
              ✅ Pagamento confirmado — {formatBRL(BILL_AMOUNT)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#166534", marginTop: "4px" }}>
              Obrigado por ir além. Isso faz toda a diferença. 💚
            </div>
          </div>
          <a href="/" style={{ color: "#6b7280", fontSize: "0.82rem", textDecoration: "underline" }}>
            Voltar para a campanha
          </a>
        </div>
      </div>
    );
  }

  if (step === "pix") {
    return (
      <div style={pageStyle}>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" }}>
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "#fef9c3", border: "1.5px solid #fde047",
              borderRadius: "999px", padding: "5px 16px", marginBottom: "0.75rem",
              fontSize: "0.8rem", fontWeight: 700, color: "#854d0e",
            }}>
              ⏱ PIX expira em {countdown}
            </div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#111827", margin: "0 0 0.3rem" }}>
              PIX gerado — copie e pague
            </h1>
            <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: 0 }}>
              Valor: <strong style={{ color: "#111827" }}>{formatBRL(BILL_AMOUNT)}</strong> · Conta de luz do Sr. Francivaldo
            </p>
          </div>

          <div style={{
            background: "#fff",
            border: "2px solid #f59e0b",
            borderRadius: "14px",
            padding: "1.25rem",
            marginBottom: "1rem",
          }}>
            <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "6px", fontWeight: 600, letterSpacing: "0.05em" }}>
              CÓDIGO PIX COPIA E COLA
            </div>
            <div style={{
              background: "#f9fafb",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "10px 12px",
              fontSize: "0.72rem",
              color: "#374151",
              wordBreak: "break-all",
              lineHeight: 1.5,
              marginBottom: "10px",
              fontFamily: "monospace",
            }}>
              {pixCode}
            </div>
            <button
              onClick={handleCopy}
              disabled={expired}
              style={{
                width: "100%",
                background: copied ? "#16a34a" : "linear-gradient(135deg,#f59e0b,#d97706)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                padding: "13px 16px",
                fontSize: "0.95rem",
                fontWeight: 700,
                cursor: expired ? "not-allowed" : "pointer",
                opacity: expired ? 0.5 : 1,
              }}
            >
              {copied ? "✅ Copiado!" : "📋 Copiar código PIX"}
            </button>
          </div>

          {expired ? (
            <div style={{
              textAlign: "center",
              background: "#fef2f2",
              border: "1.5px solid #fca5a5",
              borderRadius: "12px",
              padding: "1rem",
              color: "#dc2626",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: "1rem",
            }}>
              ⏰ PIX expirado. <a href="/conta-atrasada" style={{ color: "#dc2626" }}>Gerar novamente</a>
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <button
                onClick={handleVerify}
                disabled={verifying}
                style={{
                  background: "none",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "10px",
                  padding: "10px 20px",
                  fontSize: "0.85rem",
                  color: "#374151",
                  cursor: "pointer",
                  fontWeight: 600,
                  width: "100%",
                  marginBottom: "0.5rem",
                }}
              >
                {verifying ? "Verificando..." : "Já paguei — confirmar pagamento"}
              </button>
              {verifyMsg && (
                <p style={{ color: "#6b7280", fontSize: "0.78rem", margin: "4px 0 0" }}>{verifyMsg}</p>
              )}
            </div>
          )}

          <div style={{
            background: "#fff7ed",
            border: "1px solid #fed7aa",
            borderRadius: "12px",
            padding: "0.875rem",
            fontSize: "0.78rem",
            color: "#92400e",
            lineHeight: 1.6,
            marginTop: "1rem",
          }}>
            ⚡ Assim que o pagamento for confirmado, a conta de luz entra em processo de reativação. 
            A família vai agradecer.
          </div>

          <div style={{ textAlign: "center", marginTop: "1.25rem" }}>
            <a href="/" style={{ color: "#9ca3af", fontSize: "0.78rem", textDecoration: "underline" }}>
              Voltar para a campanha
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={{
        background: "linear-gradient(135deg,#16a34a,#15803d)",
        color: "#fff",
        textAlign: "center",
        padding: "10px 16px",
        fontSize: "0.82rem",
        fontWeight: 700,
        letterSpacing: "0.01em",
      }}>
        ✅ Sua doação foi confirmada! Obrigado por ajudar o Sr. Francivaldo 💚
      </div>

      <div style={{
        background: "linear-gradient(135deg,#dc2626,#b91c1c)",
        color: "#fff",
        padding: "1rem 1.25rem",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "1.35rem", marginBottom: "2px" }}>⚡</div>
        <div style={{ fontWeight: 800, fontSize: "0.95rem", letterSpacing: "0.04em" }}>
          ATENÇÃO — SITUAÇÃO DE EMERGÊNCIA
        </div>
        <div style={{ fontSize: "0.78rem", opacity: 0.9, marginTop: "3px" }}>
          Leia com atenção. Isso está acontecendo agora.
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem 3rem" }}>

        <p style={{
          color: "#111827",
          fontSize: "1rem",
          lineHeight: 1.75,
          marginBottom: "1.25rem",
          fontWeight: 500,
        }}>
          Neste exato momento, enquanto você lê esta mensagem,{" "}
          <strong>a energia elétrica da casa do Sr. Francivaldo está cortada.</strong>
        </p>

        <p style={{ color: "#374151", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "0.75rem" }}>
          Sem luz, a geladeira parou. O ventilador parou. Seus{" "}
          <strong>4 filhos pequenos</strong> — a menor tem apenas 6 anos — estão em casa sem
          energia, no calor do Nordeste.
        </p>

        <p style={{ color: "#374151", fontSize: "0.9rem", lineHeight: 1.75, marginBottom: "1.5rem" }}>
          O atraso na conta de luz foi acumulando enquanto ele usava o pouco que tinha
          para comprar comida. Ele escolheu alimentar os filhos — mas agora a luz foi cortada.
        </p>

        <div style={{
          background: "#fff",
          borderRadius: "14px",
          border: "1.5px solid #e5e7eb",
          overflow: "hidden",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
        }}>
          <div style={{
            background: "#dc2626",
            color: "#fff",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
            <span style={{ fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.05em" }}>
              ⛔ FORNECIMENTO SUSPENSO
            </span>
            <span style={{
              background: "rgba(255,255,255,0.2)",
              borderRadius: "6px",
              padding: "2px 8px",
              fontSize: "0.7rem",
              fontWeight: 700,
            }}>
              VENCIDA
            </span>
          </div>

          <div style={{ padding: "1.1rem 1.25rem" }}>
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: "#111827" }}>CELPE</div>
              <div style={{ fontSize: "0.73rem", color: "#6b7280" }}>
                Companhia Energética de Pernambuco
              </div>
            </div>

            <div style={{
              borderTop: "1px solid #f3f4f6",
              paddingTop: "0.75rem",
              marginBottom: "0.75rem",
            }}>
              <Row label="Titular" value="FRANCIVALDO PEREIRA RICARDO" />
              <Row label="Unidade consumidora" value="7234891-0" />
              <Row label="Referência" value="ABR/2026" />
            </div>

            <div style={{
              borderTop: "1px solid #f3f4f6",
              paddingTop: "0.75rem",
              marginBottom: "0.75rem",
            }}>
              <Row label="Vencimento" value="05/05/2026" highlight />
              <Row label="Valor da conta" value="R$ 26,49" />
              <Row label="Multa e juros" value="R$ 0,00" />
            </div>

            <div style={{
              borderTop: "2px solid #dc2626",
              paddingTop: "0.75rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ fontWeight: 800, fontSize: "0.9rem", color: "#111827" }}>
                TOTAL EM ATRASO
              </span>
              <span style={{ fontWeight: 900, fontSize: "1.15rem", color: "#dc2626" }}>
                R$ 26,49
              </span>
            </div>
          </div>
        </div>

        <div style={{
          background: "#fffbeb",
          border: "1.5px solid #fde68a",
          borderRadius: "12px",
          padding: "1rem 1.1rem",
          marginBottom: "1.75rem",
          fontSize: "0.88rem",
          color: "#92400e",
          lineHeight: 1.7,
        }}>
          <strong>R$ 26,49</strong> é tudo o que falta para a luz voltar hoje.
          Você acabou de ajudar com muito mais do que isso.{" "}
          <strong>Este valor é o próximo passo.</strong>
        </div>

        <div ref={formRef}>
          <h2 style={{
            fontSize: "1.05rem",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "1rem",
            textAlign: "center",
          }}>
            ⚡ Quitar a conta de luz — {formatBRL(BILL_AMOUNT)}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "4px" }}>
                Seu nome completo
              </label>
              <input
                style={inp}
                type="text"
                placeholder="Nome Sobrenome"
                value={name}
                onChange={e => setName(e.target.value)}
                autoComplete="name"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "4px" }}>
                CPF
              </label>
              <input
                style={inp}
                type="text"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={e => setCpf(formatCPF(e.target.value))}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "4px" }}>
                E-mail
              </label>
              <input
                style={inp}
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            <div>
              <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151", display: "block", marginBottom: "4px" }}>
                Celular (com DDD)
              </label>
              <input
                style={inp}
                type="tel"
                inputMode="numeric"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={e => setPhone(formatPhone(e.target.value))}
                autoComplete="tel"
              />
            </div>

            {error && (
              <p style={{
                background: "#fef2f2",
                border: "1px solid #fca5a5",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#dc2626",
                fontSize: "0.82rem",
                margin: 0,
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading
                  ? "#9ca3af"
                  : "linear-gradient(135deg,#dc2626,#b91c1c)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "15px 20px",
                fontSize: "1rem",
                fontWeight: 800,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
                boxShadow: loading ? "none" : "0 4px 14px rgba(220,38,38,0.35)",
                marginTop: "4px",
              }}
            >
              {loading ? "Gerando PIX..." : `⚡ Gerar PIX — ${formatBRL(BILL_AMOUNT)}`}
            </button>
          </form>
        </div>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/" style={{ color: "#9ca3af", fontSize: "0.78rem", textDecoration: "underline" }}>
            Não consigo ajudar agora →
          </a>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "4px",
      fontSize: "0.78rem",
    }}>
      <span style={{ color: "#6b7280" }}>{label}</span>
      <span style={{
        fontWeight: 600,
        color: highlight ? "#dc2626" : "#111827",
      }}>
        {value}
      </span>
    </div>
  );
}
