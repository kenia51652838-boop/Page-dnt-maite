import { useState, useEffect } from "react";

const DONORS = [
  { nome: "Maria Silva", initials: "MS", color: "#10b981", valorNum: 50, addedAt: Date.now() - 20000, city: "São Paulo" },
  { nome: "João Oliveira", initials: "JO", color: "#3b82f6", valorNum: 100, addedAt: Date.now() - 4 * 60000, city: "BH" },
  { nome: "Ana Costa", initials: "AC", color: "#8b5cf6", valorNum: 35, addedAt: Date.now() - 8 * 60000, city: "Rio de Janeiro" },
  { nome: "Carlos Pereira", initials: "CP", color: "#f59e0b", valorNum: 75, addedAt: Date.now() - 13 * 60000, city: "Fortaleza" },
  { nome: "Patrícia Gomes", initials: "PG", color: "#06b6d4", valorNum: 200, addedAt: Date.now() - 19 * 60000, city: "Curitiba" },
  { nome: "Rafael Santos", initials: "RS", color: "#f43f5e", valorNum: 50, addedAt: Date.now() - 26 * 60000, city: "Manaus" },
];

const TOTAL_HOJE = 2840;
const META = 5000;

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeLabel(addedAt: number, now: number) {
  const d = Math.floor((now - addedAt) / 60000);
  if (d < 1) return { txt: "Agora mesmo", live: true };
  if (d === 1) return { txt: "1 min atrás", live: false };
  if (d < 60) return { txt: `${d} min atrás`, live: false };
  return { txt: `${Math.floor(d / 60)}h atrás`, live: false };
}

export function Social() {
  const [now, setNow] = useState(Date.now());
  const [pulse, setPulse] = useState(true);
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    const p = setInterval(() => setPulse(v => !v), 1000);
    return () => { clearInterval(t); clearInterval(p); };
  }, []);

  const pct = Math.round((TOTAL_HOJE / META) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      <div style={{ width: 390, background: "#fff", borderRadius: 20, boxShadow: "0 8px 40px rgba(16,185,129,0.12)", overflow: "hidden", border: "1px solid #d1fae5" }}>

        {/* Header com progresso */}
        <div style={{ background: "linear-gradient(135deg, #065f46, #059669)", padding: "20px 22px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#a7f3d0", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>
                Campanha hoje
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>
                {fmt(TOTAL_HOJE)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#6ee7b7", marginBottom: 2 }}>Meta</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#a7f3d0" }}>{fmt(META)}</div>
            </div>
          </div>

          {/* Barra de progresso */}
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 999, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#34d399", borderRadius: 999, transition: "width 0.5s" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
            <span style={{ fontSize: 11, color: "#6ee7b7", fontWeight: 600 }}>{pct}% da meta atingida</span>
            <span style={{ fontSize: 11, color: "#6ee7b7" }}>{40 + DONORS.length} doadores</span>
          </div>
        </div>

        {/* Título da lista */}
        <div style={{ padding: "14px 22px 8px", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            position: "relative", width: 8, height: 8, flexShrink: 0,
          }}>
            <div style={{ position: "absolute", width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
            <div style={{
              position: "absolute", width: 8, height: 8, borderRadius: "50%",
              background: "#10b981", opacity: pulse ? 0 : 0.4,
              transform: pulse ? "scale(2.2)" : "scale(1)",
              transition: "all 1s ease",
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#064e3b" }}>Doações em tempo real</span>
        </div>

        {/* Lista */}
        <div style={{ padding: "0 12px 12px" }}>
          {DONORS.map((d, i) => {
            const { txt, live } = timeLabel(d.addedAt, now);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 10px",
                borderRadius: 12,
                background: live ? "#f0fdf4" : i % 2 === 0 ? "#fafafa" : "#fff",
                marginBottom: 4,
              }}>
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  borderRadius: "50%",
                  background: d.color,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 2px 10px ${d.color}55`,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                    {d.initials}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{d.nome}</span>
                    {live && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "#10b981", borderRadius: 999, padding: "1px 7px", lineHeight: "18px" }}>
                        NOVO
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    {txt} · {d.city}
                  </div>
                </div>

                {/* Valor */}
                <div style={{ flexShrink: 0, textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: d.color }}>
                    {fmt(d.valorNum)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 22px", borderTop: "1px solid #f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="6" width="12" height="8" rx="2" stroke="#6ee7b7" strokeWidth="1.5"/>
            <path d="M5 6V5a3 3 0 016 0v1" stroke="#6ee7b7" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 11, color: "#6ee7b7" }}>Verificado · Lumina Pagamentos</span>
        </div>
      </div>
    </div>
  );
}
