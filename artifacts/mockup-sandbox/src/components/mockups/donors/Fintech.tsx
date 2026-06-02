import { useState, useEffect } from "react";

const DONORS = [
  { nome: "Maria Silva", initials: "MS", color: "#0ea5e9", valorNum: 50, addedAt: Date.now() - 25000 },
  { nome: "João Oliveira", initials: "JO", color: "#22c55e", valorNum: 100, addedAt: Date.now() - 5 * 60000 },
  { nome: "Ana Costa", initials: "AC", color: "#a855f7", valorNum: 35, addedAt: Date.now() - 9 * 60000 },
  { nome: "Carlos Pereira", initials: "CP", color: "#f97316", valorNum: 75, addedAt: Date.now() - 14 * 60000 },
  { nome: "Patrícia Gomes", initials: "PG", color: "#14b8a6", valorNum: 200, addedAt: Date.now() - 20 * 60000 },
  { nome: "Rafael Santos", initials: "RS", color: "#f59e0b", valorNum: 50, addedAt: Date.now() - 27 * 60000 },
  { nome: "Fernanda Lima", initials: "FL", color: "#6366f1", valorNum: 30, addedAt: Date.now() - 35 * 60000 },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeLabel(addedAt: number, now: number) {
  const d = Math.floor((now - addedAt) / 60000);
  if (d < 1) return { txt: "Agora mesmo", live: true };
  if (d === 1) return { txt: "há 1 minuto", live: false };
  if (d < 60) return { txt: `há ${d} minutos`, live: false };
  const h = Math.floor(d / 60);
  return { txt: h === 1 ? "há 1 hora" : `há ${h} horas`, live: false };
}

export function Fintech() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: 390, background: "#fff", borderRadius: 20, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(15,23,42,0.07)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f1f5f9" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 4 }}>
                Doações confirmadas
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", lineHeight: 1 }}>
                {DONORS.length + 40} <span style={{ fontSize: 14, fontWeight: 500, color: "#64748b" }}>hoje</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 999, padding: "5px 12px" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}>ao vivo</span>
            </div>
          </div>
        </div>

        {/* List */}
        <div>
          {DONORS.map((d, i) => {
            const { txt, live } = timeLabel(d.addedAt, now);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 24px",
                borderBottom: i < DONORS.length - 1 ? "1px solid #f8fafc" : "none",
                background: live ? "#f0fdf4" : "#fff",
                transition: "background 0.3s",
              }}>
                {/* Avatar */}
                <div style={{
                  width: 42, height: 42, flexShrink: 0, borderRadius: "50%",
                  background: d.color + "18",
                  border: `1.5px solid ${d.color}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: d.color }}>
                    {d.initials}
                  </span>
                </div>

                {/* Name + time */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {d.nome}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                    {live && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#16a34a", flexShrink: 0 }} />}
                    <span style={{ fontSize: 12, color: live ? "#16a34a" : "#94a3b8", fontWeight: live ? 600 : 400 }}>
                      {txt}
                    </span>
                  </div>
                </div>

                {/* Value */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#059669" }}>
                    {fmt(d.valorNum)}
                  </div>
                  <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>PIX</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "#fafafa" }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="6" width="12" height="8" rx="2" stroke="#94a3b8" strokeWidth="1.5"/>
            <path d="M5 6V5a3 3 0 016 0v1" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>Nomes parciais · dados protegidos</span>
        </div>
      </div>
    </div>
  );
}
