import { useState, useEffect } from "react";
import { ARRECADADO, META, PCT } from "@/pages/Home";

interface HeroSectionProps {
  onDonate: () => void;
  formatBRL: (v: number) => string;
}

const CAMPAIGN_ID = "3812047";

function useViewerCount() {
  const [count, setCount] = useState(() => 18 + Math.floor(Math.random() * 22));

  useEffect(() => {
    const schedule = () => {
      const delay = 8000 + Math.random() * 14000;
      return setTimeout(() => {
        setCount(prev => {
          const delta = Math.random() < 0.55 ? 1 : -1;
          return Math.min(47, Math.max(12, prev + delta));
        });
        timerRef = schedule();
      }, delay);
    };
    let timerRef = schedule();
    return () => clearTimeout(timerRef);
  }, []);

  return count;
}

export default function HeroSection({ onDonate, formatBRL }: HeroSectionProps) {
  const DOADORES_SIMULADOS = Math.round(ARRECADADO / 52);
  const viewerCount = useViewerCount();

  const criacao = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 4);
    return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
  })();

  return (
    <div style={{ background: "#fff" }}>
      {/* Imagem */}
      <div style={{ padding: "20px 20px 0", background: "#f5f5f5" }}>
        <div style={{
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,0.13), 0 1px 4px rgba(0,0,0,0.08)",
          lineHeight: 0,
        }}>
          <picture>
            <img
              src={`${import.meta.env.BASE_URL}img/francivaldo.jpg`}
              alt="Sr. Francivaldo e seus filhos"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              width="1398"
              height="817"
              style={{ width: "100%", display: "block", objectFit: "cover" }}
              onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0"; }}
            />
          </picture>
        </div>
      </div>

      {/* Conteúdo */}
      <div style={{ padding: "22px 20px 18px", maxWidth: "1180px", margin: "0 auto" }}>

        {/* Badge verificada */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          marginBottom: "14px",
        }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            background: "#edfaf3",
            border: "1px solid #b8edcf",
            borderRadius: "6px",
            padding: "4px 10px",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-.866 3.48 3.745 3.745 0 01-3.48.866A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.48-.866 3.745 3.745 0 01-.866-3.48A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 01.866-3.48 3.746 3.746 0 013.48-.866A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.48.866 3.745 3.745 0 01.866 3.48A3.745 3.745 0 0121 12z"
                stroke="#24CA68"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span style={{
              fontFamily: "'Lato', sans-serif",
              fontWeight: 700,
              fontSize: "0.72rem",
              color: "#1aad56",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}>
              Campanha verificada
            </span>
          </div>

          <span style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.72rem",
            color: "#aaa",
            letterSpacing: "0.02em",
          }}>
            ID #{CAMPAIGN_ID}
          </span>
        </div>

        {/* Título */}
        <h1 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          fontSize: "clamp(1.25rem, 4vw, 1.65rem)",
          color: "#1a1a1a",
          lineHeight: 1.28,
          marginBottom: "20px",
          letterSpacing: "-0.02em",
        }}>
          Esse pai guerreiro de 46 anos deixa de se alimentar para não ver os filhos passarem fome
        </h1>

        {/* Valor */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            fontSize: "1.65rem",
            color: "#24CA68",
            letterSpacing: "-0.02em",
          }}>
            {formatBRL(ARRECADADO)}
          </span>
          <span style={{
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.85rem",
            color: "#999",
            marginLeft: "7px",
          }}>
            arrecadado de <b style={{ color: "#555", fontWeight: 600 }}>{formatBRL(META)}</b>
          </span>
        </div>

        {/* Barra */}
        <div style={{ width: "100%", height: "7px", background: "#ebebeb", borderRadius: "999px", overflow: "hidden", marginBottom: "10px" }}>
          <div style={{
            width: `${PCT}%`,
            height: "100%",
            background: "linear-gradient(90deg, #1aad56, #24CA68)",
            borderRadius: "999px",
          }} />
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.8rem", color: "#555", fontWeight: 700 }}>
            {PCT}% atingido
          </span>
          <span style={{ width: "1px", height: "13px", background: "#e0e0e0" }} />
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.8rem", color: "#555" }}>
            <b style={{ color: "#222" }}>{DOADORES_SIMULADOS.toLocaleString("pt-BR")}</b> apoiadores
          </span>
          <span style={{ width: "1px", height: "13px", background: "#e0e0e0" }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: "'Lato', sans-serif", fontSize: "0.8rem", color: "#555" }}>
            <span style={{
              width: "7px",
              height: "7px",
              borderRadius: "50%",
              background: "#e53e3e",
              display: "inline-block",
              animation: "vkPulse 1.6s ease-in-out infinite",
            }} />
            Doações em tempo real
          </span>
          <span style={{ width: "1px", height: "13px", background: "#e0e0e0" }} />
          {/* Contador de visualizadores */}
          <span style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "5px",
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.8rem",
            color: "#f97316",
            fontWeight: 600,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#f97316", flexShrink: 0 }}>
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <span style={{ transition: "all 0.4s ease" }}>
              {viewerCount} vendo agora
            </span>
          </span>
        </div>

        {/* Organizador */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          paddingTop: "16px",
          borderTop: "1px solid #f2f2f2",
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "38px", height: "38px", borderRadius: "50%",
              background: "linear-gradient(135deg, #24CA68, #15944a)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 6px rgba(0,157,78,0.2)",
            }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: "0.85rem", fontFamily: "'Montserrat', sans-serif" }}>V</span>
            </div>
            <div>
              <p style={{ margin: 0, fontFamily: "'Lato', sans-serif", fontSize: "0.82rem", fontWeight: 700, color: "#222" }}>
                Equipe Vakinha
              </p>
              <p style={{ margin: 0, fontFamily: "'Lato', sans-serif", fontSize: "0.73rem", color: "#aaa" }}>
                Organizador · Criada em {criacao}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
