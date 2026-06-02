import { useState, useEffect } from "react";

interface Donor {
  nome: string;
  initials: string;
  color: string;
  valorNum: number;
  addedAt: number;
  isNew?: boolean;
}

interface RecentDonorsProps {
  donors: Donor[];
  formatBRL: (v: number) => string;
}

function getTimeLabel(addedAt: number, now: number): { label: string; isNow: boolean } {
  const diffMins = Math.floor((now - addedAt) / 60000);
  if (diffMins < 1) return { label: "Agora mesmo", isNow: true };
  if (diffMins === 1) return { label: "há 1 minuto", isNow: false };
  if (diffMins < 60) return { label: `há ${diffMins} minutos`, isNow: false };
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs === 1) return { label: "há 1 hora", isNow: false };
  return { label: `há ${diffHrs} horas`, isNow: false };
}

export default function RecentDonors({ donors, formatBRL }: RecentDonorsProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const todayCount = 47 + donors.length;

  return (
    <div id="section-atualizacoes" style={{
      background: "#fff",
      borderRadius: "16px",
      border: "1px solid #e5e7eb",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      marginBottom: "2rem",
      overflow: "hidden",
      fontFamily: "'Montserrat', 'Lato', sans-serif",
    }}>
      <style>{`
        @keyframes ds-pulse {
          0%   { transform: scale(1);   opacity: 0.7; }
          50%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1);   opacity: 0; }
        }
        @keyframes ds-slidein {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ds-donor-new { animation: ds-slidein 0.4s ease forwards; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "0.9rem 1.25rem",
        borderBottom: "1px solid #f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#fafafa",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#24CA68", position: "absolute",
            }} />
            <div style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#24CA68", position: "absolute",
              animation: "ds-pulse 2s ease-out infinite",
            }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#111827" }}>
            Doadores recentes
          </span>
        </div>
        <div style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "999px",
          padding: "3px 10px",
          fontSize: "0.7rem",
          fontWeight: 700,
          color: "#15803d",
          letterSpacing: "0.02em",
        }}>
          {todayCount} hoje
        </div>
      </div>

      {/* ── Donor rows ─────────────────────────────────────────────────────── */}
      <div>
        {donors.map((donor, i) => {
          const { label, isNow } = getTimeLabel(donor.addedAt, now);
          return (
            <div
              key={`${donor.nome}-${donor.addedAt}-${i}`}
              className={donor.isNew ? "ds-donor-new" : ""}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "0.8rem 1.25rem",
                borderBottom: i < donors.length - 1 ? "1px solid #f3f4f6" : "none",
                borderLeft: isNow ? "3px solid #24CA68" : "3px solid transparent",
                background: isNow
                  ? "linear-gradient(90deg, #f0fdf4 0%, #ffffff 60%)"
                  : "#ffffff",
                transition: "background 0.4s",
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 40, height: 40, flexShrink: 0,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${donor.color}ee, ${donor.color}99)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 2px 8px ${donor.color}44`,
              }}>
                <span style={{
                  color: "#fff", fontWeight: 800, fontSize: "0.76rem",
                  letterSpacing: "0.04em",
                }}>
                  {donor.initials}
                </span>
              </div>

              {/* Name + time */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: "0.875rem",
                  color: "#111827",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  lineHeight: 1.3,
                }}>
                  {donor.nome}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: "5px",
                  marginTop: "3px",
                }}>
                  {isNow && (
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "#24CA68", flexShrink: 0,
                    }} />
                  )}
                  <span style={{
                    fontSize: "0.71rem",
                    color: isNow ? "#16a34a" : "#9ca3af",
                    fontWeight: isNow ? 600 : 400,
                  }}>
                    {label}
                  </span>
                </div>
              </div>

              {/* Value + verified */}
              <div style={{ flexShrink: 0, textAlign: "right" }}>
                <div style={{
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  color: "#24CA68",
                  letterSpacing: "-0.01em",
                }}>
                  {formatBRL(donor.valorNum)}
                </div>
                <div style={{
                  display: "flex", alignItems: "center", gap: "3px",
                  justifyContent: "flex-end", marginTop: "3px",
                }}>
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="6" fill="#24CA68" />
                    <path d="M3.5 6.2l1.8 1.8 3.2-3.5" stroke="#fff" strokeWidth="1.5"
                      strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span style={{ fontSize: "0.64rem", color: "#9ca3af" }}>
                    Verificado
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: "0.6rem 1.25rem",
        borderTop: "1px solid #f3f4f6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "5px",
        background: "#fafafa",
      }}>
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="6" width="12" height="8" rx="1.5" stroke="#9ca3af" strokeWidth="1.5" />
          <path d="M5 6V5a3 3 0 016 0v1" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span style={{ fontSize: "0.67rem", color: "#9ca3af" }}>
          Dados protegidos · exibição parcial dos nomes
        </span>
      </div>
    </div>
  );
}
