interface PixLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PixLimitModal({ isOpen, onClose }: PixLimitModalProps) {
  if (!isOpen) return null;
  return (
    <div className="pix-limit-modal is-open" role="dialog" aria-modal="true">
      <div className="pix-limit-modal__backdrop" onClick={onClose} />
      <div className="pix-limit-modal__panel">
        <div className="pix-limit-modal__icon">
          <span style={{fontSize:"1.5rem",fontWeight:900,color:"#ea6c00",lineHeight:1}}>!</span>
        </div>
        <h3 className="pix-limit-modal__title">Limite de PIX atingido</h3>
        <p className="pix-limit-modal__text">
          Você atingiu o limite de <strong>1 PIX</strong> ativo. Conclua o pagamento atual ou aguarde o tempo expirar para poder gerar outro código.
        </p>
        <button type="button" className="pix-limit-modal__btn" onClick={onClose}>
          Entendi
        </button>
      </div>
    </div>
  );
}
