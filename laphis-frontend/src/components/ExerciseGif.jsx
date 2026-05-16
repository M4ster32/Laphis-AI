import { useState, useEffect } from "react";
import { findExerciseImageBase } from "../utils/exerciseImages";
import AnimatedExerciseSVG from "./AnimatedExerciseSVG";

export default function ExerciseGif({ name, category, compact = false, gifUrl = null, style = {} }) {
  const [frame, setFrame] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [hasFrame1, setHasFrame1] = useState(true);

  const base = findExerciseImageBase(name);

  useEffect(() => {
    setFrame(0);
    setLoaded(false);
    setHasFrame1(true);
  }, [name, gifUrl]);

  // Animação 2 frames só quando não há gifUrl
  useEffect(() => {
    if (gifUrl || !base || !hasFrame1) return;
    const interval = setInterval(() => setFrame((f) => 1 - f), 900);
    return () => clearInterval(interval);
  }, [gifUrl, base, hasFrame1]);

  // GIF do ExerciseDB (boneco 3D)
  if (gifUrl) {
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#fff", ...style }}>
        <img
          src={gifUrl}
          alt=""
          onLoad={() => setLoaded(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        />
        {!loaded && (
          <div style={{ position: "absolute", inset: 0, background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #ddd", borderTopColor: "#888", animation: "spin 0.8s linear infinite" }} />
          </div>
        )}
      </div>
    );
  }

  // Fallback: 2 fotos alternadas
  if (base) {
    const src = frame === 0 || !hasFrame1 ? `${base}/0.jpg` : `${base}/1.jpg`;
    return (
      <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", ...style }}>
        <img
          key={src}
          src={src}
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => { if (frame === 1) setHasFrame1(false); }}
          style={{
            width: "100%", height: "100%",
            objectFit: "cover", objectPosition: "center top",
            opacity: loaded ? 1 : 0,
            transition: "opacity 0.15s ease",
          }}
        />
        {!loaded && <div style={{ position: "absolute", inset: 0, background: "#1a1a2e" }} />}
      </div>
    );
  }

  // Último fallback: stickman SVG
  return (
    <AnimatedExerciseSVG
      category={category}
      name={name}
      compact={compact}
      style={{ width: "100%", height: "100%", ...style }}
    />
  );
}
