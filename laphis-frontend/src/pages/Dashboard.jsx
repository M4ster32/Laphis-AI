import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { SkeletonDashboard } from "../components/Skeleton";
import { AvatarDisplay } from "../components/AvatarPicker";
import jsPDF from "jspdf";
import { Wind, Droplets, TrendingUp, TrendingDown, ClipboardList, BarChart3, Activity, Sparkles, Lightbulb, Dumbbell, UtensilsCrossed, Plus, Flame, Download, RefreshCw } from "lucide-react";
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

 const handleDownloadPDF = () => {
 try {
 const doc = new jsPDF({ unit: "mm", format: "a4" });
 const W = doc.internal.pageSize.getWidth();
 const H = doc.internal.pageSize.getHeight();
 const margin = 16;
 const maxW = W - margin * 2;
 let y = 0;

 const checkPage = (need = 20) => { if (y + need > H - 20) { doc.addPage(); y = 16; } };

 // — Header bar
 doc.setFillColor(155, 106, 74);
 doc.rect(0, 0, W, 38, "F");
 doc.setFont("helvetica", "bold");
 doc.setFontSize(22);
 doc.setTextColor(255, 255, 255);
 doc.text("LAPHIS", margin, 18);
 doc.setFontSize(11);
 doc.setFont("helvetica", "normal");
 doc.text("Resumo Semanal", margin, 28);
 doc.setFontSize(9);
 doc.text(new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }), W - margin, 28, { align: "right" });
 y = 48;

 doc.setTextColor(60, 60, 60);

 // — Stats
 if (weeklySummary?.stats) {
 const st = weeklySummary.stats;
 const parts = [];
 if (st.treinos > 0) parts.push(`${st.treinos} treinos`);
 if (st.minutos_treino > 0) parts.push(`${st.minutos_treino} min`);
 if (st.copos_agua > 0) parts.push(`${st.copos_agua} copos de água`);
 if (st.sessoes_zen > 0) parts.push(`${st.sessoes_zen} sessões zen`);
 if (parts.length) {
   doc.setFontSize(11);
   doc.setFont("helvetica", "bold");
   doc.text("Estatísticas", margin, y);
   y += 7;
   doc.setFont("helvetica", "normal");
   doc.setFontSize(10);
   doc.text(parts.join("  •  "), margin, y);
   y += 12;
 }
 }

 // — Summary text
 if (weeklySummary?.summary_text) {
 checkPage(30);
 doc.setFontSize(11);
 doc.setFont("helvetica", "bold");
 doc.text("Resumo AI", margin, y);
 y += 7;
 doc.setFont("helvetica", "normal");
 doc.setFontSize(10);
 const lines = doc.splitTextToSize(weeklySummary.summary_text, maxW);
 lines.forEach((line) => { checkPage(6); doc.text(line, margin, y); y += 5.5; });
 y += 8;
 }

 // — Insights
 if (insights) {
 if (insights.trend_direction) {
   checkPage(12);
   doc.setFontSize(11);
   doc.setFont("helvetica", "bold");
   const trendLabel = insights.trend_direction === "improving" ? "📈 A melhorar"
     : insights.trend_direction === "declining" ? "📉 Em queda" : "➡️ Estável";
   doc.text(`Progresso: ${trendLabel}`, margin, y);
   y += 8;
 }
 if (insights.highlights?.length) {
   checkPage(10);
   doc.setFontSize(10);
   doc.setFont("helvetica", "bold");
   doc.text("Destaques", margin, y);
   y += 6;
   doc.setFont("helvetica", "normal");
   insights.highlights.forEach((h) => {
     checkPage(7);
     const hl = doc.splitTextToSize(`• ${h}`, maxW - 4);
     hl.forEach((l) => { doc.text(l, margin + 2, y); y += 5.5; });
   });
   y += 6;
 }
 if (insights.suggestions?.length) {
   checkPage(10);
   doc.setFontSize(10);
   doc.setFont("helvetica", "bold");
   doc.text("Sugestões", margin, y);
   y += 6;
   doc.setFont("helvetica", "normal");
   insights.suggestions.forEach((sg) => {
     checkPage(7);
     const sl = doc.splitTextToSize(`💡 ${sg}`, maxW - 4);
     sl.forEach((l) => { doc.text(l, margin + 2, y); y += 5.5; });
   });
 }
 }

 // — Footer
 y = H - 12;
 doc.setFontSize(8);
 doc.setTextColor(160, 160, 160);
 doc.text("Gerado por LAPHIS — o teu assistente de saúde inteligente", margin, y);

 doc.save(`LAPHIS_Resumo_${new Date().toISOString().split("T")[0]}.pdf`);
 toast.success("PDF guardado!");
 } catch (err) {
 console.error("PDF export error:", err);
 toast.error("Erro ao gerar PDF");
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

 {/* ====== RESUMO SEMANAL (unified) ====== */}
 <div style={s.summaryCard}>
 <div style={s.summaryHeader}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <Sparkles size={18} color="var(--primary)" strokeWidth={1.5} />
 <h4 style={s.summaryTitle}>Resumo Semanal</h4>
 </div>
 <div style={{ display: "flex", gap: 6 }}>
 <button style={s.summaryIconBtn} onClick={handleDownloadPDF} title="Guardar PDF">
 <Download size={15} strokeWidth={2} />
 </button>
 <button style={s.summaryIconBtn} onClick={handleRefreshSummary} disabled={summaryLoading} title="Atualizar">
 <RefreshCw size={15} strokeWidth={2} className={summaryLoading ? "spin" : ""} />
 </button>
 </div>
 </div>

 {/* AI Summary text */}
 {weeklySummary?.summary_text && (
 <p style={s.summaryText}>{weeklySummary.summary_text}</p>
 )}

 {/* Stats tags */}
 {weeklySummary?.stats && (
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

 {/* Progress insights */}
 {insights && (insights.highlights?.length > 0 || insights.suggestions?.length > 0) && (
 <>
 <div style={s.insightsDivider} />
 <div style={s.insightsInline}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
 <span style={s.insightsSubtitle}>Progresso</span>
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
 {insights.highlights?.slice(0, 3).map((h, i) => (
 <div key={`h-${i}`} style={s.insightItem}>
 <TrendingUp size={13} color="var(--p2)" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
 <span style={s.insightText}>{h}</span>
 </div>
 ))}
 {insights.suggestions?.slice(0, 2).map((sg, i) => (
 <div key={`s-${i}`} style={s.insightItem}>
 <Lightbulb size={13} color="var(--primary)" strokeWidth={2} style={{ marginTop: 2, flexShrink: 0 }} />
 <span style={{ ...s.insightText, color: "var(--text-secondary)" }}>{sg}</span>
 </div>
 ))}
 </div>
 </>
 )}

 {/* No data — CTA to generate */}
 {!weeklySummary && !insights && !summaryLoading && !insightsLoading && (
 <p style={s.summaryEmpty}>Ainda sem dados esta semana. Regista treinos ou refeições para ver o teu resumo.</p>
 )}

 {/* Analyze button */}
 <button style={s.snapshotBtn} onClick={handleCreateSnapshot} disabled={insightsLoading}>
 {insightsLoading ? "A analisar..." : "📊 Analisar Progresso"}
 </button>
 </div>

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
 <button className="btn btn-primary btn-sm" onClick={() => navigate("/logs")} style={{ marginTop: 14 }}>
 <Plus size={14} strokeWidth={2} style={{ marginRight: 4 }} />Registar
 </button>
 </div>
 )}
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

 /* Progress Insights (inline within summary card) */
 insightsDivider: {
 height: 1, background: "var(--border)", margin: "14px 0",
 },
 insightsInline: { display: "flex", flexDirection: "column", gap: 6 },
 insightsSubtitle: { fontSize: 13, fontWeight: 700, color: "var(--text)" },
 insightsBadge: {
 display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
 padding: "3px 8px", borderRadius: 20,
 },
 insightItem: { display: "flex", alignItems: "flex-start", gap: 8 },
 insightText: { fontSize: 13, color: "var(--text)", lineHeight: 1.4 },
 snapshotBtn: {
 width: "100%", marginTop: 14, padding: "10px", border: "1px dashed var(--border)",
 borderRadius: 10, background: "none", color: "var(--text-secondary)",
 fontSize: 12, fontWeight: 600, cursor: "pointer",
 },
 summaryEmpty: {
 fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: "0 0 4px", fontStyle: "italic",
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

 /* Weekly Summary (unified) */
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
 summaryIconBtn: {
 background: "var(--bg-surface)", border: "1px solid var(--border)",
 borderRadius: 8, width: 30, height: 30, cursor: "pointer",
 display: "flex", alignItems: "center", justifyContent: "center",
 color: "var(--text-muted)", transition: "background 0.15s, color 0.15s",
 },
 summaryText: {
 fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6,
 margin: "0 0 10px", whiteSpace: "pre-wrap",
 },
 summaryStats: { display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 4 },
 summaryStatTag: {
 padding: "4px 10px", borderRadius: 12,
 background: "var(--primary-bg)", fontSize: 12,
 fontWeight: 600, color: "var(--primary)",
 },
};
