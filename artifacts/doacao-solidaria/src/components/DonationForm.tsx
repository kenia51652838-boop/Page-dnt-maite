import { ARRECADADO, META, PCT } from "@/pages/Home";

interface DonationFormProps {
  selectedValue: number | null;
  onValueClick: (v: number) => void;
  donationValues: number[];
  formatBRL: (v: number) => string;
  loading: boolean;
}

const MAIS_ESCOLHIDO = 75;

export default function DonationForm({
  selectedValue,
  onValueClick,
  donationValues,
  formatBRL,
  loading,
}: DonationFormProps) {
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
        Esse pai guerreiro de 46 anos deixa de se alimentar para não ver os filhos passarem fome
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
          {formatBRL(ARRECADADO)}
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
          width: `${PCT}%`,
          height: "100%",
          background: "linear-gradient(90deg, #1aad56, #24CA68)",
          borderRadius: "999px",
          transition: "width 900ms ease",
        }} />
      </div>
      <p style={{fontSize: "0.8rem", color: "#6b7280", marginBottom: "1rem", fontWeight: 500}}>
        {PCT}% do objetivo alcançado
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
      <div className="valor-btns-grid" style={{marginBottom: "0.875rem"}}>
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
