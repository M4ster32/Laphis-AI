import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Dumbbell, Save, Calendar, Clock, Eye, Flame } from "lucide-react";
import ApiService from "../services/api";
import MuscleHighlighter from "./MuscleHighlighter";
import ExerciseGif from "./ExerciseGif";
import Modal from "./Modal";
import ExerciseCard from "./ExerciseCard";
import { hasExerciseImage } from "../utils/exerciseImages";

/* ──────────────────────────────────────────────────────────────────────
 * PARSING
 * ────────────────────────────────────────────────────────────────────── */

const CATEGORY_KEYWORDS = [
  ["peito",    ["peito", "supino", "crucifixo", "peitoral", "chest", "flexões", "flexao", "push"]],
  ["costas",   ["costas", "remada", "dorsal", "pull", "deadlift", "terra", "lat", "puxada", "elevações"]],
  ["pernas",   ["perna", "agacha", "squat", "glúteo", "gluteo", "leg", "stiff", "lunge", "afundo", "quad", "panturrilha", "estocada", "femur"]],
  ["ombros",   ["ombro", "deltóide", "deltoide", "press militar", "overhead", "elevação lateral", "arnold", "face pull"]],
  ["biceps",   ["bícep", "bicep", "curl", "rosca"]],
  ["triceps",  ["trícep", "tricep", "skull", "dips", "extensão tríceps", "francesa"]],
  ["abdomen",  ["abdóm", "abdominal", "core", "prancha", "plank", "crunch", "oblíq"]],
  ["cardio",   ["cardio", "burpee", "hiit", "corrida", "mountain climber", "jumping", "aeróbico"]],
];

function guessCategory(text) {
  const t = text.toLowerCase();
  for (const [cat, kws] of CATEGORY_KEYWORDS) {
    if (kws.some((kw) => t.includes(kw))) return cat;
  }
  return "full_body";
}

/**
 * Parse uma linha de exercício. Aceita formatos como:
 *   "Agachamento com barra 4×8-10 (descanso 90s)"
 *   "Supino reto: 3x10"
 *   "1. Flexões 4×12"
 *   "- **Curl bíceps** 3x12 (descanso 60s)"
 */
function parseExerciseLine(raw) {
  let line = raw.trim();
  if (!line) return null;
  // remover marcadores
  line = line.replace(/^[-*•▪]\s+/, "").replace(/^\d+[.)]\s*/, "");
  // remover markdown bold/italic
  line = line.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
  // remover emojis comuns no início
  line = line.replace(/^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+/u, "").trim();
  if (!line) return null;

  // procurar padrão sets×reps em vários formatos:
  //  "4×10", "4 x 10", "4×10-12"
  //  "4 séries × 10 reps", "4 sets x 10 reps"
  //  "4 séries de 10", "4 séries de 10-12 reps"
  let sets, reps, sxrIndex;
  const compact = line.match(/\b(\d+)\s*[x×]\s*([\d-]+)\b/i);
  const verbose = line.match(/\b(\d+)\s*(?:s[ée]ries?|sets?)\s*(?:[x×]|de)\s*([\d-]+)/i);
  const verboseRev = line.match(/\b(\d+)\s*reps?\s*[x×]\s*(\d+)\s*s[ée]ries?/i);

  if (compact) {
    sets = parseInt(compact[1], 10);
    reps = compact[2];
    sxrIndex = compact.index;
  } else if (verbose) {
    sets = parseInt(verbose[1], 10);
    reps = verbose[2];
    sxrIndex = verbose.index;
  } else if (verboseRev) {
    reps = verboseRev[1];
    sets = parseInt(verboseRev[2], 10);
    sxrIndex = verboseRev.index;
  } else {
    return null;
  }

  // tudo antes do sets×reps é o nome
  let name = line.slice(0, sxrIndex).trim();
  // remover separador final (— : - –)
  name = name.replace(/[:\-–—]+\s*$/, "").trim();
  if (!name || name.length < 2) return null;
  if (name.length > 60) name = name.slice(0, 60);

  // descanso: aceita "(60 seg)", "(60s)", "descanso 60s", "60 seg"
  const restMatch =
    line.match(/descanso[\s:]*(\d+)\s*s/i) ||
    line.match(/\((\d+)\s*(?:s|seg|segundos?)\)/i) ||
    line.match(/\b(\d+)\s*(?:seg|segundos?)\b/i);
  const rest = restMatch ? parseInt(restMatch[1], 10) : 60;

  // peso sugerido: "@30kg", "@ 30 kg", "30kg"
  const weightMatch = line.match(/@\s*(\d+(?:\.\d+)?)\s*kg/i);
  const weight = weightMatch ? parseFloat(weightMatch[1]) : null;

  return {
    name,
    sets,
    reps,
    rest,
    weight,
    category: guessCategory(name),
  };
}

/**
 * Parse um plano completo (texto markdown ou JSON content_json) em dias.
 * Retorna: [{ header, exercises: [{name, sets, reps, rest, category}] }]
 */
function parsePlanDays({ rawText, contentJson }) {
  // Se temos JSON estruturado (do generatePlan), usar isso
  if (contentJson && Array.isArray(contentJson.sections)) {
    return contentJson.sections
      .map((sec) => {
        const exercises = (sec.items || [])
          .map(parseExerciseLine)
          .filter(Boolean)
          // Só mostramos exercícios com imagem (2 frames) — sem imagem, fora.
          .filter((ex) => hasExerciseImage(ex.name));
        return { header: sec.header || "Treino", exercises };
      })
      .filter((day) => day.exercises.length > 0);
  }

  // Senão parse do markdown raw
  if (!rawText) return [];
  const lines = rawText.split(/\n+/);
  const days = [];
  let cur = { header: "Treino", exercises: [] };

  // Padrão de header: "Dia 1 — ..." ou "## Dia 1" ou "📅 Dia 1"
  const headerRegex = /^[#\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]*(?:dia\s+\d+|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)[\s\S]*$/iu;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (headerRegex.test(line) && line.length < 80) {
      if (cur.exercises.length) days.push(cur);
      const cleanHeader = line
        .replace(/^#+\s*/, "")
        .replace(/^[\s\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]+/u, "")
        .trim();
      cur = { header: cleanHeader, exercises: [] };
      continue;
    }

    const ex = parseExerciseLine(line);
    // Só mostramos exercícios com imagem (2 frames) — sem imagem, fora.
    if (ex && hasExerciseImage(ex.name)) cur.exercises.push(ex);
  }
  if (cur.exercises.length) days.push(cur);

  // Se não houve headers detetados, agrupa todos sob um único "Treino"
  if (days.length === 0) {
    return [];
  }
  return days;
}

export function hasParseableWorkout(text) {
  if (!text || text.length < 100) return false;
  const days = parsePlanDays({ rawText: text });
  const total = days.reduce((s, d) => s + d.exercises.length, 0);
  return total >= 2; // pelo menos 2 exercícios para considerar um plano
}

function flatExercises(days) {
  const out = [];
  let idx = 0;
  for (const d of days) {
    for (const ex of d.exercises) {
      out.push({
        id: `parsed-${idx++}`,
        name: ex.name,
        category: ex.category,
        muscle_primary: ex.category,
        difficulty: "intermedio",
        default_sets: ex.sets,
        default_reps: ex.reps,
        default_rest_sec: ex.rest,
        suggested_weight: ex.weight,
        calories_per_min: 6,
        _day: d.header,
      });
    }
  }
  return out;
}

/* ──────────────────────────────────────────────────────────────────────
 * GIF FALLBACK MAPPING — chave normalizada → URL pública
 * Fonte: free-exercise-db (yuhonas/free-exercise-db) no GitHub
 * ────────────────────────────────────────────────────────────────────── */
const FALLBACK_GIF_MAP = {
  // Peito
  "supino": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
  "supino reto": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Bench_Press_-_Medium_Grip/0.jpg",
  "supino inclinado": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg",
  "supino declinado": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Decline_Barbell_Bench_Press/0.jpg",
  "crucifixo": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Flyes/0.jpg",
  "flexao": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
  "flexoes": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pushups/0.jpg",
  "peck deck": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Butterfly_Machine/0.jpg",

  // Costas
  "remada": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
  "remada curvada": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Bent_Over_Barbell_Row/0.jpg",
  "remada unilateral": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/One-Arm_Dumbbell_Row/0.jpg",
  "remada baixa": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Seated_Cable_Rows/0.jpg",
  "remada cavalinho": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/T-Bar_Row/0.jpg",
  "puxada": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
  "lat pulldown": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide-Grip_Lat_Pulldown/0.jpg",
  "elevacoes": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg",
  "pull up": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg",
  "pullup": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Pullups/0.jpg",
  "deadlift": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",
  "levantamento terra": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",
  "peso morto": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Deadlift/0.jpg",

  // Pernas
  "agachamento": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
  "agachamento livre": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Squat/0.jpg",
  "agachamento frontal": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Barbell_Squat/0.jpg",
  "agachamento sumo": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Wide_Stance_Barbell_Squat/0.jpg",
  "leg press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Press/0.jpg",
  "cadeira extensora": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg",
  "cadeira flexora": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg",
  "leg curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Lying_Leg_Curls/0.jpg",
  "extensao de pernas": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Leg_Extensions/0.jpg",
  "stiff": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
  "stiff romeno": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Romanian_Deadlift/0.jpg",
  "afundo": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg",
  "afundos": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg",
  "lunges": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg",
  "estocada": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dumbbell_Lunges/0.jpg",
  "panturrilha": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg",
  "elevacao de gemeos": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Standing_Calf_Raises/0.jpg",
  "abdutora": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Thigh_Abductor/0.jpg",
  "adutora": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Thigh_Adductor/0.jpg",

  // Ombros
  "press militar": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/0.jpg",
  "desenvolvimento militar": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shoulder_Press/0.jpg",
  "elevacao lateral": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Side_Lateral_Raise/0.jpg",
  "elevacao frontal": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Front_Dumbbell_Raise/0.jpg",
  "face pull": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Face_Pull/0.jpg",
  "arnold press": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Arnold_Dumbbell_Press/0.jpg",
  "encolhimento": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shrug/0.jpg",
  "shrug": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Shrug/0.jpg",

  // Bíceps
  "curl": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg",
  "rosca direta": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Barbell_Curl/0.jpg",
  "rosca martelo": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg",
  "curl martelo": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hammer_Curls/0.jpg",
  "curl inclinado": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Incline_Dumbbell_Curl/0.jpg",
  "rosca scott": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg",
  "preacher": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Preacher_Curl/0.jpg",

  // Tríceps
  "tricep dips": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/0.jpg",
  "dips": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Dips_-_Triceps_Version/0.jpg",
  "extensao triceps": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg",
  "triceps polia": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Triceps_Pushdown/0.jpg",
  "skull crusher": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Skullcrusher/0.jpg",
  "frances": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Skullcrusher/0.jpg",
  "rosca testa": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/EZ-Bar_Skullcrusher/0.jpg",

  // Abdómen
  "abdominal": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/0.jpg",
  "crunch": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Crunches/0.jpg",
  "prancha": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg",
  "plank": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Plank/0.jpg",
  "elevacao de pernas": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Hanging_Leg_Raise/0.jpg",
  "russian twist": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Russian_Twist/0.jpg",

  // Cardio
  "burpee": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Burpee/0.jpg",
  "mountain climber": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Mountain_Climbers/0.jpg",
  "jumping jack": "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/Jumping_Jack/0.jpg",
};

const _normalize = (s) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Procura o melhor match para um nome de exercício no FALLBACK_GIF_MAP.
 * Estratégia: procura a chave mais longa que esteja contida no nome.
 */
function findFallbackImage(exerciseName) {
  const normalized = _normalize(exerciseName);
  if (!normalized) return null;

  // Ordenar chaves por tamanho desc para preferir matches mais específicos
  const keys = Object.keys(FALLBACK_GIF_MAP).sort((a, b) => b.length - a.length);
  for (const k of keys) {
    if (normalized.includes(k)) return FALLBACK_GIF_MAP[k];
  }
  return null;
}

/**
 * Match fuzzy entre exercício parseado e exercícios da BD.
 * Score: contagem de palavras em comum (>3 chars).
 */
function findDbMatch(parsedName, dbExercises) {
  const tokens = _normalize(parsedName).split(" ").filter((t) => t.length > 3);
  if (tokens.length === 0) return null;
  let best = null;
  let bestScore = 0;
  for (const db of dbExercises) {
    const dbTokens = _normalize(db.name).split(" ");
    let score = 0;
    for (const t of tokens) {
      if (dbTokens.some((dt) => dt.includes(t) || t.includes(dt))) score++;
    }
    if (score > bestScore) { bestScore = score; best = db; }
  }
  return bestScore >= 1 ? best : null;
}

/**
 * Enriquece exercícios parseados com image_url da BD ou do fallback.
 */
function enrichExercises(parsedList, dbExercises) {
  return parsedList.map((ex) => {
    const dbMatch = findDbMatch(ex.name, dbExercises || []);
    if (dbMatch) {
      return {
        ...ex,
        image_url: dbMatch.image_url || findFallbackImage(ex.name),
        video_url: dbMatch.video_url,
        instructions: dbMatch.instructions,
        tips: dbMatch.tips,
        common_mistakes: dbMatch.common_mistakes,
        equipment: dbMatch.equipment,
        muscle_primary: dbMatch.muscle_primary || ex.muscle_primary,
        muscle_secondary: dbMatch.muscle_secondary,
      };
    }
    return { ...ex, image_url: findFallbackImage(ex.name) };
  });
}

/* ──────────────────────────────────────────────────────────────────────
 * COMPONENT
 * ────────────────────────────────────────────────────────────────────── */

export default function PlanWorkoutBox({
  rawText = null,
  planId = null,
  planTitle: propTitle = null,
  profileId = null,
  onPlanSaved = null,
  hideHero = false,
  hideActions = false,
}) {
  const navigate = useNavigate();
  const [contentJson, setContentJson] = useState(null);
  const [planTitle, setPlanTitle] = useState(propTitle || "Plano de Treino");
  const [loading, setLoading] = useState(!!planId);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [savedPlanId, setSavedPlanId] = useState(planId);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(0);
  const [dbExercises, setDbExercises] = useState([]);

  // Carregar todos os exercícios da BD uma vez (para fuzzy match com imagens)
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const items = await ApiService.listExercises({ limit: 200 });
        if (cancel) return;
        const list = Array.isArray(items) ? items : (items?.items || []);
        setDbExercises(list);
      } catch {
        if (!cancel) setDbExercises([]);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Carregar plano da BD se planId
  useEffect(() => {
    if (!planId) { setLoading(false); return; }
    let cancel = false;
    (async () => {
      try {
        const data = await ApiService.getPlanDetail(planId);
        if (cancel) return;
        setContentJson(data?.content_json || null);
        if (data?.title && !propTitle) setPlanTitle(data.title);
      } catch (e) {
        console.error("Erro ao carregar plano:", e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, [planId, propTitle]);

  // Tentar extrair título do rawText na primeira linha
  useEffect(() => {
    if (propTitle) return;
    if (!rawText) return;
    const firstLine = rawText.split("\n").find((l) => l.trim());
    if (firstLine) {
      const t = firstLine
        .replace(/^#+\s*/, "")
        .replace(/[*_`]/g, "")
        .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
        .trim();
      if (t.length > 4 && t.length < 100) setPlanTitle(t);
    }
  }, [rawText, propTitle]);

  // Parse dias e exercícios
  const days = useMemo(
    () => parsePlanDays({ rawText, contentJson }),
    [rawText, contentJson]
  );
  const allExercises = useMemo(
    () => enrichExercises(flatExercises(days), dbExercises),
    [days, dbExercises]
  );

  const totalExercises = allExercises.length;
  const totalSets = allExercises.reduce((s, e) => s + (e.default_sets || 0), 0);
  const estDuration = Math.round(totalSets * 1.5); // ~1.5 min por set incluindo descanso

  const ensurePlanSaved = async () => {
    if (savedPlanId) return savedPlanId;
    if (!profileId) return null;
    setSaving(true);
    try {
      const sections = days.map((d) => ({
        header: d.header,
        items: d.exercises.map(
          (e) => `${e.name} ${e.sets}×${e.reps} (descanso ${e.rest}s)`
        ),
      }));
      const saved = await ApiService.savePlan({
        profile_id: profileId,
        type: "training",
        title: planTitle,
        content_json: { type: "training", title: planTitle, sections, source: "chat" },
        notes: "Guardado a partir do chat",
      });
      const newId = saved?.id || saved?.plan?.id || null;
      if (newId) {
        setSavedPlanId(newId);
        onPlanSaved?.(newId);
      }
      return newId;
    } catch (e) {
      console.error("Erro ao guardar plano:", e);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleStart = async () => {
    const pid = await ensurePlanSaved();
    navigate(`/workout-session/${pid || "new"}`, {
      state: { exercises: allExercises, planTitle },
    });
  };

  const handleSave = async () => {
    const pid = await ensurePlanSaved();
    if (pid) {
      // navega ou mostra confirmação
    }
  };

  if (loading) {
    return (
      <div style={s.box}>
        <div style={s.skeletonHero} />
        <div style={s.skeletonRow} />
        <div style={s.skeletonRow} />
      </div>
    );
  }

  if (totalExercises === 0) {
    // se não conseguimos parsear, não rendermos nada (cai para markdown normal)
    return null;
  }

  const currentDay = days[activeDay] || days[0];

  return (
    <>
      <div style={hideHero ? s.boxFlat : s.box}>
        {/* HERO */}
        {!hideHero && (
          <div style={s.hero}>
            <div style={s.heroPattern} />
            <div style={s.heroContent}>
              <div style={s.heroIcon}><Dumbbell size={20} strokeWidth={2.5} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.heroTitle}>{planTitle}</div>
                <div style={s.heroStats}>
                  <span><Calendar size={11} /> {days.length} {days.length === 1 ? "dia" : "dias"}</span>
                  <span><Dumbbell size={11} /> {totalExercises} exercícios</span>
                  <span><Clock size={11} /> ~{estDuration}min</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TABS de dias (se mais que 1) */}
        {days.length > 1 && (
          <div style={s.tabsRow}>
            {days.map((d, i) => (
              <button
                key={i}
                style={{
                  ...s.tab,
                  ...(activeDay === i ? s.tabActive : {}),
                }}
                onClick={() => setActiveDay(i)}
              >
                {d.header.replace(/^.*?Dia\s*(\d+).*?[—-]\s*/i, (_, n) => `Dia ${n} · `).slice(0, 22)}
              </button>
            ))}
          </div>
        )}

        {/* Header do dia atual (se só 1, mostra inline) */}
        {days.length === 1 && (
          <div style={s.dayHeaderSingle}>{currentDay.header}</div>
        )}

        {/* LISTA DE EXERCÍCIOS */}
        <div style={s.exerciseList}>
          {currentDay.exercises.map((ex, i) => {
            const exObj = allExercises.find(
              (a) => a._day === currentDay.header && a.name === ex.name
            ) || ex;
            return (
              <button
                key={i}
                type="button"
                style={s.exerciseRow}
                onClick={() => setSelectedExercise(exObj)}
              >
                <div style={s.exNumber}>{i + 1}</div>
                <div style={{ ...s.exThumb, background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)", overflow: "hidden" }}>
                  <ExerciseGif
                    name={exObj.name}
                    category={exObj.category}
                    musclePrimary={exObj.muscle_primary}
                    muscleSecondary={exObj.muscle_secondary}
                  />
                </div>
                <div style={s.exInfo}>
                  <div style={s.exName}>{ex.name}</div>
                  <div style={s.exMeta}>
                    <span style={s.exMetaItem}><Dumbbell size={10} /> {ex.sets}×{ex.reps}</span>
                    <span style={s.exMetaItem}><Clock size={10} /> {ex.rest}s</span>
                  </div>
                </div>
                <Eye size={14} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
              </button>
            );
          })}
        </div>

        {/* AÇÕES */}
        {!hideActions && (
          <div style={s.actions}>
            {!savedPlanId && profileId && (
              <button
                style={s.btnSecondary}
                onClick={handleSave}
                disabled={saving}
              >
                <Save size={14} /> {saving ? "..." : "Guardar"}
              </button>
            )}
            <button style={s.btnPrimary} onClick={handleStart} disabled={saving}>
              <Play size={16} fill="currentColor" />
              Iniciar Treino
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE EXERCÍCIO */}
      <Modal
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        title={selectedExercise?.name || "Exercício"}
        showFooter={false}
      >
        {selectedExercise && (
          <div style={{ marginTop: -8 }}>
            <ExerciseCard
              exercise={selectedExercise}
              compact={false}
              showActions={false}
            />
          </div>
        )}
      </Modal>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 * STYLES
 * ────────────────────────────────────────────────────────────────────── */

const s = {
  box: {
    marginTop: 12,
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
  },
  boxFlat: {
    background: "transparent",
    border: "none",
    borderRadius: 0,
    overflow: "visible",
    boxShadow: "none",
  },

  // Hero header
  hero: {
    position: "relative",
    padding: "16px 14px",
    background: "linear-gradient(135deg, #4A403A 0%, #6b5a4d 100%)",
    color: "white",
    overflow: "hidden",
  },
  heroPattern: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.06) 0%, transparent 50%)",
    pointerEvents: "none",
  },
  heroContent: {
    position: "relative", display: "flex", alignItems: "center", gap: 12,
  },
  heroIcon: {
    width: 40, height: 40, borderRadius: 12,
    background: "rgba(255,255,255,0.18)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    backdropFilter: "blur(8px)",
  },
  heroTitle: {
    fontSize: 15, fontWeight: 800, letterSpacing: "-0.02em",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  heroStats: {
    display: "flex", gap: 12, marginTop: 4,
    fontSize: 11, opacity: 0.85, fontWeight: 600,
    flexWrap: "wrap",
  },

  // Tabs
  tabsRow: {
    display: "flex", gap: 6, padding: "10px 12px 0",
    overflowX: "auto", scrollbarWidth: "none",
  },
  tab: {
    flexShrink: 0, padding: "6px 12px",
    background: "transparent", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 12, fontWeight: 600,
    color: "var(--text-muted)", cursor: "pointer",
    fontFamily: "inherit", whiteSpace: "nowrap",
    transition: "all 0.15s",
  },
  tabActive: {
    background: "var(--primary, #4A403A)",
    borderColor: "var(--primary, #4A403A)",
    color: "white",
  },
  dayHeaderSingle: {
    padding: "10px 14px 0",
    fontSize: 12, fontWeight: 700, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: 0.8,
  },

  // Exercise list
  exerciseList: {
    padding: 10,
    display: "flex", flexDirection: "column", gap: 6,
  },
  exerciseRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: 8, paddingRight: 12,
    background: "var(--bg-secondary, var(--card-bg))",
    border: "1px solid var(--border)",
    borderRadius: 12,
    cursor: "pointer", textAlign: "left", width: "100%",
    fontFamily: "inherit",
    transition: "transform 0.15s, border-color 0.15s",
  },
  exNumber: {
    width: 22, height: 22, borderRadius: 6,
    background: "var(--bg-tertiary)", color: "var(--text-muted)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  exThumb: {
    width: 42, height: 42, borderRadius: 10,
    overflow: "hidden", flexShrink: 0,
    background: "var(--bg-tertiary)",
  },
  exInfo: { flex: 1, minWidth: 0 },
  exName: {
    fontSize: 13, fontWeight: 700, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    letterSpacing: "-0.01em",
  },
  exMeta: {
    display: "flex", gap: 10, marginTop: 3,
    fontSize: 11, color: "var(--text-muted)", fontWeight: 500,
  },
  exMetaItem: { display: "inline-flex", alignItems: "center", gap: 3 },

  // Actions
  actions: {
    display: "flex", gap: 8, padding: "0 10px 10px",
  },
  btnSecondary: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    padding: "11px 14px", borderRadius: 12,
    background: "var(--bg-secondary, var(--card-bg))",
    color: "var(--text)",
    border: "1px solid var(--border)", cursor: "pointer",
    fontSize: 13, fontWeight: 700, fontFamily: "inherit",
  },
  btnPrimary: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "11px 14px", borderRadius: 12,
    background: "linear-gradient(135deg, #4A403A 0%, #6b5a4d 100%)",
    color: "white", border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 800, fontFamily: "inherit",
    letterSpacing: "-0.01em",
    boxShadow: "0 4px 12px rgba(74, 64, 58, 0.3)",
  },

  // Skeletons
  skeletonHero: {
    height: 70, background: "linear-gradient(135deg, var(--bg-tertiary) 0%, var(--card-bg) 100%)",
    animation: "pulse 1.5s ease-in-out infinite",
  },
  skeletonRow: {
    height: 50, background: "var(--bg-tertiary)", margin: "8px 10px",
    borderRadius: 10, animation: "pulse 1.5s ease-in-out infinite",
  },
};
