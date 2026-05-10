import { useEffect, useState, useCallback } from "react";

interface Props {
  onDonate: () => void;
}

const STORAGE_KEY = "exit_intent_shown_v1";

export default function ExitIntentModal({ onDonate }: Props) {
  const [visible, setVisible] = useState(false);

  const tryShow = useCallback(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(true);
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    // Desktop: cursor saindo pelo topo da janela
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && e.relatedTarget === null) tryShow();
    };

    // Mobile Android: botão voltar
    const handlePopState = () => tryShow();

    document.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("popstate", handlePopState);

    return () => {
      document.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [tryShow]);

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
        position: "fixed", inset: 0, zIndex: 99999,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem",
        backdropFilter: "blur(3px)",
        WebkitBackdropFilter: "blur(3px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "400px",
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
          animation: "exitModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        }}
      >
        <style>{`
          @keyframes exitModalIn {
            from { opacity: 0; transform: scale(0.88) translateY(20px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>

        {/* Cabeçalho escuro */}
        <div style={{
          background: "linear-gradient(145deg, #111827, #1f2937)",
          padding: "2rem 1.5rem 1.5rem",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "2.8rem", marginBottom: "12px", lineHeight: 1 }}>😢</div>
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            fontSize: "1.1rem",
            color: "#fff",
            margin: 0,
            lineHeight: 1.35,
          }}>
            Você está saindo sem ajudar o Sr. Francivaldo e seus 4 filhos...
          </h2>
        </div>

        {/* Corpo */}
        <div style={{ padding: "1.5rem 1.5rem 0.5rem" }}>
          <p style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.92rem",
            color: "#4b5563",
            lineHeight: 1.75,
            margin: "0 0 0.85rem",
            textAlign: "center",
          }}>
            Eduardo, Maria Gabriele, Maurício e Maria Julia vão dormir sem saber se terão o que comer amanhã. O pai deles trabalha com a perna machucada e ainda fica sem jantar para que eles possam comer.
          </p>
          <p style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.92rem",
            color: "#111",
            fontWeight: 700,
            textAlign: "center",
            margin: "0 0 1.5rem",
          }}>
            R$30 já garante o jantar dessa família hoje.
          </p>

          <button
            type="button"
            onClick={handleDonate}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #1aad56, #24CA68)",
              color: "#fff",
              border: "none",
              borderRadius: "999px",
              padding: "16px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 800,
              fontSize: "1rem",
              cursor: "pointer",
              letterSpacing: "0.02em",
              boxShadow: "0 6px 20px rgba(36,202,104,0.45)",
              marginBottom: "12px",
            }}
          >
            Quero ajudar essa família 💚
          </button>

          <button
            type="button"
            onClick={dismiss}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: "0.76rem",
              fontFamily: "'Lato', sans-serif",
              cursor: "pointer",
              padding: "8px 4px 16px",
              letterSpacing: "0.01em",
            }}
          >
            Não, prefiro não ajudar agora
          </button>
        </div>
      </div>
    </div>
  );
}
