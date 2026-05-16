/**
 * ExerciseImage — wrapper para ExerciseGif (animação 2 frames).
 * Mantemos a assinatura por compatibilidade com chamadas existentes.
 */
import ExerciseGif from "./ExerciseGif";

export default function ExerciseImage({
  category,
  name,
  musclePrimary,
  muscleSecondary,
  style = {},
}) {
  return (
    <div style={{ width: "100%", height: "100%", ...style }}>
      <ExerciseGif
        name={name}
        category={category}
        musclePrimary={musclePrimary}
        muscleSecondary={muscleSecondary}
      />
    </div>
  );
}
