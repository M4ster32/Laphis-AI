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
  "peitoral superior (clavicular)": ["chest"],
  "peitoral superior": ["chest"],

  // Costas
  "costas": ["upper-back", "lower-back"],
  "dorsal": ["upper-back"],
  "grande dorsal": ["upper-back"],
  "grande dorsal, romboides": ["upper-back"],
  "latissimo do dorso": ["upper-back"],
  "lombar": ["lower-back"],
  "eretores da espinha": ["lower-back"],
  "eretores da espinha, gluteos, isquiotibiais": ["lower-back", "gluteal", "hamstring"],
  "trapezio": ["trapezius"],
  "trapezio medio": ["trapezius"],
  "romboide": ["upper-back"],
  "romboides": ["upper-back"],

  // Ombros
  "ombros": ["front-deltoids", "back-deltoids"],
  "deltoide": ["front-deltoids", "back-deltoids"],
  "deltoide anterior": ["front-deltoids"],
  "deltoide lateral": ["front-deltoids"],
  "deltoide posterior": ["back-deltoids"],
  "deltoide anterior e lateral": ["front-deltoids"],
  "deltoide anterior, lateral e posterior": ["front-deltoids", "back-deltoids"],
  "deltoide posterior, trapezio medio": ["back-deltoids", "trapezius"],
  "ombros, pernas, core": ["front-deltoids", "quadriceps", "abs"],
  "rotadores": ["rotator-cuffs"],

  // Bíceps
  "biceps": ["biceps"],
  "biceps braquial": ["biceps"],
  "biceps (cabeca longa)": ["biceps"],
  "braquial": ["biceps"],
  "braquiorradial": ["forearm"],
  "braquiorradial, braquial": ["forearm", "biceps"],

  // Tríceps
  "triceps": ["triceps"],
  "triceps (cabeca longa)": ["triceps"],

  // Antebraço
  "antebraco": ["forearm"],

  // Abdómen
  "abdomen": ["abs"],
  "abdominal": ["abs"],
  "obliquos": ["obliques"],
  "core": ["abs", "obliques"],
  "core, flexores da anca": ["abs", "obliques"],
  "core, ombros": ["abs", "front-deltoids"],
  "reto abdominal superior": ["abs"],
  "reto abdominal inferior, flexores da anca": ["abs"],
  "transverso abdominal, core profundo": ["abs"],
  "transverso abdominal, reto abdominal": ["abs"],

  // Pernas
  "pernas": ["quadriceps", "hamstring", "calves"],
  "quadricipites": ["quadriceps"],
  "quadricipites, gluteos": ["quadriceps", "gluteal"],
  "quadricipites, ombros": ["quadriceps", "front-deltoids"],
  "isquiotibiais": ["hamstring"],
  "isquiotibiais, gluteos": ["hamstring", "gluteal"],
  "gluteos": ["gluteal"],
  "gluteos, isquiotibiais, core": ["gluteal", "hamstring", "abs"],
  "femoral": ["hamstring"],
  "panturrilha": ["calves"],
  "gemeos": ["calves"],
  "gastrocnemios (gemeos)": ["calves"],
  "tibial": ["calves"],
  "adutores": ["adductor"],
  "abdutores": ["abductors"],

  // Cardio / full body
  "cardiovascular": ["quadriceps", "hamstring"],
  "cardiovascular, flexores da anca": ["quadriceps", "hamstring"],
  "cardio": ["quadriceps", "hamstring"],
  "full body": ["chest", "upper-back", "quadriceps", "abs"],
  "full body, cardiovascular": ["chest", "upper-back", "quadriceps", "abs"],
  "corpo inteiro": ["chest", "upper-back", "quadriceps", "abs"],
};

// Fallback por categoria quando muscle_primary não existe
const CATEGORY_FALLBACK = {
  peito: ["chest"],
  costas: ["upper-back"],
  pernas: ["quadriceps"],
  ombros: ["front-deltoids", "back-deltoids"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  abdomen: ["abs"],
  cardio: ["quadriceps", "hamstring"],
  full_body: ["chest", "upper-back", "quadriceps", "abs"],
};

// Músculos que estão na vista traseira
const POSTERIOR_MUSCLES = new Set([
  "upper-back", "lower-back", "trapezius", "back-deltoids",
  "triceps", "hamstring", "gluteal", "calves",
]);

const normalize = (s) =>
  s.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s,()]/g, "")
    .trim();

function parseMuscles(raw) {
  if (!raw) return [];
  const norm = normalize(raw);

  if (MUSCLE_MAP[norm]) return MUSCLE_MAP[norm];

  const result = [];
  const parts = norm.split(/[,]+/).map((s) => s.trim());
  for (const part of parts) {
    const direct = MUSCLE_MAP[part];
    if (direct) { result.push(...direct); continue; }
    for (const key of Object.keys(MUSCLE_MAP)) {
      if (key.includes(part) || part.includes(key)) {
        result.push(...MUSCLE_MAP[key]);
        break;
      }
    }
  }
  return [...new Set(result)];
}

function pickView(muscles) {
  if (!muscles.length) return "anterior";
  const posterior = muscles.filter((m) => POSTERIOR_MUSCLES.has(m)).length;
  return posterior > muscles.length / 2 ? "posterior" : "anterior";
}

export default function MuscleHighlighter({
  musclePrimary,
  muscleSecondary,
  category,
  size = 200,
  style = {},
}) {
  let primary = parseMuscles(musclePrimary);
  let secondary = parseMuscles(muscleSecondary);

  // Fallback por categoria se não detectou nada
  if (!primary.length && category && CATEGORY_FALLBACK[category]) {
    primary = CATEGORY_FALLBACK[category];
  }

  const secondaryOnly = secondary.filter((m) => !primary.includes(m));

  const data = [
    ...(primary.length ? [{ name: "primary", muscles: primary, frequency: 2 }] : []),
    ...(secondaryOnly.length ? [{ name: "secondary", muscles: secondaryOnly, frequency: 1 }] : []),
  ];

  if (!data.length) return null;

  const view = pickView(primary);
  const highlightedColor = "#ef4444";
  const secondaryColor = "#f97316";

  return (
    <ErrorBoundary>
      <Model
        type={view}
        data={data}
        style={{ width: size * 0.55, height: size, ...style }}
        highlightedColors={[highlightedColor, secondaryColor]}
      />
    </ErrorBoundary>
  );
}
