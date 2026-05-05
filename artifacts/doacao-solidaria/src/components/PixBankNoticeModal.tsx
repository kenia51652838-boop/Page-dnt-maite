interface PixBankNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PixBankNoticeModal({ isOpen, onClose }: PixBankNoticeModalProps) {
  if (!isOpen) return null;
  return (
    <div className={`pix-bank-notice-modal ${isOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!isOpen}>
      <div className="pix-modal__backdrop" onClick={onClose} />
      <div className="pix-bank-notice-modal__panel" style={{
        maxWidth:"340px",
        padding:"2rem 1.75rem 1.5rem",
        borderRadius:"1.25rem",
        position:"relative",
      }}>
        <button
          style={{
            position:"absolute",top:"1rem",right:"1rem",
            background:"#f1f5f9",border:"none",borderRadius:"999px",
            width:"28px",height:"28px",fontSize:"0.8rem",
            cursor:"pointer",color:"#94a3b8",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}
          onClick={onClose}
          aria-label="Fechar"
        >✕</button>

        {/* Ícone */}
        <div style={{
          width:"52px",height:"52px",borderRadius:"999px",
          background:"#dcfce7",
          display:"flex",alignItems:"center",justifyContent:"center",
          margin:"0 auto 1.25rem",
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2"/>
          </svg>
        </div>

        {/* Texto */}
        <h3 style={{
          textAlign:"center",fontWeight:700,fontSize:"1.05rem",
          color:"#111827",margin:"0 0 0.4rem",
        }}>
          Código PIX copiado
        </h3>
        <p style={{
          textAlign:"center",fontSize:"0.82rem",color:"#6b7280",
          margin:"0 0 1.5rem",lineHeight:1.6,
        }}>
          Cole no seu banco e finalize o pagamento
        </p>

        {/* Divider */}
        <div style={{borderTop:"1px solid #f1f5f9",margin:"0 0 1.25rem"}} />

        {/* Provedor */}
        <div style={{
          display:"flex",alignItems:"center",justifyContent:"space-between",
          marginBottom:"1.5rem",
        }}>
          <span style={{fontSize:"0.75rem",color:"#9ca3af",fontWeight:500}}>
            Processado por
          </span>
          <span style={{
            fontSize:"0.82rem",fontWeight:700,color:"#15803d",
            display:"flex",alignItems:"center",gap:"0.35rem",
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" stroke="#16a34a" strokeWidth="2"/>
            </svg>
            Instituto Doação do Bem
          </span>
        </div>

        <button type="button" className="pix-bank-notice-modal__btn" onClick={onClose}
          style={{width:"100%",borderRadius:"0.75rem",padding:"0.8rem",fontWeight:600,fontSize:"0.9rem"}}>
          Entendido
        </button>
      </div>
    </div>
  );
}
