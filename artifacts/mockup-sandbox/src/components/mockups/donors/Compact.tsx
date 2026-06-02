import { useState, useEffect } from "react";

const DONORS = [
  { nome: "Maria Silva", initials: "MS", color: "#6366f1", valorNum: 50, addedAt: Date.now() - 28000 },
  { nome: "João Oliveira", initials: "JO", color: "#0ea5e9", valorNum: 100, addedAt: Date.now() - 3 * 60000 },
  { nome: "Ana Costa", initials: "AC", color: "#a855f7", valorNum: 35, addedAt: Date.now() - 7 * 60000 },
  { nome: "Carlos Pereira", initials: "CP", color: "#f59e0b", valorNum: 75, addedAt: Date.now() - 12 * 60000 },
  { nome: "Patrícia Gomes", initials: "PG", color: "#10b981", valorNum: 200, addedAt: Date.now() - 18 * 60000 },
  { nome: "Rafael Santos", initials: "RS", color: "#ef4444", valorNum: 50, addedAt: Date.now() - 25 * 60000 },
  { nome: "Fernanda Lima", initials: "FL", color: "#ec4899", valorNum: 30, addedAt: Date.now() - 33 * 60000 },
  { nome: "Diego Souza", initials: "DS", color: "#14b8a6", valorNum: 150, addedAt: Date.now() - 42 * 60000 },
];

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeLabel(addedAt: number, now: number) {
  const d = Math.floor((now - addedAt) / 60000);
  if (d < 1) return { txt: "agora", live: true };
  if (d < 60) return { txt: `${d}m`, live: false };
  return { txt: `${Math.floor(d / 60)}h`, live: false };
}

export function Compact() {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const total = DONORS.reduce((s, d) => s + d.valorNum, 0) + 2400;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: 390, borderRadius: 18, overflow: "hidden", boxShadow: "0 4px 32px rgba(15,23,42,0.1)" }}>

        {/* Header escuro */}
        <div style={{ background: "#0f172a", padding: "18px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#475569", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
                Doadores recentes
              </div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" }}>
                {fmt(total)}
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                arrecadados hoje
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#1e293b", border: "1px solid #334155", borderRadius: 8, padding: "5px 10px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "#94a3b8" }}>
                {DONORS.length + 40} hoje
              </span>
            </div>
          </div>

          {/* Separador mini-barras coloridas dos últimos doadores */}
          <div style={{ display: "flex", gap: 3, marginTop: 14 }}>
            {DONORS.map((d, i) => (
              <div key={i} style={{ flex: 1, height: 3, borderRadius: 999, background: d.color, opacity: 0.8 }} />
            ))}
          </div>
        </div>

        {/* Lista compacta */}
        <div style={{ background: "#fff" }}>
          {DONORS.map((d, i) => {
            const { txt, live } = timeLabel(d.addedAt, now);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 22px",
                borderBottom: i < DONORS.length - 1 ? "1px solid #f8fafc" : "none",
                borderLeft: `3px solid ${live ? d.color : "transparent"}`,
                background: live ? `${d.color}08` : "#fff",
              }}>
                {/* Mini avatar */}
                <div style={{
                  width: 34, height: 34, flexShrink: 0, borderRadius: "50%",
                  background: d.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#fff" }}>{d.initials}</span>
                </div>

                {/* Nome */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {d.nome}
                  </div>
                </div>

                {/* Tempo */}
                <div style={{ flexShrink: 0, textAlign: "center", minWidth: 36 }}>
                  <span style={{
                    fontSize: 11, fontWeight: live ? 700 : 400,
                    color: live ? d.color : "#94a3b8",
                    background: live ? `${d.color}15` : "transparent",
                    borderRadius: 6, padding: live ? "2px 6px" : "0",
                  }}>
                    {txt}
                  </span>
                </div>

                {/* Valor monospace */}
                <div style={{ flexShrink: 0, textAlign: "right", minWidth: 80 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace" }}>
                    {fmt(d.valorNum)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "10px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>🔒 Dados anonimizados</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>via PIX</span>
        </div>
      </div>
    </div>
  );
}
