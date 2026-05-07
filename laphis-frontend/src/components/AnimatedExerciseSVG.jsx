/**
 * AnimatedExerciseSVG — visual animado por exercicio (sem figuras humanas reais).
 *
 * Cada exercicio recebe uma animacao stickman dedicada (ver StickmanAnimations.jsx).
 * Se o nome nao bater certo, cai para fallback por categoria, e em ultimo caso
 * para uma animacao default. O fundo usa o gradiente da categoria.
 */
import { resolveStickmanAnimation } from "./StickmanAnimations";

const CATEGORY_VISUAL = {
  peito:    { from: "#7f1d1d", to: "#dc2626", accent: "#fecaca", label: "Peito" },
  costas:   { from: "#1e3a8a", to: "#3b82f6", accent: "#bfdbfe", label: "Costas" },
  pernas:   { from: "#14532d", to: "#22c55e", accent: "#bbf7d0", label: "Pernas" },
  ombros:   { from: "#581c87", to: "#a855f7", accent: "#e9d5ff", label: "Ombros" },
  biceps:   { from: "#9a3412", to: "#f97316", accent: "#fed7aa", label: "Biceps" },
  triceps:  { from: "#831843", to: "#ec4899", accent: "#fbcfe8", label: "Triceps" },
  abdomen:  { from: "#854d0e", to: "#eab308", accent: "#fde68a", label: "Abdomen" },
  cardio:   { from: "#155e75", to: "#06b6d4", accent: "#a5f3fc", label: "Cardio" },
  full_body:{ from: "#3730a3", to: "#6366f1", accent: "#c7d2fe", label: "Full Body" },
  default:  { from: "#1f2937", to: "#4b5563", accent: "#d1d5db", label: "Exercicio" },
};

function pickVisual(category) {
  return CATEGORY_VISUAL[category] || CATEGORY_VISUAL.default;
}

/**
 * @param {string} category - categoria do exercicio (peito, costas, ...)
 * @param {string} name - nome do exercicio (PT ou EN)
 * @param {boolean} compact - modo compacto (sem etiquetas/sombra)
 * @param {object} style - estilos extra do wrapper
 */
export default function AnimatedExerciseSVG({
  category,
  name,
  compact = false,
  style = {},
}) {
  const visual = pickVisual(category);
  const Anim = resolveStickmanAnimation(name, category);

  const wrapperStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: `linear-gradient(135deg, ${visual.from} 0%, ${visual.to} 100%)`,
    ...style,
  };

  return (
    <div style={wrapperStyle} aria-label={`${visual.label} - ${name || "exercicio"}`}>
      {/* Glow radial subtil no canto superior direito */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(120% 100% at 100% 0%, rgba(255,255,255,0.18) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />

      {/* SVG com a animacao stickman do exercicio */}
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <Anim accent={visual.accent} />
      </svg>

      {/* Etiqueta de categoria + nome em modo expandido */}
      {!compact && name && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "55%",
              background:
                "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: visual.accent,
              background: "rgba(0,0,0,0.35)",
              padding: "4px 8px",
              borderRadius: 999,
              backdropFilter: "blur(4px)",
            }}
          >
            {visual.label}
          </span>
          <div
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 12,
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              textShadow: "0 1px 4px rgba(0,0,0,0.45)",
              lineHeight: 1.2,
            }}
          >
            {name}
          </div>
        </>
      )}
    </div>
  );
}
