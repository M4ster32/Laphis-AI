import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Dumbbell, Save, Calendar, Clock, Eye, Flame } from "lucide-react";
import ApiService from "../services/api";
import ExerciseImage from "./ExerciseImage";
import Modal from "./Modal";
import ExerciseCard from "./ExerciseCard";

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

  // procurar padrão sets×reps
  const sxr = line.match(/\b(\d+)\s*[x×]\s*([\d-]+)\b/i);
  if (!sxr) return null;
  const sets = parseInt(sxr[1], 10);
  const reps = sxr[2];

  // tudo antes do sets×reps é o nome
  const nameMatch = line.slice(0, sxr.index).trim();
  let name = nameMatch.replace(/[:\-–—]+\s*$/, "").trim();
  if (!name || name.length < 2) return null;
  if (name.length > 60) name = name.slice(0, 60);

  // descanso
  const restMatch = line.match(/descanso[\s:]*(\d+)\s*s/i) || line.match(/\((\d+)\s*s/i);
  const rest = restMatch ? parseInt(restMatch[1], 10) : 60;

  return {
    name,
    sets,
    reps,
    rest,
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
          .filter(Boolean);
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
    if (ex) cur.exercises.push(ex);
  }
  if (cur.exercises.length) days.push(cur);

  // Se não houve headers detetados, agrupa todos sob um único "Treino"
  if (days.length === 0) {
    return [];
  }
  return days;
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
        calories_per_min: 6,
        _day: d.header,
      });
    }
  }
  return out;
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
}) {
  const navigate = useNavigate();
  const [contentJson, setContentJson] = useState(null);
  const [planTitle, setPlanTitle] = useState(propTitle || "Plano de Treino");
  const [loading, setLoading] = useState(!!planId);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [savedPlanId, setSavedPlanId] = useState(planId);
  const [saving, setSaving] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

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
  const allExercises = useMemo(() => flatExercises(days), [days]);

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
      <div style={s.box}>
        {/* HERO */}
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
            ) || {
              id: `view-${i}`,
              name: ex.name,
              category: ex.category,
              muscle_primary: ex.category,
              difficulty: "intermedio",
              default_sets: ex.sets,
              default_reps: ex.reps,
              default_rest_sec: ex.rest,
              calories_per_min: 6,
            };
            return (
              <button
                key={i}
                type="button"
                style={s.exerciseRow}
                onClick={() => setSelectedExercise(exObj)}
              >
                <div style={s.exNumber}>{i + 1}</div>
                <div style={s.exThumb}>
                  <ExerciseImage
                    category={ex.category}
                    name={ex.name}
                    compact={true}
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
