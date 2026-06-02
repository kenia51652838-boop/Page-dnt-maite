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

  const todayCount = 40 + donors.length;

  return (
    <div
      id="section-atualizacoes"
      style={{
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #e2e8f0",
        boxShadow: "0 4px 24px rgba(15,23,42,0.07)",
        marginBottom: "2rem",
        overflow: "hidden",
        fontFamily: "'Montserrat', 'Inter', 'Segoe UI', system-ui, sans-serif",
      }}
    >
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "18px 22px 14px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#94a3b8",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Doações confirmadas
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
              {todayCount}{" "}
              <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b" }}>hoje</span>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: 999,
              padding: "5px 12px",
            }}
          >
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>ao vivo</span>
          </div>
        </div>
      </div>

      {/* ── Donor rows ────────────────────────────────────────────────── */}
      <div>
        {donors.map((donor, i) => {
          const { label, isNow } = getTimeLabel(donor.addedAt, now);
          return (
            <div
              key={`${donor.nome}-${donor.addedAt}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "13px 22px",
                borderBottom: i < donors.length - 1 ? "1px solid #f8fafc" : "none",
                background: isNow ? "#f0fdf4" : "#fff",
                transition: "background 0.4s",
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 42,
                  height: 42,
                  flexShrink: 0,
                  borderRadius: "50%",
                  background: donor.color + "18",
                  border: `1.5px solid ${donor.color}55`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: donor.color,
                    letterSpacing: "0.04em",
                  }}
                >
                  {donor.initials}
                </span>
              </div>

              {/* Nome + tempo */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#0f172a",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    lineHeight: 1.3,
                  }}
                >
                  {donor.nome}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    marginTop: 3,
                  }}
                >
                  {isNow && (
                    <div
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: "50%",
                        background: "#16a34a",
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      color: isNow ? "#16a34a" : "#94a3b8",
                      fontWeight: isNow ? 600 : 400,
                    }}
                  >
                    {label}
                  </span>
                </div>
              </div>

              {/* Valor */}
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#059669",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {formatBRL(donor.valorNum)}
                </div>
                <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>PIX</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: "10px 22px",
          borderTop: "1px solid #f1f5f9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          background: "#fafafa",
        }}
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="6" width="12" height="8" rx="2" stroke="#94a3b8" strokeWidth="1.5" />
          <path
            d="M5 6V5a3 3 0 016 0v1"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span style={{ fontSize: 11, color: "#94a3b8" }}>
          Nomes parciais · dados protegidos
        </span>
      </div>
    </div>
  );
}
