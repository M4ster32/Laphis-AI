import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { SkeletonDashboard } from "../components/Skeleton";
import { AvatarDisplay } from "../components/AvatarPicker";
import Modal from "../components/Modal";
import { Wind, Zap, Droplets, TrendingUp, TrendingDown, Bot, ClipboardList, BarChart3, ChevronRight, Activity, Sparkles, ArrowRight, Lightbulb, Dumbbell, UtensilsCrossed, Plus, Flame } from "lucide-react";
import {
 AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
 Tooltip, ResponsiveContainer,
} from "recharts";

const motivationalQuotes = [
 "Stay consistent. Small progress every day.",
 "Discipline is choosing what you want most over what you want now.",
 "Your body achieves what your mind believes.",
 "The only bad workout is the one that didn't happen.",
 "Progress, not perfection.",
 "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
 "Não desistas. O início é sempre o mais difícil.",
 "O único treino mau é aquele que não fizeste.",
 "Cuida do teu corpo, é o único lugar onde tens de viver.",
];

const CHART_COLORS = {
 training: "var(--primary)",
 trainingLight: "var(--primary-bg)",
 nutrition: "var(--p2)",
 nutritionLight: "var(--cta-bg)",
 water: "var(--p3)",
 zen: "var(--accent)",
 ai: "var(--primary)",
 progress: "var(--p2)",
 streak: "var(--danger)",
};

export default function Dashboard() {
 const { profile, loading: profileLoading } = useApp();
 const navigate = useNavigate();
 const toast = useToast();
 const [logs, setLogs] = useState([]);
 const [loading, setLoading] = useState(false);
 const [waterData, setWaterData] = useState({ glasses: 0, ml_total: 0, goal_glasses: 8, percentage: 0 });
 const [waterAdding, setWaterAdding] = useState(false);
 const [zenStats, setZenStats] = useState({});
 const [insights, setInsights] = useState(null);
 const [insightsLoading, setInsightsLoading] = useState(false);
 const [weeklySummary, setWeeklySummary] = useState(null);
 const [summaryLoading, setSummaryLoading] = useState(false);

 // Generate plan modal state
 const [showGenerate, setShowGenerate] = useState(false);
 const [genPrompt, setGenPrompt] = useState("");
 const [genType, setGenType] = useState("training");
 const [generating, setGenerating] = useState(false);
 const [genError, setGenError] = useState(null);

 useEffect(() => {
 if (profile) loadData();
 }, [profile]);

 const loadData = async () => {
 try {
 setLoading(true);
 const [logsData, water, zen] = await Promise.all([
 ApiService.getLogs(200, 0),
 ApiService.getWaterToday(),
 ApiService.getZenStats(),
 ]);
 const arr = Array.isArray(logsData) ? logsData : logsData?.logs || [];
 setLogs(arr);
 setWaterData(water || { glasses: 0, ml_total: 0, goal_glasses: 8, percentage: 0 });
 setZenStats(zen || {});
 // Load insights separately (non-blocking)
 ApiService.getProgressInsights().then(data => setInsights(data)).catch(() => {}); ApiService.getWeeklySummary().then(data => setWeeklySummary(data)).catch(() => {}); } catch (err) {
 console.error("Error loading dashboard:", err);
 } finally {
 setLoading(false);
 }
 };

 const handleAddWater = async () => {
 try {
 setWaterAdding(true);
 const result = await ApiService.addWater(1);
 setWaterData(result);
 toast.success("Water added!");
 } catch (err) {
 console.error("Error adding water:", err);
 } finally {
 setWaterAdding(false);
 }
 };

 const handleRemoveWater = async () => {
 if (waterData.glasses <= 0) return;
 try {
 const result = await ApiService.removeWater();
 setWaterData(result);
 } catch (err) {
 console.error("Error removing water:", err);
 }
 };

 const handleCreateSnapshot = async () => {
 try {
 setInsightsLoading(true);
 await ApiService.createProgressSnapshot();
 const data = await ApiService.getProgressInsights();
 setInsights(data);
 toast.success("Progresso registado!");
 } catch (err) {
 toast.error("Erro ao registar progresso");
 } finally {
 setInsightsLoading(false);
 }
 };

 const handleGenerate = async () => {
 if (!genPrompt.trim()) return;
 try {
 setGenerating(true);
 setGenError(null);
 await ApiService.generatePlan(profile.id, genType, genPrompt.trim(), null);
 setShowGenerate(false);
 setGenPrompt("");
 toast.success("Plano gerado com sucesso! 🎉");
 navigate("/plans");
 } catch (err) {
 setGenError(err.message || "Erro ao gerar plano");
 } finally {
 setGenerating(false);
 }
 };

 const handleRefreshSummary = async () => {
 try {
 setSummaryLoading(true);
 const data = await ApiService.refreshWeeklySummary();
 setWeeklySummary(data);
 toast.success("Resumo atualizado!");
 } catch (err) {
 toast.error("Erro ao atualizar resumo");
 } finally {
 setSummaryLoading(false);
 }
 };

 const workoutLogs = logs.filter((l) => l.log_type === "treino" || l.type === "workout");
 const mealLogs = logs.filter((l) => l.log_type === "refeicao" || l.type === "meal");
 const totalCalories = mealLogs.reduce((s, l) => s + (l.calories || 0), 0);
 const totalDuration = workoutLogs.reduce((s, l) => s + (l.duration_min || 0), 0);

 const streak = useMemo(() => {
 if (workoutLogs.length === 0) return 0;
 const dates = [
 ...new Set(workoutLogs.map((l) => l.date || l.created_at?.split("T")[0]))
 ].filter(Boolean).sort().reverse();
 if (dates.length === 0) return 0;
 let count = 1;
 const today = new Date().toISOString().split("T")[0];
 if (dates[0] !== today) {
 const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
 if (dates[0] !== yesterday) return 0;
 }
 for (let i = 1; i < dates.length; i++) {
 const d1 = new Date(dates[i - 1]);
 const d2 = new Date(dates[i]);
 const diff = (d1 - d2) / 86400000;
 if (diff === 1) count++;
 else break;
 }
 return count;
 }, [workoutLogs]);

 const weeklyData = useMemo(() => {
 const days = [];
 const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
 for (let i = 6; i >= 0; i--) {
 const d = new Date(Date.now() - i * 86400000);
 const dateStr = d.toISOString().split("T")[0];
 const dayWorkouts = workoutLogs.filter(
 (l) => (l.date || l.created_at?.split("T")[0]) === dateStr
 );
 const dayMeals = mealLogs.filter(
 (l) => (l.date || l.created_at?.split("T")[0]) === dateStr
 );
 days.push({
 name: dayNames[d.getDay()],
 treinos: dayWorkouts.length,
 duracao: dayWorkouts.reduce((s, l) => s + (l.duration_min || 0), 0),
 calorias: dayMeals.reduce((s, l) => s + (l.calories || 0), 0),
 });
 }
 return days;
 }, [workoutLogs, mealLogs]);

 const quote = motivationalQuotes[Math.floor(Date.now() / 86400000) % motivationalQuotes.length];
 const waterPercentage = Math.min(waterData.percentage || 0, 100);
 const waterCircumference = 2 * Math.PI * 40;
 const waterOffset = waterCircumference * (1 - waterPercentage / 100);
 const greetingTime = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 19 ? "Boa tarde" : "Boa noite";

 // ======== ONBOARDING ========
 if (!profile && !profileLoading) {
 return (
 <div style={s.page}>
 <div style={s.onboardCard}>
 <h2 style={s.onboardTitle}>Bem-vindo ao LAPHIS</h2>
 <p style={s.onboardDesc}>
 O teu assistente pessoal de treino e nutrição com inteligência artificial.
 </p>
 <div style={s.onboardFeatures}>
 {[
 { text: "Coach AI pessoal com inteligência artificial" },
 { text: "Acompanha o teu progresso com gráficos" },
 { text: "Nutrição adaptada aos teus objetivos" },
 { text: "Espaço Zen para mente e corpo" },
 ].map((f, i) => (
 <div key={i} style={s.onboardFeature}>
 <div style={s.onboardDot} />
 <span style={s.onboardFeatureText}>{f.text}</span>
 </div>
 ))}
 </div>
 <button className="btn btn-primary btn-full" onClick={() => navigate("/profile")}>
 Criar Perfil
 </button>
 </div>
 </div>
 );
 }

 if (profileLoading) {
 return <div style={{ padding: '16px' }}><SkeletonDashboard /></div>;
 }

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
 {/* Greeting */}
 <div style={s.greeting}>
 <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
 <AvatarDisplay avatar={profile.avatar} name={profile.name} size={48} />
 <div>
 <p style={s.greetingSub}>{greetingTime},</p>
 <h1 style={s.greetingName}>{profile.name?.split(" ")[0]}</h1>
 </div>
 </div>
 </div>

 {/* AI Coach — Hero Card */}
 <button style={s.aiCard} onClick={() => navigate("/chat")}>
 <div style={s.aiCardInner}>
 <div style={{ ...s.aiIcon, background: "var(--gradient-primary)" }}><Bot size={20} strokeWidth={2} color="#fff" /></div>
 <div style={{ flex: 1 }}>
 <div style={s.aiTitle}>AI Coach</div>
 <div style={s.aiDesc}>Pergunta o que quiseres sobre treino ou nutrição</div>
 </div>
 <ChevronRight size={20} color="var(--text-muted)" strokeWidth={1.5} />
 </div>
 </button>

 {/* Generate Workout — Primary CTA */}
 <button style={s.generateCta} onClick={() => setShowGenerate(true)}>
 <div style={{ ...s.generateCtaIcon, background: "var(--gradient-cta)" }}>
 <Zap size={22} strokeWidth={2} color="#fff" />
 </div>
 <div style={s.generateCtaContent}>
 <div style={s.generateCtaTitle}>Gerar Plano com AI</div>
 <div style={s.generateCtaDesc}>Treino, nutrição ou combinado — personalizado para ti</div>
 </div>
 <ArrowRight size={18} color="var(--cta)" strokeWidth={2} />
 </button>

 {/* Stats Row — compact inline */}
 <div style={s.statsRow}>
 <div style={s.statItem}>
 <span style={s.statValue}>{streak}</span>
 <span style={s.statLabel}>Streak</span>
 </div>
 <div style={s.statDivider} />
 <div style={s.statItem}>
 <span style={s.statValue}>{workoutLogs.length}</span>
 <span style={s.statLabel}>Treinos</span>
 </div>
 <div style={s.statDivider} />
 <div style={s.statItem}>
 <span style={s.statValue}>{totalCalories.toLocaleString()}</span>
 <span style={s.statLabel}>Calorias</span>
 </div>
 <div style={s.statDivider} />
 <div style={s.statItem}>
 <span style={s.statValue}>{totalDuration}</span>
 <span style={s.statLabel}>Minutos</span>
 </div>
 </div>

 {/* Weekly AI Summary */}
 {weeklySummary && (
 <div style={s.summaryCard}>
 <div style={s.summaryHeader}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <Sparkles size={18} color="var(--primary)" strokeWidth={1.5} />
 <h4 style={s.summaryTitle}>Resumo Semanal</h4>
 </div>
 <button style={s.summaryRefresh} onClick={handleRefreshSummary} disabled={summaryLoading}>
 {summaryLoading ? "..." : "↻"}
 </button>
 </div>
 <p style={s.summaryText}>{weeklySummary.summary_text}</p>
 {weeklySummary.stats && (
 <div style={s.summaryStats}>
 {weeklySummary.stats.treinos > 0 && (
 <span style={s.summaryStatTag}>🏋️ {weeklySummary.stats.treinos} treinos</span>
 )}
 {weeklySummary.stats.minutos_treino > 0 && (
 <span style={s.summaryStatTag}>⏱️ {weeklySummary.stats.minutos_treino}min</span>
 )}
 {weeklySummary.stats.copos_agua > 0 && (
 <span style={s.summaryStatTag}>💧 {weeklySummary.stats.copos_agua} copos</span>
 )}
 {weeklySummary.stats.sessoes_zen > 0 && (
 <span style={s.summaryStatTag}>🧘 {weeklySummary.stats.sessoes_zen} zen</span>
 )}
 </div>
 )}
 </div>
 )}

 {/* Hydration + Zen — side by side */}
 <div style={s.twoCol}>
 {/* Water */}
 <div style={s.waterCard}>
 <div style={s.waterHeader}>
 <Droplets size={18} color="var(--primary)" strokeWidth={1.5} />
 <span style={s.sectionLabel}>Hidratação</span>
 </div>
 <div style={s.waterBody}>
 <div style={s.waterRing}>
 <svg width="88" height="88" viewBox="0 0 88 88">
 <circle cx="44" cy="44" r="40" fill="none" stroke="var(--border)" strokeWidth="4" />
 <circle
 cx="44" cy="44" r="40" fill="none"
 stroke="var(--primary)" strokeWidth="4"
 strokeDasharray={waterCircumference}
 strokeDashoffset={waterOffset}
 strokeLinecap="round"
 style={{ transition: "stroke-dashoffset 0.5s ease", transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
 />
 </svg>
 <div style={s.waterRingText}>
 <span style={s.waterCount}>{waterData.glasses}</span>
 <span style={s.waterGoal}>/{waterData.goal_glasses}</span>
 </div>
 </div>
 <div style={s.waterControls}>
 <button style={s.waterBtn} onClick={handleRemoveWater} disabled={waterData.glasses <= 0}>-</button>
 <button style={{ ...s.waterBtn, ...s.waterBtnPlus }} onClick={handleAddWater} disabled={waterAdding}>+</button>
 </div>
 </div>
 </div>

 {/* Zen summary */}
 <div style={s.zenSummary}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <Wind size={18} color="var(--p3)" strokeWidth={1.5} />
 <span style={s.sectionLabel}>Zen</span>
 </div>
 <div style={s.zenStatRow}>
 <div style={s.zenStat}>
 <span style={s.zenStatNum}>{zenStats.total_sessions || 0}</span>
 <span style={s.zenStatText}>sessões</span>
 </div>
 <div style={s.zenStat}>
 <span style={s.zenStatNum}>{zenStats.total_minutes || 0}</span>
 <span style={s.zenStatText}>min</span>
 </div>
 </div>
 <button
 style={s.zenLink}
 onClick={() => navigate("/zen")}
 >
 Abrir Zen
 </button>
 </div>
 </div>

 {/* Quick Actions — 4 items */}
 <div style={s.actionsRow}>
 {[
 { label: "Registar", to: "/logs", icon: ClipboardList, color: "var(--primary)", bg: "var(--primary-bg)" },
 { label: "Planos", to: "/plans", icon: Dumbbell, color: "var(--p2)", bg: "var(--cta-bg)" },
 { label: "Relatórios", to: "/reports", icon: BarChart3, color: "var(--p3)", bg: "var(--primary-bg)" },
 { label: "Zen", to: "/zen", icon: Wind, color: "var(--accent)", bg: "var(--primary-bg)" },
 ].map((a, i) => (
 <button key={i} style={s.actionBtn} onClick={() => navigate(a.to)}>
 <div style={{ width: 40, height: 40, borderRadius: 12, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4 }}>
 <a.icon size={20} strokeWidth={1.5} color={a.color} />
 </div>
 {a.label}
 </button>
 ))}
 </div>

 {/* Progress Insights */}
 {insights && (insights.highlights?.length > 0 || insights.suggestions?.length > 0) && (
 <div style={s.insightsCard}>
 <div style={s.insightsHeader}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <Sparkles size={18} color="var(--p2)" strokeWidth={1.5} />
 <h4 style={s.insightsTitle}>Progresso</h4>
 </div>
 {insights.trend_direction && (
 <span style={{
 ...s.insightsBadge,
 background: insights.trend_direction === "improving" ? "rgba(76, 175, 80, 0.12)"
 : insights.trend_direction === "declining" ? "rgba(244, 67, 54, 0.12)"
 : "rgba(255, 193, 7, 0.12)",
 color: insights.trend_direction === "improving" ? "#2E7D32"
 : insights.trend_direction === "declining" ? "#C62828"
 : "#F57F17",
 }}>
 {insights.trend_direction === "improving" ? <TrendingUp size={13} /> : insights.trend_direction === "declining" ? <TrendingDown size={13} /> : <Activity size={13} />}
 {insights.trend_direction === "improving" ? " A melhorar" : insights.trend_direction === "declining" ? " Em queda" : " Estável"}
 </span>
 )}
 </div>
 {insights.highlights?.length > 0 && (
 <div style={s.insightsList}>
 {insights.highlights.slice(0, 3).map((h, i) => (
 <div key={i} style={s.insightItem}>
 <ArrowRight size={13} color="var(--p2)" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
 <span style={s.insightText}>{h}</span>
 </div>
 ))}
 </div>
 )}
 {insights.suggestions?.length > 0 && (
 <div style={{ ...s.insightsList, marginTop: 8 }}>
 {insights.suggestions.slice(0, 2).map((sg, i) => (
 <div key={i} style={s.insightItem}>
 <Lightbulb size={13} color={CHART_COLORS.ai} strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
 <span style={{ ...s.insightText, color: "var(--text-secondary)" }}>{sg}</span>
 </div>
 ))}
 </div>
 )}
 <button style={s.snapshotBtn} onClick={handleCreateSnapshot} disabled={insightsLoading} title="Gera uma análise do teu progresso semanal">
 {insightsLoading ? "A registar..." : "📊 Analisar Progresso Semanal"}
 </button>
 </div>
 )}

 {/* No insights yet — show snapshot button */}
 {(!insights || (!insights.highlights?.length && !insights.suggestions?.length)) && (
 <button style={s.snapshotBtnStandalone} onClick={handleCreateSnapshot} disabled={insightsLoading} title="Gera uma análise do teu progresso semanal baseada nos teus treinos e refeições">
 <Sparkles size={16} strokeWidth={1.5} />
 {insightsLoading ? "A registar..." : "📊 Analisar Progresso Semanal"}
 </button>
 )}

 {/* Weekly Chart */}
 {workoutLogs.length > 0 && (
 <div style={s.chartCard}>
 <h4 style={s.chartTitle}>Treinos — 7 dias</h4>
 <ResponsiveContainer width="100%" height={140}>
 <BarChart data={weeklyData} barSize={20}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
 <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
 <YAxis hide allowDecimals={false} />
 <Tooltip content={<CustomTooltip />} />
 <Bar dataKey="treinos" name="Treinos" fill={CHART_COLORS.training} radius={[4, 4, 0, 0]} />
 </BarChart>
 </ResponsiveContainer>
 </div>
 )}

 {mealLogs.length > 0 && (
 <div style={s.chartCard}>
 <h4 style={s.chartTitle}>Calorias — 7 dias</h4>
 <ResponsiveContainer width="100%" height={140}>
 <AreaChart data={weeklyData}>
 <defs>
 <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={CHART_COLORS.nutrition} stopOpacity={0.2} />
 <stop offset="95%" stopColor={CHART_COLORS.nutrition} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
 <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
 <YAxis hide />
 <Tooltip content={<CustomTooltip />} />
 <Area type="monotone" dataKey="calorias" name="Calorias"
 stroke={CHART_COLORS.nutrition} fill="url(#calGrad)"
 strokeWidth={2} dot={{ r: 3, fill: CHART_COLORS.nutrition }} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 )}

 {/* Quote — subtle */}
 <p style={s.quote}>"{quote}"</p>

 {/* Recent Activity */}
 {logs.length > 0 && (
 <>
 <h4 style={s.sectionTitle}>Atividade Recente</h4>
 <div style={s.activityList}>
 {logs.slice(0, 4).map((log, idx) => {
 const isWorkout = log.log_type === "treino" || log.type === "workout";
 return (
 <div key={idx} style={s.activityItem}>
 <div style={{ ...s.activityDot, background: isWorkout ? CHART_COLORS.trainingLight : CHART_COLORS.nutritionLight }}>
 {isWorkout ? <TrendingUp size={18} color={CHART_COLORS.training} strokeWidth={1.5} /> : <UtensilsCrossed size={18} color={CHART_COLORS.nutrition} strokeWidth={1.5} />}
 </div>
 <div style={s.activityInfo}>
 <span style={s.activityTitle}>
 {isWorkout
 ? (log.description || `Treino — ${log.duration_min || 0}min`)
 : (log.foods || `Refeição — ${log.calories || 0} cal`)}
 </span>
 <span style={s.activityDate}>
 {log.date || log.created_at?.split("T")[0] || "—"}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </>
 )}

 {/* Empty state when no logs */}
 {!loading && logs.length === 0 && (
 <div style={s.emptyCard}>
 <Flame size={32} color="var(--text-muted)" strokeWidth={1.5} style={{ opacity: 0.5, marginBottom: 8 }} />
 <h4 style={s.emptyCardTitle}>Começa a tua jornada!</h4>
 <p style={s.emptyCardText}>Regista o teu primeiro treino ou refeição para acompanhar o progresso.</p>
 <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
 <button className="btn btn-primary btn-sm" onClick={() => navigate("/logs")}>
 <Plus size={14} strokeWidth={2} style={{ marginRight: 4 }} />Registar
 </button>
 <button className="btn btn-secondary btn-sm" onClick={() => setShowGenerate(true)}>
 <Zap size={14} strokeWidth={2} style={{ marginRight: 4 }} />Gerar Plano
 </button>
 </div>
 </div>
 )}

 {/* ====== GENERATE PLAN MODAL ====== */}
 <Modal
 isOpen={showGenerate}
 onClose={() => { setShowGenerate(false); setGenError(null); setGenPrompt(""); }}
 title="Gerar Plano com AI"
 confirmText="Gerar Plano"
 onConfirm={handleGenerate}
 loading={generating}
 >
 {genError && (
 <div className="alert alert-error" style={{ marginBottom: 12 }}>
 <span className="alert-icon">⚠️</span><span>{genError}</span>
 </div>
 )}

 {/* Plan Type */}
 <div className="form-group">
 <label className="form-label">Tipo de plano</label>
 <div style={s.typeGrid}>
 {[
 { value: "training", label: "Treino", icon: Dumbbell, color: "var(--primary)", bg: "var(--primary-bg)" },
 { value: "nutrition", label: "Nutrição", icon: UtensilsCrossed, color: "var(--p2)", bg: "var(--cta-bg)" },
 { value: "combined", label: "Combinado", icon: Zap, color: "var(--p3)", bg: "var(--primary-bg)" },
 ].map((t) => (
 <button
 key={t.value} type="button"
 onClick={() => setGenType(t.value)}
 style={{
 ...s.typeBtn,
 borderColor: genType === t.value ? t.color : "var(--border)",
 background: genType === t.value ? t.bg : "var(--card-bg)",
 }}
 >
 <t.icon size={22} color={genType === t.value ? t.color : "var(--text-muted)"} strokeWidth={1.5} />
 <span style={{
 fontSize: 12, fontWeight: genType === t.value ? 700 : 500,
 color: genType === t.value ? t.color : "var(--text-secondary)",
 }}>{t.label}</span>
 </button>
 ))}
 </div>
 </div>

 <div className="form-group">
 <label className="form-label">Descreve o que queres</label>
 <textarea
 className="form-input"
 placeholder="Ex: Plano semanal de treino para ganhar massa, 4 dias"
 value={genPrompt} onChange={(e) => setGenPrompt(e.target.value)}
 rows={3} style={{ resize: "vertical" }} disabled={generating}
 />
 </div>

 {/* Quick prompt chips */}
 <div style={s.quickPrompts}>
 {["Plano semanal de treino", "Nutrição para emagrecer", "Treino corpo inteiro", "Treino em casa"].map((p, i) => (
 <button key={i} style={s.quickPromptBtn} onClick={() => setGenPrompt(p)} type="button">{p}</button>
 ))}
 </div>
 </Modal>
 </div>
 );
}

// ===== STYLES =====
const s = {
 page: { animation: "fadeUp 0.3s ease" },

 /* Onboarding */
 onboardCard: {
 background: "var(--card-bg)", borderRadius: "var(--radius)",
 padding: "40px 24px 32px", boxShadow: "var(--shadow-md)",
 border: "1px solid var(--border)", textAlign: "center",
 },
 onboardTitle: { fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" },
 onboardDesc: { fontSize: 15, color: "var(--text-secondary)", margin: "0 0 28px", lineHeight: 1.6 },
 onboardFeatures: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, textAlign: "left" },
 onboardFeature: { display: "flex", alignItems: "center", gap: 12, padding: "10px 0" },
 onboardDot: { width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 },
 onboardFeatureText: { fontSize: 14, fontWeight: 500, color: "var(--text-secondary)" },

 /* Greeting */
 greeting: { marginBottom: 20, paddingTop: 4 },
 greetingSub: { fontSize: 14, color: "var(--text-muted)", fontWeight: 500, margin: "0 0 2px" },
 greetingName: { fontSize: 24, fontWeight: 700, color: "var(--text)", margin: 0 },
 greetingAvatar: {
 width: 48, height: 48, borderRadius: 16,
 background: "var(--gradient-primary)", color: "#fff",
 fontSize: 20, fontWeight: 700,
 display: "flex", alignItems: "center", justifyContent: "center",
 boxShadow: "var(--btn-primary-shadow)", flexShrink: 0,
 },

 /* AI Coach Hero */
 aiCard: {
  display: "block", width: "100%", padding: "14px 16px",
  borderRadius: "var(--radius)", background: "var(--card-bg)",
  border: "1px solid var(--border)", cursor: "pointer",
  boxShadow: "var(--shadow)", transition: "transform 0.15s ease, box-shadow 0.15s ease",
  marginBottom: 12, textAlign: "left", boxSizing: "border-box",
 },
 aiCardInner: { display: "flex", alignItems: "center", gap: 12, color: "var(--text)", minWidth: 0 },
 aiIcon: {
 width: 42, height: 42, borderRadius: 12,
 background: "var(--gradient-primary)", color: "#fff",
 display: "flex", alignItems: "center", justifyContent: "center",
 fontSize: 14, fontWeight: 800, letterSpacing: -0.5, flexShrink: 0,
 },
 aiTitle: { fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2 },
 aiDesc: { fontSize: 13, color: "var(--text-muted)", fontWeight: 400 },

 /* Generate CTA */
 generateCta: {
  display: "flex", alignItems: "center", gap: 12, width: "100%",
  padding: "14px 16px", borderRadius: "var(--radius)",
  background: "var(--card-bg)", border: "2px solid var(--cta)",
  cursor: "pointer", textAlign: "left", marginBottom: 20,
  boxShadow: "0 2px 12px var(--btn-primary-shadow)",
  transition: "transform 0.15s ease, box-shadow 0.15s ease",
  boxSizing: "border-box",
 },
 generateCtaIcon: {
  width: 44, height: 44, borderRadius: 14,
  background: "var(--gradient-cta)", color: "#fff",
  display: "flex", alignItems: "center", justifyContent: "center",
  flexShrink: 0,
  boxShadow: "0 2px 8px var(--btn-primary-shadow)",
 },
 generateCtaContent: { flex: 1, minWidth: 0 },
 generateCtaTitle: { fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 2 },
 generateCtaDesc: { fontSize: 12, color: "var(--text-muted)", fontWeight: 400, lineHeight: 1.4 },

 /* Stats Row */
 statsRow: {
 display: "flex", alignItems: "center", gap: 0,
 background: "var(--card-bg)", borderRadius: "var(--radius)",
  padding: "14px 2px", boxShadow: "var(--shadow)",
  border: "1px solid var(--border)", marginBottom: 16,
  width: "100%", boxSizing: "border-box", overflow: "hidden",
 },
 statItem: {
  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  minWidth: 0, overflow: "hidden",
 },
 statValue: { fontSize: 17, fontWeight: 700, color: "var(--text)", lineHeight: 1, whiteSpace: "nowrap" },
 statLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
 statDivider: { width: 1, height: 28, background: "var(--border)" },

 /* Two Column */
 twoCol: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, width: "100%", boxSizing: "border-box" },

 /* Water */
 waterCard: {
 background: "var(--card-bg)", borderRadius: "var(--radius)",
 padding: "14px", boxShadow: "var(--shadow)", border: "1px solid var(--border)",
 display: "flex", flexDirection: "column",
 },
 waterHeader: { marginBottom: 8, display: "flex", alignItems: "center", gap: 8 },
 sectionLabel: { fontSize: 13, fontWeight: 600, color: "var(--text)" },
 waterBody: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 },
 waterRing: { position: "relative", width: 88, height: 88 },
 waterRingText: {
 position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
 textAlign: "center", display: "flex", flexDirection: "column",
 },
 waterCount: { fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1 },
 waterGoal: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
 waterControls: { display: "flex", gap: 8 },
 waterBtn: {
 width: 32, height: 32, borderRadius: "50%", border: "1px solid var(--border)",
 background: "var(--card-bg)", fontSize: 16, fontWeight: 600, cursor: "pointer",
 color: "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center",
 transition: "background 0.15s",
 },
 waterBtnPlus: {
 background: "var(--primary)", color: "#fff", border: "none",
 },

 /* Zen Summary */
 zenSummary: {
 background: "var(--card-bg)", borderRadius: "var(--radius)",
 padding: "14px", boxShadow: "var(--shadow)", border: "1px solid var(--border)",
 display: "flex", flexDirection: "column",
 },
 zenStatRow: { display: "flex", gap: 16, marginTop: 12, flex: 1 },
 zenStat: { display: "flex", flexDirection: "column", gap: 2 },
 zenStatNum: { fontSize: 20, fontWeight: 700, color: "var(--text)", lineHeight: 1 },
 zenStatText: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
 zenLink: {
 marginTop: "auto", paddingTop: 10, background: "none", border: "none",
 color: "var(--primary)", fontSize: 13, fontWeight: 600, cursor: "pointer",
 textAlign: "left", padding: "8px 0 0",
 },

 /* Quick Actions */
 actionsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20, width: "100%", boxSizing: "border-box" },
 actionBtn: {
  padding: "12px 4px", borderRadius: "var(--radius-sm)",
  background: "var(--card-bg)", border: "1px solid var(--border)",
  boxShadow: "var(--shadow)", cursor: "pointer", fontSize: 10,
  fontWeight: 600, color: "var(--text-secondary)", textAlign: "center",
  transition: "background 0.15s",
  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
  minWidth: 0, overflow: "hidden",
 },

 /* Chart */
 chartCard: {
  background: "var(--card-bg)", borderRadius: "var(--radius)", padding: "14px",
  marginBottom: 16, boxShadow: "var(--shadow)", border: "1px solid var(--border)",
  width: "100%", boxSizing: "border-box", overflow: "hidden",
 },
 chartTitle: { fontSize: 13, fontWeight: 600, color: "var(--text)", margin: "0 0 12px" },

 /* Quote */
 quote: {
 fontSize: 13, color: "var(--text-muted)", fontStyle: "italic",
 lineHeight: 1.6, margin: "0 0 24px", fontWeight: 400, textAlign: "center",
 },

 /* Section */
 sectionTitle: { fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 12px" },

 /* Activity */
 activityList: { display: "flex", flexDirection: "column", gap: 8, width: "100%" },
 activityItem: {
  display: "flex", alignItems: "center", gap: 10, padding: "12px 12px",
  background: "var(--card-bg)", borderRadius: "var(--radius-sm)",
  boxShadow: "var(--shadow)", border: "1px solid var(--border)",
  boxSizing: "border-box", width: "100%", minWidth: 0,
 },
 activityDot: {
 width: 36, height: 36, borderRadius: 10,
 display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
 },
 activityInfo: { flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center", minWidth: 0 },
 activityTitle: { fontSize: 13, fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
 activityDate: { fontSize: 12, color: "var(--text-muted)", fontWeight: 400, flexShrink: 0, marginLeft: 8 },

 /* Tooltip */
 tooltip: {
 background: "var(--card-bg)", borderRadius: 10, padding: "8px 12px",
 boxShadow: "var(--shadow-md)", border: "1px solid var(--border)",
 },
 tooltipLabel: { fontSize: 12, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" },
 tooltipValue: { fontSize: 12, fontWeight: 400, margin: 0 },

 /* Progress Insights */
 insightsCard: {
 background: "var(--card-bg)", borderRadius: "var(--radius)", padding: "16px",
 marginBottom: 16, boxShadow: "var(--shadow)", border: "1px solid var(--border)",
 },
 insightsHeader: {
 display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
 },
 insightsTitle: { fontSize: 14, fontWeight: 700, color: "var(--text)", margin: 0 },
 insightsBadge: {
 display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600,
 padding: "4px 10px", borderRadius: 20,
 },
 insightsList: { display: "flex", flexDirection: "column", gap: 6 },
 insightItem: { display: "flex", alignItems: "flex-start", gap: 8 },
 insightText: { fontSize: 13, color: "var(--text)", lineHeight: 1.4 },
 snapshotBtn: {
 width: "100%", marginTop: 14, padding: "10px", border: "1px dashed var(--border)",
 borderRadius: 10, background: "none", color: "var(--text-secondary)",
 fontSize: 12, fontWeight: 600, cursor: "pointer",
 },
 snapshotBtnStandalone: {
 display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
 width: "100%", marginBottom: 16, padding: "12px", border: "1px dashed var(--border)",
 borderRadius: "var(--radius)", background: "var(--card-bg)", color: "var(--text-secondary)",
 fontSize: 13, fontWeight: 600, cursor: "pointer", boxShadow: "var(--shadow)",
 },

 /* Empty State */
 emptyCard: {
 background: "var(--card-bg)", borderRadius: "var(--radius)",
 padding: "36px 24px", boxShadow: "var(--shadow)", border: "1px solid var(--border)",
 textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center",
 marginBottom: 20,
 },
 emptyCardTitle: { fontSize: 17, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" },
 emptyCardText: { fontSize: 13, color: "var(--text-muted)", margin: 0, maxWidth: 260, lineHeight: 1.5 },

 /* Generate Modal */
 typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
 typeBtn: {
 display: "flex", flexDirection: "column", alignItems: "center",
 justifyContent: "center", gap: 6, padding: "14px 8px",
 borderRadius: "var(--radius-sm)", border: "2px solid var(--border)",
 cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
 boxShadow: "var(--shadow)", background: "var(--card-bg)",
 },
 quickPrompts: { display: "flex", flexWrap: "wrap", gap: 8 },
 quickPromptBtn: {
 padding: "7px 12px", borderRadius: 20,
 background: "var(--card-bg)", border: "1px solid var(--border)",
 fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
 fontWeight: 500, transition: "background 0.15s",
 boxShadow: "var(--shadow)",
 },

 /* Weekly Summary */
 summaryCard: {
 background: "var(--card-bg)", borderRadius: "var(--radius)",
 padding: "16px", boxShadow: "var(--shadow)",
 border: "1px solid var(--border)", marginBottom: 16,
 },
 summaryHeader: {
 display: "flex", justifyContent: "space-between", alignItems: "center",
 marginBottom: 10,
 },
 summaryTitle: { fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 },
 summaryRefresh: {
 background: "var(--bg-surface)", border: "1px solid var(--border)",
 borderRadius: 8, width: 30, height: 30, cursor: "pointer",
 display: "flex", alignItems: "center", justifyContent: "center",
 fontSize: 16, color: "var(--text-muted)", transition: "background 0.15s",
 },
 summaryText: {
 fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6,
 margin: "0 0 10px", whiteSpace: "pre-wrap",
 },
 summaryStats: { display: "flex", flexWrap: "wrap", gap: 8 },
 summaryStatTag: {
 padding: "4px 10px", borderRadius: 12,
 background: "var(--primary-bg)", fontSize: 12,
 fontWeight: 600, color: "var(--primary)",
 },
};
