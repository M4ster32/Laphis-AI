import { Component } from "react";
import Model from "react-body-highlighter";

class ErrorBoundary extends Component {
  state = { error: false };
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? null : this.props.children; }
}

const MUSCLE_MAP = {
  // Peito
  "peito": ["chest"],
  "peitoral": ["chest"],
  "peitoral maior": ["chest"],
  "peitoral menor": ["chest"],

  // Costas
  "costas": ["upper-back", "lower-back"],
  "dorsal": ["upper-back"],
  "grande dorsal": ["upper-back"],
  "latíssimo do dorso": ["upper-back"],
  "lombar": ["lower-back"],
  "trapézio": ["trapezius"],
  "trapezio": ["trapezius"],
  "rombóide": ["upper-back"],
  "romboide": ["upper-back"],

  // Ombros
  "ombros": ["front-deltoids", "back-deltoids"],
  "deltóide": ["front-deltoids", "back-deltoids"],
  "deltoide": ["front-deltoids", "back-deltoids"],
  "deltóide anterior": ["front-deltoids"],
  "deltóide posterior": ["back-deltoids"],
  "deltóide lateral": ["front-deltoids"],
  "rotadores": ["rotator-cuffs"],

  // Bíceps
  "bíceps": ["biceps"],
  "biceps": ["biceps"],
  "braquial": ["biceps"],

  // Tríceps
  "tríceps": ["triceps"],
  "triceps": ["triceps"],

  // Antebraço
  "antebraço": ["forearm"],
  "antebraco": ["forearm"],

  // Abdómen
  "abdómen": ["abs"],
  "abdomen": ["abs"],
  "abdominal": ["abs"],
  "oblíquos": ["obliques"],
  "obliquos": ["obliques"],
  "core": ["abs", "obliques"],

  // Pernas
  "pernas": ["quadriceps", "hamstring", "calves"],
  "quadríceps": ["quadriceps"],
  "quadriceps": ["quadriceps"],
  "isquiotibiais": ["hamstring"],
  "femoral": ["hamstring"],
  "glúteos": ["gluteal"],
  "gluteos": ["gluteal"],
  "glúteo": ["gluteal"],
  "gluteo": ["gluteal"],
  "panturrilha": ["calves"],
  "gémeos": ["calves"],
  "gemeos": ["calves"],
  "tibial": ["calves"],
  "adutores": ["adductor"],
  "adutor": ["adductor"],
  "abdutores": ["abductors"],
  "abutor": ["abductors"],

  // Cardio / full body
  "cardio": ["chest", "quadriceps"],
  "full body": ["chest", "upper-back", "quadriceps", "abs"],
  "corpo inteiro": ["chest", "upper-back", "quadriceps", "abs"],
};

function parseMuscles(raw) {
  if (!raw) return [];
  const parts = raw.toLowerCase().split(/[,/\n]+/).map((s) => s.trim());
  const result = [];
  for (const part of parts) {
    const mapped = MUSCLE_MAP[part];
    if (mapped) result.push(...mapped);
  }
  return [...new Set(result)];
}

export default function MuscleHighlighter({
  musclePrimary,
  muscleSecondary,
  size = 200,
  compact = false,
  style = {},
}) {
  const primary = parseMuscles(musclePrimary);
  const secondary = parseMuscles(muscleSecondary);

  const secondaryOnly = secondary.filter((m) => !primary.includes(m));

  const data = [
    ...(primary.length ? [{ name: "primary", muscles: primary, frequency: 2 }] : []),
    ...(secondaryOnly.length ? [{ name: "secondary", muscles: secondaryOnly, frequency: 1 }] : []),
  ];

  if (!data.length) return null;

  const highlightedColor = "#ef4444";
  const secondaryColor = "#f97316";

  if (compact) {
    return (
      <ErrorBoundary>
        <Model
          data={data}
          style={{ width: size * 0.55, height: size }}
          highlightedColors={[highlightedColor, secondaryColor]}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          ...style,
        }}
      >
        <Model
          data={data}
          style={{ width: size / 2, height: size }}
          highlightedColors={[highlightedColor, secondaryColor]}
        />
        <Model
          type="posterior"
          data={data}
          style={{ width: size / 2, height: size }}
          highlightedColors={[highlightedColor, secondaryColor]}
        />
      </div>
    </ErrorBoundary>
  );
}
