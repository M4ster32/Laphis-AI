import { useState, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Zap, PieChart as PieChartIcon, Dumbbell, UtensilsCrossed, Droplets, Wind, Clock, Flame, ClipboardList, FileText, Activity } from "lucide-react";

const MOOD_MAP = {
  calm: { label: "Calmo", color: "#3B82F6" },
  happy: { label: "Feliz", color: "#F59E0B" },
  stressed: { label: "Stressado", color: "#EF4444" },
  anxious: { label: "Ansioso", color: "#EC4899" },
  tired: { label: "Cansado", color: "#8B5CF6" },
  energetic: { label: "Energético", color: "#10B981" },
  neutral: { label: "Neutro", color: "#94A3B8" },
};

const CHART_COLORS = ["#FF6B35", "#10B981", "#3B82F6", "#8B5CF6", "#EF4444", "#F59E0B", "#EC4899"];

export default function Reports() {
  const { profile } = useApp();
  const [report, setReport] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [data, logs, plans] = await Promise.all([
        ApiService.getReportSummary(),
        ApiService.getLogs(50, 0).catch(() => []),
        profile?.id ? ApiService.getPlans(profile.id).catch(() => []) : Promise.resolve([]),
      ]);
      setReport(data);
      const logsArr = Array.isArray(logs) ? logs : logs?.logs || [];
      setRecentLogs(logsArr);
      const plansArr = Array.isArray(plans) ? plans : plans?.plans || [];
      setActivePlans(plansArr.filter(p => p.status === "active"));
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <span className="loading-text">A gerar relatório...</span>
      </div>
    );
  }

  if (!report) {
    return (
      <div style={s.page}>
        <div style={s.emptyCard}>
          <h3 style={s.emptyTitle}>Sem dados suficientes</h3>
          <p style={s.emptyText}>Começa a registar treinos, refeições e sessões zen para ver o teu relatório.</p>
        </div>
      </div>
    );
  }

  const SECTIONS = [
    { key: "overview", label: "Geral", icon: PieChartIcon },
    { key: "fitness", label: "Fitness", icon: TrendingUp },
    { key: "zen", label: "Zen", icon: Wind },
    { key: "activity", label: "Atividade", icon: Activity },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={s.tooltip}>
        <p style={s.tooltipLabel}>{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ ...s.tooltipValue, color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.reportHeader}>
        <div style={s.reportHeaderBg}>
          <h1 style={s.reportTitle}>Relatório</h1>
          <p style={s.reportSubtitle}>
            {profile?.name ? `Dados de ${profile.name}` : "O teu progresso completo"}
          </p>
          {report.member_since && (
            <p style={s.memberSince}>Membro desde {report.member_since}</p>
          )}
        </div>
      </div>

      {/* Big Stats Row */}
      <div style={s.bigStatsRow}>
        <div style={s.bigStatCard}>
          <Dumbbell size={18} color="var(--primary)" strokeWidth={1.5} />
          <span style={s.bigStatValue}>{report.total_workouts}</span>
          <span style={s.bigStatLabel}>Treinos</span>
        </div>
        <div style={s.bigStatCard}>
          <UtensilsCrossed size={18} color="var(--accent)" strokeWidth={1.5} />
          <span style={s.bigStatValue}>{report.total_meals}</span>
          <span style={s.bigStatLabel}>Refeições</span>
        </div>
        <div style={s.bigStatCard}>
          <Wind size={18} color="var(--accent-zen, #8C441B)" strokeWidth={1.5} />
          <span style={s.bigStatValue}>{report.total_zen_sessions}</span>
          <span style={s.bigStatLabel}>Zen</span>
        </div>
        <div style={s.bigStatCard}>
          <FileText size={18} color="#BF6734" strokeWidth={1.5} />
          <span style={s.bigStatValue}>{report.total_plans}</span>
          <span style={s.bigStatLabel}>Planos</span>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={s.tabBar}>
        {SECTIONS.map((sec) => (
          <button
            key={sec.key}
            onClick={() => setActiveSection(sec.key)}
            style={{
              ...s.tabBtn,
              background: activeSection === sec.key ? "var(--primary)" : "transparent",
              color: activeSection === sec.key ? "white" : "var(--text-secondary)",
              fontWeight: activeSection === sec.key ? 600 : 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <sec.icon size={18} strokeWidth={1.5} />
            {sec.label}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW SECTION ===== */}
      {activeSection === "overview" && (
        <>
          {/* Time Invested */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <Clock size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Tempo Investido
            </h4>
            <div style={s.timeGrid}>
              <div style={s.timeItem}>
                <span style={s.timeValue}>{report.total_workout_minutes}</span>
                <span style={s.timeLabel}>min treino</span>
              </div>
              <div style={s.timeItem}>
                <span style={s.timeValue}>{report.total_zen_minutes}</span>
                <span style={s.timeLabel}>min zen</span>
              </div>
              <div style={s.timeItem}>
                <span style={s.timeValue}>{report.total_workout_minutes + report.total_zen_minutes}</span>
                <span style={s.timeLabel}>min total</span>
              </div>
            </div>
          </div>

          {/* Averages */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <TrendingUp size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Médias
            </h4>
            <div style={s.avgGrid}>
              <div style={s.avgItem}>
                <span style={{ ...s.avgValue, color: "var(--accent-sport)" }}>{report.avg_workout_duration}'</span>
                <span style={s.avgLabel}>min/treino</span>
              </div>
              <div style={s.avgItem}>
                <span style={{ ...s.avgValue, color: "var(--accent-zen)" }}>{report.avg_calories_per_day}</span>
                <span style={s.avgLabel}>cal/dia</span>
              </div>
            </div>
          </div>

          {/* Streaks */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <Flame size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Streaks
            </h4>
            <div style={s.streakGrid}>
              <div style={s.streakItem}>
                <span style={s.streakValue}>{report.workout_streak}</span>
                <span style={s.streakLabel}>Dias treino</span>
              </div>
              <div style={s.streakItem}>
                <span style={s.streakValue}>{report.zen_streak}</span>
                <span style={s.streakLabel}>Dias zen</span>
              </div>
            </div>
          </div>

          {/* Calories total */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <UtensilsCrossed size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Calorias Totais
            </h4>
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <span style={{ fontSize: 36, fontWeight: 700, color: "var(--primary)" }}>
                {report.total_calories.toLocaleString()}
              </span>
              <span style={{ display: "block", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                calorias registadas
              </span>
            </div>
          </div>
        </>
      )}

      {/* ===== FITNESS SECTION ===== */}
      {activeSection === "fitness" && (
        <>
          {/* Workouts by week chart */}
          <div style={s.chartCard}>
            <h4 style={s.cardTitle}> Treinos por Semana</h4>
            {report.workouts_by_week?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.workouts_by_week} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Treinos" fill="#D9751E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.noData}>Sem dados de treinos</p>
            )}
          </div>

          {/* Workout Duration by week */}
          <div style={s.chartCard}>
            <h4 style={s.cardTitle}>Duração Total (min/semana)</h4>
            {report.workouts_by_week?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={report.workouts_by_week}>
                  <defs>
                    <linearGradient id="durGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D9751E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D9751E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Minutos" stroke="#D9751E" fill="url(#durGrad)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.noData}>Sem dados</p>
            )}
          </div>

          {/* Calories by week */}
          <div style={s.chartCard}>
            <h4 style={s.cardTitle}> Calorias por Semana</h4>
            {report.calories_by_week?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.calories_by_week} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="total" name="Calorias" fill="#8C441B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.noData}>Sem dados de refeições</p>
            )}
          </div>
        </>
      )}

      {/* ===== ZEN SECTION ===== */}
      {activeSection === "zen" && (
        <>
          {/* Zen stats */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>Resumo Zen</h4>
            <div style={s.zenStatsGrid}>
              <div style={s.zenStatItem}>
                <span style={{ ...s.zenStatValue, color: "var(--accent-zen)" }}>{report.total_zen_sessions}</span>
                <span style={s.zenStatLabel}>Sessões</span>
              </div>
              <div style={s.zenStatItem}>
                <span style={{ ...s.zenStatValue, color: "var(--accent-zen)" }}>{report.total_zen_minutes}'</span>
                <span style={s.zenStatLabel}>Minutos</span>
              </div>
              <div style={s.zenStatItem}>
                <span style={{ ...s.zenStatValue, color: "var(--accent-sport)" }}>{report.zen_streak}</span>
                <span style={s.zenStatLabel}>Streak</span>
              </div>
            </div>
          </div>

          {/* Zen by week */}
          <div style={s.chartCard}>
            <h4 style={s.cardTitle}>Sessões Zen por Semana</h4>
            {report.zen_by_week?.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={report.zen_by_week} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis hide allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Sessões" fill="#8C441B" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.noData}>Sem dados zen</p>
            )}
          </div>

          {/* Mood Distribution */}
          {report.mood_distribution?.length > 0 && (
            <div style={s.chartCard}>
              <h4 style={s.cardTitle}>Distribuição de Humor (pós-sessão)</h4>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={report.mood_distribution.map((d, i) => ({
                        ...d,
                        name: MOOD_MAP[d.mood]?.label || d.mood,
                        color: MOOD_MAP[d.mood]?.color || CHART_COLORS[i % CHART_COLORS.length],
                      }))}
                      cx="50%" cy="50%"
                      innerRadius={45} outerRadius={75}
                      dataKey="count" paddingAngle={4}
                    >
                      {report.mood_distribution.map((d, i) => (
                        <Cell
                          key={i}
                          fill={MOOD_MAP[d.mood]?.color || CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={s.moodLegend}>
                {report.mood_distribution.map((d, i) => {
                  const mood = MOOD_MAP[d.mood];
                  return (
                    <div key={i} style={s.moodLegendItem}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: mood?.color || CHART_COLORS[i % CHART_COLORS.length], display: "inline-block" }} />
                      <span style={s.moodLegendText}>
                        {mood?.label || d.mood}: {d.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Most Common Moods */}
          {(report.most_common_mood_before || report.most_common_mood_after) && (
            <div style={s.card}>
              <h4 style={s.cardTitle}>Humor Mais Frequente</h4>
              <div style={s.moodFreqGrid}>
                {report.most_common_mood_before && (
                  <div style={s.moodFreqItem}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: MOOD_MAP[report.most_common_mood_before]?.color || "var(--text)" }}>
                      {MOOD_MAP[report.most_common_mood_before]?.label || report.most_common_mood_before}
                    </span>
                    <span style={s.moodFreqLabel}>Antes</span>
                  </div>
                )}
                {report.most_common_mood_after && (
                  <div style={s.moodFreqItem}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: MOOD_MAP[report.most_common_mood_after]?.color || "var(--text)" }}>
                      {MOOD_MAP[report.most_common_mood_after]?.label || report.most_common_mood_after}
                    </span>
                    <span style={s.moodFreqLabel}>Depois</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== ACTIVITY SECTION — What was used/consumed ===== */}
      {activeSection === "activity" && (
        <>
          {/* Active Plans */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <FileText size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Planos Ativos
            </h4>
            {activePlans.length > 0 ? (
              <div style={s.activityList}>
                {activePlans.slice(0, 5).map((plan, idx) => {
                  const typeIcons = { training: Dumbbell, nutrition: UtensilsCrossed, combined: Zap };
                  const typeColors = { training: "var(--primary)", nutrition: "var(--accent)", combined: "#BF6734" };
                  const typeLabels = { training: "Treino", nutrition: "Nutrição", combined: "Misto" };
                  const PlanIcon = typeIcons[plan.type] || FileText;
                  return (
                    <div key={idx} style={s.activityItem}>
                      <div style={{ ...s.activityDot, background: `${typeColors[plan.type] || "var(--primary)"}15` }}>
                        <PlanIcon size={16} color={typeColors[plan.type] || "var(--primary)"} strokeWidth={1.5} />
                      </div>
                      <div style={s.activityInfo}>
                        <span style={s.activityTitle}>{plan.title || "Plano sem título"}</span>
                        <span style={s.activityMeta}>{typeLabels[plan.type] || plan.type}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={s.noData}>Sem planos ativos</p>
            )}
          </div>

          {/* Recent Workouts */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <Dumbbell size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Últimos Treinos
            </h4>
            {(() => {
              const workouts = recentLogs.filter(l => l.log_type === "treino" || l.type === "workout").slice(0, 6);
              return workouts.length > 0 ? (
                <div style={s.activityList}>
                  {workouts.map((log, idx) => (
                    <div key={idx} style={s.activityItem}>
                      <div style={{ ...s.activityDot, background: "rgba(217, 117, 30, 0.08)" }}>
                        <Dumbbell size={16} color="var(--primary)" strokeWidth={1.5} />
                      </div>
                      <div style={s.activityInfo}>
                        <span style={s.activityTitle}>{log.description || "Treino"}</span>
                        <span style={s.activityMeta}>
                          {log.duration_min ? `${log.duration_min} min` : ""}
                          {log.duration_min && log.calories ? " · " : ""}
                          {log.calories ? `${log.calories} cal` : ""}
                          {!log.duration_min && !log.calories ? (log.date || "—") : ""}
                        </span>
                      </div>
                      <span style={s.activityDate}>{log.date || log.created_at?.split("T")[0] || ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={s.noData}>Sem treinos registados</p>
              );
            })()}
          </div>

          {/* Recent Meals */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <UtensilsCrossed size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Últimas Refeições
            </h4>
            {(() => {
              const meals = recentLogs.filter(l => l.log_type === "refeicao" || l.type === "meal").slice(0, 6);
              return meals.length > 0 ? (
                <div style={s.activityList}>
                  {meals.map((log, idx) => (
                    <div key={idx} style={s.activityItem}>
                      <div style={{ ...s.activityDot, background: "rgba(140, 68, 27, 0.08)" }}>
                        <UtensilsCrossed size={16} color="var(--accent)" strokeWidth={1.5} />
                      </div>
                      <div style={s.activityInfo}>
                        <span style={s.activityTitle}>{log.foods || log.meal_type || "Refeição"}</span>
                        <span style={s.activityMeta}>
                          {log.calories ? `${log.calories} cal` : ""}
                          {log.meal_type ? ` · ${log.meal_type}` : ""}
                        </span>
                      </div>
                      <span style={s.activityDate}>{log.date || log.created_at?.split("T")[0] || ""}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={s.noData}>Sem refeições registadas</p>
              );
            })()}
          </div>

          {/* Usage Summary */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <ClipboardList size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Resumo de Utilização
            </h4>
            <div style={s.usageSummary}>
              <div style={s.usageItem}>
                <div style={s.usageIcon}><Dumbbell size={20} color="var(--primary)" strokeWidth={1.5} /></div>
                <div style={s.usageInfo}>
                  <span style={s.usageValue}>{report.total_workouts} treinos</span>
                  <span style={s.usageSub}>{report.total_workout_minutes} min totais</span>
                </div>
              </div>
              <div style={s.usageDivider} />
              <div style={s.usageItem}>
                <div style={s.usageIcon}><UtensilsCrossed size={20} color="var(--accent)" strokeWidth={1.5} /></div>
                <div style={s.usageInfo}>
                  <span style={s.usageValue}>{report.total_meals} refeições</span>
                  <span style={s.usageSub}>{report.total_calories.toLocaleString()} cal totais</span>
                </div>
              </div>
              <div style={s.usageDivider} />
              <div style={s.usageItem}>
                <div style={s.usageIcon}><Wind size={20} color="var(--accent-zen, #8C441B)" strokeWidth={1.5} /></div>
                <div style={s.usageInfo}>
                  <span style={s.usageValue}>{report.total_zen_sessions} sessões zen</span>
                  <span style={s.usageSub}>{report.total_zen_minutes} min meditação</span>
                </div>
              </div>
              <div style={s.usageDivider} />
              <div style={s.usageItem}>
                <div style={s.usageIcon}><FileText size={20} color="#BF6734" strokeWidth={1.5} /></div>
                <div style={s.usageInfo}>
                  <span style={s.usageValue}>{report.total_plans} planos criados</span>
                  <span style={s.usageSub}>{activePlans.length} ativos agora</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const s = {
  page: { animation: "fadeUp 0.35s ease" },

  /* Report Header */
  reportHeader: { marginBottom: 20 },
  reportHeaderBg: {
    background: "var(--gradient-primary)",
    borderRadius: "var(--radius)",
    padding: "28px 24px",
    textAlign: "center",
    boxShadow: "0 4px 16px rgba(217, 117, 30, 0.15)",
  },
  reportTitle: { fontSize: 22, fontWeight: 700, color: "white", margin: "0 0 4px" },
  reportSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 500 },
  memberSince: { fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "8px 0 0", fontWeight: 500 },

  /* Big Stats */
  bigStatsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 },
  bigStatCard: {
    background: "var(--card-bg)", borderRadius: "var(--radius-sm)", padding: "14px 6px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: "var(--shadow)", border: "1px solid var(--border)",
  },
  bigStatValue: { fontSize: 20, fontWeight: 700, color: "var(--text)" },
  bigStatLabel: { fontSize: 10, color: "var(--text-muted)", fontWeight: 600 },

  /* Tabs */
  tabBar: {
    display: "flex", gap: 4, marginBottom: 20,
    background: "var(--card-bg)", borderRadius: 16, padding: 4,
    boxShadow: "var(--shadow)", border: "1px solid var(--border)",
  },
  tabBtn: {
    flex: 1, padding: "10px 8px", borderRadius: 12, border: "none",
    fontSize: 13, cursor: "pointer", transition: "background 0.2s, color 0.2s", textAlign: "center",
  },

  /* Card */
  card: {
    background: "var(--card-bg)", borderRadius: "var(--radius)", padding: "20px",
    boxShadow: "var(--shadow)", marginBottom: 14, border: "1px solid var(--border)",
  },
  cardTitle: { fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 16px" },

  /* Chart Card */
  chartCard: {
    background: "var(--card-bg)", borderRadius: "var(--radius)", padding: "20px",
    boxShadow: "var(--shadow)", marginBottom: 14, border: "1px solid var(--border)",
  },

  /* Time */
  timeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  timeItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "12px 8px", background: "var(--card-bg)", borderRadius: "var(--radius-xs)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  timeValue: { fontSize: 22, fontWeight: 700, color: "var(--primary)" },
  timeLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },

  /* Averages */
  avgGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 },
  avgItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "16px 8px", background: "var(--card-bg)", borderRadius: "var(--radius-xs)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  avgValue: { fontSize: 28, fontWeight: 700 },
  avgLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },

  /* Streaks */
  streakGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 },
  streakItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "16px 8px", background: "var(--card-bg)", borderRadius: "var(--radius-xs)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  streakValue: { fontSize: 32, fontWeight: 700, color: "var(--text)" },
  streakLabel: { fontSize: 12, color: "var(--text-muted)", fontWeight: 600 },

  /* Zen stats */
  zenStatsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  zenStatItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "12px 8px", background: "var(--card-bg)", borderRadius: "var(--radius-xs)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  zenStatValue: { fontSize: 22, fontWeight: 700 },
  zenStatLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },

  /* Mood Legend */
  moodLegend: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginTop: 8 },
  moodLegendItem: { display: "flex", alignItems: "center", gap: 6 },
  moodLegendText: { fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" },

  /* Mood Frequency */
  moodFreqGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 },
  moodFreqItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "16px 8px", background: "var(--card-bg)", borderRadius: "var(--radius-xs)",
    border: "1px solid var(--border)",
    boxShadow: "var(--shadow)",
  },
  moodFreqLabel: { fontSize: 12, color: "var(--text-muted)", fontWeight: 600 },
  moodFreqText: { fontSize: 14, fontWeight: 700, color: "var(--text)" },

  /* Tooltip */
  tooltip: {
    background: "var(--card-bg)", borderRadius: 14, padding: "10px 14px",
    boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
  },
  tooltipLabel: { fontSize: 12, fontWeight: 700, color: "var(--text)", margin: "0 0 4px" },
  tooltipValue: { fontSize: 12, fontWeight: 500, margin: 0 },

  /* No data */
  noData: { textAlign: "center", padding: "24px", fontSize: 13, color: "var(--text-muted)", fontWeight: 500 },

  /* Activity list */
  activityList: { display: "flex", flexDirection: "column", gap: 8 },
  activityItem: {
    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
    background: "var(--bg)", borderRadius: "var(--radius-xs)",
  },
  activityDot: {
    width: 34, height: 34, borderRadius: 10,
    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  activityInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2, minWidth: 0 },
  activityTitle: {
    fontSize: 13, fontWeight: 600, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  activityMeta: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  activityDate: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500, flexShrink: 0 },

  /* Usage summary */
  usageSummary: { display: "flex", flexDirection: "column", gap: 0 },
  usageItem: { display: "flex", alignItems: "center", gap: 14, padding: "14px 0" },
  usageIcon: {
    width: 40, height: 40, borderRadius: 12,
    background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  usageInfo: { display: "flex", flexDirection: "column", gap: 2 },
  usageValue: { fontSize: 14, fontWeight: 700, color: "var(--text)" },
  usageSub: { fontSize: 12, color: "var(--text-muted)", fontWeight: 500 },
  usageDivider: { height: 1, background: "var(--border)" },

  /* Empty */
  emptyCard: {
    textAlign: "center", background: "var(--card-bg)", borderRadius: "var(--radius)",
    padding: "48px 24px", boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "12px 0 8px" },
  emptyText: { fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 },
};
