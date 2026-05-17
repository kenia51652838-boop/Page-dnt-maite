import { ReactNode, useEffect, useRef, useState } from "react";

interface DoacaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export default function DoacaoModal({ isOpen, onClose, children }: DoacaoModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showFade, setShowFade] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const timeout = setTimeout(() => {
      if (!scrollRef.current) return;
      const { scrollHeight, clientHeight } = scrollRef.current;
      setShowFade(scrollHeight > clientHeight + 10);
    }, 50);
    return () => clearTimeout(timeout);
  }, [isOpen]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setShowFade(scrollTop + clientHeight < scrollHeight - 10);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`doacao-modal ${isOpen ? "is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-label="Formulário de doação"
    >
      <div className="doacao-modal__backdrop" onClick={onClose} />
      <div className="doacao-modal__panel">
        <button
          type="button"
          style={{
            position: "absolute",
            top: "0.9rem",
            right: "0.9rem",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "999px",
            width: "28px",
            height: "28px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "0.85rem",
            color: "#64748b",
            zIndex: 2,
            flexShrink: 0,
          }}
          onClick={onClose}
          aria-label="Fechar"
        >
          ✕
        </button>

        <div
          ref={scrollRef}
          className="doacao-modal__scroll"
          onScroll={handleScroll}
        >
          {children}
        </div>

        {showFade && (
          <div className="doacao-modal__fade">
            <span className="doacao-modal__fade-hint">↓ role para ver mais</span>
          </div>
        )}
      </div>
    </div>
  );
}
