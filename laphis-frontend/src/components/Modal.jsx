import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  onConfirm,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmVariant = "primary",
  showFooter = true,
  loading = false,
}) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  return (
    <div ref={overlayRef} onClick={handleOverlayClick} style={s.overlay}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.header}>
          <h3 style={s.title}>{title}</h3>
          <button style={s.closeBtn} onClick={onClose} aria-label="Fechar"><X size={20} strokeWidth={1.5} /></button>
        </div>

        {/* Body */}
        <div style={s.body}>{children}</div>

        {/* Footer */}
        {showFooter && (
          <div style={s.footer}>
            <button className="btn" style={s.cancelBtn} onClick={onClose} disabled={loading}>
              {cancelText}
            </button>
            {onConfirm && (
              <button
                className={`btn btn-${confirmVariant}`}
                onClick={onConfirm}
                disabled={loading}
                style={{ minWidth: 110 }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> A processar...</>
                ) : (
                  confirmText
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9999,
    background: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(12px) saturate(1.2)", WebkitBackdropFilter: "blur(12px) saturate(1.2)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    animation: "fadeIn 0.15s ease",
    padding: 0,
  },
  modal: {
    background: "var(--bg-surface)", borderRadius: "24px 24px 0 0",
    width: "100%", maxWidth: 500,
    maxHeight: "calc(100dvh - 48px)",
    display: "flex", flexDirection: "column",
    animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.15), 0 -12px 48px rgba(0, 0, 0, 0.25)",
    border: "1px solid var(--border)",
    borderBottom: "none",
    position: "relative",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 20px 14px", borderBottom: "1px solid var(--border-light)",
    flexShrink: 0,
  },
  title: {
    fontSize: 18, fontWeight: 800, color: "var(--text)", margin: 0,
    letterSpacing: "-0.02em",
  },
  closeBtn: {
    width: 34, height: 34, borderRadius: "50%", background: "var(--hover-overlay)",
    border: "1px solid var(--border)", fontSize: 15, color: "var(--text-muted)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s", flexShrink: 0,
  },
  body: {
    padding: "16px 20px", flex: 1, overflowY: "auto",
    WebkitOverflowScrolling: "touch",
  },
  footer: {
    display: "flex", gap: 10, justifyContent: "flex-end",
    padding: "14px 20px",
    paddingBottom: "max(24px, env(safe-area-inset-bottom, 24px))",
    borderTop: "1px solid var(--border-light)",
    background: "var(--bg-surface)",
    flexShrink: 0,
    borderRadius: "0 0 0 0",
  },
  cancelBtn: {
    background: "var(--card-bg)", border: "1px solid var(--border)",
    color: "var(--text-secondary)", fontWeight: 600,
    borderRadius: "var(--radius-sm)", padding: "10px 18px", fontSize: 14,
    cursor: "pointer", transition: "all 0.15s",
  },
};
