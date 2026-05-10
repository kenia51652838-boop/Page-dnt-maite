import { useState, useEffect, useRef } from "react";
import { apiUrl } from "@/lib/api";
import { META } from "@/pages/Home";

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

type Step = "animating" | "thankyou" | "vip-form" | "vip-pix" | "vip-paid";

interface Props {
  isOpen: boolean;
  donationAmount: number;
  arrecadado: number;
  onClose: () => void;
}

const VIP_SEC = 5 * 60;

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: "1.5px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "0.9rem",
  fontFamily: "inherit",
  outline: "none",
  background: "#f9fafb",
  boxSizing: "border-box",
  color: "#111827",
};

export default function ThankYouModal({ isOpen, donationAmount, arrecadado, onClose }: Props) {
  const [step, setStep] = useState<Step>("animating");
  const [displayValue, setDisplayValue] = useState(arrecadado);

  const [vipName, setVipName] = useState("");
  const [vipEmail, setVipEmail] = useState("");
  const [vipPhone, setVipPhone] = useState("");
  const [vipError, setVipError] = useState("");
  const [vipLoading, setVipLoading] = useState(false);

  const [vipPixCode, setVipPixCode] = useState("");
  const [vipTxId, setVipTxId] = useState("");
  const [vipCountdown, setVipCountdown] = useState("5:00");
  const [vipCopied, setVipCopied] = useState(false);
  const [vipExpired, setVipExpired] = useState(false);

  const animRef = useRef<number>(0);
  const vipPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vipCdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const vipExpiresRef = useRef<number>(0);

  function stopVipPoll() {
    if (vipPollRef.current) { clearInterval(vipPollRef.current); vipPollRef.current = null; }
  }
  function stopVipCountdown() {
    if (vipCdRef.current) { clearInterval(vipCdRef.current); vipCdRef.current = null; }
  }

  useEffect(() => {
    if (!isOpen) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      stopVipPoll();
      stopVipCountdown();
      setTimeout(() => {
        setStep("animating");
        setDisplayValue(arrecadado);
        setVipName(""); setVipEmail(""); setVipPhone("");
        setVipError(""); setVipPixCode(""); setVipTxId("");
        setVipCountdown("5:00"); setVipCopied(false); setVipExpired(false);
        setVipLoading(false);
      }, 300);
      return;
    }

    if (donationAmount <= 0) {
      setDisplayValue(arrecadado);
      setStep("thankyou");
      return;
    }

    setStep("animating");
    setDisplayValue(arrecadado);
    const start = arrecadado;
    const end = arrecadado + donationAmount;
    const duration = 2000;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayValue(Math.round(start + (end - start) * eased));
      if (t < 1) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        setTimeout(() => setStep("thankyou"), 700);
      }
    }
    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isOpen]);

  function startVipCountdown() {
    vipExpiresRef.current = Date.now() + VIP_SEC * 1000;
    stopVipCountdown();
    vipCdRef.current = setInterval(() => {
      const rem = vipExpiresRef.current - Date.now();
      if (rem <= 0) {
        setVipCountdown("0:00");
        setVipExpired(true);
        stopVipCountdown();
        stopVipPoll();
        return;
      }
      const s = Math.ceil(rem / 1000);
      const m = Math.floor(s / 60);
      const r = s % 60;
      setVipCountdown(`${m}:${r < 10 ? "0" : ""}${r}`);
    }, 250);
  }

  function startVipPolling(txId: string) {
    stopVipPoll();
    vipPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(apiUrl(`/api/pix/status/${txId}`));
        const data = await res.json() as { status?: string };
        if (data.status === "paid") {
          stopVipPoll();
          stopVipCountdown();
          setStep("vip-paid");
        }
      } catch (_) {}
    }, 5000);
  }

  async function handleVipSubmit(e: React.FormEvent) {
    e.preventDefault();
    setVipError("");
    if (!vipName.trim() || vipName.trim().split(" ").filter(Boolean).length < 2) {
      setVipError("Por favor, digite seu nome completo."); return;
    }
    if (!vipEmail.trim() || !vipEmail.includes("@")) {
      setVipError("Por favor, digite um e-mail válido."); return;
    }
    if (vipPhone.replace(/\D/g, "").length < 10) {
      setVipError("Digite um celular válido com DDD."); return;
    }
    setVipLoading(true);
    try {
      const res = await fetch(apiUrl("/api/pix/create-vip"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: vipName.trim(),
          email: vipEmail.trim(),
          phone: vipPhone.replace(/\D/g, ""),
        }),
      });
      const data = await res.json() as { pix_code?: string; transaction_id?: string; error?: string };
      if (!res.ok || data.error) throw new Error(data.error || "Erro ao gerar PIX VIP");
      setVipPixCode(data.pix_code || "");
      setVipTxId(data.transaction_id || "");
      setVipExpired(false);
      setStep("vip-pix");
      startVipCountdown();
      startVipPolling(data.transaction_id || "");
    } catch (err) {
      setVipError(err instanceof Error ? err.message : "Erro ao gerar PIX VIP");
    } finally {
      setVipLoading(false);
    }
  }

  function handleVipCopy() {
    if (!vipPixCode) return;
    navigator.clipboard?.writeText(vipPixCode).then(() => {
      setVipCopied(true);
      setTimeout(() => setVipCopied(false), 3000);
    });
  }

  if (!isOpen) return null;

  const finalArrecadado = arrecadado + donationAmount;
  const displayPCT = ((displayValue / META) * 100).toFixed(1);
  const finalPCT = Math.min((finalArrecadado / META) * 100, 100).toFixed(1);

  // ─── ANIMATING ──────────────────────────────────────────────────────────────
  if (step === "animating") {
    return (
      <div className="pix-modal is-open" role="dialog" aria-modal="true">
        <div className="pix-modal__backdrop" />
        <div className="pix-modal__panel" style={{ maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "1.1rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
              border: "1.5px solid #86efac",
              borderRadius: "999px", padding: "6px 18px", marginBottom: "0.75rem",
              fontSize: "0.85rem", fontWeight: 700, color: "#15803d",
            }}>
              ✅ PIX Aprovado!
            </div>
            <h2 style={{ color: "#111827", fontWeight: 800, fontSize: "1.15rem", margin: 0 }}>
              Seu pagamento foi confirmado
            </h2>
          </div>

          <div style={{
            background: "linear-gradient(135deg, #f0fdf6, #e6faf0)",
            border: "2px solid #24CA68",
            borderRadius: "16px",
            padding: "1.25rem",
            marginBottom: "1rem",
            textAlign: "center",
          }}>
            <div style={{
              display: "inline-block",
              background: "#24CA68",
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.88rem",
              borderRadius: "999px",
              padding: "4px 16px",
              marginBottom: "0.85rem",
              letterSpacing: "0.03em",
            }}>
              + {formatBRL(donationAmount)} de você 🎉
            </div>

            <div style={{ fontSize: "2.4rem", fontWeight: 900, color: "#24CA68", lineHeight: 1.05, marginBottom: "3px" }}>
              {formatBRL(displayValue)}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.85rem" }}>
              arrecadados de {formatBRL(META)}
            </div>

            <div style={{ width: "100%", height: "10px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{
                width: `${displayPCT}%`,
                height: "100%",
                background: "linear-gradient(90deg, #1aad56, #24CA68)",
                borderRadius: "999px",
                transition: "width 0.08s linear",
              }} />
            </div>
            <div style={{ fontSize: "0.76rem", color: "#6b7280", marginTop: "5px" }}>
              {displayPCT}% do objetivo alcançado
            </div>
          </div>

          <p style={{ textAlign: "center", color: "#4b5563", fontSize: "0.875rem", lineHeight: 1.6, margin: 0 }}>
            Você fez a diferença hoje para o Sr. Francivaldo e seus 4 filhos 💚
          </p>
        </div>
      </div>
    );
  }

  // ─── THANK YOU + VIP UPSELL ─────────────────────────────────────────────────
  if (step === "thankyou") {
    return (
      <div className="pix-modal is-open" role="dialog" aria-modal="true">
        <div className="pix-modal__backdrop" />
        <div className="pix-modal__panel" style={{ maxWidth: "420px" }}>
          <button className="pix-modal__close" onClick={onClose} aria-label="Fechar">✕</button>

          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{
              width: 52, height: 52,
              background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
              borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 0.55rem",
              fontSize: "1.5rem",
            }}>✅</div>
            <h2 style={{ color: "#24CA68", fontWeight: 800, fontSize: "1.1rem", margin: "0 0 0.2rem" }}>
              Obrigado pela sua doação! 💚
            </h2>
            <p style={{ color: "#4b5563", fontSize: "0.82rem", margin: 0, lineHeight: 1.5 }}>
              O Francivaldo e seus 4 filhos já receberam sua contribuição de <strong>{formatBRL(donationAmount)}</strong>.
            </p>
          </div>

          <div style={{
            background: "#f0fdf4", border: "1px solid #bbf7d0",
            borderRadius: "12px", padding: "0.7rem 1rem", marginBottom: "1rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "5px" }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#24CA68" }}>{formatBRL(finalArrecadado)}</span>
              <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>meta {formatBRL(META)}</span>
            </div>
            <div style={{ width: "100%", height: "7px", background: "#e5e7eb", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ width: `${finalPCT}%`, height: "100%", background: "linear-gradient(90deg,#1aad56,#24CA68)", borderRadius: "999px" }} />
            </div>
            <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "3px" }}>{finalPCT}% do objetivo</div>
          </div>

          <div style={{ borderTop: "1px dashed #e5e7eb", margin: "0 0 0.9rem" }} />

          <div style={{
            background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
            border: "2px solid #f59e0b",
            borderRadius: "16px",
            padding: "1.1rem",
            marginBottom: "0.85rem",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "1.5rem" }}>👑</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#92400e", lineHeight: 1.2 }}>
                  Quero te convidar para algo especial
                </div>
                <div style={{ fontSize: "0.74rem", color: "#b45309" }}>Clube de Doadores VIP — acesso exclusivo</div>
              </div>
            </div>

            <p style={{ fontSize: "0.82rem", color: "#78350f", lineHeight: 1.6, margin: "0 0 0.75rem" }}>
              Quem já ajudou o Francivaldo sabe o impacto que uma doação faz. Agora você pode ir além: doe mais <strong>R$50</strong> e faça parte do grupo mais próximo dessa família.
            </p>

            <ul style={{ listStyle: "none", padding: 0, margin: "0 0 0.9rem", display: "flex", flexDirection: "column", gap: "7px" }}>
              {([
                ["📲", "Atualizações exclusivas sobre o Francivaldo e a família"],
                ["📞", "Contato direto com o beneficiário por ligação"],
                ["🏠", "Acesso ao endereço para visita presencial"],
                ["🪪", "Receba o seu Cartão VIP digital exclusivo"],
                ["🎁", "Concorra a prêmios especiais do programa VIP"],
              ] as [string, string][]).map(([icon, text]) => (
                <li key={text} style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.79rem", color: "#78350f" }}>
                  <span style={{ flexShrink: 0 }}>{icon}</span>
                  <span>{text}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => setStep("vip-form")}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff",
                border: "none",
                borderRadius: "12px",
                padding: "13px",
                fontFamily: "inherit",
                fontWeight: 800,
                fontSize: "0.93rem",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(245,158,11,0.4)",
                letterSpacing: "0.01em",
              }}
            >
              👑 Quero ser Doador VIP — doe mais R$50
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%", padding: "10px", border: "none",
              background: "transparent", color: "#9ca3af",
              fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Já ajudei, obrigado
          </button>

          <div className="pix-doacao-protegida" style={{ marginTop: "0.65rem" }}>
            <img src={`${import.meta.env.BASE_URL}img/doacao-protegida.png`} alt="Doação Protegida" style={{ height: "40px", width: "auto" }} />
          </div>
        </div>
      </div>
    );
  }

  // ─── VIP FORM ───────────────────────────────────────────────────────────────
  if (step === "vip-form") {
    return (
      <div className="pix-modal is-open" role="dialog" aria-modal="true">
        <div className="pix-modal__backdrop" />
        <div className="pix-modal__panel" style={{ maxWidth: "420px" }}>
          <button className="pix-modal__close" onClick={() => setStep("thankyou")} aria-label="Voltar">←</button>

          <div style={{ textAlign: "center", marginBottom: "1.1rem" }}>
            <span style={{ fontSize: "2rem" }}>👑</span>
            <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#92400e", margin: "0.35rem 0 0.2rem" }}>
              Garanta seu acesso VIP
            </h2>
            <p style={{ fontSize: "0.82rem", color: "#78350f", margin: 0, lineHeight: 1.55 }}>
              Preencha seus dados reais para gerar o PIX VIP e receber todos os benefícios exclusivos.
            </p>
          </div>

          <form onSubmit={handleVipSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Nome completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={vipName}
                  onChange={e => setVipName(e.target.value)}
                  autoComplete="name"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  disabled={vipLoading}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  E-mail *
                </label>
                <input
                  type="email"
                  placeholder="seuemail@gmail.com"
                  value={vipEmail}
                  onChange={e => setVipEmail(e.target.value)}
                  autoComplete="email"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  disabled={vipLoading}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.74rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Celular com DDD *
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={vipPhone}
                  onChange={e => setVipPhone(formatPhone(e.target.value))}
                  autoComplete="tel"
                  inputMode="numeric"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#f59e0b")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  disabled={vipLoading}
                />
              </div>
            </div>

            {vipError && (
              <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "0 0 0.65rem", fontWeight: 600 }}>{vipError}</p>
            )}

            <button
              type="submit"
              disabled={vipLoading}
              style={{
                width: "100%", padding: "13px", border: "none",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #f59e0b, #d97706)",
                color: "#fff", fontWeight: 800, fontSize: "0.93rem",
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                opacity: vipLoading ? 0.75 : 1,
                boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
              }}
            >
              {vipLoading ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "pixSpin .8s linear infinite",
                  }} />
                  Gerando seu PIX VIP...
                </>
              ) : "👑 Gerar PIX VIP — R$50"}
            </button>

            <button
              type="button"
              onClick={() => setStep("thankyou")}
              disabled={vipLoading}
              style={{
                marginTop: "0.5rem", width: "100%", padding: "10px",
                border: "none", background: "transparent",
                color: "#9ca3af", fontSize: "0.8rem",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Voltar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── VIP PIX ────────────────────────────────────────────────────────────────
  if (step === "vip-pix") {
    return (
      <div className="pix-modal is-open" role="dialog" aria-modal="true">
        <div className="pix-modal__backdrop" />
        <div className="pix-modal__panel" style={{ maxWidth: "420px" }}>
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "6px",
              background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
              border: "1.5px solid #f59e0b",
              borderRadius: "999px", padding: "5px 16px",
              fontSize: "0.82rem", fontWeight: 700, color: "#92400e",
              marginBottom: "0.6rem",
            }}>
              👑 PIX VIP — R$50
            </div>
            <h2 style={{ fontWeight: 800, fontSize: "1.05rem", color: "#111827", margin: "0 0 0.15rem" }}>
              Copie o código e pague no seu banco
            </h2>
            <p style={{ fontSize: "0.78rem", color: vipExpired ? "#dc2626" : "#6b7280", margin: 0, fontWeight: vipExpired ? 600 : 400 }}>
              {vipExpired ? "PIX expirado." : `Expira em ${vipCountdown}`}
            </p>
          </div>

          {!vipExpired ? (
            <>
              <div style={{
                background: "#f9fafb", border: "1.5px solid #e5e7eb",
                borderRadius: "12px", padding: "0.9rem",
                marginBottom: "0.75rem",
                wordBreak: "break-all", fontSize: "0.7rem",
                color: "#374151", lineHeight: 1.5, fontFamily: "monospace",
                maxHeight: "100px", overflowY: "auto",
              }}>
                {vipPixCode}
              </div>
              <button
                type="button"
                onClick={handleVipCopy}
                style={{
                  width: "100%", padding: "13px", border: "none",
                  borderRadius: "12px",
                  background: vipCopied ? "#15803d" : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#fff", fontWeight: 800, fontSize: "0.93rem",
                  cursor: "pointer", fontFamily: "inherit",
                  transition: "background 0.3s",
                  boxShadow: "0 4px 12px rgba(245,158,11,0.35)",
                  marginBottom: "0.75rem",
                }}
              >
                {vipCopied ? "✅ Código copiado!" : "📋 Copiar código PIX VIP"}
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <p style={{ color: "#dc2626", fontWeight: 600, fontSize: "0.88rem", marginBottom: "0.75rem" }}>
                Este PIX expirou. Gere um novo para continuar.
              </p>
              <button
                type="button"
                onClick={() => { setVipExpired(false); setStep("vip-form"); }}
                style={{
                  width: "100%", padding: "13px", border: "none", borderRadius: "12px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#fff", fontWeight: 800, fontSize: "0.93rem",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Gerar novo PIX VIP
              </button>
            </div>
          )}

          <div style={{
            background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: "10px", padding: "0.65rem 0.9rem", marginBottom: "0.75rem",
          }}>
            <p style={{ fontSize: "0.77rem", color: "#92400e", margin: 0, lineHeight: 1.5 }}>
              💡 Abra o app do banco → Pix → Copia e Cola → cole o código acima e confirme o pagamento de <strong>R$50</strong>.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: "100%", padding: "10px", border: "none",
              background: "transparent", color: "#9ca3af",
              fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  // ─── VIP PAID ───────────────────────────────────────────────────────────────
  if (step === "vip-paid") {
    return (
      <div className="pix-modal is-open" role="dialog" aria-modal="true">
        <div className="pix-modal__backdrop" />
        <div className="pix-modal__panel" style={{ maxWidth: "420px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>👑</div>
            <h2 style={{ fontWeight: 800, fontSize: "1.2rem", color: "#92400e", margin: "0 0 0.35rem" }}>
              Você agora é um Doador VIP!
            </h2>
            <p style={{ fontSize: "0.84rem", color: "#78350f", lineHeight: 1.6, margin: "0 0 1rem" }}>
              Parabéns! Em breve você receberá acesso a todos os benefícios exclusivos no celular cadastrado. Obrigado por ir além! 💛
            </p>

            <div style={{
              background: "linear-gradient(135deg, #fffbeb, #fef3c7)",
              border: "1.5px solid #f59e0b",
              borderRadius: "14px", padding: "0.9rem 1rem", marginBottom: "1.1rem",
              textAlign: "left",
            }}>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {([
                  ["📲", "Atualizações exclusivas sobre o caso em breve"],
                  ["📞", "Acesso ao contato direto com o Francivaldo"],
                  ["🪪", "Seu Cartão VIP digital será enviado"],
                  ["🎁", "Você já está concorrendo aos prêmios VIP"],
                ] as [string, string][]).map(([icon, text]) => (
                  <li key={text} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.81rem", color: "#78350f" }}>
                    <span>{icon}</span><span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%", padding: "13px", border: "none",
                borderRadius: "12px", background: "#24CA68",
                color: "#fff", fontWeight: 800, fontSize: "0.95rem",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Fechar 💚
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
