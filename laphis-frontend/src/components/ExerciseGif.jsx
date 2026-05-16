import { useState, useEffect } from "react";
import { findExerciseImageBase } from "../utils/exerciseImages";
import MuscleHighlighter from "./MuscleHighlighter";

/**
 * ExerciseGif — animação 2 frames com fotos do free-exercise-db.
 * Fallback: MuscleHighlighter quando não há match.
 */
export default function ExerciseGif({ name, category, musclePrimary, muscleSecondary, style = {} }) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [hasFrame1, setHasFrame1] = useState(true);

  const base = findExerciseImageBase(name);

  useEffect(() => {
    setFrame(0);
    setLoaded(false);
    setHasFrame1(true);
  }, [name]);

  useEffect(() => {
    if (!base || !hasFrame1) return;
    const interval = setInterval(() => setFrame((f) => 1 - f), 900);
    return () => clearInterval(interval);
  }, [base, hasFrame1]);

  if (!base) {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
        ...style,
      }}>
        <MuscleHighlighter
          musclePrimary={musclePrimary}
          muscleSecondary={muscleSecondary}
          category={category}
          size={140}
        />
      </div>
    );
  }

  const src = frame === 0 || !hasFrame1 ? `${base}/0.jpg` : `${base}/1.jpg`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#1a1a2e", ...style }}>
      <img
        key={src}
        src={src}
        alt={name || ""}
        onLoad={() => setLoaded(true)}
        onError={() => { if (frame === 1) setHasFrame1(false); }}
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center top",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      />
    </div>
  );
}
