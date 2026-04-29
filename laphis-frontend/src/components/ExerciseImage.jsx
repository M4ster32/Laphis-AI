import { useState, useEffect } from "react";
import {
  Dumbbell,
  Heart,
  Footprints,
  Activity,
  Flame,
  Zap,
  Target,
} from "lucide-react";
import ExerciseDBAPI from "../services/ExerciseDBAPI";

const CATEGORY_VISUAL = {
  peito:    { from: "#7f1d1d", to: "#dc2626", accent: "#fecaca", Icon: Dumbbell,   label: "Peito" },
  costas:   { from: "#1e3a8a", to: "#3b82f6", accent: "#bfdbfe", Icon: Activity,   label: "Costas" },
  pernas:   { from: "#14532d", to: "#22c55e", accent: "#bbf7d0", Icon: Footprints, label: "Pernas" },
  ombros:   { from: "#581c87", to: "#a855f7", accent: "#e9d5ff", Icon: Target,     label: "Ombros" },
  biceps:   { from: "#9a3412", to: "#f97316", accent: "#fed7aa", Icon: Dumbbell,   label: "Bíceps" },
  triceps:  { from: "#831843", to: "#ec4899", accent: "#fbcfe8", Icon: Dumbbell,   label: "Tríceps" },
  abdomen:  { from: "#854d0e", to: "#eab308", accent: "#fde68a", Icon: Flame,      label: "Abdómen" },
  cardio:   { from: "#155e75", to: "#06b6d4", accent: "#a5f3fc", Icon: Heart,      label: "Cardio" },
  full_body:{ from: "#3730a3", to: "#6366f1", accent: "#c7d2fe", Icon: Zap,        label: "Full Body" },
  default:  { from: "#1f2937", to: "#4b5563", accent: "#d1d5db", Icon: Dumbbell,   label: "Exercício" },
};

function pickVisual(category) {
  return CATEGORY_VISUAL[category] || CATEGORY_VISUAL.default;
}

export default function ExerciseImage({
  src,
  alt,
  category,
  name,
  style = {},
  compact = false,
}) {
  const [failed, setFailed] = useState(false);
  const [gifUrl, setGifUrl] = useState(src || null);
  const [loading, setLoading] = useState(!!name && !src);

  const visual = pickVisual(category);
  const showFallback = !gifUrl || failed;

  // Fetch GIF do RapidAPI ExerciseDB quando o nome do exercício muda
  useEffect(() => {
    if (!name) {
      setGifUrl(src || null);
      return;
    }

    setLoading(true);
    (async () => {
      try {
        const result = await ExerciseDBAPI.searchGifByName(name);
        if (result.gifUrl) {
          setGifUrl(result.gifUrl);
          setFailed(false);
        } else {
          // Se não encontrar, usar a src padrão ou fallback
          setGifUrl(src || null);
        }
      } catch (err) {
        console.warn("Erro ao buscar GIF do ExerciseDB:", err);
        setGifUrl(src || null);
      } finally {
        setLoading(false);
      }
    })();
  }, [name, src]);

  const wrapperStyle = {
    position: "relative",
    width: "100%",
    height: "100%",
    overflow: "hidden",
    background: `linear-gradient(135deg, ${visual.from} 0%, ${visual.to} 100%)`,
    ...style,
  };

  if (showFallback) {
    return <FallbackVisual visual={visual} name={name} compact={compact} style={wrapperStyle} />;
  }

  return (
    <div style={wrapperStyle}>
      {gifUrl ? (
        <img
          src={gifUrl}
          alt={alt || name || "Exercício"}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
          }}
        >
          A carregar GIF...
        </div>
      )}
    </div>
  );
}

function FallbackVisual({ visual, name, compact, style }) {
  const { Icon, accent, label } = visual;
  const iconSize = compact ? 28 : 64;

  return (
    <div style={style} aria-label={`${label} — ${name || "exercício"}`}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(120% 100% at 100% 0%, rgba(255,255,255,0.18) 0%, transparent 55%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: compact ? 0.85 : 0.55,
        }}
      >
        <Icon size={iconSize} color={accent} strokeWidth={1.5} />
      </div>

      {!compact && name && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0, right: 0, bottom: 0, height: "55%",
              background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)",
              pointerEvents: "none",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: 12, left: 12,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: accent,
              background: "rgba(0,0,0,0.35)",
              padding: "4px 8px",
              borderRadius: 999,
              backdropFilter: "blur(4px)",
            }}
          >
            {label}
          </span>
          <div
            style={{
              position: "absolute",
              left: 14, right: 14, bottom: 12,
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
