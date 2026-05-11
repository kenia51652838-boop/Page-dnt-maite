import { useState, useEffect, useCallback } from "react";

interface Props {
  name: string;
  city: string;
  amount: number;
  onDismiss: () => void;
}

function formatBRL(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(p => p.length > 1);
  if (parts.length === 0) return "DA";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return ((parts[0][0] ?? "") + (parts[parts.length - 1][0] ?? "")).toUpperCase();
}

export default function PrivateFomoToast({ name, city, amount, onDismiss }: Props) {
  const [leaving, setLeaving] = useState(false);

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onDismiss(), 380);
  }, [onDismiss]);

  useEffect(() => {
    const t = setTimeout(() => dismiss(), 7000);
    return () => clearTimeout(t);
  }, [dismiss]);

  const initials = getInitials(name);

  return (
    <div style={{
      position: "fixed",
      top: "16px",
      left: "16px",
      right: "16px",
      zIndex: 9999,
      maxWidth: "340px",
      animation: leaving
        ? "fomoOut 0.38s ease forwards"
        : "fomoIn 0.42s cubic-bezier(0.34,1.56,0.64,1) forwards",
    }}>
      <style>{`
        @keyframes fomoIn {
          from { opacity: 0; transform: translateY(-18px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fomoOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(-14px) scale(0.96); }
        }
        @keyframes fomoTimer {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>

      <div style={{
        background: "#fff",
        borderRadius: "14px",
        boxShadow: "0 10px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}>
        <div style={{
          background: "linear-gradient(135deg, #f0fdf6, #e8faf2)",
          padding: "9px 12px 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          borderBottom: "1px solid #d1fae5",
        }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" fill="#24CA68"/>
            <path d="M7 12.5l3.5 3.5 6.5-7" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.7rem",
            fontWeight: 700,
            color: "#15803d",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}>
            Doação confirmada
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Fechar"
            style={{
              marginLeft: "auto",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              padding: "0",
              lineHeight: 1,
              fontSize: "18px",
              display: "flex",
              alignItems: "center",
            }}
          >×</button>
        </div>

        <div style={{
          padding: "12px 14px 13px",
          display: "flex",
          gap: "10px",
          alignItems: "flex-start",
        }}>
          <div style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #24CA68, #15944a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 2px 8px rgba(36,202,104,0.32)",
          }}>
            <span style={{
              color: "#fff",
              fontWeight: 800,
              fontSize: "0.88rem",
              fontFamily: "'Montserrat', sans-serif",
            }}>
              {initials}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              margin: 0,
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              color: "#111827",
              lineHeight: 1.3,
            }}>
              {name}
            </p>
            {city && (
              <p style={{
                margin: "3px 0 0",
                fontFamily: "'Lato', sans-serif",
                fontSize: "0.73rem",
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}>
                <span style={{ fontSize: "0.82rem" }}>📍</span> {city}
              </p>
            )}
            <p style={{
              margin: "6px 0 0",
              fontFamily: "'Lato', sans-serif",
              fontSize: "0.8rem",
              color: "#374151",
            }}>
              acabou de contribuir{" "}
              <span style={{
                fontWeight: 800,
                color: "#24CA68",
                fontSize: "0.92rem",
              }}>
                {formatBRL(amount)}
              </span>
            </p>
          </div>
        </div>

        <div style={{ height: "3px", background: "#f3f4f6" }}>
          <div style={{
            height: "100%",
            background: "linear-gradient(90deg, #1aad56, #24CA68)",
            animation: "fomoTimer 7s linear forwards",
          }} />
        </div>
      </div>
    </div>
  );
}
