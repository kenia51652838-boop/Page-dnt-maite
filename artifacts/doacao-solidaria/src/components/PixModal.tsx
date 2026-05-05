import { useState } from "react";

interface PixModalProps {
  isOpen: boolean;
  pixCode: string;
  amount: string;
  countdownText: string;
  expiresAt?: number;
  createdAt?: number;
  expired: boolean;
  confirmed: boolean;
  onClose: () => void;
  onCopy: () => void;
  copiedMsg: { text: string; err: boolean } | null;
  onConfirmedClose: () => void;
  onVerify?: () => Promise<"pending" | undefined>;
}

const PIX_RING_C = 2 * Math.PI * 44;
const TOTAL_SEC = 5 * 60;

function parseCountdown(text: string) {
  const [m = "5", s = "0"] = text.split(":");
  return parseInt(m) * 60 + parseInt(s);
}

export default function PixModal({
  isOpen,
  pixCode,
  amount,
  countdownText,
  confirmed,
  expired,
  onClose,
  onCopy,
  copiedMsg,
  onConfirmedClose,
  onVerify,
}: PixModalProps) {
  const [verifying, setVerifying] = useState(false);
  const [verifyMsg, setVerifyMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const remSec = parseCountdown(countdownText);
  const pct = Math.max(0, Math.min(1, remSec / TOTAL_SEC));
  const offset = PIX_RING_C * (1 - pct);

  async function handleVerify() {
    if (!onVerify || verifying) return;
    setVerifying(true);
    setVerifyMsg(null);
    try {
      const result = await onVerify();
      if (result === "pending") {
        setVerifyMsg("Ainda não identificamos seu pagamento. Aguarde alguns instantes e tente novamente.");
      }
    } catch {
      setVerifyMsg("Erro ao verificar. Tente novamente.");
    } finally {
      setVerifying(false);
    }
  }

  if (expired) {
    return (
      <div className="pix-modal is-open" role="dialog" aria-modal="true">
        <div className="pix-modal__backdrop" onClick={onClose} />
        <div className="pix-modal__panel">
          <button className="pix-modal__close" onClick={onClose} aria-label="Fechar">✕</button>
          <h2 className="pix-panel__title">PIX expirado</h2>
          <p className="pix-panel__lead">
            Sua doação de <strong style={{color:"#24CA68"}}>{amount}</strong> será confirmada após a{" "}
            <strong style={{color:"#24CA68"}}>transferência PIX</strong>
          </p>
          <div className="pix-expired-box">
            Este código PIX expirou. Feche esta janela e escolha o valor novamente para gerar um novo código. Se você já pagou, a confirmação pode aparecer em alguns instantes.
          </div>
          {onVerify && (
            <button
              type="button"
              onClick={handleVerify}
              disabled={verifying}
              style={{
                marginTop:"1rem",width:"100%",padding:"0.75rem",
                background: verifying ? "#9ca3af" : "#24CA68",
                color:"#fff",border:"none",borderRadius:"10px",
                fontWeight:700,fontSize:"0.95rem",cursor: verifying ? "not-allowed" : "pointer",
                transition:"background 0.2s"
              }}
            >
              {verifying ? "Verificando..." : "Já paguei — verificar"}
            </button>
          )}
          {verifyMsg && (
            <div style={{marginTop:"0.75rem",padding:"0.65rem 1rem",background:"#fef9c3",borderRadius:"8px",fontSize:"0.82rem",color:"#92400e",textAlign:"center"}}>
              {verifyMsg}
            </div>
          )}
          <div className="pix-doacao-protegida" style={{marginTop:"1.5rem"}}>
            <img src={`${import.meta.env.BASE_URL}img/doacao-protegida.png`} alt="Doação Protegida" style={{height:"44px",width:"auto"}} />
          </div>
        </div>
      </div>
    );
  }

  void confirmed; void onConfirmedClose;

  return (
    <div className="pix-modal is-open" role="dialog" aria-modal="true">
      <div className="pix-modal__backdrop" onClick={onClose} />
      <div className="pix-modal__panel">
        <button className="pix-modal__close" onClick={onClose} aria-label="Fechar modal PIX">✕</button>

        <h2 className="pix-panel__title">Quase lá!</h2>
        <p className="pix-panel__lead">
          Sua doação de <strong style={{color:"#24CA68"}}>{amount}</strong> será confirmada após a{" "}
          <strong style={{color:"#24CA68"}}>transferência PIX</strong>
        </p>

        <div className="pix-expiry-wrap">
          <svg width="52" height="52" viewBox="0 0 100 100" aria-hidden="true" style={{transform:"rotate(-90deg)",flexShrink:0}}>
            <circle cx="50" cy="50" r="44" fill="none" stroke="#d1fae5" strokeWidth="9"/>
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke="#24CA68"
              strokeWidth="9"
              strokeLinecap="round"
              strokeDasharray={String(PIX_RING_C)}
              strokeDashoffset={String(offset)}
              style={{transition:"stroke-dashoffset 0.25s linear"}}
            />
          </svg>
          <div style={{display:"flex",flexDirection:"column",gap:"1px"}}>
            <span style={{fontSize:"0.65rem",fontWeight:700,color:"#64748b",letterSpacing:"0.08em",textTransform:"uppercase"}}>VÁLIDO POR</span>
            <span style={{fontSize:"1.6rem",fontWeight:800,color:"#0f172a",letterSpacing:"-0.03em",lineHeight:1.1}}>
              {countdownText}
            </span>
          </div>
        </div>

        <p style={{fontSize:"0.82rem",fontWeight:600,color:"#374151",margin:"0 0 0.5rem"}}>
          1. Copie o código abaixo:
        </p>

        <div className="pix-panel__code-wrap">
          <input
            type="text"
            readOnly
            className="pix-code-input"
            value={pixCode || ""}
            aria-label="Código PIX"
            onClick={e => (e.target as HTMLInputElement).select()}
            style={{userSelect:"text"}}
          />
        </div>

        <button
          type="button"
          className="pix-panel__btn-copy"
          onClick={onCopy}
          aria-label="Copiar código PIX"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1z"/>
            <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0z"/>
          </svg>
          COPIAR CÓDIGO
        </button>

        {copiedMsg && (
          <div className={`pix-inline-feedback ${copiedMsg.err ? "pix-inline-feedback--err" : "pix-inline-feedback--ok"}`}>
            {copiedMsg.text}
          </div>
        )}

        <ol className="pix-panel__steps">
          <li>
            <span className="pix-panel__step-ico">
              <img src="https://img.icons8.com/color/28/bank-building.png" width="22" height="22" alt="" />
            </span>
            <span>Abra o aplicativo ou site do seu banco;</span>
          </li>
          <li>
            <span className="pix-panel__step-ico">
              <img src="https://img.icons8.com/color/28/pix.png" width="22" height="22" alt="" />
            </span>
            <span>Entre na área PIX e escolha a opção <strong>PIX Copia e Cola</strong>;</span>
          </li>
          <li>
            <span className="pix-panel__step-ico">
              <span style={{fontSize:"1.1rem"}}>✅</span>
            </span>
            <span>Após finalizar, o nosso sistema identifica o pagamento automaticamente;</span>
          </li>
        </ol>

        <div className="pix-status-msg">
          <span className="pix-status-msg__spinner" aria-hidden="true" />
          <span style={{color:"#24CA68",fontWeight:600,fontSize:"0.82rem"}}>Aguardando confirmação do pagamento...</span>
        </div>

        {onVerify && (
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            style={{
              marginTop:"0.75rem",width:"100%",padding:"0.7rem",
              background: verifying ? "#9ca3af" : "transparent",
              color: verifying ? "#fff" : "#374151",
              border:"1.5px solid #d1d5db",borderRadius:"10px",
              fontWeight:600,fontSize:"0.85rem",cursor: verifying ? "not-allowed" : "pointer",
              transition:"all 0.2s"
            }}
          >
            {verifying ? "Verificando..." : "Já paguei — verificar agora"}
          </button>
        )}

        {verifyMsg && (
          <div style={{marginTop:"0.5rem",padding:"0.65rem 1rem",background:"#fef9c3",borderRadius:"8px",fontSize:"0.82rem",color:"#92400e",textAlign:"center"}}>
            {verifyMsg}
          </div>
        )}

        <div className="pix-doacao-protegida">
          <img src={`${import.meta.env.BASE_URL}img/doacao-protegida.png`} alt="Doação Protegida" style={{height:"44px",width:"auto"}} />
        </div>
      </div>
    </div>
  );
}
