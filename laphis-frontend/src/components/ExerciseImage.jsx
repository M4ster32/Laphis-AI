/**
 * ExerciseImage — visual de um exercicio.
 *
 * O LAPHIS deixou de usar GIFs externos com pessoas (RapidAPI ExerciseDB).
 * Hoje renderiza sempre uma animacao SVG stickman dedicada ao exercicio,
 * com fallback inteligente por categoria quando o nome nao bate certo.
 *
 * Mantemos a assinatura ({ src, alt, category, name, style, compact })
 * por compatibilidade com chamadas existentes (`src` e `alt` sao ignorados).
 */
import AnimatedExerciseSVG from "./AnimatedExerciseSVG";

export default function ExerciseImage({
  category,
  name,
  style = {},
  compact = false,
}) {
  return (
    <AnimatedExerciseSVG
      category={category}
      name={name}
      compact={compact}
      style={style}
    />
  );
}
