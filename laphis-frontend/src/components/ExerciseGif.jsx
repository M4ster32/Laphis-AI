import { useState, useEffect } from "react";
import { findExerciseImageBase } from "../utils/exerciseImages";
import AnimatedExerciseSVG from "./AnimatedExerciseSVG";

export default function ExerciseGif({ name, category, compact = false, style = {} }) {
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
      <AnimatedExerciseSVG
        category={category}
        name={name}
        compact={compact}
        style={{ width: "100%", height: "100%", ...style }}
      />
    );
  }

  const src = frame === 0 || !hasFrame1 ? `${base}/0.jpg` : `${base}/1.jpg`;

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}>
      <img
        key={src}
        src={src}
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (frame === 1) setHasFrame1(false);
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.15s ease",
        }}
      />
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
        }} />
      )}
    </div>
  );
}
