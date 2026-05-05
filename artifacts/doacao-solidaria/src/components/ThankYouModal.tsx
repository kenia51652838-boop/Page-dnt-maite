import { useState } from "react";

interface ThankYouModalProps {
  isOpen: boolean;
  amount: string;
  onClose: () => void;
}

function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

type Step = "form" | "submitting" | "done";

export default function ThankYouModal({ isOpen, amount, onClose }: ThankYouModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || name.trim().split(" ").filter(Boolean).length < 2) {
      setError("Por favor, digite seu nome completo.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 10) {
      setError("Digite um telefone válido com DDD.");
      return;
    }

    setStep("submitting");
    try {
      const { apiUrl } = await import("@/lib/api");
      await fetch(apiUrl("/api/leads"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/\D/g, ""),
          message: message.trim(),
          amount: parseFloat(amount.replace(/[^0-9,]/g, "").replace(",", ".")),
        }),
      });
    } catch (_) {
      // segue mesmo com erro
    }
    setStep("done");
  }

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

  return (
    <div className="pix-modal is-open" role="dialog" aria-modal="true">
      <div className="pix-modal__backdrop" />
      <div className="pix-modal__panel" style={{ maxWidth: "420px" }}>
        {step !== "submitting" && (
          <button className="pix-modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        )}

        {/* Confirmação */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem" }}>
          <div style={{
            width: 60, height: 60,
            background: "linear-gradient(135deg,#dcfce7,#bbf7d0)",
            borderRadius: "50%",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 0.75rem",
            fontSize: "1.75rem",
          }}>✅</div>
          <h2 style={{
            color: "#24CA68", fontWeight: 800, fontSize: "1.2rem",
            margin: "0 0 0.3rem", letterSpacing: "-0.02em",
          }}>
            Pagamento de {amount} confirmado!
          </h2>
          <p style={{ color: "#4b5563", fontSize: "0.875rem", margin: 0, lineHeight: 1.5 }}>
            Francivaldo e seus filhos agradecem muito a sua ajuda 💚
          </p>
        </div>

        {step === "done" ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>💌</div>
            <h3 style={{ fontWeight: 700, color: "#15803d", fontSize: "1rem", margin: "0 0 0.4rem" }}>
              Mensagem recebida!
            </h3>
            <p style={{ color: "#4b5563", fontSize: "0.85rem", margin: "0 0 1.25rem", lineHeight: 1.6 }}>
              Você receberá novidades sobre o Francivaldo e a família pelo telefone informado.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: "100%", padding: "13px", border: "none", borderRadius: "12px",
                background: "#24CA68", color: "#fff", fontWeight: 700, fontSize: "0.95rem",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Concluir
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Contexto */}
            <div style={{
              background: "#f0fdf4", border: "1px solid #bbf7d0",
              borderRadius: "12px", padding: "0.9rem 1rem", marginBottom: "1.1rem",
            }}>
              <p style={{ color: "#166534", fontSize: "0.85rem", lineHeight: 1.6, margin: 0 }}>
                Gostaria de receber novidades sobre o Francivaldo e os filhos?
                Adicione seu nome e telefone abaixo.
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginBottom: "0.85rem" }}>
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Seu nome completo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maria Silva"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#24CA68")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  disabled={step === "submitting"}
                />
              </div>

              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "#374151", display: "block", marginBottom: "4px" }}>
                  Seu telefone com DDD *
                </label>
                <input
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  autoComplete="tel"
                  inputMode="numeric"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = "#24CA68")}
                  onBlur={e => (e.target.style.borderColor = "#e5e7eb")}
                  disabled={step === "submitting"}
                />
              </div>
            </div>

            {/* Card de mensagem para a Júlia */}
            <div style={{
              border: "1.5px solid #e5e7eb", borderRadius: "14px",
              overflow: "hidden", marginBottom: "0.85rem",
            }}>
              <div style={{
                background: "#f8fafc", padding: "0.65rem 1rem",
                borderBottom: "1px solid #e5e7eb",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <span style={{ fontSize: "1rem" }}>💬</span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#374151" }}>
                  Deixe uma mensagem para o Francivaldo
                </span>
                <span style={{
                  marginLeft: "auto", fontSize: "0.68rem", color: "#9ca3af",
                  background: "#f1f5f9", padding: "2px 8px", borderRadius: "999px", fontWeight: 600,
                }}>opcional</span>
              </div>
              <textarea
                placeholder="Escreva uma mensagem de carinho..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={3}
                style={{
                  width: "100%", padding: "10px 12px",
                  border: "none", outline: "none",
                  fontSize: "0.875rem", fontFamily: "inherit",
                  background: "#fff", resize: "none",
                  boxSizing: "border-box", lineHeight: 1.5,
                  color: "#374151", display: "block",
                }}
                disabled={step === "submitting"}
              />
            </div>

            {error && (
              <p style={{ color: "#dc2626", fontSize: "0.8rem", margin: "0 0 0.65rem", fontWeight: 600 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={step === "submitting"}
              style={{
                width: "100%", padding: "13px", border: "none",
                borderRadius: "12px", background: "#24CA68", color: "#fff",
                fontWeight: 700, fontSize: "0.95rem", cursor: "pointer",
                fontFamily: "inherit", display: "flex", alignItems: "center",
                justifyContent: "center", gap: "8px",
                opacity: step === "submitting" ? 0.75 : 1,
              }}
            >
              {step === "submitting" ? (
                <>
                  <span style={{
                    width: 16, height: 16,
                    border: "2px solid rgba(255,255,255,0.4)",
                    borderTopColor: "#fff", borderRadius: "50%",
                    display: "inline-block", animation: "pixSpin .8s linear infinite",
                  }} />
                  Enviando...
                </>
              ) : "Quero receber novidades 💚"}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={step === "submitting"}
              style={{
                marginTop: "0.55rem", width: "100%", padding: "10px",
                border: "none", background: "transparent",
                color: "#9ca3af", fontSize: "0.83rem",
                cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Não, obrigado
            </button>
          </form>
        )}

        <div className="pix-doacao-protegida" style={{ marginTop: "0.85rem" }}>
          <img src={`${import.meta.env.BASE_URL}img/doacao-protegida.png`} alt="Doação Protegida" style={{height:"44px",width:"auto"}} />
        </div>
      </div>
    </div>
  );
}
