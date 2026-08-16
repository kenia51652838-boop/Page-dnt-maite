import { useEffect, useState } from "react";

interface Props {
  onDonate: () => void;
}

const STORAGE_KEY = "beneficiary_msg_shown_v1";
const DELAY_MS    = 5000;

export default function BeneficiaryMessageModal({ onDonate }: Props) {
  const [visible, setVisible]   = useState(false);
  const [entered, setEntered]   = useState(false);
  const [typing, setTyping]     = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setVisible(true);
      document.body.style.overflow = "hidden";
      setTimeout(() => setEntered(true), 30);
      setTimeout(() => setTyping(false), 2200);
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    document.body.style.overflow = "";
  }

  function handleDonate() {
    dismiss();
    onDonate();
  }

  if (!visible) return null;

  return (
    <div
      onClick={dismiss}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        padding: "0 0 0 0",
        transition: "opacity 0.25s",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: "480px",
          background: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "0 0 32px",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.18)",
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.38s cubic-bezier(0.32,1.1,0.5,1)",
          overflow: "hidden",
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#e5e7eb" }} />
        </div>

        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "12px 20px 14px",
          borderBottom: "1px solid #f3f4f6",
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            overflow: "hidden", flexShrink: 0,
            border: "2px solid #24CA68",
            boxShadow: "0 0 0 3px #24CA6822",
          }}>
            <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #24CA68, #15944a)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.1rem", fontFamily: "'Montserrat', sans-serif" }}>G</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: "0.95rem", color: "#111" }}>
              Glaice (mãe da Maíte)
            </p>
            <p style={{ margin: 0, fontFamily: "'Lato', sans-serif", fontSize: "0.75rem", color: "#24CA68", fontWeight: 700 }}>
              ✓ Beneficiário verificado
            </p>
          </div>
          <button
            onClick={dismiss}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#9ca3af", fontSize: "1.3rem", padding: "4px",
              lineHeight: 1, flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Mensagem estilo chat */}
        <div style={{ padding: "18px 20px 0" }}>

          {/* Balão de mensagem */}
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", marginBottom: "6px" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: "linear-gradient(135deg, #24CA68, #15944a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              border: "1.5px solid #e5e7eb",
            }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.72rem", fontFamily: "'Montserrat', sans-serif" }}>G</span>
            </div>

            <div style={{
              background: "#f3f4f6",
              borderRadius: "18px 18px 18px 4px",
              padding: "12px 16px",
              maxWidth: "82%",
              position: "relative",
            }}>
              {typing ? (
                <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "2px 4px" }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 7, height: 7, borderRadius: "50%",
                      background: "#9ca3af",
                      display: "inline-block",
                      animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }} />
                  ))}
                </div>
              ) : (
                <p style={{
                  margin: 0,
                  fontFamily: "'Lato', sans-serif",
                  fontSize: "0.9rem",
                  color: "#1f2937",
                  lineHeight: 1.55,
                }}>
                  Olá. Sou a Glaice, mãe da Maíte. Minha filha sofreu sequelas graves por um erro médico no parto e precisa de tratamento contínuo. Estou trabalhando todo dia na minha açaiteria pra pagar a fisioterapia dela.
                  {" "}<span style={{ fontWeight: 700 }}>Por favor, se puder me ajudar com qualquer valor, vai fazer toda a diferença no tratamento dela.</span>
                  {" "}Que Deus abençoe você. 🙏
                </p>
              )}

              <p style={{
                margin: "6px 0 0", textAlign: "right",
                fontFamily: "'Lato', sans-serif",
                fontSize: "0.68rem",
                color: "#9ca3af",
              }}>
                agora ✓✓
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={handleDonate}
            style={{
              width: "100%",
              padding: "15px",
              background: "linear-gradient(135deg, #1aad56, #24CA68)",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(36,202,104,0.35)",
              letterSpacing: "0.01em",
            }}
          >
            Quero ajudar a Maíte 💚
          </button>
          <button
            onClick={dismiss}
            style={{
              width: "100%",
              padding: "12px",
              background: "none",
              color: "#9ca3af",
              border: "none",
              borderRadius: "10px",
              fontFamily: "'Lato', sans-serif",
              fontWeight: 600,
              fontSize: "0.82rem",
              cursor: "pointer",
            }}
          >
            Agora não
          </button>
        </div>

        <style>{`
          @keyframes typingDot {
            0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
            30% { transform: translateY(-5px); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
