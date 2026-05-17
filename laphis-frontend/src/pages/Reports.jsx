import { useState, useEffect } from "react";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import EmptyState from "../components/EmptyState";
import { SkeletonReports } from "../components/Skeleton";
import jsPDF from "jspdf";
import { BarChart, Bar, AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Zap, PieChart as PieChartIcon, Dumbbell, UtensilsCrossed, Droplets, Wind, Clock, Flame, ClipboardList, FileText, Activity, Download, Scale, Plus, Trash2 } from "lucide-react";

const MOOD_MAP = {
  calm: { label: "Calmo", color: "var(--p1)" },
  happy: { label: "Feliz", color: "var(--p2)" },
  stressed: { label: "Stressado", color: "var(--danger)" },
  anxious: { label: "Ansioso", color: "var(--p3)" },
  tired: { label: "Cansado", color: "var(--p4)" },
  energetic: { label: "Energético", color: "var(--primary)" },
  neutral: { label: "Neutro", color: "var(--text-muted)" },
};

const CHART_COLORS = ["var(--p1)", "var(--p2)", "var(--p3)", "var(--p4)", "var(--p5)", "var(--primary-light)", "var(--accent)"];

export default function Reports() {
  const { profile } = useApp();
  const toast = useToast();
  const [report, setReport] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  
  // Weight tracking state
  const [weightHistory, setWeightHistory] = useState([]);
  const [weightStats, setWeightStats] = useState({});
  const [weightInput, setWeightInput] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [weightAdding, setWeightAdding] = useState(false);

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const [data, logs, plans, wHistory, wStats] = await Promise.all([
        ApiService.getReportSummary(),
        ApiService.getLogs(50, 0).catch(() => []),
        profile?.id ? ApiService.getPlans(profile.id).catch(() => []) : Promise.resolve([]),
        ApiService.getWeightEntries(60).catch(() => []),
        ApiService.getWeightStats().catch(() => ({})),
      ]);
      setReport(data);
      const logsArr = Array.isArray(logs) ? logs : logs?.logs || [];
      setRecentLogs(logsArr);
      const plansArr = Array.isArray(plans) ? plans : plans?.plans || [];
      setActivePlans(plansArr.filter(p => p.status === "active"));
      setWeightHistory(Array.isArray(wHistory) ? wHistory.reverse() : []);
      setWeightStats(wStats || {});
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    try {
      // jsPDF nao suporta emojis — remove-os de qualquer string dinamica
      const clean = (str) =>
        String(str || "")
          .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}\u{20D0}-\u{20FF}]/gu, "")
          .replace(/\s{2,}/g, " ")
          .trim();

      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const m = 16;
      const maxW = W - m * 2;
      let y = 0;
      const checkPage = (need = 20) => { if (y + need > H - 20) { doc.addPage(); y = 16; } };

      // Header
      doc.setFillColor(155, 106, 74);
      doc.rect(0, 0, W, 38, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text("LAPHIS", m, 18);
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text("Relat\u00f3rio Completo", m, 28);
      doc.setFontSize(9);
      doc.text(new Date().toLocaleDateString("pt-PT", { day: "numeric", month: "long", year: "numeric" }), W - m, 28, { align: "right" });
      if (profile?.name) {
        doc.text(clean(profile.name), W - m, 18, { align: "right" });
      }
      y = 48;
      doc.setTextColor(60, 60, 60);

      // Stats summary
      doc.setFontSize(12); doc.setFont("helvetica", "bold");
      doc.text("Resumo Geral", m, y); y += 8;
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      const stats = [
        `Treinos: ${report.total_workouts} (${report.total_workout_minutes} min)`,
        `Refei\u00e7\u00f5es: ${report.total_meals} (${report.total_calories.toLocaleString()} cal)`,
        `Sess\u00f5es Zen: ${report.total_zen_sessions} (${report.total_zen_minutes} min)`,
        `Planos: ${report.total_plans}`,
        `Streak Treino: ${report.workout_streak} dias`,
        `Streak Zen: ${report.zen_streak} dias`,
        `M\u00e9dia treino: ${report.avg_workout_duration} min | M\u00e9dia cal/dia: ${report.avg_calories_per_day}`,
      ];
      stats.forEach((line) => { checkPage(6); doc.text(line, m, y); y += 6; });
      y += 6;

      // Workouts by week
      if (report.workouts_by_week?.length) {
        checkPage(16);
        doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text("Treinos por Semana", m, y); y += 7;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        report.workouts_by_week.forEach((w) => {
          checkPage(6);
          doc.text(clean(`${w.week}: ${w.count} treinos${w.total ? " (" + w.total + " min)" : ""}`), m + 2, y); y += 5;
        });
        y += 6;
      }

      // Calories by week
      if (report.calories_by_week?.length) {
        checkPage(16);
        doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text("Calorias por Semana", m, y); y += 7;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        report.calories_by_week.forEach((w) => {
          checkPage(6);
          doc.text(clean(`${w.week}: ${w.total.toLocaleString()} cal`), m + 2, y); y += 5;
        });
        y += 6;
      }

      // Zen summary
      if (report.zen_by_week?.length) {
        checkPage(16);
        doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text("Zen por Semana", m, y); y += 7;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        report.zen_by_week.forEach((w) => {
          checkPage(6);
          doc.text(clean(`${w.week}: ${w.count} sess\u00f5es`), m + 2, y); y += 5;
        });
        y += 6;
      }

      // Mood
      if (report.mood_distribution?.length) {
        checkPage(16);
        doc.setFontSize(11); doc.setFont("helvetica", "bold");
        doc.text("Distribui\u00e7\u00e3o de Humor", m, y); y += 7;
        doc.setFontSize(9); doc.setFont("helvetica", "normal");
        report.mood_distribution.forEach((d) => {
          checkPage(6);
          const label = MOOD_MAP[d.mood]?.label || d.mood;
          doc.text(clean(`${label}: ${d.count}`), m + 2, y); y += 5;
        });
      }

      // Footer
      y = H - 12;
      doc.setFontSize(8); doc.setTextColor(160, 160, 160);
      doc.text("Gerado por LAPHIS \u2014 o teu assistente de sa\u00fade inteligente", m, y);

      doc.save(`LAPHIS_Relatorio_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF guardado!");
    } catch (err) {
      console.error("PDF export error:", err);
      toast.error("Erro ao gerar PDF");
    }
  };

  if (loading) {
    /* Skeleton mirrors the final layout so there is no visual jolt
       when the real data lands. */
    return <SkeletonReports />;
  }

  if (!report) {
    return (
      <div style={s.page}>
        <EmptyState
          icon="📊"
          title="Sem dados suficientes"
          description="Começa a registar treinos, refeições e sessões zen para ver o teu relatório."
          actionLabel="Registar"
          actionTo="/logs"
        />
      </div>
    );
  }

  const SECTIONS = [
    { key: "overview", label: "Geral", icon: PieChartIcon },
    { key: "fitness", label: "Fitness", icon: TrendingUp },
    { key: "weight", label: "Peso", icon: Scale },
    { key: "zen", label: "Zen", icon: Wind },
    { key: "activity", label: "Atividade", icon: Activity },
  ];

  /**
   * Optimistic weight add: inject a placeholder entry into the history
   * chart/list the moment the user clicks so the UI feels instant.
   * Replace the temp entry with the server copy once the write lands,
   * or roll it back on failure.
   */
  const handleAddWeight = async () => {
    const w = parseFloat(weightInput);
    if (!w || w < 30 || w > 300) return;

    const notes = weightNotes.trim() || null;
    const historySnapshot = weightHistory;
    const statsSnapshot = weightStats;
    const tempId = `temp-${Date.now()}`;
    const optimisticEntry = {
      id: tempId,
      weight_kg: w,
      notes,
      logged_at: new Date().toISOString(),
      _pending: true,
    };

    setWeightHistory((prev) => [...prev, optimisticEntry]);
    setWeightStats((prev) => ({ ...prev, current: w }));
    setWeightInput("");
    setWeightNotes("");
    setWeightAdding(true);

    try {
      await ApiService.addWeightEntry(w, notes);
      toast.success("Peso registado!");
      const [wH, wS] = await Promise.all([
        ApiService.getWeightEntries(60).catch(() => []),
        ApiService.getWeightStats().catch(() => ({})),
      ]);
      setWeightHistory(Array.isArray(wH) ? wH.reverse() : []);
      setWeightStats(wS || {});
    } catch (err) {
      toast.error("Erro ao registar peso");
      setWeightHistory(historySnapshot);
      setWeightStats(statsSnapshot);
    } finally {
      setWeightAdding(false);
    }
  };

  /**
   * Optimistic weight delete: remove the entry from state first, then
   * run the delete call, rolling back if it fails.
   */
  const handleDeleteWeight = async (entryId) => {
    const historySnapshot = weightHistory;
    const statsSnapshot = weightStats;
    setWeightHistory((prev) => prev.filter((e) => e.id !== entryId));
    try {
      await ApiService.deleteWeightEntry(entryId);
      const [wH, wS] = await Promise.all([
        ApiService.getWeightEntries(60).catch(() => []),
        ApiService.getWeightStats().catch(() => ({})),
      ]);
      setWeightHistory(Array.isArray(wH) ? wH.reverse() : []);
      setWeightStats(wS || {});
      toast.success("Registo apagado");
    } catch (err) {
      toast.error("Erro ao apagar");
      setWeightHistory(historySnapshot);
      setWeightStats(statsSnapshot);
    }
  };

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
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h1 style={s.reportTitle}>Relatório</h1>
              <p style={s.reportSubtitle}>
                {profile?.name ? `Dados de ${profile.name}` : "O teu progresso completo"}
              </p>
            </div>
            <button onClick={handleExportPDF} style={s.pdfBtn} title="Guardar PDF">
              <Download size={16} strokeWidth={2} />
            </button>
          </div>
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
          <Wind size={18} color="var(--accent-zen)" strokeWidth={1.5} />
          <span style={s.bigStatValue}>{report.total_zen_sessions}</span>
          <span style={s.bigStatLabel}>Zen</span>
        </div>
        <div style={s.bigStatCard}>
          <FileText size={18} color="var(--primary-light)" strokeWidth={1.5} />
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
                  <Bar dataKey="count" name="Treinos" fill="var(--primary)" radius={[6, 6, 0, 0]} />
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
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.05)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" name="Minutos" stroke="var(--primary)" fill="url(#durGrad)" strokeWidth={2.5} />
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
                  <Bar dataKey="total" name="Calorias" fill="var(--p2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.noData}>Sem dados de refeições</p>
            )}
          </div>
        </>
      )}

      {/* ===== WEIGHT SECTION ===== */}
      {activeSection === "weight" && (
        <>
          {/* Add Weight Form */}
          <div style={s.card}>
            <h4 style={s.cardTitle}>
              <Scale size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -3 }} />
              Registar Peso
            </h4>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <input
                  type="number" className="form-input" placeholder="Ex: 75.5"
                  min="30" max="300" step="0.1"
                  value={weightInput} onChange={(e) => setWeightInput(e.target.value)}
                  style={{ fontSize: 16, fontWeight: 600 }}
                />
              </div>
              <button
                className="btn btn-primary"
                onClick={handleAddWeight}
                disabled={weightAdding || !weightInput}
                style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
              >
                {weightAdding ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : <Plus size={16} />}
                kg
              </button>
            </div>
            <input
              type="text" className="form-input" placeholder="Notas (opcional)"
              value={weightNotes} onChange={(e) => setWeightNotes(e.target.value)}
              style={{ marginTop: 8, fontSize: 13 }}
            />
          </div>

          {/* Weight Stats */}
          {weightStats && (weightStats.current || weightStats.min || weightStats.max) && (
            <div style={s.card}>
              <h4 style={s.cardTitle}>Estatísticas</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {weightStats.current && (
                  <div style={s.weightStatItem}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{weightStats.current}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Atual (kg)</span>
                  </div>
                )}
                {weightStats.min && (
                  <div style={s.weightStatItem}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--p1)" }}>{weightStats.min}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Mínimo</span>
                  </div>
                )}
                {weightStats.max && (
                  <div style={s.weightStatItem}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: "var(--p4)" }}>{weightStats.max}</span>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600 }}>Máximo</span>
                  </div>
                )}
              </div>
              {weightStats.change != null && (
                <div style={{ textAlign: "center", marginTop: 12, padding: "10px 0", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: weightStats.change > 0 ? "var(--danger)" : weightStats.change < 0 ? "var(--p1)" : "var(--text-muted)" }}>
                    {weightStats.change > 0 ? "+" : ""}{weightStats.change} kg desde o início
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Weight Evolution Chart */}
          <div style={s.chartCard}>
            <h4 style={s.cardTitle}>Evolução do Peso</h4>
            {weightHistory.length > 1 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weightHistory.map(w => ({ date: w.date?.substring(5) || "", peso: w.weight_kg }))}>
                  <defs>
                    <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(15, 23, 42, 0.05)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--primary)" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={s.noData}>Regista pelo menos 2 pesos para ver o gráfico</p>
            )}
          </div>

          {/* Weight History List */}
          {weightHistory.length > 0 && (
            <div style={s.card}>
              <h4 style={s.cardTitle}>Histórico</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {weightHistory.slice().reverse().slice(0, 15).map((entry) => (
                  <div key={entry.id} className={entry._pending ? "is-pending" : ""} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>{entry.weight_kg} kg</span>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 8 }}>{entry.date}</span>
                    </div>
                    {entry.notes && <span style={{ fontSize: 12, color: "var(--text-muted)", fontStyle: "italic" }}>{entry.notes}</span>}
                    <button onClick={() => handleDeleteWeight(entry.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
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
                  <Bar dataKey="count" name="Sessões" fill="var(--p3)" radius={[6, 6, 0, 0]} />
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
                  const typeColors = { training: "var(--primary)", nutrition: "var(--accent)", combined: "var(--primary-light)" };
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
                      <div style={{ ...s.activityDot, background: "var(--primary-bg)" }}>
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
                      <div style={{ ...s.activityDot, background: "var(--cta-bg)" }}>
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
                <div style={s.usageIcon}><Wind size={20} color="var(--accent-zen)" strokeWidth={1.5} /></div>
                <div style={s.usageInfo}>
                  <span style={s.usageValue}>{report.total_zen_sessions} sessões zen</span>
                  <span style={s.usageSub}>{report.total_zen_minutes} min meditação</span>
                </div>
              </div>
              <div style={s.usageDivider} />
              <div style={s.usageItem}>
                <div style={s.usageIcon}><FileText size={20} color="var(--primary-light)" strokeWidth={1.5} /></div>
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
    boxShadow: "0 4px 16px var(--btn-primary-shadow)",
  },
  reportTitle: { fontSize: 22, fontWeight: 700, color: "white", margin: "0 0 4px" },
  reportSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.85)", margin: 0, fontWeight: 500 },
  memberSince: { fontSize: 12, color: "rgba(255,255,255,0.6)", margin: "8px 0 0", fontWeight: 500 },
  pdfBtn: {
    width: 36, height: 36, borderRadius: 10,
    background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)",
    color: "white", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s", flexShrink: 0,
  },

  /* Big Stats */
  bigStatsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 },
  bigStatCard: {
    background: "var(--card-bg)", borderRadius: "var(--radius-sm)", padding: "14px 6px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
    boxShadow: "var(--shadow)", border: "1px solid var(--border)",
    minWidth: 0, overflow: "hidden",
  },
  bigStatValue: { fontSize: 20, fontWeight: 700, color: "var(--text)", whiteSpace: "nowrap" },
  bigStatLabel: { fontSize: 10, color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" },

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

  /* Weight stat */
  weightStatItem: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "14px 8px", background: "var(--card-bg)", borderRadius: "var(--radius-xs)",
    border: "1px solid var(--border)", boxShadow: "var(--shadow)",
  },

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
