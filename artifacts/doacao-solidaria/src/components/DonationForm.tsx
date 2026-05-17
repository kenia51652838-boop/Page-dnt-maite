import { useState } from "react";
import { ARRECADADO, META } from "@/pages/Home";

interface DonationFormProps {
  selectedValue: number | null;
  onValueClick: (v: number) => void;
  donationValues: number[];
  formatBRL: (v: number) => string;
  loading: boolean;
  arrecadado?: number;
}

const MAIS_ESCOLHIDO = 75;

const IMPACT_MAP: Record<number, string> = {
  30:   "garante o jantar de hoje para o Sr. Francivaldo e os 4 filhos",
  35:   "compra arroz, feijão e ovos para 2 dias de refeição",
  40:   "cobre 2 dias de alimentação básica para toda a família",
  50:   "garante 3 dias de refeições para as crianças",
  60:   "alimenta a família por 3 a 4 dias com o básico do mercado",
  75:   "cobre 4 dias de comida no prato para os 4 filhos",
  100:  "garante 5 a 6 dias de alimentação completa para a família",
  150:  "uma semana inteira de comida garantida para essa família",
  200:  "mais de 1 semana de alimentação e itens básicos de higiene",
  300:  "quase 2 semanas de comida e dignidade para os 4 filhos",
  400:  "2 semanas de alimentação completa e ajuda no tratamento da perna",
  500:  "3 semanas de comida e cuidado garantidos para essa família",
  750:  "mais de 1 mês de refeições no prato para os 4 filhos",
  1000: "muda completamente a realidade dessa família por mais de 1 mês",
};

export default function DonationForm({
  selectedValue,
  onValueClick,
  donationValues,
  formatBRL,
  loading,
  arrecadado,
}: DonationFormProps) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const effectiveArrecadado = arrecadado ?? ARRECADADO;
  const effectivePCT = ((effectiveArrecadado / META) * 100).toFixed(2);

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
        4 filhos, 1 pai com a perna machucada e a geladeira vazia. O Sr. Francivaldo não sabe como vai jantar hoje.
      </h2>

      {/* Valor + progresso */}
      <div style={{marginBottom: "0.5rem"}}>
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
        marginBottom: "4px",
      }}>
        <div style={{
          width: `${effectivePCT}%`,
          height: "100%",
          background: "linear-gradient(90deg, #1aad56, #24CA68)",
          borderRadius: "999px",
          transition: "width 900ms ease",
        }} />
      </div>
      <p style={{fontSize: "0.8rem", color: "#6b7280", marginBottom: "1rem", fontWeight: 500}}>
        {effectivePCT}% do objetivo alcançado
      </p>

      {/* Label */}
      <p style={{
        fontSize: "0.8rem",
        fontWeight: 600,
        color: "#374151",
        marginBottom: "0.5rem",
      }}>
        Escolha o valor da sua contribuição:
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
              <span>{formatBRL(v)}</span>
            </button>
          );
        })}
      </div>

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
      {loading ? (
        <div style={{display:"flex", alignItems:"center", justifyContent:"center", gap:"8px", padding:"4px 0"}}>
          <span style={{
            width: 15, height: 15,
            border: "2.5px solid rgba(36,202,104,0.25)",
            borderTopColor: "#24CA68",
            borderRadius: "50%",
            display: "inline-block",
            animation: "pixSpin 0.8s linear infinite",
            flexShrink: 0,
          }} />
          <span style={{color:"#24CA68", fontWeight:700, fontSize:"0.85rem"}}>
            Gerando seu PIX...
          </span>
        </div>
      ) : (
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
      )}
    </div>
  );
}
