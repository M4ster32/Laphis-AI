import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

// ============ TOAST CONTEXT ============
const ToastContext = createContext();

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}

const ICONS = {
  success: <CheckCircle size={20} strokeWidth={1.5} />,
  error: <AlertCircle size={20} strokeWidth={1.5} />,
  warning: <AlertTriangle size={20} strokeWidth={1.5} />,
  info: <Info size={20} strokeWidth={1.5} />,
};

const COLORS = {
  success: { bg: "rgba(34, 197, 94, 0.12)", border: "rgba(34, 197, 94, 0.25)", text: "var(--toast-success)" },
  error: { bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.25)", text: "var(--toast-error)" },
  warning: { bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.25)", text: "var(--toast-warning)" },
  info: { bg: "rgba(59, 130, 246, 0.12)", border: "rgba(59, 130, 246, 0.25)", text: "var(--toast-info)" },
};

// ============ SINGLE TOAST ============
function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false);
  const colors = COLORS[toast.type] || COLORS.info;

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3500);
    return () => clearTimeout(timer);
  }, [toast, onRemove]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      style={{
        ...s.toast,
        background: colors.bg,
        borderColor: colors.border,
        animation: exiting ? "toastOut 0.3s ease forwards" : "toastIn 0.35s ease",
      }}
      role="alert"
    >
      <div style={{ display: "flex", alignItems: "center", color: colors.text }}>
        {ICONS[toast.type] || <Info size={20} strokeWidth={1.5} />}
      </div>
      <div style={s.content}>
        {toast.title && <strong style={{ ...s.title, color: colors.text }}>{toast.title}</strong>}
        <span style={s.message}>{toast.message}</span>
      </div>
      <button style={s.closeBtn} onClick={handleClose} aria-label="Fechar"><X size={16} strokeWidth={1.5} /></button>
    </div>
  );
}

// ============ TOAST PROVIDER ============
// ============ STYLES ============
const s = {
  container: {
    position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)",
    zIndex: 9999, display: "flex", flexDirection: "column", gap: 8,
    width: "calc(100% - 32px)", maxWidth: 420, pointerEvents: "none",
  },
  toast: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", borderRadius: 14,
    border: "1px solid", backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
    pointerEvents: "auto",
  },
  icon: { fontSize: 18, flexShrink: 0 },
  content: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  title: { fontSize: 13, fontWeight: 700, lineHeight: 1.3 },
  message: { fontSize: 13, fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1.4 },
  closeBtn: {
    background: "none", border: "none", color: "var(--text-muted)",
    fontSize: 18, cursor: "pointer", padding: 4, flexShrink: 0,
    lineHeight: 1, borderRadius: 6,
  },
};

// ============ TOAST PROVIDER ============
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", options = {}) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-4), { id, message, type, ...options }]);
    return id;
  }, []);

  const toast = useCallback({
    success: (msg, opts) => addToast(msg, "success", opts),
    error: (msg, opts) => addToast(msg, "error", opts),
    warning: (msg, opts) => addToast(msg, "warning", opts),
    info: (msg, opts) => addToast(msg, "info", opts),
  }, [addToast]);

  // Make it a callable with .success/.error etc.
  const toastFn = Object.assign(
    (msg, type, opts) => addToast(msg, type, opts),
    {
      success: (msg, opts) => addToast(msg, "success", opts),
      error: (msg, opts) => addToast(msg, "error", opts),
      warning: (msg, opts) => addToast(msg, "warning", opts),
      info: (msg, opts) => addToast(msg, "info", opts),
    }
  );

  return (
    <ToastContext.Provider value={toastFn}>
      {children}

      {/* Toast Container */}
      {toasts.length > 0 && (
        <div style={s.container} aria-live="polite">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onRemove={removeToast} />
          ))}
        </div>
      )}

      {/* Inject keyframes */}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(-16px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-12px) scale(0.95); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
