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
    backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    display: "flex", alignItems: "flex-end", justifyContent: "center",
    animation: "fadeIn 0.15s ease",
  },
  modal: {
    background: "var(--bg-surface)", borderRadius: "20px 20px 0 0",
    width: "100%", maxWidth: 500,
    maxHeight: "92dvh",
    display: "flex", flexDirection: "column",
    animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
    boxShadow: "0 -8px 32px rgba(0, 0, 0, 0.18)",
    border: "none",
    position: "relative",
    overflow: "hidden",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 18px 10px", borderBottom: "1px solid var(--border-light)",
    flexShrink: 0,
  },
  title: {
    fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0,
    letterSpacing: "-0.02em",
  },
  closeBtn: {
    width: 30, height: 30, borderRadius: "50%", background: "var(--hover-overlay)",
    border: "none", fontSize: 15, color: "var(--text-muted)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s", flexShrink: 0,
  },
  body: {
    padding: "8px 16px", flex: 1, overflowY: "auto",
    WebkitOverflowScrolling: "touch",
    minHeight: 0,
    overscrollBehavior: "contain",
  },
  footer: {
    display: "flex", gap: 8, justifyContent: "flex-end",
    padding: "12px 18px",
    paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))",
    borderTop: "1px solid var(--border-light)",
    background: "var(--bg-surface)",
    flexShrink: 0,
  },
  cancelBtn: {
    background: "none", border: "none",
    color: "var(--text-muted)", fontWeight: 600,
    borderRadius: 8, padding: "8px 16px", fontSize: 13,
    cursor: "pointer", transition: "all 0.15s",
  },
};
