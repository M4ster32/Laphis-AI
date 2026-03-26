import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { Wind, Zap, Heart, Plus, Trash2 } from "lucide-react";

const BREATHING_PATTERNS = [
  { name: "Relaxar", label: "4-7-8", inhale: 4, hold: 7, exhale: 8 },
  { name: "Energizar", label: "4-4-4", inhale: 4, hold: 4, exhale: 4 },
  { name: "Calma Profunda", label: "5-5-5", inhale: 5, hold: 5, exhale: 5 },
  { name: "Foco", label: "4-2-6", inhale: 4, hold: 2, exhale: 6 },
];

const AMBIENT_SOUNDS = [
  { key: "silence", label: "Silêncio" },
  { key: "rain", label: "Chuva" },
  { key: "ocean", label: "Oceano" },
  { key: "forest", label: "Floresta" },
  { key: "fire", label: "Fogueira" },
  { key: "wind", label: "Vento" },
];

const MOODS = [
  { value: "calm", label: "Calmo", color: "var(--accent-sport)" },
  { value: "happy", label: "Feliz", color: "var(--accent-sport)" },
  { value: "stressed", label: "Stressado", color: "var(--accent-nutrition)" },
  { value: "anxious", label: "Ansioso", color: "#EF4444" },
  { value: "tired", label: "Cansado", color: "var(--accent-zen)" },
  { value: "energetic", label: "Energético", color: "var(--accent-sport)" },
  { value: "neutral", label: "Neutro", color: "#94A3A6" },
];

const TIMER_PRESETS = [3, 5, 10, 15, 20];

const AFFIRMATIONS = [
  "Eu sou capaz de alcançar os meus objetivos.",
  "O meu corpo é forte e resiliente.",
  "Cada passo que dou me aproxima da melhor versão de mim.",
  "Eu mereço saúde, felicidade e equilíbrio.",
  "A minha mente está calma e focada.",
  "Eu escolho pensamentos que me fortalecem.",
  "Cada respiração traz paz ao meu corpo e mente.",
  "Eu confio no processo e sou paciente comigo.",
  "A minha energia é positiva e contagiante.",
  "Eu sou grato(a) pelo progresso que faço todos os dias.",
  "O descanso faz parte do meu treino.",
  "Eu honro o meu corpo com cada decisão que tomo.",
];

export default function Zen() {
  const { profile } = useApp();
  const [activeView, setActiveView] = useState("home"); // home, breathing, meditation, mood
  const [selectedPattern, setSelectedPattern] = useState(BREATHING_PATTERNS[0]);
  const [selectedSound, setSelectedSound] = useState("silence");
  const [timerMinutes, setTimerMinutes] = useState(5);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState("ready"); // ready, inhale, hold, exhale
  const [breathCount, setBreathCount] = useState(0);
  const [phaseTime, setPhaseTime] = useState(0);
  const [meditationTime, setMeditationTime] = useState(0);
  const [moodBefore, setMoodBefore] = useState(null);
  const [moodAfter, setMoodAfter] = useState(null);
  const [sessionType, setSessionType] = useState(null); // "breathing" | "meditation"
  const [showComplete, setShowComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [todayAffirmation] = useState(
    AFFIRMATIONS[Math.floor(Date.now() / 86400000) % AFFIRMATIONS.length]
  );

  const timerRef = useRef(null);
  const breathRef = useRef(null);

  useEffect(() => {
    loadHistory();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(breathRef.current);
    };
  }, []);

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const data = await ApiService.getZenSessions();
      setHistory(Array.isArray(data) ? data : data?.sessions || []);
    } catch (err) {
      console.error("Erro ao carregar zen history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // ===== BREATHING ENGINE =====
  const startBreathing = useCallback(() => {
    setIsSessionActive(true);
    setSessionType("breathing");
    setBreathCount(0);
    runBreathCycle();
  }, [selectedPattern]);

  const runBreathCycle = useCallback(() => {
    let phase = "inhale";
    let time = selectedPattern.inhale;
    setBreathPhase("inhale");
    setPhaseTime(time);

    breathRef.current = setInterval(() => {
      time--;
      setPhaseTime(time);

      if (time <= 0) {
        if (phase === "inhale") {
          phase = "hold";
          time = selectedPattern.hold;
          setBreathPhase("hold");
        } else if (phase === "hold") {
          phase = "exhale";
          time = selectedPattern.exhale;
          setBreathPhase("exhale");
        } else {
          // cycle complete
          phase = "inhale";
          time = selectedPattern.inhale;
          setBreathPhase("inhale");
          setBreathCount((c) => c + 1);
        }
        setPhaseTime(time);
      }
    }, 1000);
  }, [selectedPattern]);

  const stopBreathing = useCallback(() => {
    clearInterval(breathRef.current);
    setIsSessionActive(false);
    setBreathPhase("ready");
    if (breathCount > 0) {
      setShowComplete(true);
    }
  }, [breathCount]);

  // ===== MEDITATION TIMER =====
  const startMeditation = useCallback(() => {
    setIsSessionActive(true);
    setSessionType("meditation");
    const totalSeconds = timerMinutes * 60;
    setMeditationTime(totalSeconds);

    timerRef.current = setInterval(() => {
      setMeditationTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsSessionActive(false);
          setShowComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerMinutes]);

  const stopMeditation = useCallback(() => {
    clearInterval(timerRef.current);
    setIsSessionActive(false);
    const elapsed = timerMinutes * 60 - meditationTime;
    if (elapsed > 10) {
      setShowComplete(true);
    }
  }, [timerMinutes, meditationTime]);

  // ===== SAVE SESSION =====
  const saveSession = async () => {
    if (!moodAfter) return;
    try {
      setSaving(true);
      const durationMin = sessionType === "breathing"
        ? Math.ceil((breathCount * (selectedPattern.inhale + selectedPattern.hold + selectedPattern.exhale)) / 60)
        : Math.ceil((timerMinutes * 60 - meditationTime) / 60);

      await ApiService.saveZenSession({
        type: sessionType,
        duration_min: Math.max(durationMin, 1),
        mood_before: moodBefore,
        mood_after: moodAfter,
        notes: sessionType === "breathing"
          ? `Padrão: ${selectedPattern.name} (${selectedPattern.label}) — ${breathCount} ciclos`
          : `Meditação de ${timerMinutes}min — Som: ${AMBIENT_SOUNDS.find(s => s.key === selectedSound)?.label || "Silêncio"}`,
      });
      setShowComplete(false);
      setMoodBefore(null);
      setMoodAfter(null);
      setBreathCount(0);
      setActiveView("home");
      loadHistory();
    } catch (err) {
      console.error("Erro ao guardar sessão:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const totalZenMinutes = history.reduce((sum, h) => sum + (h.duration_min || 0), 0);
  const totalSessions = history.length;
  const currentStreak = (() => {
    if (history.length === 0) return 0;
    const dates = [...new Set(history.map(h => h.created_at?.split("T")[0]).filter(Boolean))].sort().reverse();
    let streak = 0;
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (dates[0] !== today && dates[0] !== yesterday) return 0;
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      if (dates[i] === expected) streak++;
      else break;
    }
    return streak;
  })();

  // ===== SESSION COMPLETE MODAL =====
  if (showComplete) {
    return (
      <div style={s.page}>
        <div style={s.completeCard}>
          <h2 style={s.completeTitle}>Sessão Completa</h2>
          <p style={s.completeDesc}>
            {sessionType === "breathing"
              ? `${breathCount} ciclos de respiração ${selectedPattern.name}`
              : `${formatTime(timerMinutes * 60 - meditationTime)} de meditação`}
          </p>

          <div style={s.moodSection}>
            <p style={s.moodLabel}>Como te sentes agora?</p>
            <div style={s.moodGrid}>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMoodAfter(m.value)}
                  style={{
                    ...s.moodBtn,
                    background: moodAfter === m.value ? m.color + "18" : "var(--bg)",
                    borderColor: moodAfter === m.value ? m.color : "var(--border)",
                    transform: moodAfter === m.value ? "scale(1.05)" : "scale(1)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={s.completeActions}>
            <button
              className="btn btn-primary btn-full"
              onClick={saveSession}
              disabled={!moodAfter || saving}
            >
              {saving ? "A guardar..." : "Guardar Sessão"}
            </button>
            <button
              className="btn btn-ghost btn-full"
              onClick={() => { setShowComplete(false); setActiveView("home"); }}
            >
              Descartar
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== BREATHING VIEW =====
  if (activeView === "breathing") {
    const phaseLabel = { ready: "Pronto?", inhale: "Inspira", hold: "Segura", exhale: "Expira" };
    const phaseColors = { ready: "var(--text-muted)", inhale: "var(--accent-sport)", hold: "var(--accent-zen)", exhale: "var(--accent-sport)" };
    const circleScale = { ready: 1, inhale: 1.3, hold: 1.3, exhale: 0.85 };

    return (
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => { stopBreathing(); setActiveView("home"); }}>
          ← Voltar
        </button>

        {/* Mood Before */}
        {!moodBefore && !isSessionActive && (
          <div style={s.moodSection}>
            <p style={s.moodLabel}>Como te sentes antes de começar?</p>
            <div style={s.moodGrid}>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMoodBefore(m.value)}
                  style={{
                    ...s.moodBtn,
                    background: moodBefore === m.value ? m.color + "18" : "var(--bg)",
                    borderColor: moodBefore === m.value ? m.color : "var(--border)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {moodBefore && (
          <>
            {/* Pattern Selector */}
            {!isSessionActive && (
              <div style={s.patternGrid}>
                {BREATHING_PATTERNS.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => setSelectedPattern(p)}
                    style={{
                      ...s.patternCard,
                      borderColor: selectedPattern.name === p.name ? "var(--primary)" : "var(--border)",
                      background: selectedPattern.name === p.name ? "rgba(217, 117, 30, 0.08)" : "var(--card-bg)",
                    }}
                  >
                    <span style={s.patternName}>{p.name}</span>
                    <span style={s.patternLabel}>{p.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Breathing Circle */}
            <div style={s.breathContainer}>
              <div style={{
                ...s.breathCircleOuter,
                transform: `scale(${circleScale[breathPhase]})`,
                borderColor: phaseColors[breathPhase],
                boxShadow: isSessionActive ? `0 0 40px ${phaseColors[breathPhase]}30` : "none",
              }}>
                <div style={{ ...s.breathCircleInner, background: phaseColors[breathPhase] + "15" }}>
                  <span style={{ ...s.breathPhaseText, color: phaseColors[breathPhase] }}>
                    {phaseLabel[breathPhase]}
                  </span>
                  {isSessionActive && (
                    <span style={s.breathTimer}>{phaseTime}s</span>
                  )}
                </div>
              </div>
              {isSessionActive && (
                <p style={s.breathCycles}>Ciclos: {breathCount}</p>
              )}
            </div>

            {/* Controls */}
            <div style={s.controlsArea}>
              {!isSessionActive ? (
                <button className="btn btn-primary btn-full" onClick={startBreathing}>
                  Começar Respiração
                </button>
              ) : (
                <button className="btn btn-danger btn-full" onClick={stopBreathing}>
                  Parar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ===== MEDITATION VIEW =====
  if (activeView === "meditation") {
    const progress = isSessionActive ? ((timerMinutes * 60 - meditationTime) / (timerMinutes * 60)) * 100 : 0;

    return (
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => { stopMeditation(); setActiveView("home"); }}>
          ← Voltar
        </button>

        {/* Mood Before */}
        {!moodBefore && !isSessionActive && (
          <div style={s.moodSection}>
            <p style={s.moodLabel}>Como te sentes antes de começar?</p>
            <div style={s.moodGrid}>
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMoodBefore(m.value)}
                  style={{
                    ...s.moodBtn,
                    background: moodBefore === m.value ? m.color + "18" : "var(--bg)",
                    borderColor: moodBefore === m.value ? m.color : "var(--border)",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {moodBefore && (
          <>
            {/* Timer Presets */}
            {!isSessionActive && (
              <>
                <div style={s.timerPresets}>
                  {TIMER_PRESETS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTimerMinutes(t)}
                      style={{
                        ...s.timerPresetBtn,
                        background: timerMinutes === t ? "var(--primary)" : "var(--bg-card)",
                        color: timerMinutes === t ? "white" : "var(--text-secondary)",
                        fontWeight: timerMinutes === t ? 700 : 500,
                        boxShadow: timerMinutes === t ? "0 4px 12px rgba(217, 117, 30, 0.25)" : "var(--shadow)",
                      }}
                    >
                      {t}min
                    </button>
                  ))}
                </div>

                {/* Sound Selector */}
                <h4 style={s.subTitle}>Som Ambiente</h4>
                <div style={s.soundGrid}>
                  {AMBIENT_SOUNDS.map((snd) => (
                    <button
                      key={snd.key}
                      onClick={() => setSelectedSound(snd.key)}
                      style={{
                        ...s.soundBtn,
                        borderColor: selectedSound === snd.key ? "var(--primary)" : "var(--border)",
                        background: selectedSound === snd.key ? "rgba(217, 117, 30, 0.08)" : "var(--card-bg)",
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>{snd.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Meditation Timer Circle */}
            <div style={s.meditationContainer}>
              <div style={s.timerCircle}>
                <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="100" cy="100" r="88" fill="none" stroke="var(--border-light)" strokeWidth="6" />
                  <circle
                    cx="100" cy="100" r="88" fill="none"
                    stroke="var(--primary)" strokeWidth="6"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 1s linear" }}
                  />
                </svg>
                <div style={s.timerDisplay}>
                  <span style={s.timerTime}>
                    {isSessionActive ? formatTime(meditationTime) : `${timerMinutes}:00`}
                  </span>
                  <span style={s.timerLabel}>
                    {isSessionActive ? "a meditar..." : "minutos"}
                  </span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div style={s.controlsArea}>
              {!isSessionActive ? (
                <button className="btn btn-primary btn-full" onClick={startMeditation}>
                  Começar Meditação
                </button>
              ) : (
                <button className="btn btn-danger btn-full" onClick={stopMeditation}>
                  Terminar
                </button>
              )}
            </div>
          </>
        )}
      </div>
    );
  }

  // ===== HOME VIEW =====
  return (
    <div style={s.page}>
      {/* Hero */}
      <div style={s.zenHero}>
        <div style={s.zenHeroBg}>
          <h1 style={s.zenTitle}>Espaço Zen</h1>
          <p style={s.zenSubtitle}>Encontra o teu equilíbrio interior</p>
        </div>
      </div>

      {/* Daily Affirmation */}
      <div style={s.affirmationCard}>
        <p style={s.affirmationText}>"{todayAffirmation}"</p>
      </div>

      {/* Stats */}
      <div style={s.zenStatsRow}>
        <div style={s.zenStatCard}>
          <span style={s.zenStatValue}>{totalSessions}</span>
          <span style={s.zenStatLabel}>Sessões</span>
        </div>
        <div style={s.zenStatCard}>
          <span style={s.zenStatValue}>{totalZenMinutes}</span>
          <span style={s.zenStatLabel}>Minutos</span>
        </div>
        <div style={s.zenStatCard}>
          <span style={s.zenStatValue}>{currentStreak}</span>
          <span style={s.zenStatLabel}>Streak</span>
        </div>
      </div>

      {/* Activities */}
      <h3 style={s.sectionTitle}>Atividades</h3>
      <div style={s.activitiesGrid}>
        <button style={s.activityCard} onClick={() => { setMoodBefore(null); setActiveView("breathing"); }}>
          <div style={{ ...s.activityIconCircle, background: "rgba(217, 117, 30, 0.08)" }}>
            <Wind size={24} color="var(--primary)" strokeWidth={1.5} />
          </div>
          <h4 style={s.activityTitle}>Respiração</h4>
          <p style={s.activityDesc}>Exercícios guiados de respiração</p>
        </button>

        <button style={s.activityCard} onClick={() => { setMoodBefore(null); setActiveView("meditation"); }}>
          <div style={{ ...s.activityIconCircle, background: "rgba(140, 68, 27, 0.08)" }}>
            <Zap size={24} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <h4 style={s.activityTitle}>Meditação</h4>
          <p style={s.activityDesc}>Timer com sons ambiente</p>
        </button>
      </div>

      {/* Recent Sessions */}
      {history.length > 0 && (
        <>
          <h3 style={{ ...s.sectionTitle, marginTop: 28 }}>Sessões Recentes</h3>
          <div style={s.historyList}>
            {history.slice(0, 5).map((h, i) => {
              const moodObj = MOODS.find(m => m.value === h.mood_after);
              return (
                <div key={i} style={s.historyItem}>
                  <div style={s.historyIcon}>
                    {h.type === "breathing" ? <Wind size={16} strokeWidth={1.5} /> : <Zap size={16} strokeWidth={1.5} />}
                  </div>
                  <div style={s.historyInfo}>
                    <span style={s.historyTitle}>
                      {h.type === "breathing" ? "Respiração" : "Meditação"} — {h.duration_min}min
                    </span>
                    <span style={s.historyDate}>
                      {h.created_at?.split("T")[0] || "—"}
                    </span>
                  </div>
                  <div style={s.historyMood}>
                    {moodObj?.label || "—"}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ===== STYLES — Liquid Glass =====
const gl = {
  bg: "var(--card-bg)", border: "1px solid var(--border)",
  shadow: "var(--shadow)", shadowMd: "var(--shadow-md)",
};

const s = {
  page: { animation: "fadeUp 0.35s ease" },

  /* Hero */
  zenHero: { marginBottom: 20 },
  zenHeroBg: {
    background: "var(--gradient-zen)",
    borderRadius: "var(--radius)",
    padding: "32px 24px",
    textAlign: "center",
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 4px 16px rgba(140, 68, 27, 0.15)",
  },
  zenHeroEmoji: { fontSize: 48, display: "block", marginBottom: 8, animation: "float 3s ease-in-out infinite" },
  zenTitle: { fontSize: 24, fontWeight: 700, color: "white", margin: "0 0 4px" },
  zenSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0, fontWeight: 500 },

  /* Affirmation */
  affirmationCard: {
    display: "flex", alignItems: "flex-start", gap: 12,
    padding: "18px 20px", background: gl.bg, borderRadius: "var(--radius-sm)",
    boxShadow: gl.shadow, marginBottom: 20, borderLeft: "3px solid var(--accent)",
    border: gl.border, borderLeftWidth: "3px", borderLeftColor: "var(--accent)",
  },
  affirmationText: {
    fontSize: 14, color: "var(--text-secondary)", fontStyle: "italic",
    lineHeight: 1.6, margin: 0, fontWeight: 500,
  },

  /* Zen Stats */
  zenStatsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 },
  zenStatCard: {
    background: gl.bg, borderRadius: "var(--radius-sm)", padding: "16px 8px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    boxShadow: gl.shadow, border: gl.border,
  },
  zenStatValue: { fontSize: 20, fontWeight: 700, color: "var(--text)" },
  zenStatLabel: { fontSize: 11, color: "var(--text-muted)", fontWeight: 600 },

  /* Section */
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 14px" },
  subTitle: { fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "20px 0 12px" },

  /* Activities */
  activitiesGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 },
  activityCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    padding: "24px 16px", borderRadius: "var(--radius)", background: gl.bg,
    border: gl.border, cursor: "pointer", transition: "transform 0.25s, box-shadow 0.25s",
    boxShadow: gl.shadow, textAlign: "center",
    position: "relative", overflow: "hidden",
  },
  activityIconCircle: {
    width: 56, height: 56, borderRadius: 18,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  activityTitle: { fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0 },
  activityDesc: { fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 },

  /* History */
  historyList: { display: "flex", flexDirection: "column", gap: 8 },
  historyItem: {
    display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
    background: gl.bg, borderRadius: "var(--radius-sm)", boxShadow: gl.shadow,
    border: gl.border,
  },
  historyIcon: { fontSize: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary)" },
  historyInfo: { flex: 1, display: "flex", flexDirection: "column", gap: 2 },
  historyTitle: { fontSize: 14, fontWeight: 600, color: "var(--text)" },
  historyDate: { fontSize: 12, color: "var(--text-muted)", fontWeight: 500 },
  historyMood: { fontSize: 20, flexShrink: 0 },

  /* Back button */
  backBtn: {
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "8px 0", marginBottom: 20, fontSize: 14, fontWeight: 600,
    color: "var(--primary)", background: "none", border: "none", cursor: "pointer",
  },

  /* Mood Selection */
  moodSection: { marginBottom: 24 },
  moodLabel: { fontSize: 15, fontWeight: 700, color: "var(--text)", marginBottom: 14 },
  moodGrid: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
  },
  moodBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "12px 6px", borderRadius: "var(--radius-sm)", border: gl.border,
    cursor: "pointer", transition: "border-color 0.15s, background 0.15s", background: "var(--card-bg)",
    boxShadow: "var(--shadow)",
  },

  /* Breathing Patterns */
  patternGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 },
  patternCard: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    padding: "16px 10px", borderRadius: "var(--radius-sm)", border: gl.border,
    cursor: "pointer", transition: "all 0.25s",
    background: "var(--card-bg)",
    boxShadow: "var(--shadow)",
  },
  patternName: { fontSize: 13, fontWeight: 700, color: "var(--text)" },
  patternLabel: { fontSize: 11, fontWeight: 600, color: "var(--text-muted)" },

  /* Breathing Circle */
  breathContainer: { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 0", gap: 16 },
  breathCircleOuter: {
    width: 180, height: 180, borderRadius: "50%",
    border: "2px solid var(--glass-border)", display: "flex", alignItems: "center",
    justifyContent: "center", transition: "all 1.5s ease-in-out",
    boxShadow: gl.shadow,
  },
  breathCircleInner: {
    width: 150, height: 150, borderRadius: "50%",
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 4, transition: "background 0.5s",
  },
  breathPhaseText: { fontSize: 20, fontWeight: 700, transition: "color 0.5s" },
  breathTimer: { fontSize: 32, fontWeight: 700, color: "var(--text)" },
  breathCycles: { fontSize: 14, fontWeight: 600, color: "var(--text-muted)" },

  /* Timer Presets */
  timerPresets: { display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" },
  timerPresetBtn: {
    padding: "10px 16px", borderRadius: "var(--radius-xs)", border: "none",
    fontSize: 13, cursor: "pointer", transition: "all 0.25s",
  },

  /* Sound */
  soundGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 },
  soundBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    padding: "12px 8px", borderRadius: "var(--radius-sm)", border: gl.border,
    cursor: "pointer", transition: "all 0.25s",
    background: "var(--card-bg)",
    boxShadow: "var(--shadow)",
  },

  /* Meditation Timer */
  meditationContainer: { display: "flex", justifyContent: "center", padding: "24px 0" },
  timerCircle: {
    position: "relative", width: 200, height: 200,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  timerDisplay: {
    position: "absolute", display: "flex", flexDirection: "column",
    alignItems: "center", gap: 4,
  },
  timerTime: { fontSize: 36, fontWeight: 700, color: "var(--text)" },
  timerLabel: { fontSize: 13, color: "var(--text-muted)", fontWeight: 600 },

  /* Controls */
  controlsArea: { padding: "8px 0 24px" },

  /* Complete */
  completeCard: {
    textAlign: "center", background: gl.bg, borderRadius: "var(--radius)",
    padding: "40px 24px 32px", boxShadow: gl.shadowMd,
    border: gl.border,
  },
  completeTitle: { fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" },
  completeDesc: { fontSize: 15, color: "var(--text-secondary)", margin: "0 0 24px", lineHeight: 1.6 },
  completeActions: { display: "flex", flexDirection: "column", gap: 10, marginTop: 24 },
};
