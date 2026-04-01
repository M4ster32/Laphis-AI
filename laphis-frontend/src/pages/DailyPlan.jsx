import { useState, useEffect, useRef } from "react";
import { useApp } from "../hooks/useApp";
import { useToast } from "../components/Toast";
import ApiService from "../services/api";
import EmptyState from "../components/EmptyState";
import {
  CalendarClock, Dumbbell, UtensilsCrossed, Clock,
  Zap, Send, ChevronDown, ChevronUp, Flame,
  Droplets, Sparkles, RefreshCw,
} from "lucide-react";

const QUICK_ADJUSTS = [
  { label: "⏱️ Só 30 min", value: "Só tenho 30 minutos para treinar" },
  { label: "🏠 Em casa", value: "Vou treinar em casa sem equipamento" },
  { label: "🧘 Descanso", value: "Hoje não vou treinar, é dia de descanso" },
  { label: "🌱 Vegetariano", value: "Sou vegetariano, quero refeições sem carne" },
  { label: "📈 + Comida", value: "Estou com mais fome, quero comer mais" },
  { label: "📉 - Comida", value: "Quero comer menos hoje, refeições mais leves" },
];

export default function DailyPlan() {
  const { profile } = useApp();
  const toast = useToast();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [constraint, setConstraint] = useState("");
  const [showWorkout, setShowWorkout] = useState(true);
  const [showMeals, setShowMeals] = useState(true);
  const inputRef = useRef(null);

  const todayStr = new Date().toISOString().split("T")[0];

  const formatDate = (str) => {
    const d = new Date(str + "T12:00:00");
    return d.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" });
  };

  useEffect(() => {
    if (profile) loadPlan();
  }, [profile]);

  const loadPlan = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getDailyPlan(profile.id, todayStr);
      setPlan(data);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!profile) return;
    setGenerating(true);
    try {
      const data = await ApiService.generateDailyPlan(profile.id, todayStr);
      setPlan(data);
      toast.success("Plano gerado! 🎯");
    } catch (err) {
      toast.error(err.message || "Erro ao gerar plano");
    } finally {
      setGenerating(false);
    }
  };

  const handleAdjust = async (text = null) => {
    const msg = (text || constraint).trim();
    if (!msg || !plan) return;
    setAdjusting(true);
    setConstraint("");
    try {
      const data = await ApiService.adjustDailyPlan(plan.id, msg);
      setPlan(data);
      toast.success("Plano ajustado! ✨");
    } catch (err) {
      toast.error(err.message || "Erro ao ajustar");
    } finally {
      setAdjusting(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAdjust();
    }
  };

  if (!profile) {
    return (
      <div style={s.page}>
        <EmptyState
          icon="📋"
          title="Cria o teu perfil primeiro"
          description="Para gerar planos diários personalizados."
          actionLabel="Criar Perfil"
          actionTo="/profile"
        />
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.headerTop}>
          <CalendarClock size={22} color="#fff" strokeWidth={1.5} />
          <h1 style={s.headerTitle}>Plano do Dia</h1>
        </div>
        <p style={s.headerDate}>{formatDate(todayStr)}</p>
      </div>

      {/* Content */}
      {loading ? (
        <div style={s.loadingWrap}>
          <RefreshCw size={24} className="spin" color="var(--primary)" />
          <span style={s.loadingText}>A carregar plano...</span>
        </div>
      ) : !plan ? (
        <div style={s.emptyWrap}>
          <div style={s.emptyIcon}>📋</div>
          <h3 style={s.emptyTitle}>
            Sem plano para hoje
          </h3>
          <p style={s.emptyText}>
            A IA vai criar um plano completo de treino e refeições adaptado ao teu perfil.
          </p>
          <button style={s.generateBtn} onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <><RefreshCw size={18} className="spin" /> A gerar...</>
            ) : (
              <><Sparkles size={18} /> Gerar Plano</>
            )}
          </button>
        </div>
      ) : (
        <>
          {/* ====== WORKOUT SECTION ====== */}
          <div style={s.section}>
            <button style={s.sectionHeader} onClick={() => setShowWorkout((v) => !v)}>
              <div style={s.sectionHeaderLeft}>
                <div style={{ ...s.sectionIcon, background: "var(--primary-bg)" }}>
                  <Dumbbell size={18} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={s.sectionTitle}>{plan.workout?.title || "Treino"}</h3>
                  <span style={s.sectionSub}>
                    {plan.workout?.duration_min > 0
                      ? `${plan.workout.duration_min} min • ${plan.workout?.exercises?.length || 0} exercícios`
                      : plan.workout?.focus || "Dia de descanso"}
                  </span>
                </div>
              </div>
              {showWorkout ? (
                <ChevronUp size={18} color="var(--text-muted)" />
              ) : (
                <ChevronDown size={18} color="var(--text-muted)" />
              )}
            </button>

            {showWorkout && (
              <div style={s.sectionBody}>
                {plan.workout?.warmup && (
                  <div style={s.warmupTag}>🔥 {plan.workout.warmup}</div>
                )}

                {plan.workout?.exercises?.length > 0 ? (
                  <div style={s.exerciseList}>
                    {plan.workout.exercises.map((ex, i) => (
                      <div key={i} style={s.exerciseItem}>
                        <div style={s.exerciseNum}>{i + 1}</div>
                        <div style={s.exerciseInfo}>
                          <span style={s.exerciseName}>{ex.name}</span>
                          <span style={s.exerciseDetail}>
                            {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ex.reps || ""}
                            {ex.rest_sec ? ` • ${ex.rest_sec}s descanso` : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={s.restDay}>🧘 Dia de descanso — foca-te na recuperação!</p>
                )}

                {plan.workout?.cooldown && (
                  <div style={s.cooldownTag}>❄️ {plan.workout.cooldown}</div>
                )}

                {plan.workout?.tips?.length > 0 && (
                  <div style={s.tipsWrap}>
                    {plan.workout.tips.map((tip, i) => (
                      <p key={i} style={s.tip}>💡 {tip}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ====== MEALS SECTION ====== */}
          <div style={s.section}>
            <button style={s.sectionHeader} onClick={() => setShowMeals((v) => !v)}>
              <div style={s.sectionHeaderLeft}>
                <div style={{ ...s.sectionIcon, background: "var(--cta-bg)" }}>
                  <UtensilsCrossed size={18} color="var(--p2)" />
                </div>
                <div>
                  <h3 style={s.sectionTitle}>Refeições</h3>
                  <span style={s.sectionSub}>
                    ~{plan.meals?.total_calories || 0} cal • {plan.meals?.total_protein_g || 0}g proteína
                  </span>
                </div>
              </div>
              {showMeals ? (
                <ChevronUp size={18} color="var(--text-muted)" />
              ) : (
                <ChevronDown size={18} color="var(--text-muted)" />
              )}
            </button>

            {showMeals && (
              <div style={s.sectionBody}>
                {plan.meals?.meals?.map((meal, i) => (
                  <div key={i} style={s.mealCard}>
                    <div style={s.mealHeader}>
                      <span style={s.mealType}>{meal.type}</span>
                      <span style={s.mealTime}>{meal.time}</span>
                    </div>
                    <div style={s.mealFoods}>
                      {meal.foods?.map((food, j) => (
                        <span key={j} style={s.foodItem}>• {food}</span>
                      ))}
                    </div>
                    <div style={s.mealMeta}>
                      <span style={s.mealCal}>
                        <Flame size={12} /> {meal.calories} cal
                      </span>
                      <span style={s.mealProtein}>💪 {meal.protein_g}g prot</span>
                    </div>
                  </div>
                ))}

                {plan.meals?.hydration && (
                  <div style={s.hydrationTag}>
                    <Droplets size={14} color="var(--primary)" />
                    <span>{plan.meals.hydration}</span>
                  </div>
                )}

                {plan.meals?.tips?.length > 0 && (
                  <div style={s.tipsWrap}>
                    {plan.meals.tips.map((tip, i) => (
                      <p key={i} style={s.tip}>💡 {tip}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ====== ADJUSTMENTS HISTORY ====== */}
          {plan.adjustments?.length > 0 && (
            <div style={s.adjustHistory}>
              <h4 style={s.adjustHistoryTitle}>
                <Zap size={16} color="var(--primary)" /> Ajustes ({plan.adjustments.length})
              </h4>
              {plan.adjustments.map((adj, i) => (
                <div key={i} style={s.adjustItem}>
                  <p style={s.adjustConstraint}>💬 &ldquo;{adj.constraint}&rdquo;</p>
                  {adj.changes?.map((ch, j) => (
                    <p key={j} style={s.adjustChange}>{ch}</p>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* ====== QUICK ADJUST CHIPS ====== */}
          <div style={s.quickRow}>
            {QUICK_ADJUSTS.map((qa, i) => (
              <button
                key={i}
                style={s.quickChip}
                onClick={() => handleAdjust(qa.value)}
                disabled={adjusting}
              >
                {qa.label}
              </button>
            ))}
          </div>

          {/* ====== ADJUST INPUT ====== */}
          <div style={s.adjustInputWrap}>
            <div style={s.inputRow}>
              <textarea
                ref={inputRef}
                style={s.textInput}
                value={constraint}
                onChange={(e) => setConstraint(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Como queres ajustar? Ex: 'Só tenho 30 min'"
                rows={1}
                disabled={adjusting}
              />
              <button
                style={{
                  ...s.sendBtn,
                  opacity: constraint.trim() && !adjusting ? 1 : 0.5,
                }}
                onClick={() => handleAdjust()}
                disabled={!constraint.trim() || adjusting}
              >
                {adjusting ? (
                  <RefreshCw size={18} className="spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>

          {/* ====== REGENERATE ====== */}
          <button style={s.regenBtn} onClick={handleGenerate} disabled={generating}>
            <RefreshCw size={14} className={generating ? "spin" : ""} />
            Gerar novo plano
          </button>
        </>
      )}
    </div>
  );
}

/* ==================== STYLES ==================== */
const s = {
  page: {
    padding: "0 16px 100px",
    maxWidth: 600,
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
  },

  /* Header */
  header: {
    background: "var(--gradient-primary)",
    borderRadius: "0 0 var(--radius) var(--radius)",
    padding: "20px 20px 16px",
    margin: "0 -16px 16px",
    color: "#fff",
  },
  headerTop: { display: "flex", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: 800, margin: 0, color: "#fff" },
  headerDate: {
    fontSize: 13,
    opacity: 0.85,
    margin: "4px 0 0",
    textTransform: "capitalize",
  },

  /* Loading */
  loadingWrap: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "60px 20px",
  },
  loadingText: { fontSize: 14, color: "var(--text-muted)" },

  /* Empty */
  emptyWrap: {
    textAlign: "center",
    padding: "40px 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 },
  emptyText: {
    fontSize: 14,
    color: "var(--text-muted)",
    maxWidth: 300,
    lineHeight: 1.5,
    margin: 0,
  },
  generateBtn: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: "12px 28px",
    borderRadius: 16,
    background: "var(--gradient-primary)",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 16px var(--btn-primary-shadow)",
    transition: "opacity 0.15s",
  },

  /* Sections */
  section: {
    background: "var(--card-bg)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
    marginBottom: 12,
    overflow: "hidden",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "14px 16px",
    width: "100%",
    border: "none",
    background: "none",
    cursor: "pointer",
    textAlign: "left",
  },
  sectionHeaderLeft: { display: "flex", alignItems: "center", gap: 12 },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionTitle: { fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 },
  sectionSub: { fontSize: 12, color: "var(--text-muted)", display: "block", marginTop: 2 },
  sectionBody: { padding: "0 16px 16px" },

  /* Workout */
  warmupTag: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(255, 152, 0, 0.08)",
    fontSize: 12,
    color: "var(--text-secondary)",
    marginBottom: 12,
    fontWeight: 500,
  },
  exerciseList: { display: "flex", flexDirection: "column", gap: 8 },
  exerciseItem: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 12px",
    borderRadius: 10,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-light)",
  },
  exerciseNum: {
    width: 28,
    height: 28,
    borderRadius: 8,
    background: "var(--primary-bg)",
    color: "var(--primary)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    fontWeight: 700,
    flexShrink: 0,
  },
  exerciseInfo: { display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  exerciseName: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  exerciseDetail: { fontSize: 11, color: "var(--text-muted)" },
  cooldownTag: {
    padding: "8px 12px",
    borderRadius: 8,
    background: "rgba(33, 150, 243, 0.08)",
    fontSize: 12,
    color: "var(--text-secondary)",
    marginTop: 12,
    fontWeight: 500,
  },
  restDay: {
    textAlign: "center",
    padding: "24px 12px",
    fontSize: 14,
    color: "var(--text-secondary)",
    fontStyle: "italic",
  },
  tipsWrap: { marginTop: 12, display: "flex", flexDirection: "column", gap: 4 },
  tip: { fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.5 },

  /* Meals */
  mealCard: {
    padding: "12px",
    borderRadius: 10,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-light)",
    marginBottom: 8,
  },
  mealHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealType: { fontSize: 14, fontWeight: 700, color: "var(--text)" },
  mealTime: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  mealFoods: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 },
  foodItem: { fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 },
  mealMeta: { display: "flex", gap: 12 },
  mealCal: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "var(--danger)",
  },
  mealProtein: { fontSize: 11, fontWeight: 600, color: "var(--primary)" },
  hydrationTag: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 12px",
    borderRadius: 10,
    background: "rgba(33, 150, 243, 0.06)",
    fontSize: 13,
    color: "var(--text-secondary)",
    marginTop: 4,
    fontWeight: 500,
  },

  /* Adjustments History */
  adjustHistory: {
    background: "var(--card-bg)",
    borderRadius: "var(--radius)",
    border: "1px solid var(--border)",
    padding: "14px 16px",
    marginBottom: 12,
  },
  adjustHistoryTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text)",
    margin: "0 0 10px",
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  adjustItem: {
    padding: "10px 12px",
    borderRadius: 8,
    background: "var(--bg-surface)",
    border: "1px solid var(--border-light)",
    marginBottom: 6,
  },
  adjustConstraint: {
    fontSize: 13,
    fontWeight: 600,
    color: "var(--text)",
    margin: "0 0 4px",
  },
  adjustChange: {
    fontSize: 12,
    color: "var(--text-secondary)",
    margin: "2px 0",
    lineHeight: 1.4,
  },

  /* Quick Adjust */
  quickRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  quickChip: {
    padding: "7px 12px",
    borderRadius: 20,
    background: "var(--card-bg)",
    border: "1px solid var(--border)",
    fontSize: 12,
    color: "var(--text-secondary)",
    cursor: "pointer",
    fontWeight: 500,
    transition: "background 0.15s, border-color 0.15s",
    boxShadow: "var(--shadow)",
  },

  /* Adjust Input */
  adjustInputWrap: {
    position: "sticky",
    bottom: 72,
    zIndex: 10,
    background: "var(--bg)",
    padding: "8px 0",
    borderTop: "1px solid var(--border-light)",
  },
  inputRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  textInput: {
    flex: 1,
    border: "1px solid var(--border)",
    borderRadius: 20,
    padding: "10px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    background: "var(--card-bg)",
    color: "var(--text)",
    resize: "none",
    outline: "none",
    lineHeight: 1.4,
    transition: "border-color 0.2s",
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: "50%",
    background: "var(--gradient-primary)",
    color: "white",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.15s",
    boxShadow: "0 2px 8px var(--btn-primary-shadow)",
    flexShrink: 0,
  },

  /* Regenerate */
  regenBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    width: "100%",
    padding: "10px",
    borderRadius: 10,
    border: "1px dashed var(--border)",
    background: "none",
    color: "var(--text-muted)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
};
