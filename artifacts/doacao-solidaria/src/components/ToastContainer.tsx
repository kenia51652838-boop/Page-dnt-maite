import { ToastItem } from "@/pages/Home";

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const ICONS: Record<string, string> = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
};

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="toast-container" role="region" aria-label="Notificações">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`toast toast--${t.type} ${t.leaving ? "toast--leaving" : ""}`}
          role="alert"
          aria-live="polite"
        >
          <span style={{fontSize:"1.2rem",lineHeight:1}}>{ICONS[t.type] ?? "ℹ️"}</span>
          <div>
            {t.title && <div className="toast__title">{t.title}</div>}
            <p className="toast__message">{t.message}</p>
          </div>
          <button
            type="button"
            className="toast__close"
            onClick={() => onDismiss(t.id)}
            aria-label="Fechar notificação"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
