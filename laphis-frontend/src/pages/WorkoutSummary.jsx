import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Trophy, Timer, Flame, Check, Home, Dumbbell } from "lucide-react";
import ApiService from "../services/api";

/**
 * WorkoutSummary — Ecrã de resumo após terminar um treino.
 * Mostra estatísticas e guarda automaticamente em registos (workout log).
 */
export default function WorkoutSummary() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [saving, setSaving] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Se chegar aqui sem state (refresh), volta ao chat
  useEffect(() => {
    if (!state) {
      navigate("/chat", { replace: true });
    }
  }, [state, navigate]);

  // Guardar workout log automaticamente
  useEffect(() => {
    if (!state) return;

    const save = async () => {
      try {
        const completedExercises = (state.exercises || []).filter(
          (ex) => (state.completedSets?.[ex.id] || 0) > 0
        );
        const description = `${state.planTitle || "Treino"} — ${completedExercises.length} exercícios`;
        const exerciseLines = completedExercises
          .map((ex) => `${ex.name}: ${state.completedSets[ex.id]}×${ex.default_reps || "10-12"}`)
          .join("\n");

        await ApiService.createLog({
          log_type: "treino",
          description,
          duration_min: state.durationMin,
          calories: state.calories,
          notes: exerciseLines || null,
        });

        setSaved(true);
      } catch (e) {
        console.error("Erro a guardar treino:", e);
        setError(e.message || "Erro ao guardar");
      } finally {
        setSaving(false);
      }
    };
    save();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!state) return null;

  const fmtTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  const completionPct = state.totalPossibleSets > 0
    ? Math.round((state.totalSetsCompleted / state.totalPossibleSets) * 100)
    : 0;

  return (
    <div style={s.page}>
      <div style={s.hero}>
        <div style={s.trophy}>
          <Trophy size={48} strokeWidth={1.5} />
        </div>
        <h1 style={s.title}>Treino Completo!</h1>
        <p style={s.subtitle}>{state.planTitle || "Treino"}</p>
      </div>

      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <Timer size={20} style={{ color: "var(--primary)" }} />
          <div style={s.statValue}>{fmtTime(state.elapsed)}</div>
          <div style={s.statLabel}>Duração</div>
        </div>
        <div style={s.statCard}>
          <Flame size={20} style={{ color: "#f59e0b" }} />
          <div style={s.statValue}>{state.calories}</div>
          <div style={s.statLabel}>kcal</div>
        </div>
        <div style={s.statCard}>
          <Dumbbell size={20} style={{ color: "#22c55e" }} />
          <div style={s.statValue}>
            {state.totalSetsCompleted}/{state.totalPossibleSets}
          </div>
          <div style={s.statLabel}>Séries</div>
        </div>
      </div>

      {/* Barra de conclusão */}
      <div style={s.completionWrap}>
        <div style={s.completionLabel}>
          <span>Conclusão</span>
          <span style={{ fontWeight: 700, color: "var(--primary)" }}>{completionPct}%</span>
        </div>
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Lista de exercícios feitos */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Exercícios</h3>
        <div style={s.exerciseList}>
          {(state.exercises || []).map((ex) => {
            const done = state.completedSets?.[ex.id] || 0;
            const total = ex.default_sets || 3;
            const pct = total > 0 ? (done / total) * 100 : 0;
            return (
              <div key={ex.id} style={s.exerciseRow}>
                <div style={s.exerciseInfo}>
                  <div style={s.exerciseName}>{ex.name}</div>
                  <div style={s.exerciseMeta}>
                    {done}/{total} séries × {ex.default_reps || "10-12"} reps
                  </div>
                </div>
                <div style={{
                  ...s.exerciseBadge,
                  background: pct === 100 ? "rgba(34, 197, 94, 0.15)" : "var(--bg-tertiary)",
                  color: pct === 100 ? "#22c55e" : "var(--text-muted)",
                }}>
                  {pct === 100 ? <Check size={14} strokeWidth={3} /> : `${Math.round(pct)}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status do save */}
      <div style={s.saveStatus}>
        {saving && <span style={{ color: "var(--text-muted)" }}>A guardar treino...</span>}
        {saved && <span style={{ color: "#22c55e" }}>✓ Treino guardado em Registos</span>}
        {error && <span style={{ color: "#ef4444" }}>Erro: {error}</span>}
      </div>

      {/* Ações */}
      <div style={s.actions}>
        <button style={s.btnSecondary} onClick={() => navigate("/logs")}>
          Ver Registos
        </button>
        <button style={s.btnPrimary} onClick={() => navigate("/dashboard")}>
          <Home size={16} /> Início
        </button>
      </div>
    </div>
  );
}

const s = {
  page: {
    flex: "1 1 0", overflowY: "auto", padding: "20px 16px 24px",
    display: "flex", flexDirection: "column", gap: 18,
  },
  hero: {
    textAlign: "center", padding: "28px 16px",
    background: "var(--gradient-primary, var(--primary))",
    color: "white", borderRadius: 20,
    boxShadow: "0 8px 24px var(--btn-primary-shadow, rgba(0,0,0,0.2))",
  },
  trophy: {
    width: 80, height: 80, borderRadius: "50%",
    background: "rgba(255,255,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 12px",
  },
  title: { fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: "-0.03em" },
  subtitle: { fontSize: 14, opacity: 0.9, margin: "6px 0 0", fontWeight: 500 },
  statsGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
  },
  statCard: {
    padding: "14px 10px", borderRadius: 14,
    background: "var(--card-bg)", border: "1px solid var(--border)",
    textAlign: "center", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 6,
  },
  statValue: {
    fontSize: 18, fontWeight: 800, color: "var(--text)",
    fontVariantNumeric: "tabular-nums",
  },
  statLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },
  completionWrap: { },
  completionLabel: {
    display: "flex", justifyContent: "space-between",
    fontSize: 13, color: "var(--text-secondary)", marginBottom: 6, fontWeight: 600,
  },
  progressTrack: {
    height: 10, background: "var(--bg-tertiary)",
    borderRadius: 8, overflow: "hidden",
  },
  progressFill: {
    height: "100%", background: "var(--gradient-primary, var(--primary))",
    transition: "width 0.6s ease",
  },
  section: { },
  sectionTitle: {
    fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 10px",
  },
  exerciseList: { display: "flex", flexDirection: "column", gap: 6 },
  exerciseRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: 12, background: "var(--card-bg)",
    border: "1px solid var(--border)", borderRadius: 10,
  },
  exerciseInfo: { flex: 1, minWidth: 0 },
  exerciseName: {
    fontSize: 13, fontWeight: 600, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  exerciseMeta: { fontSize: 11, color: "var(--text-muted)", marginTop: 2 },
  exerciseBadge: {
    width: 38, height: 26, borderRadius: 8,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
  },
  saveStatus: {
    textAlign: "center", padding: "8px",
    fontSize: 12, fontWeight: 600,
  },
  actions: { display: "flex", gap: 10 },
  btnSecondary: {
    flex: 1, padding: "14px", borderRadius: 12,
    background: "var(--card-bg)", color: "var(--text)",
    border: "1px solid var(--border)", cursor: "pointer",
    fontSize: 14, fontWeight: 600, fontFamily: "inherit",
  },
  btnPrimary: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "14px", borderRadius: 12,
    background: "var(--gradient-primary, var(--primary))",
    color: "white", border: "none", cursor: "pointer",
    fontSize: 14, fontWeight: 700, fontFamily: "inherit",
    boxShadow: "0 4px 12px var(--btn-primary-shadow, rgba(0,0,0,0.2))",
  },
};
