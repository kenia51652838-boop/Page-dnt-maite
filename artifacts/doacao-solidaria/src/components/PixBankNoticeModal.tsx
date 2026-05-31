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
        maxWidth: "320px",
        padding: "2.25rem 1.75rem 1.75rem",
        borderRadius: "1.5rem",
        position: "relative",
        textAlign: "center",
        boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 4px 16px rgba(0,0,0,0.08)",
      }}>

        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "999px",
          background: "linear-gradient(135deg, #bbf7d0 0%, #dcfce7 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 1.25rem",
          boxShadow: "0 0 0 10px rgba(34,197,94,0.08)",
          animation: "pix-pop-in 0.35s cubic-bezier(0.22,1.28,0.36,1) both",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#16a34a" />
            <path d="M7.5 12.5l3 3 6-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3 style={{
          fontWeight: 800,
          fontSize: "1.15rem",
          color: "#0f172a",
          margin: "0 0 0.4rem",
          letterSpacing: "-0.01em",
        }}>
          PIX copiado!
        </h3>
        <p style={{
          fontSize: "0.875rem",
          color: "#6b7280",
          margin: "0 0 1.75rem",
          lineHeight: 1.6,
        }}>
          Agora cole o código no seu banco e finalize o pagamento.
        </p>

        <button
          type="button"
          className="pix-bank-notice-modal__btn"
          onClick={onClose}
          style={{
            width: "100%",
            borderRadius: "0.875rem",
            padding: "0.85rem",
            fontWeight: 700,
            fontSize: "0.95rem",
          }}
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
