import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Dumbbell, ChevronRight, Eye } from "lucide-react";
import ApiService from "../services/api";
import ExerciseImage from "./ExerciseImage";
import Modal from "./Modal";
import ExerciseCard from "./ExerciseCard";

/**
 * PlanWorkoutBox — Caixa interativa que aparece no chat quando um plano de
 * treino é criado. Mostra os exercícios, deixa clicar para ver GIF/instruções,
 * e tem botão "Iniciar Treino" que vai para a sessão de treino.
 */
export default function PlanWorkoutBox({ planId, planTitle }) {
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExercise, setSelectedExercise] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const planData = await ApiService.getPlanDetail(planId);
        if (cancelled) return;
        setPlan(planData);

        // Detetar categoria a partir do conteúdo do plano
        const flatten = (obj) => {
          if (!obj) return "";
          if (typeof obj === "string") return obj;
          if (Array.isArray(obj)) return obj.map(flatten).join(" ");
          return Object.values(obj).map(flatten).join(" ");
        };
        const text = flatten(planData.content_json).toLowerCase();

        const categoryMap = [
          { category: "peito",    keywords: ["peito", "supino", "crucifixo", "peitoral"] },
          { category: "costas",   keywords: ["costas", "remada", "dorsal", "deadlift", "terra"] },
          { category: "pernas",   keywords: ["perna", "agachamento", "squat", "glúteo", "leg"] },
          { category: "ombros",   keywords: ["ombro", "deltóide", "press militar"] },
          { category: "biceps",   keywords: ["bícep", "bicep", "curl", "rosca"] },
          { category: "triceps",  keywords: ["trícep", "tricep", "skull", "dips"] },
          { category: "abdomen",  keywords: ["abdóm", "abdominal", "core", "prancha"] },
          { category: "cardio",   keywords: ["cardio", "burpee", "hiit"] },
          { category: "full_body",keywords: ["corpo inteiro", "full body", "completo"] },
        ];

        let category = "full_body";
        for (const { category: cat, keywords } of categoryMap) {
          if (keywords.some(kw => text.includes(kw))) { category = cat; break; }
        }

        // Extrair nomes de exercícios do plano
        const lines = flatten(planData.content_json).split(/\n+/);
        const exerciseNames = [];
        const seen = new Set();
        for (const raw of lines) {
          const line = raw.trim().replace(/^[-*•]\s+/, "").replace(/^\d+[.)-]\s+/, "");
          const m = line.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-/]{2,40}?)(?:\s*[:–—-]\s*|\s+)(?=.*\d+\s*[x×]\s*\d+)/);
          let name = null;
          if (m) name = m[1].trim();
          else if (/\b\d+\s*[x×]\s*\d+/i.test(line)) {
            name = line.split(/\d/)[0].replace(/[:–—\-\s]+$/, "").trim();
          }
          if (!name || name.length < 3 || name.length > 50) continue;
          const key = name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          exerciseNames.push(name);
        }

        // Buscar exercícios da BD da categoria detetada
        let dbExercises = [];
        try {
          const items = await ApiService.listExercises({ category, limit: 8 });
          dbExercises = Array.isArray(items) ? items : (items?.items || []);
        } catch {}

        // Combinar: tentar fazer match de nomes extraídos com exercícios da BD;
        // o que não tiver match cria um item sintético
        const final = [];
        const usedDb = new Set();
        for (let i = 0; i < exerciseNames.length && i < 10; i++) {
          const name = exerciseNames[i];
          const match = dbExercises.find(e =>
            !usedDb.has(e.id) &&
            e.name.toLowerCase().includes(name.toLowerCase().split(" ")[0])
          );
          if (match) {
            final.push(match);
            usedDb.add(match.id);
          } else {
            final.push({
              id: `synthetic-${planId}-${i}`,
              name,
              category,
              muscle_primary: category,
              difficulty: "intermedio",
              default_sets: 3,
              default_reps: "10-12",
              default_rest_sec: 60,
              calories_per_min: 6,
            });
          }
        }

        // Se nenhum extraído, usar os da BD
        if (final.length === 0) {
          final.push(...dbExercises.slice(0, 5));
        }

        if (!cancelled) setExercises(final);
      } catch (e) {
        console.error("Erro ao carregar plano:", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [planId]);

  const handleStart = () => {
    navigate(`/workout-session/${planId}`, { state: { exercises, planTitle: planTitle || plan?.title } });
  };

  if (loading) {
    return (
      <div style={s.box}>
        <div style={s.loadingBar} />
        <div style={{ ...s.loadingBar, width: "60%" }} />
      </div>
    );
  }

  return (
    <>
      <div style={s.box}>
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.headerIcon}>
              <Dumbbell size={18} strokeWidth={2} />
            </div>
            <div>
              <div style={s.headerTitle}>{planTitle || plan?.title || "Plano de Treino"}</div>
              <div style={s.headerMeta}>{exercises.length} exercícios</div>
            </div>
          </div>
        </div>

        <div style={s.exerciseList}>
          {exercises.map((ex, i) => (
            <button
              key={ex.id}
              type="button"
              style={s.exerciseRow}
              onClick={() => setSelectedExercise(ex)}
            >
              <div style={s.thumbnail}>
                <ExerciseImage
                  src={ex.image_url}
                  alt={ex.name}
                  category={ex.category}
                  name={ex.name}
                  compact={true}
                />
              </div>
              <div style={s.exerciseInfo}>
                <div style={s.exerciseName}>{i + 1}. {ex.name}</div>
                <div style={s.exerciseMeta}>
                  {ex.default_sets}×{ex.default_reps} • {ex.default_rest_sec}s descanso
                </div>
              </div>
              <Eye size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
            </button>
          ))}
        </div>

        <div style={s.actions}>
          <button style={s.btnSecondary} onClick={() => navigate(`/plans/${planId}`)}>
            Ver Plano <ChevronRight size={14} />
          </button>
          <button style={s.btnPrimary} onClick={handleStart}>
            <Play size={16} fill="currentColor" /> Iniciar Treino
          </button>
        </div>
      </div>

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

const s = {
  box: {
    marginTop: 12,
    padding: 14,
    background: "var(--bg-secondary, var(--card-bg))",
    border: "1px solid var(--primary, #4A403A)",
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 10 },
  headerIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: "var(--gradient-primary, var(--primary))",
    color: "white", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  headerTitle: { fontWeight: 700, fontSize: 14, color: "var(--text)" },
  headerMeta: { fontSize: 12, color: "var(--text-muted)", marginTop: 2 },
  exerciseList: { display: "flex", flexDirection: "column", gap: 6 },
  exerciseRow: {
    display: "flex", alignItems: "center", gap: 10,
    padding: 8, background: "var(--card-bg)",
    border: "1px solid var(--border)", borderRadius: 10,
    cursor: "pointer", textAlign: "left", width: "100%",
    fontFamily: "inherit",
    transition: "background 0.15s, border-color 0.15s",
  },
  thumbnail: {
    width: 44, height: 44, borderRadius: 8,
    overflow: "hidden", flexShrink: 0,
    background: "var(--bg-tertiary)",
  },
  exerciseInfo: { flex: 1, minWidth: 0 },
  exerciseName: {
    fontSize: 13, fontWeight: 600, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  exerciseMeta: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  actions: { display: "flex", gap: 8, marginTop: 4 },
  btnSecondary: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
    padding: "10px 12px", borderRadius: 10,
    background: "var(--card-bg)", color: "var(--text)",
    border: "1px solid var(--border)", cursor: "pointer",
    fontSize: 13, fontWeight: 600, fontFamily: "inherit",
  },
  btnPrimary: {
    flex: 2, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "10px 12px", borderRadius: 10,
    background: "var(--gradient-primary, var(--primary))",
    color: "white", border: "none", cursor: "pointer",
    fontSize: 13, fontWeight: 700, fontFamily: "inherit",
    boxShadow: "0 2px 8px var(--btn-primary-shadow, rgba(0,0,0,0.15))",
  },
  loadingBar: {
    height: 16, background: "var(--bg-tertiary)",
    borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite",
  },
};
