import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { SkeletonDashboard } from "../components/Skeleton";
import { AvatarDisplay } from "../components/AvatarPicker";
import jsPDF from "jspdf";
import { TrendingUp, TrendingDown, Activity, Sparkles, Lightbulb, Dumbbell, UtensilsCrossed, Plus, Flame, Download, RefreshCw, CalendarClock, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
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


 const [expandSummary, setExpandSummary] = useState(false);

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

 /**
  * Optimistic water add: bump the glass count locally first so the ring
  * animates instantly, then reconcile with the server. Roll back the
  * increment if the write fails so the UI never claims a glass that
  * was not actually recorded.
  */
 const handleAddWater = async () => {
 const snapshot = waterData;
 setWaterData((prev) => ({ ...prev, glasses: (prev?.glasses || 0) + 1 }));
 setWaterAdding(true);
 try {
 const result = await ApiService.addWater(1);
 setWaterData(result);
 toast.success("Water added!");
 } catch (err) {
 console.error("Error adding water:", err);
 setWaterData(snapshot);
 } finally {
 setWaterAdding(false);
 }
 };

 /**
  * Optimistic water remove: mirror of handleAddWater.
  */
 const handleRemoveWater = async () => {
 if (waterData.glasses <= 0) return;
 const snapshot = waterData;
 setWaterData((prev) => ({ ...prev, glasses: Math.max(0, (prev?.glasses || 0) - 1) }));
 try {
 const result = await ApiService.removeWater();
 setWaterData(result);
 } catch (err) {
 console.error("Error removing water:", err);
 setWaterData(snapshot);
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
 {/* ── 1. HERO: Greeting + Daily Plan ── */}
 <div style={s.greeting}>
 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
 <AvatarDisplay avatar={profile.avatar} name={profile.name} size={42} />
 <div>
 <p style={s.greetingSub}>{greetingTime}</p>
 <h1 style={s.greetingName}>{profile.name?.split(" ")[0]}</h1>
 </div>
 </div>
 </div>

 <div className="card-lift hero-premium" style={s.heroCard} onClick={() => navigate("/daily-plan")}>
 <div style={s.heroLeft}>
 <div className="icon-chip"><CalendarClock size={22} color="var(--primary)" strokeWidth={1.75} /></div>
 <div>
 <h2 style={s.heroTitle}>Plano do Dia</h2>
 <p style={s.heroSub}>Treino + refeições personalizados</p>
 </div>
 </div>
 <ChevronRight size={18} color="var(--text-muted)" />
 </div>

 {/* ── 2. COMPACT STATS ── */}
 <div style={s.statsStrip}>
 {[
 { v: streak, l: "Streak" },
 { v: workoutLogs.length, l: "Treinos" },
 { v: totalCalories.toLocaleString(), l: "Calorias" },
 { v: totalDuration, l: "Min" },
 ].map((st, i) => (
 <div key={i} style={s.statCell}>
 <span className="stat-emphasis" style={s.statVal}>{st.v}</span>
 <span style={s.statLbl}>{st.l}</span>
 </div>
 ))}
 </div>

 {/* ── 3. CHARTS — Visual Data ── */}
 {workoutLogs.length > 0 && (
 <div style={s.chartCard}>
 <h4 style={s.chartTitle}>Treinos — 7 dias</h4>
 <ResponsiveContainer width="100%" height={120}>
 <BarChart data={weeklyData} barSize={18}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
 <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
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
 <ResponsiveContainer width="100%" height={120}>
 <AreaChart data={weeklyData}>
 <defs>
 <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor={CHART_COLORS.nutrition} stopOpacity={0.18} />
 <stop offset="95%" stopColor={CHART_COLORS.nutrition} stopOpacity={0} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--border-light)" vertical={false} />
 <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
 <YAxis hide />
 <Tooltip content={<CustomTooltip />} />
 <Area type="monotone" dataKey="calorias" name="Calorias"
 stroke={CHART_COLORS.nutrition} fill="url(#calGrad)"
 strokeWidth={2} dot={{ r: 2.5, fill: CHART_COLORS.nutrition }} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 )}

 {/* ── 4. WEEKLY SUMMARY (collapsible, default collapsed) ── */}
 <div style={s.summaryCard}>
 <button style={s.summaryToggle} onClick={() => setExpandSummary(!expandSummary)}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <Sparkles size={16} color="var(--primary)" strokeWidth={1.5} />
 <span style={s.summaryLabel}>Resumo Semanal</span>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
 {weeklySummary?.stats && (
 <div style={s.summaryMiniStats}>
 {weeklySummary.stats.treinos > 0 && <span>{weeklySummary.stats.treinos} treinos</span>}
 {weeklySummary.stats.minutos_treino > 0 && <span>· {weeklySummary.stats.minutos_treino}min</span>}
 </div>
 )}
 {expandSummary ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
 </div>
 </button>

 {expandSummary && (
 <div style={s.summaryBody}>
 {weeklySummary?.summary_text && (
 <p style={s.summaryText}>{weeklySummary.summary_text}</p>
 )}
 {weeklySummary?.stats && (
 <div style={s.summaryTags}>
 {weeklySummary.stats.treinos > 0 && <span style={s.tag}>🏋️ {weeklySummary.stats.treinos} treinos</span>}
 {weeklySummary.stats.minutos_treino > 0 && <span style={s.tag}>⏱️ {weeklySummary.stats.minutos_treino}min</span>}
 {weeklySummary.stats.copos_agua > 0 && <span style={s.tag}>💧 {weeklySummary.stats.copos_agua} copos</span>}
 {weeklySummary.stats.sessoes_zen > 0 && <span style={s.tag}>🧘 {weeklySummary.stats.sessoes_zen} zen</span>}
 </div>
 )}

 {insights && (insights.highlights?.length > 0 || insights.suggestions?.length > 0) && (
 <div style={s.insightsBlock}>
 {insights.trend_direction && (
 <span style={{
 ...s.trendBadge,
 background: insights.trend_direction === "improving" ? "rgba(76,175,80,0.10)" : insights.trend_direction === "declining" ? "rgba(244,67,54,0.10)" : "rgba(255,193,7,0.10)",
 color: insights.trend_direction === "improving" ? "#2E7D32" : insights.trend_direction === "declining" ? "#C62828" : "#F57F17",
 }}>
 {insights.trend_direction === "improving" ? <><TrendingUp size={12} /> A melhorar</> : insights.trend_direction === "declining" ? <><TrendingDown size={12} /> Em queda</> : <><Activity size={12} /> Estável</>}
 </span>
 )}
 {insights.highlights?.slice(0, 2).map((h, i) => (
 <p key={`h-${i}`} style={s.insightLine}><TrendingUp size={12} color="var(--p2)" style={{ flexShrink: 0, marginTop: 2 }} /> {h}</p>
 ))}
 {insights.suggestions?.slice(0, 1).map((sg, i) => (
 <p key={`s-${i}`} style={{ ...s.insightLine, color: "var(--text-muted)" }}><Lightbulb size={12} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} /> {sg}</p>
 ))}
 </div>
 )}

 {!weeklySummary && !insights && (
 <p style={s.summaryEmpty}>Regista treinos ou refeições para ver o resumo.</p>
 )}

 <div style={s.summaryActions}>
 <button style={s.summaryActBtn} onClick={handleCreateSnapshot} disabled={insightsLoading}>
 {insightsLoading ? "A analisar..." : "Analisar"}
 </button>
 <button style={s.summaryActBtn} onClick={handleDownloadPDF}>
 <Download size={13} /> PDF
 </button>
 </div>
 </div>
 )}
 </div>

 {/* ── Recent Activity (compact, max 3) ── */}
 {logs.length > 0 && (
 <div style={s.recentCard}>
 <h3 style={s.recentTitle}>Recente</h3>
 {logs.slice(0, 3).map((log, idx) => {
 const isWorkout = log.log_type === "treino" || log.type === "workout";
 return (
 <div key={idx} style={s.recentRow}>
 <div style={{ ...s.recentDot, background: isWorkout ? "var(--primary-bg)" : "var(--cta-bg)" }}>
 {isWorkout ? <Dumbbell size={14} color="var(--primary)" strokeWidth={1.5} /> : <UtensilsCrossed size={14} color="var(--p2)" strokeWidth={1.5} />}
 </div>
 <span style={s.recentText}>
 {isWorkout ? (log.description || `Treino — ${log.duration_min || 0}min`) : (log.foods || `Refeição — ${log.calories || 0} cal`)}
 </span>
 <span style={s.recentDate}>{log.date || log.created_at?.split("T")[0] || "—"}</span>
 </div>
 );
 })}
 </div>
 )}

 {/* ── Empty State ── */}
 {!loading && logs.length === 0 && (
 <div style={s.emptyCard}>
 <Flame size={28} color="var(--text-muted)" strokeWidth={1.5} style={{ opacity: 0.4 }} />
 <h3 style={s.emptyTitle}>Começa a tua jornada!</h3>
 <p style={s.emptySub}>Regista o teu primeiro treino ou refeição.</p>
 <button className="btn btn-primary btn-sm" onClick={() => navigate("/logs")} style={{ marginTop: 12 }}>
 <Plus size={14} strokeWidth={2} style={{ marginRight: 4 }} />Registar
 </button>
 </div>
 )}

 {/* ── Quote (minimal) ── */}
 <p style={s.quote}>"{quote}"</p>
 </div>
 );
}

// ===== STYLES — Balanced: Clean + Data-Rich =====
const s = {
 page: { animation: "fadeUp 0.25s ease", display: "flex", flexDirection: "column", gap: 18 },

 /* Onboarding */
 onboardCard: {
 background: "var(--card-bg)", borderRadius: "var(--radius)",
 padding: "44px 28px 36px", boxShadow: "var(--shadow-lg)",
 border: "var(--card-border)", textAlign: "center",
 },
 onboardTitle: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: "0 0 12px", letterSpacing: "-0.035em", lineHeight: 1.15 },
 onboardDesc: { fontSize: "var(--text-body)", color: "var(--text-secondary)", margin: "0 0 32px", lineHeight: 1.65 },
 onboardFeatures: { display: "flex", flexDirection: "column", gap: 14, marginBottom: 32, textAlign: "left" },
 onboardFeature: { display: "flex", alignItems: "center", gap: 14, padding: "8px 0" },
 onboardDot: { width: 5, height: 5, borderRadius: "50%", background: "var(--primary)", flexShrink: 0 },
 onboardFeatureText: { fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text-secondary)", lineHeight: 1.5 },

 /* 1. Greeting */
 greeting: { paddingTop: 4 },
 greetingSub: { fontSize: "var(--text-overline)", color: "var(--text-muted)", fontWeight: 600, margin: 0, letterSpacing: "0.06em", textTransform: "uppercase" },
 greetingName: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: "2px 0 0", letterSpacing: "-0.035em", lineHeight: 1.1 },

 /* Hero Card — primary focus. The .hero-premium class adds gradient +
    layered shadows; this object defines only the structural parts. */
 heroCard: {
 display: "flex", alignItems: "center", justifyContent: "space-between",
 padding: "18px 20px", borderRadius: 18,
 border: "1px solid var(--border)",
 cursor: "pointer",
 },
 heroLeft: { display: "flex", alignItems: "center", gap: 14 },
 heroTitle: { fontSize: 17, fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.015em" },
 heroSub: { fontSize: 12, color: "var(--text-muted)", margin: "4px 0 0", fontWeight: 500 },

 /* 2. Stats Strip */
 statsStrip: {
 display: "flex", alignItems: "center",
 background: "var(--card-bg)", borderRadius: 14,
 padding: "14px 0", boxShadow: "var(--shadow)",
 border: "var(--card-border)",
 },
 statCell: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 },
 statVal: { fontSize: "var(--text-h2)", fontWeight: 800, color: "var(--text)", lineHeight: 1, letterSpacing: "-0.02em", fontFamily: "var(--font-heading)" },
 statLbl: { fontSize: "var(--text-overline)", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" },

 /* 3. Charts */
 chartCard: {
 background: "var(--card-bg)", borderRadius: 14, padding: "14px 14px 8px",
 boxShadow: "var(--shadow)", border: "var(--card-border)",
 overflow: "hidden",
 },
 chartTitle: { fontSize: "var(--text-overline)", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.06em" },

 /* 4. Weekly Summary — collapsible */
 summaryCard: {
 background: "var(--card-bg)", borderRadius: 14,
 boxShadow: "var(--shadow)", border: "var(--card-border)",
 overflow: "hidden",
 },
 summaryToggle: {
 width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
 padding: "13px 16px", background: "none", border: "none", cursor: "pointer",
 },
 summaryLabel: { fontSize: "var(--text-body)", fontWeight: 700, color: "var(--text)" },
 summaryMiniStats: { fontSize: "var(--text-overline)", color: "var(--text-muted)", fontWeight: 500, display: "flex", gap: 4 },
 summaryBody: { padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 12 },
 summaryText: { fontSize: "var(--text-caption)", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" },
 summaryTags: { display: "flex", flexWrap: "wrap", gap: 6 },
 tag: {
 padding: "3px 10px", borderRadius: 10,
 background: "var(--primary-bg)", fontSize: 11,
 fontWeight: 600, color: "var(--primary)",
 },
 insightsBlock: { display: "flex", flexDirection: "column", gap: 6, paddingTop: 4 },
 trendBadge: {
 display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600,
 padding: "3px 10px", borderRadius: 20, width: "fit-content",
 },
 insightLine: { fontSize: 12, color: "var(--text)", lineHeight: 1.5, margin: 0, display: "flex", alignItems: "flex-start", gap: 6 },
 summaryEmpty: { fontSize: 12, color: "var(--text-muted)", margin: 0, fontStyle: "italic" },
 summaryActions: { display: "flex", gap: 6, paddingTop: 4 },
 summaryActBtn: {
 padding: "6px 12px", borderRadius: 8, background: "var(--hover-overlay)",
 border: "1px solid var(--border-light)", fontSize: 11, fontWeight: 600,
 color: "var(--text-secondary)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4,
 transition: "background 0.12s",
 },

 /* 5. Recent Activity */
 recentCard: {
 background: "var(--card-bg)", borderRadius: 14,
 padding: "12px 14px", boxShadow: "var(--shadow)", border: "var(--card-border)",
 },
 recentTitle: { fontSize: "var(--text-overline)", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" },
 recentRow: {
 display: "flex", alignItems: "center", gap: 12, padding: "8px 0",
 borderBottom: "1px solid var(--border-light)",
 },
 recentDot: { width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
 recentText: { flex: 1, fontSize: "var(--text-body)", fontWeight: 500, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
 recentDate: { fontSize: "var(--text-overline)", color: "var(--text-muted)", fontWeight: 400, flexShrink: 0 },

 /* Empty State */
 emptyCard: {
 background: "var(--card-bg)", borderRadius: 14,
 padding: "44px 24px", boxShadow: "var(--shadow)", border: "var(--card-border)",
 textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
 },
 emptyTitle: { fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" },
 emptySub: { fontSize: "var(--text-body)", color: "var(--text-muted)", margin: 0, maxWidth: 260, lineHeight: 1.6 },

 /* Quote */
 quote: {
 fontSize: "var(--text-overline)", color: "var(--text-muted)", fontStyle: "italic",
 lineHeight: 1.7, fontWeight: 400, textAlign: "center", opacity: 0.5, margin: "4px 0 0",
 },

 /* Tooltip */
 tooltip: { background: "var(--card-bg)", borderRadius: 10, padding: "10px 14px", boxShadow: "var(--shadow-md)", border: "var(--card-border)" },
 tooltipLabel: { fontSize: "var(--text-overline)", fontWeight: 700, color: "var(--text)", margin: "0 0 4px" },
 tooltipValue: { fontSize: "var(--text-overline)", fontWeight: 400, margin: 0 },
};
