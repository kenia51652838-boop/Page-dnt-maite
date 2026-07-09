import { useState, useEffect, useRef } from "react";
import { ARRECADADO, META, PCT } from "@/pages/Home";
import emojiPleading from "@/assets/emoji-pleading.png";

interface HeroSectionProps {
  onDonate: () => void;
  formatBRL: (v: number) => string;
  arrecadado?: number;
}

const CAMPAIGN_ID    = "3812047";
const CAMPAIGN_CYCLE_REF = new Date("2026-06-24T00:00:00-03:00");

export default function HeroSection({ onDonate, formatBRL, arrecadado }: HeroSectionProps) {
  const target = arrecadado ?? ARRECADADO;

  // Animação de contagem ao receber novo valor
  const [displayed, setDisplayed] = useState(ARRECADADO);
  const prevRef = useRef(ARRECADADO);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === prevRef.current) return;
    const start = prevRef.current;
    prevRef.current = target;
    const duration = 1800;
    const startTime = performance.now();

    if (animRef.current !== null) cancelAnimationFrame(animRef.current);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(start + (target - start) * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current !== null) cancelAnimationFrame(animRef.current); };
  }, [target]);

  const effectivePCT = ((target / META) * 100).toFixed(2);
  const DOADORES_SIMULADOS = Math.round(target / 35);
  const daysSinceRef  = Math.floor((Date.now() - CAMPAIGN_CYCLE_REF.getTime()) / 86_400_000);
  const daysLeft      = 5 - (daysSinceRef % 6);
  const cycleEnd      = new Date(CAMPAIGN_CYCLE_REF.getTime() + (Math.floor(daysSinceRef / 6) * 6 + 5) * 86_400_000);
  const cycleEndLabel = daysLeft === 0
    ? "hoje"
    : cycleEnd.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

  const isUrgent = daysLeft <= 2;
  const accentColor  = isUrgent ? "#dc2626" : "#d97706";
  const bgGradient   = isUrgent
    ? "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)"
    : "linear-gradient(135deg, #fff7ed 0%, #fef9ec 100%)";
  const borderColor  = isUrgent ? "#fca5a5" : "#fcd34d";
  const pillBg       = isUrgent ? "#dc2626" : "#f59e0b";
  const subtextColor = isUrgent ? "#991b1b" : "#a16207";

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
            <source
              srcSet={`${import.meta.env.BASE_URL}img/francivaldo.webp`}
              type="image/webp"
            />
            <img
              src={`${import.meta.env.BASE_URL}img/francivaldo.jpg`}
              alt="Sr. Francivaldo e seus filhos"
              fetchPriority="high"
              loading="eager"
              decoding="async"
              width="1200"
              height="701"
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
          marginBottom: "8px",
          letterSpacing: "-0.02em",
        }}>
          4 filhos, 1 pai com a perna fraturada e a geladeira vazia. O Sr. Francivaldo não sabe como vai jantar hoje.
        </h1>
        <p style={{
          fontFamily: "'Lato', sans-serif",
          fontSize: "0.92rem",
          fontWeight: 700,
          color: "#e53e3e",
          marginBottom: "18px",
          marginTop: 0,
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}>
          <img src={emojiPleading} alt="" style={{ width: "18px", height: "18px", display: "inline-block" }} />
          Por favor, ajude
        </p>

        {/* Valor animado */}
        <div style={{ marginBottom: "12px" }}>
          <span style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            fontSize: "1.65rem",
            color: "#24CA68",
            letterSpacing: "-0.02em",
            transition: "color 0.3s",
          }}>
            {formatBRL(displayed)}
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

        {/* Barra animada */}
        <div style={{ width: "100%", height: "7px", background: "#ebebeb", borderRadius: "999px", overflow: "hidden", marginBottom: "10px" }}>
          <div style={{
            width: `${effectivePCT}%`,
            height: "100%",
            background: "linear-gradient(90deg, #1aad56, #24CA68)",
            borderRadius: "999px",
            transition: "width 1.8s cubic-bezier(0.25, 1, 0.5, 1)",
          }} />
        </div>

        {/* Timer de urgência */}
        <div style={{
          display: "flex", alignItems: "center", gap: "12px",
          background: bgGradient,
          border: `1px solid ${borderColor}`,
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: "8px",
          padding: "11px 14px",
          marginBottom: "14px",
          boxShadow: "0 1px 5px rgba(0,0,0,0.06)",
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: accentColor, flexShrink: 0,
            boxShadow: `0 0 0 3px ${accentColor}22`,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: "flex", alignItems: "baseline",
              flexWrap: "wrap", gap: "6px",
              marginTop: "2px",
            }}>
              <span style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 800, fontSize: "0.88rem",
                color: accentColor, lineHeight: 1,
              }}>
                {daysLeft === 0 ? "Último dia" : `${daysLeft} dia${daysLeft > 1 ? "s" : ""} restantes`}
              </span>
              <span style={{ color: "#d1d5db", fontSize: "0.75rem", lineHeight: 1 }}>|</span>
              <span style={{
                fontFamily: "'Lato', sans-serif",
                fontSize: "0.78rem", fontWeight: 600,
                color: subtextColor, lineHeight: 1,
              }}>
                encerra em{" "}
                <span style={{ fontWeight: 700, color: accentColor }}>
                  {cycleEndLabel}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px", flexWrap: "wrap" }}>
          <span style={{ fontFamily: "'Lato', sans-serif", fontSize: "0.8rem", color: "#555", fontWeight: 700 }}>
            {effectivePCT}% atingido
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
