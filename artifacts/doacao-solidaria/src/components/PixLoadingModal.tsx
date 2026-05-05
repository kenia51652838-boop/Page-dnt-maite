interface PixLoadingModalProps {
  isOpen: boolean;
}

export default function PixLoadingModal({ isOpen }: PixLoadingModalProps) {
  if (!isOpen) return null;
  return (
    <div className={`pix-loading-modal ${isOpen ? "is-open" : ""}`} role="dialog" aria-modal="true" aria-hidden={!isOpen}>
      <div className="pix-loading-modal__backdrop" />
      <div className="pix-loading-modal__panel" aria-live="polite">
        <h2 className="pix-loading-modal__title">Gerando PIX...</h2>
        <div className="pix-loading-spinner" aria-hidden="true" />
        <p className="pix-loading-modal__subtitle">Aguarde alguns segundos.</p>
      </div>
    </div>
  );
}
