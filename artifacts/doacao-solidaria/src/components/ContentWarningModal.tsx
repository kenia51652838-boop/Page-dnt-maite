import { useEffect, useState } from "react";

const WARNING_KEY = "content_warning_v1";

interface Props {
  onDismiss: () => void;
}

export default function ContentWarningModal({ onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(WARNING_KEY)) return;
    const t = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(t);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    sessionStorage.setItem(WARNING_KEY, "1");
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 300);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10050,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.25rem",
        background: "rgba(8, 15, 35, 0.78)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        opacity: leaving ? 0 : 1,
        transition: leaving ? "opacity 0.3s ease" : "none",
        animation: leaving ? "none" : "cwFadeIn 0.4s ease-out",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "1.25rem",
          padding: "2rem 1.5rem 1.75rem",
          maxWidth: "340px",
          width: "100%",
          boxShadow: "0 25px 70px rgba(0,0,0,0.4)",
          textAlign: "center",
          position: "relative",
          animation: leaving ? "none" : "cwSlideUp 0.4s cubic-bezier(0.22, 1.28, 0.36, 1)",
        }}
      >
        <button
          onClick={handleDismiss}
          aria-label="Fechar"
          style={{
            position: "absolute",
            top: "0.85rem",
            right: "0.85rem",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "50%",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.8rem",
            color: "#64748b",
          }}
        >
          ✕
        </button>

        <div style={{ fontSize: "2.2rem", marginBottom: "0.6rem" }}>⚠️</div>

        <h3
          style={{
            fontSize: "1.15rem",
            fontWeight: 800,
            color: "#111827",
            marginBottom: "0.75rem",
            lineHeight: 1.3,
          }}
        >
          Antes de continuar
        </h3>

        <p
          style={{
            fontSize: "0.875rem",
            color: "#374151",
            lineHeight: 1.7,
            marginBottom: "0.5rem",
          }}
        >
          Esta página contém imagens e relatos reais de uma família vivendo em situação de{" "}
          <strong>vulnerabilidade extrema</strong>. A história do Sr. Francivaldo é difícil de ler
          — mas é verdadeira.
        </p>

        <p
          style={{
            fontSize: "0.78rem",
            color: "#9ca3af",
            marginBottom: "1.5rem",
            fontStyle: "italic",
          }}
        >
          Algumas pessoas preferem não continuar.
        </p>

        <button
          onClick={handleDismiss}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #1aad56, #24CA68)",
            color: "#fff",
            border: "none",
            borderRadius: "12px",
            padding: "14px 20px",
            fontSize: "0.95rem",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.01em",
            boxShadow: "0 4px 14px rgba(26,173,86,0.35)",
          }}
        >
          Entendi — quero ver a história
        </button>
      </div>
    </div>
  );
}
