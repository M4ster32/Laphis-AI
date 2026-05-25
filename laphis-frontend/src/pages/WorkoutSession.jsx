import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, Check, Pause, Play,
  Timer, Dumbbell, X,
} from "lucide-react";
import ApiService from "../services/api";
import ExerciseImage from "../components/ExerciseImage";
import MuscleHighlighter from "../components/MuscleHighlighter";
import Modal from "../components/Modal";
import { hasExerciseImage } from "../utils/exerciseImages";

/**
 * WorkoutSession — Sessão de treino em curso.
 * - Mostra um exercício de cada vez
 * - Permite marcar sets feitos
 * - Timer de descanso entre sets
 * - Navegação Anterior/Próximo
 * - Ao terminar todos os exercícios → /workout-summary
 */
export default function WorkoutSession() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [exercises, setExercises] = useState(location.state?.exercises || []);
  const [planTitle, setPlanTitle] = useState(location.state?.planTitle || "Treino");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedSets, setCompletedSets] = useState({}); // { exerciseId: number }
  const [restTime, setRestTime] = useState(0);
  const [restRunning, setRestRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0); // segundos totais do treino
  const [showExitModal, setShowExitModal] = useState(false);
  const startedAt = useRef(Date.now());

  // Se já temos exercícios via state (vindo do PlanWorkoutBox), nada a fazer.
  // Se não há state nem planId válido, voltar.
  useEffect(() => {
    if (exercises.length > 0) return;
    if (!planId || planId === "new") {
      // Sem dados — volta para o chat
      navigate("/chat");
      return;
    }
    (async () => {
      try {
        const plan = await ApiService.getPlanDetail(planId);
        setPlanTitle(plan?.title || "Treino");
        // Reconstruir exercícios a partir do content_json (sections.items)
        const sections = plan?.content_json?.sections || [];
        const parsed = [];
        let idx = 0;
        for (const sec of sections) {
          for (const item of (sec.items || [])) {
            const sxr = item.match(/(\d+)\s*[x×]\s*([\d-]+)/i);
            if (!sxr) continue;
            const sets = parseInt(sxr[1], 10);
            const reps = sxr[2];
            const restMatch = item.match(/(\d+)\s*s/);
            const rest = restMatch ? parseInt(restMatch[1], 10) : 60;
            const name = item.slice(0, sxr.index).trim().replace(/[:\-–—]+\s*$/, "");
            if (!name) continue;
            // Só treinamos exercícios com imagem (2 frames).
            if (!hasExerciseImage(name)) continue;
            parsed.push({
              id: `db-${idx++}`,
              name,
              category: "full_body",
              muscle_primary: "full_body",
              difficulty: "intermedio",
              default_sets: sets,
              default_reps: reps,
              default_rest_sec: rest,
              calories_per_min: 6,
            });
          }
        }
        if (parsed.length === 0) {
          navigate("/chat");
          return;
        }
        setExercises(parsed);
      } catch (e) {
        console.error(e);
        navigate("/chat");
      }
    })();
  }, [planId, exercises.length, navigate]);

  // Cronómetro total do treino
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Timer de descanso
  useEffect(() => {
    if (!restRunning || restTime <= 0) return;
    const t = setInterval(() => {
      setRestTime((prev) => {
        if (prev <= 1) {
          setRestRunning(false);
          // beep simples (Web Audio)
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.connect(g); g.connect(ctx.destination);
            o.frequency.value = 880;
            g.gain.value = 0.3;
            o.start(); o.stop(ctx.currentTime + 0.2);
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [restRunning, restTime]);

  if (!exercises || exercises.length === 0) {
    return (
      <div style={s.page}>
        <div style={s.empty}>
          <Dumbbell size={48} color="var(--text-muted)" />
          <h2 style={{ marginTop: 16 }}>Sem exercícios neste plano</h2>
          <button className="btn" onClick={() => navigate(-1)}>Voltar</button>
        </div>
      </div>
    );
  }

  const current = exercises[currentIdx];
  const totalSets = current.default_sets || 3;
  const sets = completedSets[current.id] || 0;
  const restDefault = current.default_rest_sec || 60;

  const completeSet = () => {
    const nowSets = (completedSets[current.id] || 0) + 1;
    setCompletedSets({ ...completedSets, [current.id]: nowSets });
    if (nowSets < totalSets) {
      setRestTime(restDefault);
      setRestRunning(true);
    }
  };

  const undoSet = () => {
    const nowSets = Math.max(0, (completedSets[current.id] || 0) - 1);
    setCompletedSets({ ...completedSets, [current.id]: nowSets });
  };

  const next = () => {
    setRestRunning(false);
    setRestTime(0);
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      finishWorkout();
    }
  };

  const prev = () => {
    setRestRunning(false);
    setRestTime(0);
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  };

  const finishWorkout = () => {
    const totalSetsCompleted = Object.values(completedSets).reduce((a, b) => a + b, 0);
    const totalPossibleSets = exercises.reduce((sum, ex) => sum + (ex.default_sets || 3), 0);
    const durationMin = Math.max(1, Math.round(elapsed / 60));
    const avgCalPerMin = exercises.reduce((sum, ex) => sum + (ex.calories_per_min || 6), 0) / exercises.length;
    const calories = Math.round(avgCalPerMin * durationMin);

    navigate("/workout-summary", {
      state: {
        planId,
        planTitle,
        exercises,
        completedSets,
        durationMin,
        elapsed,
        calories,
        totalSetsCompleted,
        totalPossibleSets,
      },
      replace: true,
    });
  };

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const allSetsDone = sets >= totalSets;
  const isLast = currentIdx === exercises.length - 1;

  return (
    <div style={s.page}>
      {/* Top bar */}
      <div style={s.topBar}>
        <button style={s.iconBtn} onClick={() => setShowExitModal(true)} aria-label="Sair">
          <X size={20} />
        </button>
        <div style={s.topInfo}>
          <div style={s.topTitle}>{planTitle}</div>
          <div style={s.topMeta}>
            <Timer size={12} /> {fmtTime(elapsed)} · Exercício {currentIdx + 1}/{exercises.length}
          </div>
        </div>
        <div style={{ width: 40 }} />
      </div>

      {/* Progress */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${((currentIdx + sets / totalSets) / exercises.length) * 100}%` }} />
      </div>

      {/* Exercício atual */}
      <div style={s.exerciseArea}>
        <div style={s.exerciseImage}>
          {/* Esquerda: animação 2 frames */}
          <div style={{ flex: 1, height: "100%" }}>
            <ExerciseImage
              category={current.category}
              name={current.name}
              musclePrimary={current.muscle_primary}
              muscleSecondary={current.muscle_secondary}
            />
          </div>
          {/* Direita: boneco anatómico */}
          <div style={{
            width: 90,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderLeft: "1px solid rgba(255,255,255,0.06)",
            background: "linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%)",
            flexShrink: 0,
          }}>
            <MuscleHighlighter
              musclePrimary={current.muscle_primary}
              muscleSecondary={current.muscle_secondary}
              category={current.category}
              size={130}
            />
          </div>
        </div>

        <h1 style={s.exerciseName}>{current.name}</h1>
        <div style={s.exerciseMeta}>
          {current.muscle_primary && (
            <div style={s.exerciseMuscle}>{current.muscle_primary}</div>
          )}
          {current.suggested_weight && (
            <div style={s.weightBadge}>🏋️ {current.suggested_weight} kg</div>
          )}
        </div>

        {/* Sets indicator */}
        <div style={s.setsRow}>
          {Array.from({ length: totalSets }).map((_, i) => (
            <div
              key={i}
              style={{
                ...s.setBubble,
                ...(i < sets ? s.setBubbleDone : {}),
              }}
            >
              {i < sets ? <Check size={18} strokeWidth={3} /> : i + 1}
            </div>
          ))}
        </div>

        <div style={s.setLabel}>
          {allSetsDone
            ? `${totalSets}/${totalSets} séries concluídas ✓`
            : `Próxima: Série ${sets + 1} de ${totalSets} · ${current.default_reps || "10-12"} reps`}
        </div>

        {/* Timer de descanso */}
        {restTime > 0 && (
          <div style={s.restBox}>
            <div style={s.restLabel}>Descanso</div>
            <div style={s.restTimer}>{fmtTime(restTime)}</div>
            <div style={s.restActions}>
              <button style={s.restBtn} onClick={() => setRestRunning(!restRunning)}>
                {restRunning ? <><Pause size={14} /> Pausar</> : <><Play size={14} /> Continuar</>}
              </button>
              <button style={s.restBtn} onClick={() => { setRestRunning(false); setRestTime(0); }}>
                Saltar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div style={s.bottomBar}>
        <button style={s.navBtn} onClick={prev} disabled={currentIdx === 0}>
          <ChevronLeft size={20} />
        </button>

        {!allSetsDone ? (
          <button style={s.mainBtn} onClick={completeSet}>
            <Check size={20} strokeWidth={2.5} /> Concluir Série {sets + 1}
          </button>
        ) : (
          <button style={s.mainBtn} onClick={next}>
            {isLast ? "Terminar Treino" : "Próximo Exercício"} <ChevronRight size={20} />
          </button>
        )}

        <button style={s.navBtn} onClick={sets > 0 ? undoSet : next} title={sets > 0 ? "Desfazer série" : "Saltar"}>
          {sets > 0 ? "−1" : <ChevronRight size={20} />}
        </button>
      </div>

      <Modal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="Sair do treino?"
        confirmText="Sair sem guardar"
        onConfirm={() => navigate("/chat")}
      >
        <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Tens a certeza que queres sair? O progresso desta sessão será perdido.
        </p>
      </Modal>
    </div>
  );
}

const s = {
  page: {
    display: "flex", flexDirection: "column", flex: "1 1 0", minHeight: 0,
    background: "var(--bg-base, var(--bg))",
  },
  empty: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", flex: 1, padding: 24, textAlign: "center", gap: 8,
  },
  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 14px", flexShrink: 0,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: "50%",
    background: "var(--card-bg)", border: "1px solid var(--border)",
    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)",
  },
  topInfo: { textAlign: "center" },
  topTitle: { fontSize: 14, fontWeight: 700, color: "var(--text)" },
  topMeta: {
    fontSize: 11, color: "var(--text-muted)", marginTop: 2,
    display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
  },
  progressTrack: {
    height: 4, background: "var(--border)", margin: "0 14px",
    borderRadius: 4, overflow: "hidden", flexShrink: 0,
  },
  progressFill: {
    height: "100%", background: "var(--gradient-primary, var(--primary))",
    transition: "width 0.4s ease",
  },
  exerciseArea: {
    flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column",
    alignItems: "center", overflowY: "auto",
  },
  exerciseImage: {
    width: "100%", maxWidth: 360, height: 170, borderRadius: 16,
    overflow: "hidden", background: "var(--bg-tertiary)",
    boxShadow: "var(--shadow)",
    display: "flex", flexDirection: "row",
  },
  exerciseName: {
    fontSize: 20, fontWeight: 800, color: "var(--text)",
    margin: "12px 0 6px", textAlign: "center", letterSpacing: "-0.03em",
  },
  exerciseMeta: {
    display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "center",
  },
  exerciseMuscle: {
    fontSize: 12, color: "var(--text-muted)", textTransform: "uppercase",
    letterSpacing: 1, fontWeight: 600,
  },
  weightBadge: {
    fontSize: 12, fontWeight: 700, color: "var(--primary)",
    background: "var(--bg-tertiary)", border: "1px solid var(--primary)",
    borderRadius: 8, padding: "2px 8px",
  },
  setsRow: {
    display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center",
  },
  setBubble: {
    width: 44, height: 44, borderRadius: "50%",
    background: "var(--card-bg)", border: "2px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, fontWeight: 700, color: "var(--text-muted)",
    transition: "all 0.2s ease",
  },
  setBubbleDone: {
    background: "var(--gradient-primary, var(--primary))",
    color: "white", borderColor: "var(--primary)",
    boxShadow: "0 2px 8px var(--btn-primary-shadow, rgba(0,0,0,0.2))",
  },
  setLabel: {
    fontSize: 13, color: "var(--text-secondary)",
    marginTop: 8, fontWeight: 500,
  },
  restBox: {
    marginTop: 12, padding: 12,
    background: "var(--card-bg)", border: "2px solid var(--primary)",
    borderRadius: 14, width: "100%", maxWidth: 320, textAlign: "center",
  },
  restLabel: {
    fontSize: 11, color: "var(--text-muted)",
    textTransform: "uppercase", letterSpacing: 1, fontWeight: 600,
  },
  restTimer: {
    fontSize: 38, fontWeight: 800, color: "var(--primary)",
    marginTop: 4, fontVariantNumeric: "tabular-nums",
  },
  restActions: { display: "flex", gap: 8, marginTop: 12, justifyContent: "center" },
  restBtn: {
    display: "flex", alignItems: "center", gap: 4, padding: "6px 12px",
    background: "transparent", border: "1px solid var(--border)",
    borderRadius: 8, fontSize: 12, fontWeight: 600, color: "var(--text)",
    cursor: "pointer", fontFamily: "inherit",
  },
  bottomBar: {
    display: "flex", gap: 10, padding: "14px",
    borderTop: "1px solid var(--border-light)", flexShrink: 0,
    background: "var(--bg-base, var(--bg))",
  },
  navBtn: {
    width: 50, height: 50, borderRadius: 14,
    background: "var(--card-bg)", color: "var(--text)",
    border: "1px solid var(--border)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 12, fontWeight: 700,
  },
  mainBtn: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, height: 50, borderRadius: 14, border: "none",
    background: "var(--gradient-primary, var(--primary))", color: "white",
    cursor: "pointer", fontSize: 15, fontWeight: 700, fontFamily: "inherit",
    boxShadow: "0 4px 12px var(--btn-primary-shadow, rgba(0,0,0,0.2))",
  },
};
