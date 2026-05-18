import { useState, useEffect, useRef, useCallback } from "react";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { Wind, Zap, Heart, Plus, Trash2, BookOpen, Star } from "lucide-react";

// ===== AMBIENT AUDIO — usa ficheiros reais de /public/sounds/ =====
//
// SONS NECESSÁRIOS — coloca estes ficheiros em laphis-frontend/public/sounds/
// Descarrega grátis (sem atribuição) em https://pixabay.com/sound-effects/
//   rain.mp3      → pesquisa "rain ambience loop"
//   ocean.mp3     → pesquisa "ocean waves loop"
//   forest.mp3    → pesquisa "forest birds ambience"
//   fire.mp3      → pesquisa "campfire crackling loop"
//   wind.mp3      → pesquisa "wind howling loop"
//   whitenoise.mp3→ pesquisa "white noise loop"
//   thunder.mp3   → pesquisa "thunderstorm rain loop"
//   cafe.mp3      → pesquisa "coffee shop ambience"
//
class AmbientAudio {
  constructor() {
    this._audio = null;
    this._fadeTimer = null;
  }

  play(key) {
    this.stop();
    if (key === "silence") return;

    const audio = new Audio(`/sounds/${key}.mp3`);
    audio.loop = true;
    audio.volume = 0;

    // fade-in over 2s
    let vol = 0;
    const step = 0.65 / 20; // target 0.65 volume in 20 steps
    const fadeIn = setInterval(() => {
      vol = Math.min(0.65, vol + step);
      audio.volume = vol;
      if (vol >= 0.65) clearInterval(fadeIn);
    }, 100);

    audio.play().catch(() => clearInterval(fadeIn));
    this._audio = audio;
    this._fadeTimer = fadeIn;
  }

  stop() {
    if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
    if (this._audio) {
      try { this._audio.pause(); this._audio.currentTime = 0; } catch {}
      this._audio = null;
    }
  }

  fadeOut() {
    if (!this._audio) return;
    const audio = this._audio;
    this._audio = null;
    if (this._fadeTimer) { clearInterval(this._fadeTimer); this._fadeTimer = null; }
    let vol = audio.volume;
    const fade = setInterval(() => {
      vol = Math.max(0, vol - 0.05);
      try { audio.volume = vol; } catch {}
      if (vol <= 0) { try { audio.pause(); } catch {} clearInterval(fade); }
    }, 80);
  }
}

const ambientAudio = new AmbientAudio();

const BREATHING_PATTERNS = [
  { name: "Relaxar", label: "4-7-8", inhale: 4, hold: 7, exhale: 8, desc: "Reduz ansiedade" },
  { name: "Box Breathing", label: "4-4-4", inhale: 4, hold: 4, exhale: 4, desc: "Equilíbrio total" },
  { name: "Calma Profunda", label: "5-5-5", inhale: 5, hold: 5, exhale: 5, desc: "Meditação ativa" },
  { name: "Foco", label: "4-2-6", inhale: 4, hold: 2, exhale: 6, desc: "Clareza mental" },
  { name: "Coerência", label: "5-0-5", inhale: 5, hold: 0, exhale: 5, desc: "Ritmo cardíaco" },
  { name: "Energizar", label: "6-2-4", inhale: 6, hold: 2, exhale: 4, desc: "Mais energia" },
  { name: "Anti-Stress", label: "4-4-8", inhale: 4, hold: 4, exhale: 8, desc: "Expira o stress" },
  { name: "Sono", label: "4-8-8", inhale: 4, hold: 8, exhale: 8, desc: "Prepara o descanso" },
];

const AMBIENT_SOUNDS = [
  { key: "silence", label: "Silêncio", icon: "🔇" },
  { key: "rain", label: "Chuva", icon: "🌧️" },
  { key: "ocean", label: "Oceano", icon: "🌊" },
  { key: "forest", label: "Floresta", icon: "🌲" },
  { key: "fire", label: "Fogueira", icon: "🔥" },
  { key: "wind", label: "Vento", icon: "💨" },
  { key: "whitenoise", label: "Ruído Branco", icon: "〰️" },
  { key: "thunder", label: "Trovoada", icon: "⛈️" },
  { key: "cafe", label: "Café", icon: "☕" },
];

const MOODS = [
  { value: "calm", label: "Calmo", color: "var(--p1)" },
  { value: "happy", label: "Feliz", color: "var(--p2)" },
  { value: "stressed", label: "Stressado", color: "var(--danger)" },
  { value: "anxious", label: "Ansioso", color: "var(--p3)" },
  { value: "tired", label: "Cansado", color: "var(--p4)" },
  { value: "energetic", label: "Energético", color: "var(--primary)" },
  { value: "neutral", label: "Neutro", color: "var(--text-muted)" },
];

const TIMER_PRESETS = [3, 5, 10, 15, 20];

const AFFIRMATIONS_CATEGORIES = [
  { key: "all", label: "Todas" },
  { key: "forca", label: "Força" },
  { key: "mente", label: "Mente" },
  { key: "gratidao", label: "Gratidão" },
  { key: "habitos", label: "Hábitos" },
  { key: "confianca", label: "Confiança" },
];

const GRATITUDE_QUESTIONS = [
  "Hoje, o que te fez sorrir?",
  "Que pessoa merece um obrigado teu hoje?",
  "Que coisa simples foi especial hoje?",
  "Qual foi o teu pequeno progresso hoje?",
  "O que aprendeste que não sabias ontem?",
  "Que momento de hoje queres guardar?",
  "O que te deu força hoje?",
];

const AFFIRMATIONS = [
  { text: "O meu corpo é forte, capaz e resiliente.", cat: "forca" },
  { text: "Cada treino torna-me mais forte do que ontem.", cat: "forca" },
  { text: "Cuido do meu corpo porque ele é o meu lar.", cat: "forca" },
  { text: "A minha força cresce a cada desafio que enfrento.", cat: "forca" },
  { text: "O meu corpo merece movimento, descanso e nutrição.", cat: "forca" },
  { text: "Estou a construir a melhor versão de mim, um dia de cada vez.", cat: "forca" },
  { text: "A consistência é o meu superpoder.", cat: "forca" },
  { text: "Cada repetição conta. Cada esforço importa.", cat: "forca" },
  { text: "O meu corpo adapta-se, melhora e surpreende-me.", cat: "forca" },
  { text: "Tenho energia para dar e receber.", cat: "forca" },
  { text: "A minha mente está calma, clara e focada.", cat: "mente" },
  { text: "Escolho pensamentos que me elevam e fortalecem.", cat: "mente" },
  { text: "Tenho controlo sobre as minhas reações e emoções.", cat: "mente" },
  { text: "A paz começa em mim e irradia para tudo à minha volta.", cat: "mente" },
  { text: "Cada respiração acalma o meu sistema nervoso.", cat: "mente" },
  { text: "Sou capaz de superar qualquer obstáculo com serenidade.", cat: "mente" },
  { text: "A minha mente é um aliado, não um inimigo.", cat: "mente" },
  { text: "Foco-me no que posso controlar e solto o resto.", cat: "mente" },
  { text: "Cada dia é uma nova oportunidade de recomeçar.", cat: "mente" },
  { text: "Sou presente. Estou aqui. Isto é suficiente.", cat: "mente" },
  { text: "Sou grato(a) pelo progresso que faço todos os dias.", cat: "gratidao" },
  { text: "Reconheço e celebro as minhas conquistas, grandes e pequenas.", cat: "gratidao" },
  { text: "Há sempre algo pelo qual ser grato neste momento.", cat: "gratidao" },
  { text: "Atraio saúde, energia e bem-estar para a minha vida.", cat: "gratidao" },
  { text: "A minha vida está cheia de oportunidades para crescer.", cat: "gratidao" },
  { text: "Sou suficiente exatamente como sou, e continuo a evoluir.", cat: "gratidao" },
  { text: "Mereço saúde, felicidade e equilíbrio em todas as áreas da vida.", cat: "gratidao" },
  { text: "A abundância flui naturalmente para mim.", cat: "gratidao" },
  { text: "O descanso faz parte do meu treino e honro-o.", cat: "habitos" },
  { text: "Honro o meu corpo com cada decisão que tomo.", cat: "habitos" },
  { text: "A disciplina de hoje é a liberdade de amanhã.", cat: "habitos" },
  { text: "Faço escolhas que o meu eu futuro vai agradecer.", cat: "habitos" },
  { text: "Cada pequena ação positiva cria um grande impacto.", cat: "habitos" },
  { text: "Não preciso de ser perfeito(a), só preciso de ser consistente.", cat: "habitos" },
  { text: "O progresso, por mais pequeno que seja, é sempre progresso.", cat: "habitos" },
  { text: "Começo hoje. Não amanhã. Hoje.", cat: "habitos" },
  { text: "Confio em mim e no processo da minha jornada.", cat: "confianca" },
  { text: "Sou capaz de mais do que imagino.", cat: "confianca" },
  { text: "Acredito no meu potencial ilimitado.", cat: "confianca" },
  { text: "A minha confiança cresce a cada vez que me desafio.", cat: "confianca" },
  { text: "Sou corajoso(a) o suficiente para começar e persistente o suficiente para continuar.", cat: "confianca" },
  { text: "A minha opinião sobre mim próprio(a) é a única que realmente importa.", cat: "confianca" },
  { text: "Sou o(a) arquiteto(a) da minha própria saúde e felicidade.", cat: "confianca" },
];

export default function Zen() {
  const { profile } = useApp();
  const toast = useToast();
  const [activeView, setActiveView] = useState("home"); // home, breathing, meditation, gratitude, affirmations
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
  const [gratitudeText, setGratitudeText] = useState("");
  const [gratitudeSaved, setGratitudeSaved] = useState(false);
  const [affirmationIdx, setAffirmationIdx] = useState(
    () => Math.floor(Math.random() * AFFIRMATIONS.length)
  );
  const [affirmationCategory, setAffirmationCategory] = useState("all");
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [todayAffirmation] = useState(
    AFFIRMATIONS[Math.floor(Date.now() / 86400000) % AFFIRMATIONS.length].text
  );

  const timerRef = useRef(null);
  const breathRef = useRef(null);

  useEffect(() => {
    loadHistory();
    return () => {
      clearInterval(timerRef.current);
      clearInterval(breathRef.current);
      ambientAudio.stop();
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

    // Start ambient sound
    ambientAudio.play(selectedSound);

    timerRef.current = setInterval(() => {
      setMeditationTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          ambientAudio.fadeOut();
          setIsSessionActive(false);
          setShowComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerMinutes, selectedSound]);

  const stopMeditation = useCallback(() => {
    clearInterval(timerRef.current);
    ambientAudio.fadeOut();
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
                      background: selectedPattern.name === p.name ? "var(--primary-bg)" : "var(--card-bg)",
                    }}
                  >
                    <span style={s.patternName}>{p.name}</span>
                    <span style={s.patternLabel}>{p.label}</span>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>{p.desc}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Breathing Circle */}
            <div style={s.breathWrapper}>
              <p style={s.breathCycles}>Ciclos: {breathCount}</p>
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
              </div>
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
        <button style={s.backBtn} onClick={() => { stopMeditation(); ambientAudio.stop(); setActiveView("home"); }}>
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
                        boxShadow: timerMinutes === t ? "0 4px 12px var(--btn-primary-hover-shadow)" : "var(--shadow)",
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
                        background: selectedSound === snd.key ? "var(--primary-bg)" : "var(--card-bg)",
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{snd.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>{snd.label}</span>
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

  // ===== GRATITUDE VIEW =====
  if (activeView === "gratitude") {
    const todayQ = GRATITUDE_QUESTIONS[Math.floor(Date.now() / 86400000) % GRATITUDE_QUESTIONS.length];

    const handleSaveGratitude = async () => {
      if (!gratitudeText.trim()) return;
      setSaving(true);
      try {
        await ApiService.saveZenSession({
          type: "gratitude",
          duration_min: 2,
          mood_before: null,
          mood_after: "happy",
          notes: `${todayQ}\n\n${gratitudeText.trim()}`,
        });
        setGratitudeSaved(true);
        setGratitudeText("");
        loadHistory();
      } catch (err) {
        console.error("Erro ao guardar gratidão:", err);
        toast.error("Erro ao guardar. Tenta novamente.");
      } finally {
        setSaving(false);
      }
    };

    const pastEntries = history.filter(h => h.type === "gratitude").slice(0, 3);

    return (
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => { setActiveView("home"); setGratitudeSaved(false); setGratitudeText(""); }}>
          ← Voltar
        </button>

        {!gratitudeSaved ? (
          <div style={s.gratitudeCard}>
            <span style={s.gratitudeLabel}>Pergunta do dia</span>
            <p style={s.gratitudeQuestion}>{todayQ}</p>
            <textarea
              value={gratitudeText}
              onChange={(e) => setGratitudeText(e.target.value)}
              rows={4}
              placeholder="A tua resposta..."
              style={s.gratitudeInput}
              autoFocus
            />
            <button
              className="btn btn-primary btn-full"
              style={{ marginTop: 16 }}
              disabled={!gratitudeText.trim() || saving}
              onClick={handleSaveGratitude}
            >
              {saving ? "A guardar..." : "Guardar"}
            </button>
          </div>
        ) : (
          <div style={s.gratitudeSavedCard}>
            <div style={{ fontSize: 44, marginBottom: 16 }}>🌱</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.02em" }}>Guardado.</h3>
            <p style={{ fontSize: 15, color: "var(--text-secondary)", margin: 0, lineHeight: 1.7 }}>
              A gratidão transforma a perspetiva.<br />Que o teu dia seja leve.
            </p>
            <button
              className="btn btn-ghost"
              style={{ marginTop: 24 }}
              onClick={() => setGratitudeSaved(false)}
            >
              Escrever mais
            </button>
          </div>
        )}

        {pastEntries.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h4 style={s.sectionTitle}>Entradas Anteriores</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pastEntries.map((h, i) => {
                const parts = h.notes?.split("\n\n");
                const question = parts?.length > 1 ? parts[0] : null;
                const answer = parts?.length > 1 ? parts[1] : h.notes;
                return (
                  <div key={i} style={s.gratitudeEntry}>
                    <span style={s.gratitudeEntryDate}>{h.created_at?.split("T")[0]}</span>
                    {question && <span style={s.gratitudeEntryQ}>{question}</span>}
                    <span style={s.gratitudeEntryText}>{answer}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===== AFFIRMATIONS VIEW =====
  if (activeView === "affirmations") {
    const filtered = affirmationCategory === "all"
      ? AFFIRMATIONS
      : AFFIRMATIONS.filter(a => a.cat === affirmationCategory);
    const safeIdx = affirmationIdx % filtered.length;
    const current = filtered[safeIdx]?.text || filtered[0]?.text;

    const handleCategoryChange = (key) => {
      setAffirmationCategory(key);
      setAffirmationIdx(0);
    };

    return (
      <div style={s.page}>
        <button style={s.backBtn} onClick={() => setActiveView("home")}>
          ← Voltar
        </button>
        <div style={s.zenHeroBg}>
          <h2 style={{ ...s.zenTitle, fontSize: 20 }}>Afirmações Positivas</h2>
          <p style={s.zenSubtitle}>Repete em voz alta com convicção</p>
        </div>

        {/* Category filter */}
        <div style={s.catFilterRow}>
          {AFFIRMATIONS_CATEGORIES.map(c => (
            <button
              key={c.key}
              style={{
                ...s.catChip,
                ...(affirmationCategory === c.key ? s.catChipActive : {}),
              }}
              onClick={() => handleCategoryChange(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Affirmation card */}
        <div style={s.affirmationDetailCard}>
          <p style={s.affirmationDetailText}>"{current}"</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 28 }}>
            <button
              className="btn btn-ghost"
              onClick={() => setAffirmationIdx((safeIdx - 1 + filtered.length) % filtered.length)}
            >
              ←
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                let next;
                do { next = Math.floor(Math.random() * filtered.length); } while (next === safeIdx && filtered.length > 1);
                setAffirmationIdx(next);
              }}
            >
              Aleatória
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => setAffirmationIdx((safeIdx + 1) % filtered.length)}
            >
              →
            </button>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "16px 0 0", textAlign: "center" }}>
            {safeIdx + 1} / {filtered.length}
          </p>
        </div>
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
        <span style={s.affirmationDayLabel}>Afirmação do dia</span>
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
          <div style={{ ...s.activityIconCircle, background: "var(--primary-bg)" }}>
            <Wind size={24} color="var(--primary)" strokeWidth={1.5} />
          </div>
          <h4 style={s.activityTitle}>Respiração</h4>
          <p style={s.activityDesc}>8 padrões guiados</p>
        </button>

        <button style={s.activityCard} onClick={() => { setMoodBefore(null); setActiveView("meditation"); }}>
          <div style={{ ...s.activityIconCircle, background: "rgba(140, 68, 27, 0.08)" }}>
            <Zap size={24} color="var(--accent)" strokeWidth={1.5} />
          </div>
          <h4 style={s.activityTitle}>Meditação</h4>
          <p style={s.activityDesc}>Timer com 9 sons</p>
        </button>

        <button style={s.activityCard} onClick={() => { setGratitudeSaved(false); setGratitudeText(""); setActiveView("gratitude"); }}>
          <div style={{ ...s.activityIconCircle, background: "rgba(34, 197, 94, 0.08)" }}>
            <BookOpen size={24} color="#22c55e" strokeWidth={1.5} />
          </div>
          <h4 style={s.activityTitle}>Gratidão</h4>
          <p style={s.activityDesc}>Diário de gratidão diário</p>
        </button>

        <button style={s.activityCard} onClick={() => setActiveView("affirmations")}>
          <div style={{ ...s.activityIconCircle, background: "rgba(234, 179, 8, 0.08)" }}>
            <Star size={24} color="#eab308" strokeWidth={1.5} />
          </div>
          <h4 style={s.activityTitle}>Afirmações</h4>
          <p style={s.activityDesc}>Mentalidade positiva</p>
        </button>
      </div>

      {/* Recent Sessions */}
      {history.length > 0 && (
        <>
          <h3 style={{ ...s.sectionTitle, marginTop: 28 }}>Sessões Recentes</h3>
          <div style={s.historyList}>
            {history.slice(0, 5).map((h, i) => {
              const moodObj = MOODS.find(m => m.value === h.mood_after);
              const typeLabel = h.type === "breathing" ? "Respiração" : h.type === "gratitude" ? "Gratidão" : "Meditação";
              const durationLabel = h.type === "gratitude" ? "" : ` — ${h.duration_min}min`;
              return (
                <div key={i} style={s.historyItem}>
                  <div style={s.historyIcon}>
                    {h.type === "breathing" ? <Wind size={16} strokeWidth={1.5} /> : h.type === "gratitude" ? <BookOpen size={16} strokeWidth={1.5} /> : <Zap size={16} strokeWidth={1.5} />}
                  </div>
                  <div style={s.historyInfo}>
                    <span style={s.historyTitle}>{typeLabel}{durationLabel}</span>
                    <span style={s.historyDate}>{h.created_at?.split("T")[0] || "—"}</span>
                  </div>
                  <div style={s.historyMood}>{moodObj?.label || "—"}</div>
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
  zenTitle: { fontSize: "var(--text-h1)", fontWeight: 800, color: "white", margin: "0 0 6px", letterSpacing: "-0.03em" },
  zenSubtitle: { fontSize: "var(--text-body)", color: "rgba(255,255,255,0.8)", margin: 0, fontWeight: 500 },

  /* Affirmation — home card */
  affirmationCard: {
    padding: "20px 20px 18px", background: gl.bg, borderRadius: "var(--radius-sm)",
    boxShadow: gl.shadow, marginBottom: 20,
    border: gl.border, borderLeft: "3px solid var(--accent)",
  },
  affirmationDayLabel: {
    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--accent)", marginBottom: 8,
  },
  affirmationText: {
    fontSize: 15, color: "var(--text)", fontStyle: "italic",
    lineHeight: 1.65, margin: 0, fontWeight: 600,
  },

  /* Affirmation — detail view */
  affirmationDetailCard: {
    marginTop: 24, padding: "36px 24px 28px",
    background: gl.bg, borderRadius: 20,
    border: gl.border, boxShadow: "var(--shadow-md)",
    textAlign: "center",
  },
  affirmationDetailText: {
    fontSize: 20, fontWeight: 700, color: "var(--text)",
    lineHeight: 1.55, margin: 0, fontStyle: "italic",
  },

  /* Category filter */
  catFilterRow: {
    display: "flex", gap: 8, flexWrap: "wrap", marginTop: 20, marginBottom: 4,
  },
  catChip: {
    padding: "7px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
    border: "1px solid var(--border)", background: "var(--card-bg)",
    color: "var(--text-secondary)", cursor: "pointer", transition: "all 0.2s",
  },
  catChipActive: {
    background: "var(--primary)", color: "#fff", borderColor: "var(--primary)",
  },

  /* Gratitude */
  gratitudeCard: {
    marginTop: 8, padding: "28px 24px",
    background: gl.bg, borderRadius: 20,
    border: gl.border, boxShadow: "var(--shadow-md)",
  },
  gratitudeLabel: {
    display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--primary)", marginBottom: 12,
  },
  gratitudeQuestion: {
    fontSize: 20, fontWeight: 700, color: "var(--text)",
    lineHeight: 1.45, margin: "0 0 24px", letterSpacing: "-0.01em",
  },
  gratitudeInput: {
    width: "100%", padding: "14px 16px", borderRadius: 12,
    border: "1px solid var(--border)", background: "var(--bg-tertiary)",
    color: "var(--text)", fontSize: 15, lineHeight: 1.7,
    resize: "none", fontFamily: "inherit", boxSizing: "border-box",
    outline: "none",
  },
  gratitudeSavedCard: {
    marginTop: 8, padding: "48px 24px",
    background: gl.bg, borderRadius: 20,
    border: gl.border, boxShadow: "var(--shadow-md)",
    textAlign: "center",
  },
  gratitudeEntry: {
    padding: "16px 18px", background: gl.bg, borderRadius: 14,
    border: gl.border, boxShadow: gl.shadow,
    display: "flex", flexDirection: "column", gap: 6,
  },
  gratitudeEntryDate: {
    fontSize: 11, fontWeight: 600, color: "var(--text-muted)", letterSpacing: "0.04em",
  },
  gratitudeEntryQ: {
    fontSize: 13, fontWeight: 700, color: "var(--primary)", fontStyle: "italic",
  },
  gratitudeEntryText: {
    fontSize: 14, color: "var(--text)", lineHeight: 1.65,
  },

  /* Zen Stats */
  zenStatsRow: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 },
  zenStatCard: {
    background: gl.bg, borderRadius: "var(--radius-sm)", padding: "16px 8px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
    boxShadow: gl.shadow, border: gl.border,
  },
  zenStatValue: { fontSize: "var(--text-h2)", fontWeight: 800, color: "var(--text)", fontFamily: "var(--font-heading)" },
  zenStatLabel: { fontSize: "var(--text-overline)", color: "var(--text-muted)", fontWeight: 600 },

  /* Section */
  sectionTitle: { fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: "0 0 16px", letterSpacing: "-0.02em" },
  subTitle: { fontSize: "var(--text-body)", fontWeight: 700, color: "var(--text)", margin: "24px 0 14px" },

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
  activityTitle: { fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.01em" },
  activityDesc: { fontSize: "var(--text-caption)", color: "var(--text-muted)", margin: 0, lineHeight: 1.5 },

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
  patternGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 24 },
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
  breathWrapper: { display: "flex", flexDirection: "column", alignItems: "center", gap: 0 },
  breathContainer: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "40px 0 40px", /* vertical padding absorbs the scale overhang */
  },
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
  breathCycles: { fontSize: 14, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 },

  /* Timer Presets */
  timerPresets: { display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" },
  timerPresetBtn: {
    padding: "10px 16px", borderRadius: "var(--radius-xs)", border: "none",
    fontSize: 13, cursor: "pointer", transition: "all 0.25s",
  },

  /* Sound */
  soundGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 24 }, // 9 sons = 3×3
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
  completeTitle: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: "0 0 10px", letterSpacing: "-0.03em" },
  completeDesc: { fontSize: "var(--text-h3)", color: "var(--text-secondary)", margin: "0 0 28px", lineHeight: 1.6 },
  completeActions: { display: "flex", flexDirection: "column", gap: 10, marginTop: 24 },
};
