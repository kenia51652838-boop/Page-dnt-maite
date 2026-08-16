import { useState } from "react";
import { ARRECADADO, META } from "@/pages/Home";

const CTA_MAP: Record<number, string> = {
  30:   "Ajudar no tratamento da Maíte",
  35:   "Contribuir para a recuperação",
  40:   "Pagar parte da consulta especializada",
  50:   "Cobrir sessão de fisioterapia",
  60:   "Garantir sessões de reabilitação",
  75:   "Custear exames da Maíte",
  100:  "Pagar uma semana de terapia",
  150:  "Garantir duas semanas de reabilitação",
  200:  "Cobrir tratamento mensal da Maíte",
  300:  "Garantir um mês de fisioterapia",
  400:  "Cobrir exames + sessões do mês",
  500:  "Garantir mês completo de tratamento",
  750:  "Ajudar no tratamento por 2 meses",
  1000: "Transformar a reabilitação da Maíte",
  2000: "Mudar completamente o futuro da Maíte",
};

interface DonationFormProps {
  selectedValue: number | null;
  onValueClick: (v: number) => void;
  onGeneratePix?: (v: number) => void;
  donationValues: number[];
  formatBRL: (v: number) => string;
  loading: boolean;
  arrecadado?: number;
}

const MAIS_ESCOLHIDO = 75;

const IMPACT_MAP: Record<number, string> = {
  30:   "ajuda a cobrir parte dos exames e consultas especializadas para a Maíte",
  35:   "contribui para a reabilitação neurológica que a Maíte precisa urgentemente",
  40:   "paga parte de uma sessão de fisioterapia para a Maíte se desenvolver",
  50:   "cobre uma sessão de fisioterapia ou fonoaudiologia para a Maíte",
  60:   "garante uma semana de exercícios de reabilitação para a Maíte",
  75:   "cobre exames ou duas sessões de terapia para a recuperação da Maíte",
  100:  "garante uma semana completa de fisioterapia para a Maíte",
  150:  "custeia duas semanas de reabilitação neurológica para a Maíte",
  200:  "cobre mais de um mês de sessões de fisioterapia para a Maíte",
  300:  "garante um mês inteiro de tratamento especializado para a Maíte",
  400:  "cobre exames + sessões de reabilitação pelo mês inteiro",
  500:  "garante mais de um mês de tratamento completo para a Maíte",
  750:  "custeia dois meses de reabilitação e exames para a Maíte",
  1000: "muda completamente o acesso ao tratamento da Maíte por vários meses",
  2000: "garante mais de 3 meses de tratamento especializado e dignidade para a Maíte",
};

export default function DonationForm({
  selectedValue,
  onValueClick,
  onGeneratePix,
  donationValues,
  formatBRL,
  loading,
  arrecadado,
}: DonationFormProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [selectError, setSelectError] = useState(false);

  const effectiveArrecadado = arrecadado ?? ARRECADADO;
  const effectivePCT = ((effectiveArrecadado / META) * 100).toFixed(2);
  const donorCount = Math.round(effectiveArrecadado / 35);

  const activeValue = hoveredValue ?? selectedValue ?? MAIS_ESCOLHIDO;
  const impactText = IMPACT_MAP[activeValue] ?? "";

  return (
    <div id="section-donation">

      {/* Título */}
      <h2 style={{
        fontSize: "1.3rem",
        fontWeight: 800,
        color: "#111827",
        lineHeight: 1.3,
        marginBottom: "0.75rem",
        paddingRight: "2rem",
      }}>
        Maíte tem 2 anos e luta desde o primeiro dia de vida por causa de sequelas do parto
      </h2>

      {/* Valor + progresso */}
      <div style={{marginBottom: "0.4rem"}}>
        <span style={{
          display: "block",
          fontSize: "1.45rem",
          fontWeight: 800,
          color: "#24CA68",
          lineHeight: 1.1,
          marginBottom: "2px",
        }}>
          {formatBRL(effectiveArrecadado)}
        </span>
        <span style={{fontSize: "0.78rem", color: "#6b7280"}}>
          arrecadados de {formatBRL(META)}
        </span>
      </div>

      {/* Barra de progresso */}
      <div style={{
        width: "100%",
        height: "8px",
        background: "#e5e7eb",
        borderRadius: "999px",
        overflow: "hidden",
        marginBottom: "5px",
      }}>
        <div style={{
          width: `${effectivePCT}%`,
          height: "100%",
          background: "linear-gradient(90deg, #1aad56, #24CA68)",
          borderRadius: "999px",
          transition: "width 900ms ease",
        }} />
      </div>

      {/* Progresso + doadores */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1rem",
      }}>
        <p style={{fontSize: "0.78rem", color: "#6b7280", margin: 0, fontWeight: 500}}>
          {effectivePCT}% do objetivo alcançado
        </p>
        <p style={{
          fontSize: "0.78rem",
          color: "#6b7280",
          margin: 0,
          fontWeight: 600,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="7" r="4" stroke="#9ca3af" strokeWidth="2"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {donorCount.toLocaleString("pt-BR")} doadores
        </p>
      </div>

      {/* Avatar stack — prova social */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        marginBottom: "1rem",
        background: "#f0fdf4", border: "1px solid #bbf7d0",
        borderRadius: "10px", padding: "8px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          {[
            { i: "AC", c: "#24CA68" },
            { i: "RM", c: "#0ea5e9" },
            { i: "FL", c: "#a855f7" },
            { i: "CE", c: "#f97316" },
            { i: "MT", c: "#ef4444" },
          ].map((a, idx) => (
            <div key={idx} style={{
              width: 28, height: 28, borderRadius: "50%",
              background: a.c, color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", fontWeight: 800,
              fontFamily: "'Montserrat', sans-serif",
              border: "2px solid #fff",
              marginLeft: idx === 0 ? 0 : -8,
              zIndex: 5 - idx,
              position: "relative",
            }}>{a.i}</div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: "0.75rem", color: "#166534", fontWeight: 600, lineHeight: 1.4 }}>
          Ana C., Bruno S. e <strong>+{(donorCount - 2).toLocaleString("pt-BR")}</strong> pessoas já ajudaram
        </p>
      </div>

      {/* Label */}
      <p style={{
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#374151",
        marginBottom: "0.5rem",
      }}>
        Escolha o valor que seu coração desejar:
      </p>

      {/* Grid de valores */}
      <div className="valor-btns-grid" style={{marginBottom: "0.75rem"}}>
        {donationValues.map(v => {
          const isMaisEscolhido = v === MAIS_ESCOLHIDO;
          const isSelected = selectedValue === v;
          let cls = "valor-btn ";
          if (isSelected) cls += "valor-btn--selected";
          else if (isMaisEscolhido) cls += "valor-btn--mais-escolhido";
          else cls += "valor-btn--normal";

          return (
            <button
              key={v}
              type="button"
              className={cls}
              onClick={() => onValueClick(v)}
              onMouseEnter={() => setHoveredValue(v)}
              onMouseLeave={() => setHoveredValue(null)}
              disabled={loading}
              style={{position: "relative", opacity: loading ? 0.65 : 1}}
            >
              {isMaisEscolhido && !isSelected && (
                <span className="valor-btn__selo">Mais Escolhido</span>
              )}
              <span style={{display:"block", lineHeight: 1.2}}>{formatBRL(v)}</span>
            </button>
          );
        })}
      </div>


      {/* Botão Gerar PIX */}
      {onGeneratePix && (
        <div style={{marginBottom: "0.75rem"}}>
          <button
            type="button"
            onClick={() => {
              if (!selectedValue) {
                setSelectError(true);
                return;
              }
              setSelectError(false);
              onGeneratePix(selectedValue);
            }}
            disabled={loading}
            className="btn-donation"
            style={{ width: "100%" }}
          >
            {loading ? (
              <span style={{display:"flex", alignItems:"center", justifyContent:"center", gap:"8px"}}>
                <span style={{
                  width: 15, height: 15,
                  border: "2px solid rgba(255,255,255,0.4)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  animation: "pixSpin 0.8s linear infinite",
                  flexShrink: 0,
                }} />
                Gerando PIX...
              </span>
            ) : (
              <span>Gerar PIX{selectedValue ? ` — ${formatBRL(selectedValue)}` : ""}</span>
            )}
          </button>
          {selectError && (
            <p style={{
              margin: "6px 0 0",
              fontSize: "0.78rem",
              color: "#dc2626",
              fontWeight: 600,
              textAlign: "center",
              fontFamily: "'Lato', sans-serif",
            }}>
              ⚠️ Selecione o valor que deseja contribuir antes de continuar.
            </p>
          )}
        </div>
      )}

      {/* Barra de impacto */}
      {impactText && (
        <div style={{
          background: "linear-gradient(135deg, #f0fdf6, #e6faf0)",
          border: "1.5px solid #bbf0d0",
          borderRadius: "10px",
          padding: "10px 14px",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "8px",
          transition: "all 0.2s ease",
        }}>
          <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>💚</span>
          <p style={{
            margin: 0,
            fontFamily: "'Lato', sans-serif",
            fontSize: "0.8rem",
            color: "#166534",
            lineHeight: 1.5,
            fontWeight: 600,
          }}>
            <span style={{ color: "#14532d", fontWeight: 800 }}>
              {formatBRL(activeValue)}
            </span>{" "}
            {impactText}
          </p>
        </div>
      )}

      {/* Rodapé */}
      <p style={{
        fontSize: "0.72rem",
        color: "#9ca3af",
        textAlign: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
      }}>
        <span>🔒</span>
        Pagamento processado de forma segura via PIX
      </p>
    </div>
  );
}
