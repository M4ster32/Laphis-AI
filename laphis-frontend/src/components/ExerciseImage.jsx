/**
 * ExerciseImage — agora apenas um wrapper para MuscleHighlighter.
 * Mantemos a assinatura por compatibilidade com chamadas existentes.
 */
import MuscleHighlighter from "./MuscleHighlighter";

export default function ExerciseImage({
  category,
  name,
  musclePrimary,
  muscleSecondary,
  style = {},
  compact = false,
}) {
  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
      ...style,
    }}>
      <MuscleHighlighter
        musclePrimary={musclePrimary}
        muscleSecondary={muscleSecondary}
        category={category}
        size={compact ? 56 : 200}
      />
    </div>
  );
}
