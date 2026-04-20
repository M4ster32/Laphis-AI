import { useState } from "react";
import Modal from "./Modal";
import { Dumbbell, UtensilsCrossed, Zap } from "lucide-react";

/* Plan type definitions — single source of truth */
const PLAN_TYPES = [
  { value: "training", label: "Treino", Icon: Dumbbell, color: "var(--primary)", bg: "var(--primary-bg)" },
  { value: "nutrition", label: "Nutrição", Icon: UtensilsCrossed, color: "var(--p2)", bg: "var(--cta-bg)" },
  { value: "combined", label: "Combinado", Icon: Zap, color: "var(--p3)", bg: "var(--primary-bg)" },
];

/* Quick prompt chips to reduce friction */
const QUICK_PROMPTS = [
  "Plano semanal de treino",
  "Nutrição para emagrecer",
  "Treino corpo inteiro",
  "Treino em casa",
];

/**
 * Shared modal for generating AI plans.
 * Eliminates duplication between Dashboard and Plans pages.
 *
 * @param {Object}   props
 * @param {boolean}  props.isOpen       - Controls modal visibility.
 * @param {Function} props.onClose      - Called when modal is dismissed.
 * @param {Function} props.onGenerate   - Callback: (type, prompt, categoryId) => Promise.
 * @param {boolean}  props.generating   - Whether the generation request is in flight.
 * @param {string|null} props.error     - Error message to display.
 * @param {Array}    [props.categories] - Optional category list for tagging the plan.
 */
export default function GeneratePlanModal({
  isOpen,
  onClose,
  onGenerate,
  generating = false,
  error = null,
  categories = [],
}) {
  const [genType, setGenType] = useState("combined");
  const [prompt, setPrompt] = useState("");
  const [genCategory, setGenCategory] = useState(null);

  const handleConfirm = () => {
    if (!prompt.trim()) return;
    onGenerate(genType, prompt.trim(), genCategory);
  };

  const handleClose = () => {
    setPrompt("");
    setGenCategory(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Gerar Novo Plano"
      confirmText="Gerar com AI"
      onConfirm={handleConfirm}
      loading={generating}
    >
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 10 }}>
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Plan type selector */}
      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Tipo de plano</label>
        <div style={s.typeGrid}>
          {PLAN_TYPES.map((t) => {
            const isActive = genType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setGenType(t.value)}
                style={{
                  ...s.typeBtn,
                  borderColor: isActive ? t.color : "var(--border)",
                  background: isActive ? t.bg : "var(--card-bg)",
                }}
              >
                <t.Icon
                  size={20}
                  color={isActive ? t.color : "var(--text-muted)"}
                  strokeWidth={1.5}
                />
                <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? t.color : "var(--text-secondary)" }}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Free-form prompt */}
      <div style={{ marginBottom: 12 }}>
        <label className="form-label">Descreve o que queres</label>
        <textarea
          className="form-input"
          placeholder="Ex: Plano semanal de treino para ganhar massa, 4 dias"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          style={{ resize: "none" }}
          disabled={generating}
        />
      </div>

      {/* Quick prompt suggestions */}
      <div style={s.quickPrompts}>
        {QUICK_PROMPTS.map((p, i) => (
          <button key={i} style={s.quickPromptBtn} onClick={() => setPrompt(p)} type="button">
            {p}
          </button>
        ))}
      </div>

      {/* Optional category assignment */}
      {categories.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <label className="form-label">Categoria (opcional)</label>
          <div style={s.categoryChips}>
            {categories.map((cat) => {
              const isActive = genCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setGenCategory(isActive ? null : cat.id)}
                  style={{
                    ...s.categoryChip,
                    background: isActive ? "var(--primary)" : "var(--card-bg)",
                    color: isActive ? "white" : "var(--text-secondary)",
                    borderColor: isActive ? "var(--primary)" : "var(--border)",
                  }}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}

const s = {
  typeGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: 10,
  },
  typeBtn: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    padding: "12px 8px",
    borderRadius: "var(--radius-sm)",
    border: "2px solid var(--border)",
    cursor: "pointer",
    transition: "border-color 0.15s, background 0.15s",
    boxShadow: "var(--shadow)",
    background: "var(--card-bg)",
  },
  quickPrompts: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  quickPromptBtn: {
    padding: "7px 12px",
    borderRadius: 20,
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    fontSize: 12,
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontWeight: 500,
    transition: "background 0.15s",
    boxShadow: "var(--shadow)",
  },
  categoryChips: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryChip: {
    padding: "6px 12px",
    borderRadius: 16,
    border: "1px solid var(--border)",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  },
};
