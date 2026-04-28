import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import ExerciseCard, { ExerciseList } from "../components/ExerciseCard";
import PlanWorkoutBox from "../components/PlanWorkoutBox";
import { Send, Trash2, Save, FileText, Plus, MessageSquare, Pencil, Clock, ChevronLeft, Menu, Check, Zap, Dumbbell } from "lucide-react";

/* Detect if message content looks like a training/nutrition plan */
function looksLikePlan(text) {
  if (!text || text.length < 200) return false;
  const lower = text.toLowerCase();

  // Must be about training or nutrition
  const isFitness = /treino|exerc[ií]cio|s[eé]rie|reps|sets|supino|agachamento|deadlift|press|curl/.test(lower);
  const isNutrition = /nutri[cç][aã]o|dieta|refei[cç][aã]o|caloria|kcal|prote[ií]na|pequeno[- ]almo[cç]o|almo[cç]o|jantar|snack|alimentar/.test(lower);
  if (!isFitness && !isNutrition) return false;

  // Must have structural plan indicators (days, numbered items, bullet points)
  const hasStructure = /dia \d|segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo/i.test(text);
  const hasList = (text.match(/^[\s]*[-•●\d][.)\s]/gm) || []).length >= 3;
  const hasMultipleLines = text.split("\n").filter(l => l.trim()).length >= 6;

  return (hasStructure || hasList) && hasMultipleLines;
}

/* Inline formatting: **bold**, *italic*, ***bold italic*** */
function inlineFormat(text, lineKey) {
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let parts = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    if (match[2]) parts.push(<strong key={`${lineKey}-b${match.index}`}><em>{match[2]}</em></strong>);
    else if (match[3]) parts.push(<strong key={`${lineKey}-b${match.index}`}>{match[3]}</strong>);
    else if (match[4]) parts.push(<em key={`${lineKey}-i${match.index}`}>{match[4]}</em>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length === 0 ? text : parts;
}

/* Render markdown: headings, bullet/numbered lists, bold, italic */
function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();

    // Blank line → spacer
    if (trimmed === "") return <div key={i} style={{ height: 6 }} />;

    // Headings: # ## ### ####
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)/);
    if (hMatch) {
      const lvl = hMatch[1].length;
      const sz = { 1: 18, 2: 16, 3: 15, 4: 14 };
      return (
        <div key={i} style={{ fontSize: sz[lvl], fontWeight: 700, marginTop: lvl <= 2 ? 12 : 8, marginBottom: 4, color: "var(--text)" }}>
          {inlineFormat(hMatch[2], i)}
        </div>
      );
    }

    // Bullet lists: - , * , •
    const bMatch = trimmed.match(/^[-*•]\s+(.+)/);
    if (bMatch) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, paddingLeft: 4 }}>
          <span style={{ color: "var(--primary)", fontWeight: 700, flexShrink: 0 }}>•</span>
          <span>{inlineFormat(bMatch[1], i)}</span>
        </div>
      );
    }

    // Numbered lists: 1. 2) etc
    const nMatch = trimmed.match(/^(\d+)[.)\s]\s*(.+)/);
    if (nMatch) {
      return (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 3, paddingLeft: 4 }}>
          <span style={{ color: "var(--primary)", fontWeight: 600, flexShrink: 0, minWidth: 16 }}>{nMatch[1]}.</span>
          <span>{inlineFormat(nMatch[2], i)}</span>
        </div>
      );
    }

    // Regular paragraph line
    return (
      <div key={i} style={{ marginBottom: 2 }}>
        {inlineFormat(trimmed, i)}
      </div>
    );
  });
}

const SUGGESTIONS = [
  "Cria um plano semanal de treino",
  "Sugere exercícios para costas",
  "O que devo comer pós-treino?",
  "Como melhorar a minha postura?",
  "Analisa o meu progresso",
];

function daysLeft(expiresAt) {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

/**
 * Extrai nomes de exercícios de uma resposta do AI. Procura padrões como:
 *   - "Supino reto: 3x10"
 *   - "1. Agachamento — 4x12"
 *   - "- **Flexões** 3x15"
 * Devolve uma lista de strings (nomes) com duplicados removidos.
 */
function extractExerciseNames(text = "") {
  const lines = text.split(/\n+/);
  const out = [];
  const seen = new Set();
  const sxr = /\b\d+\s*[x×]\s*\d+/i;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    // Tira marcadores comuns no início ("- ", "* ", "1. ", "•")
    let stripped = line.replace(/^[-*•]\s+/, "").replace(/^\d+[.)-]\s+/, "");
    // Tira markdown bold/italic
    stripped = stripped.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1");
    // Linhas com padrão "Nome: 3x10" ou "Nome - 3x10" ou "Nome 3x10"
    const m = stripped.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s\-/]{2,40}?)(?:\s*[:–—-]\s*|\s+)(?=.*\d+\s*[x×]\s*\d+)/);
    let name = null;
    if (m) {
      name = m[1].trim();
    } else if (sxr.test(stripped)) {
      // fallback: tira tudo a partir do primeiro número
      name = stripped.split(/\d/)[0].replace(/[:–—\-\s]+$/, "").trim();
    }
    if (!name || name.length < 3 || name.length > 50) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(name);
  }
  return out;
}

export default function Chat() {
  const navigate = useNavigate();
  const { profile } = useApp();
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [editingTitle, setEditingTitle] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [savingPlan, setSavingPlan] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [pendingSuggestions, setPendingSuggestions] = useState([]);
  const [detectedExercises, setDetectedExercises] = useState({});  // msgIndex -> exercises[]
  const [selectedExercise, setSelectedExercise] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  // Detectar categoria de treino na mensagem e buscar exercícios relevantes
  useEffect(() => {
    const lastIdx = messages.length - 1;
    if (lastIdx < 0) return;
    const msg = messages[lastIdx];
    if (msg.role !== "assistant") return;
    if (detectedExercises[lastIdx] !== undefined) return;

    const text = msg.content.toLowerCase();

    // Detetar categoria com base em palavras-chave
    const categoryMap = [
      { category: "peito",    keywords: ["peito", "supino", "chest", "peitoral", "bench", "crucifixo", "flexões"] },
      { category: "costas",   keywords: ["costas", "remada", "dorsal", "pull", "deadlift", "terra", "lat", "elevações"] },
      { category: "pernas",   keywords: ["perna", "quad", "glúteo", "gluteo", "agachamento", "squat", "leg press", "stiff", "lunges", "afundos", "femur", "gémeo"] },
      { category: "ombros",   keywords: ["ombro", "deltóide", "press militar", "overhead", "elevação lateral", "face pull", "arnold"] },
      { category: "biceps",   keywords: ["bícep", "bicep", "curl", "rosca"] },
      { category: "triceps",  keywords: ["trícep", "tricep", "skull", "dips", "extensão tríceps"] },
      { category: "abdomen",  keywords: ["abdómen", "abdominal", "core", "prancha", "plank", "crunch", "oblíquo"] },
      { category: "cardio",   keywords: ["cardio", "burpee", "hiit", "corrida", "mountain climber", "jumping", "aeróbico"] },
      { category: "full_body",keywords: ["corpo inteiro", "full body", "kettlebell", "funcional", "completo"] },
    ];

    // Exige pelo menos 3 palavras-chave de fitness para mostrar exercícios
    const isFitnessMsg = /treino|exerc[ií]cio|s[eé]rie|reps|sets|x\d|\dx\d/i.test(msg.content);
    if (!isFitnessMsg) {
      setDetectedExercises(prev => ({ ...prev, [lastIdx]: [] }));
      return;
    }

    let detectedCategory = null;
    for (const { category, keywords } of categoryMap) {
      if (keywords.some(kw => text.includes(kw))) {
        detectedCategory = category;
        break;
      }
    }

    if (!detectedCategory) {
      setDetectedExercises(prev => ({ ...prev, [lastIdx]: [] }));
      return;
    }

    // Extrair nomes de exercícios do texto (linhas com padrão "Nome: 3x10",
    // "1. Nome", "- Nome 4x12", ou bullets do markdown).
    const extractedNames = extractExerciseNames(msg.content).slice(0, 6);

    // Uma única chamada à API para buscar 3 exercícios da categoria
    ApiService.listExercises({ category: detectedCategory, limit: 3 })
      .then(items => {
        const list = Array.isArray(items) ? items : (items?.items || []);
        // Se a BD não tem nada, criamos items sintéticos a partir dos nomes
        // que a IA mencionou — ainda assim renderiza imagem com a cor da categoria.
        if (list.length === 0 && extractedNames.length > 0) {
          const synthetic = extractedNames.map((name, idx) => ({
            id: `synthetic-${lastIdx}-${idx}`,
            name,
            category: detectedCategory,
            muscle_primary: detectedCategory,
            difficulty: "intermedio",
            default_sets: 3,
            default_reps: "10-12",
            default_rest_sec: 60,
            calories_per_min: 6,
          }));
          setDetectedExercises(prev => ({ ...prev, [lastIdx]: synthetic }));
        } else {
          setDetectedExercises(prev => ({ ...prev, [lastIdx]: list }));
        }
      })
      .catch(() => {
        const synthetic = extractedNames.map((name, idx) => ({
          id: `synthetic-${lastIdx}-${idx}`,
          name,
          category: detectedCategory,
          muscle_primary: detectedCategory,
          difficulty: "intermedio",
          default_sets: 3,
          default_reps: "10-12",
          default_rest_sec: 60,
          calories_per_min: 6,
        }));
        setDetectedExercises(prev => ({ ...prev, [lastIdx]: synthetic }));
      });
  }, [messages]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSessions = useCallback(async () => {
    try {
      const list = await ApiService.getChatSessions();
      setSessions(list || []);
    } catch (e) {
      console.error("Erro ao carregar sessões:", e);
    } finally {
      setSessionsLoaded(true);
    }
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // Fetch pending adaptation suggestions
  useEffect(() => {
    ApiService.getAdaptationSuggestions("pending")
      .then(data => setPendingSuggestions(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const loadSession = async (sessionId) => {
    try {
      const data = await ApiService.getChatSession(sessionId);
      if (data) {
        setActiveSession(data);
        setMessages(data.messages || []);
        setShowSidebar(false);
      }
    } catch (e) {
      console.error("Erro ao carregar sessão:", e);
    }
  };

  const handleNewSession = async () => {
    try {
      const session = await ApiService.createChatSession();
      setSessions((prev) => [session, ...prev]);
      setActiveSession(session);
      setMessages([]);
      setShowSidebar(false);
      inputRef.current?.focus();
    } catch (e) {
      console.error("Erro ao criar sessão:", e);
    }
  };

  const handleDeleteSession = async () => {
    if (!showDeleteModal) return;
    try {
      await ApiService.deleteChatSession(showDeleteModal);
      setSessions((prev) => prev.filter((s) => s.id !== showDeleteModal));
      if (activeSession?.id === showDeleteModal) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch (e) {
      console.error("Erro ao apagar:", e);
    } finally {
      setShowDeleteModal(null);
    }
  };

  const handleRename = async (sessionId) => {
    if (!editTitle.trim()) return;
    try {
      await ApiService.renameChatSession(sessionId, editTitle.trim());
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, title: editTitle.trim() } : s))
      );
      if (activeSession?.id === sessionId) {
        setActiveSession((prev) => ({ ...prev, title: editTitle.trim() }));
      }
    } catch (e) {
      console.error("Erro ao renomear:", e);
    } finally {
      setEditingTitle(null);
    }
  };

  // Deteta se a mensagem é um pedido explícito para criar/gerar um plano
  const isPlanRequest = (msg) => {
    const q = msg.toLowerCase();
    return (
      (q.includes("cria") || q.includes("gera") || q.includes("faz") || q.includes("dá-me") || q.includes("dame") || q.includes("quero")) &&
      (q.includes("plano") || q.includes("programa") || q.includes("rotina") || q.includes("treino") || q.includes("workout"))
    );
  };

  const sendMessage = async (text = null) => {
    const msg = (text || input).trim();
    if (!msg || loading || !profile) return;
    setInput("");

    const userMsg = { role: "user", content: msg, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Se é pedido de plano, gerar via API de planos diretamente
    if (isPlanRequest(msg)) {
      try {
        const q = msg.toLowerCase();
        const type = (q.includes("nutri") || q.includes("aliment") || q.includes("dieta"))
          ? (q.includes("treino") || q.includes("exerc") ? "combined" : "nutrition")
          : "training";

        const plan = await ApiService.generatePlan(profile.id, type, msg, null);
        const planId = plan?.id || plan?.plan?.id;
        const planTitle = plan?.title || plan?.plan?.title || "Plano gerado";

        const confirmMsg = `✅ **${planTitle}** criado!`;
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: confirmMsg,
          created_at: new Date().toISOString(),
          planId,
          planTitle,
        }]);
      } catch {
        // fallback para resposta normal do AI
        try {
          const resp = await ApiService.askAI(msg, profile.id, activeSession?.id || null);
          const aiText = resp.title
            ? `${resp.title}\n\n${(resp.bullets || []).map((b) => (b.startsWith("•") ? b : `• ${b}`)).join("\n")}`
            : resp.answer || resp.response || "Sem resposta.";
          setMessages((prev) => [...prev, { role: "assistant", content: aiText, created_at: new Date().toISOString() }]);
        } catch (err2) {
          setMessages((prev) => [...prev, { role: "assistant", content: "Erro: " + (err2.message || "Sem ligação"), created_at: new Date().toISOString() }]);
        }
      } finally {
        setLoading(false);
        inputRef.current?.focus();
      }
      return;
    }

    try {
      const resp = await ApiService.askAI(msg, profile.id, activeSession?.id || null);
      const aiText = resp.title
        ? `${resp.title}\n\n${(resp.bullets || []).map((b) => (b.startsWith("•") ? b : `• ${b}`)).join("\n")}`
        : resp.answer || resp.response || "Sem resposta.";

      setMessages((prev) => [...prev, { role: "assistant", content: aiText, created_at: new Date().toISOString() }]);

      if (resp.session_id && !activeSession) {
        const newSession = {
          id: resp.session_id,
          title: msg.slice(0, 80),
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
          message_count: 2,
        };
        setActiveSession(newSession);
        setSessions((prev) => {
          const exists = prev.find((s) => s.id === resp.session_id);
          return exists ? prev : [newSession, ...prev];
        });
      } else if (resp.session_id && activeSession) {
        setActiveSession((prev) => ({ ...prev, id: resp.session_id }));
        setSessions((prev) =>
          prev.map((s) =>
            s.id === resp.session_id
              ? { ...s, title: s.title === "Nova conversa" ? msg.slice(0, 80) : s.title, message_count: (s.message_count || 0) + 2 }
              : s
          )
        );
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro: " + (err.message || "Sem ligação"), created_at: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSaveAsPlan = async (content) => {
    if (!profile) return;
    setSavingPlan(content);
    try {
      const lower = content.toLowerCase();
      const type = lower.includes("nutri") || lower.includes("alimentar") || lower.includes("dieta") || lower.includes("calor")
        ? (lower.includes("treino") || lower.includes("exerc") ? "combined" : "nutrition")
        : "training";

      // Extract title from first heading or first line
      const allLines = content.split("\n").filter(l => l.trim());
      const headingLine = allLines.find(l => /^#{1,4}\s+/.test(l.trim()));
      let title = headingLine
        ? headingLine.replace(/^#{1,4}\s+/, "").trim()
        : (allLines[0] || "Plano do Chat").slice(0, 100);

      // Build structured sections from the text
      const sections = [];
      let cur = { header: "", items: [] };
      for (const line of content.split("\n")) {
        const t = line.trim();
        if (!t) {
          if (cur.items.length || cur.header) { sections.push(cur); cur = { header: "", items: [] }; }
          continue;
        }
        if (/^#{1,4}\s+/.test(t)) {
          if (cur.items.length || cur.header) sections.push(cur);
          cur = { header: t.replace(/^#{1,4}\s+/, ""), items: [] };
        } else if (/^[-*•]\s+/.test(t)) {
          cur.items.push(t.replace(/^[-*•]\s+/, ""));
        } else if (/^\d+[.)\s]\s*/.test(t)) {
          cur.items.push(t.replace(/^\d+[.)\s]\s*/, ""));
        } else {
          cur.items.push(t);
        }
      }
      if (cur.items.length || cur.header) sections.push(cur);

      await ApiService.savePlan({
        profile_id: profile.id,
        type,
        title,
        content_json: { type, title, sections, source: "chat" },
        notes: "Guardado a partir do Chat",
      });

      setSaveSuccess("✅ Plano guardado! Vai a Planos para ver.");
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      console.error("Erro ao guardar plano:", err);
      setSaveSuccess("❌ Erro ao guardar: " + (err.message || "tenta novamente"));
      setTimeout(() => setSaveSuccess(null), 4000);
    } finally {
      setSavingPlan(null);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!profile) {
    return (
      <div style={s.page}>
        <EmptyState
          icon="🤖"
          title="Cria o teu perfil primeiro"
          description="Para ter recomendações personalizadas, precisamos de conhecer-te."
          actionLabel="Criar Perfil"
          actionTo="/profile"
        />
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Sidebar overlay + sidebar — only rendered when open */}
      {showSidebar && (
        <>
        <div style={s.overlay} onClick={() => setShowSidebar(false)} />
        <div style={s.sidebar}>
        <div style={s.sidebarHeader}>
          <h3 style={s.sidebarTitle}>Conversas</h3>
          <button style={s.sidebarClose} onClick={() => setShowSidebar(false)}>
            <ChevronLeft size={18} />
          </button>
        </div>

        <button style={s.newSessionBtn} onClick={handleNewSession}>
          <Plus size={16} /> Nova Conversa
        </button>

        <div style={s.sessionList}>
          {sessions.map((session) => (
            <div
              key={session.id}
              style={{
                ...s.sessionItem,
                background: activeSession?.id === session.id ? "var(--bg-elevated)" : "transparent",
                borderColor: activeSession?.id === session.id ? "var(--primary)" : "var(--border)",
              }}
              onClick={() => loadSession(session.id)}
            >
              {editingTitle === session.id ? (
                <input
                  style={s.renameInput}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => handleRename(session.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleRename(session.id)}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <div style={s.sessionInfo}>
                    <MessageSquare size={14} style={{ flexShrink: 0, color: "var(--text-muted)" }} />
                    <span style={s.sessionTitle}>{session.title}</span>
                  </div>
                  <div style={s.sessionMeta}>
                    <span style={s.sessionDays}>
                      <Clock size={10} /> {daysLeft(session.expires_at)}d
                    </span>
                    <div style={s.sessionActions}>
                      <button
                        style={s.sessionActionBtn}
                        onClick={(e) => { e.stopPropagation(); setEditingTitle(session.id); setEditTitle(session.title); }}
                        title="Renomear"
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        style={{ ...s.sessionActionBtn, color: "var(--danger, #e74c3c)" }}
                        onClick={(e) => { e.stopPropagation(); setShowDeleteModal(session.id); }}
                        title="Apagar"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          {sessionsLoaded && sessions.length === 0 && (
            <p style={s.noSessions}>Sem conversas. Clica em "Nova Conversa" para começar!</p>
          )}
        </div>
      </div>
        </>
      )}

      {/* Header */}
      <div style={s.chatHeader}>
        <div style={s.headerLeft}>
          <button style={s.menuBtn} onClick={() => setShowSidebar(true)}>
            <Menu size={18} />
          </button>
          <div style={s.coachRow}>
            <div style={s.coachAvatar}>AI</div>
            <div>
              <h2 style={s.coachName}>
                {activeSession ? activeSession.title : "AI Coach"}
              </h2>
              <span style={s.coachStatus}>
                {activeSession ? `Expira em ${daysLeft(activeSession.expires_at)} dias` : "Online"}
              </span>
            </div>
          </div>
        </div>
        <button style={s.newBtn} onClick={handleNewSession} title="Nova conversa">
          <Plus size={16} />
        </button>
      </div>

      {/* Messages */}
      <div style={s.messagesArea}>
        {messages.length === 0 && (
          <div style={s.welcomeBox}>
            <div style={s.welcomeAvatar}>AI</div>
            <h3 style={s.welcomeTitle}>Olá {profile?.name?.split(" ")[0]}</h3>
            <p style={s.welcomeText}>Sou o teu Coach AI. Pergunta-me sobre treino, nutrição ou planos.</p>
            {pendingSuggestions.length > 0 && (
              <button
                style={s.adaptTip}
                onClick={() => sendMessage("Quais são as tuas sugestões de adaptação para mim?")}
              >
                <Zap size={16} color="var(--accent, #8B7DB5)" />
                <span>Tenho <strong>{pendingSuggestions.length}</strong> {pendingSuggestions.length === 1 ? "sugestão" : "sugestões"} para ti com base no teu progresso</span>
              </button>
            )}
            <div style={s.suggestionsGrid}>
              {SUGGESTIONS.map((text, i) => (
                <button key={i} style={s.suggestionBtn} onClick={() => sendMessage(text)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={msg.role === "user" ? s.userBubbleWrap : s.assistantBubbleWrap}>
            <div style={msg.role === "user" ? s.userBubble : s.assistantBubble}>
              {/* Se for plano (gerado via /plans ou texto plan-like), mostrar SÓ a box bonita */}
              {msg.role === "assistant" && (msg.planId || looksLikePlan(msg.content)) ? (
                <PlanWorkoutBox
                  rawText={msg.planId ? null : msg.content}
                  planId={msg.planId || null}
                  planTitle={msg.planTitle || null}
                  profileId={profile?.id}
                  onPlanSaved={(newId) => {
                    setMessages((prev) =>
                      prev.map((m, idx) => idx === i ? { ...m, planId: newId } : m)
                    );
                  }}
                />
              ) : (
                <div style={s.msgContent}>
                  {msg.role === "assistant" ? renderMarkdown(msg.content) : msg.content}
                </div>
              )}
              
              {/* Exercícios detectados em mensagens não-plano (ex: pergunta avulsa) */}
              {msg.role === "assistant" && !msg.planId && !looksLikePlan(msg.content) && detectedExercises[i]?.length > 0 && (
                <div style={s.exercisesSection}>
                  <div style={s.exercisesHeader}>
                    <Dumbbell size={14} />
                    <span>Exercícios mencionados ({detectedExercises[i].length})</span>
                  </div>
                  <div style={s.exercisesList}>
                    {detectedExercises[i].map((ex) => (
                      <ExerciseCard
                        key={ex.id}
                        exercise={ex}
                        compact={true}
                        onClick={() => setSelectedExercise(ex)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div style={s.assistantBubbleWrap}>
            <div style={s.assistantBubble}>
              <div style={s.typingDots}>
                <span style={s.dot} />
                <span style={{ ...s.dot, animationDelay: "0.2s" }} />
                <span style={{ ...s.dot, animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}

        {saveSuccess && (
          <div className="alert alert-success" style={{ margin: "8px 0" }}>
            <span className="alert-icon">✓</span>
            <span>{saveSuccess}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={s.inputArea}>
        <div style={s.inputRow}>
          <textarea
            ref={inputRef}
            style={s.textInput}
            placeholder="Escreve aqui..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={loading}
          />
          <button
            style={{ ...s.sendBtn, opacity: !input.trim() || loading ? 0.4 : 1 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Apagar Conversa"
        confirmText="Apagar"
        onConfirm={handleDeleteSession}
      >
        <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Tens a certeza que queres apagar esta conversa? As mensagens serão permanentemente removidas.
        </p>
      </Modal>

      {/* Modal de Exercício */}
      <Modal
        isOpen={!!selectedExercise}
        onClose={() => setSelectedExercise(null)}
        title={selectedExercise?.name || "Exercício"}
        showFooter={false}
      >
        {selectedExercise && (
          <div style={{ marginTop: -8 }}>
            <ExerciseCard
              exercise={selectedExercise}
              compact={false}
              showActions={true}
              onStart={(ex) => {
                setSelectedExercise(null);
                // Could navigate to a workout tracker or log the exercise
                console.log("Iniciar treino:", ex.name);
              }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}

const s = {
  page: {
    display: "flex", flexDirection: "column", flex: "1 1 0", minHeight: 0,
    animation: "fadeUp 0.3s ease", position: "relative", overflow: "hidden",
  },

  /* Sidebar */
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    zIndex: 300, animation: "fadeIn 0.2s ease",
  },
  sidebar: {
    position: "fixed", top: 0, left: 0, bottom: 0,
    width: 280, background: "var(--bg-surface)",
    zIndex: 310,
    display: "flex", flexDirection: "column",
    overflowY: "auto",
    boxShadow: "6px 0 24px rgba(0,0,0,0.25)",
  },
  sidebarHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 14px 12px", borderBottom: "1px solid var(--border)",
  },
  sidebarTitle: { fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" },
  sidebarClose: {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text-muted)", padding: 4,
  },
  newSessionBtn: {
    display: "flex", alignItems: "center", gap: 8,
    margin: "12px 14px", padding: "10px 14px", borderRadius: "var(--radius-sm)",
    background: "var(--gradient-primary)", color: "#fff", border: "none",
    cursor: "pointer", fontWeight: 600, fontSize: 13,
  },
  sessionList: { flex: 1, padding: "0 10px 10px", display: "flex", flexDirection: "column", gap: 4 },
  sessionItem: {
    padding: "10px 12px", borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)", cursor: "pointer",
    transition: "background 0.15s, border-color 0.15s",
  },
  sessionInfo: { display: "flex", alignItems: "center", gap: 8 },
  sessionTitle: {
    fontSize: 13, fontWeight: 600, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  sessionMeta: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: 6,
  },
  sessionDays: {
    display: "flex", alignItems: "center", gap: 4,
    fontSize: 11, color: "var(--text-muted)", fontWeight: 500,
  },
  sessionActions: { display: "flex", gap: 4 },
  sessionActionBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text-muted)", padding: 2,
    transition: "color 0.15s",
  },
  renameInput: {
    width: "100%", padding: "4px 8px", borderRadius: 6,
    border: "1px solid var(--primary)", background: "var(--card-bg)",
    color: "var(--text)", fontSize: 13, fontFamily: "inherit", outline: "none",
  },
  noSessions: {
    textAlign: "center", fontSize: 13, color: "var(--text-muted)",
    padding: "20px 10px", lineHeight: 1.5,
  },

  /* Header */
  chatHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 14px 16px", flexShrink: 0,
  },
  headerLeft: { display: "flex", alignItems: "center", gap: 8 },
  menuBtn: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--card-bg)", border: "1px solid var(--border)",
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)", transition: "background 0.15s",
  },
  newBtn: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--gradient-primary)", border: "none",
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "#fff", transition: "opacity 0.15s",
    boxShadow: "0 2px 8px var(--btn-primary-shadow)",
  },
  coachRow: { display: "flex", alignItems: "center", gap: 10 },
  coachAvatar: {
    width: 40, height: 40, borderRadius: 12,
    background: "var(--gradient-primary)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 800, letterSpacing: -0.5,
    boxShadow: "0 2px 8px var(--btn-primary-shadow)",
  },
  coachName: {
    fontSize: "var(--text-h3)", fontWeight: 800, color: "var(--text)", margin: 0,
    maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
    letterSpacing: "-0.02em",
  },
  coachStatus: { fontSize: "var(--text-overline)", color: "var(--text-muted)", fontWeight: 500 },

  /* Messages */
  messagesArea: {
    flex: "1 1 0", minHeight: 0, overflowY: "auto", padding: "0 14px 8px",
    display: "flex", flexDirection: "column", gap: 10,
  },
  userBubbleWrap: { display: "flex", justifyContent: "flex-end" },
  assistantBubbleWrap: { display: "flex", justifyContent: "flex-start" },
  userBubble: {
    background: "var(--gradient-primary)", color: "white",
    borderRadius: "20px 20px 6px 20px", padding: "14px 18px",
    maxWidth: "80%", fontSize: "var(--text-body)", lineHeight: 1.6, fontWeight: 500,
    boxShadow: "0 2px 8px var(--btn-primary-shadow)",
  },
  assistantBubble: {
    background: "var(--card-bg)", color: "var(--text)",
    borderRadius: "20px 20px 20px 6px", padding: "14px 18px",
    maxWidth: "85%", fontSize: "var(--text-body)", lineHeight: 1.6, fontWeight: 500,
    boxShadow: "var(--shadow)", border: "1px solid var(--border)",
  },
  msgContent: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  msgActions: {
    display: "flex", gap: 6, marginTop: 8, paddingTop: 8,
    borderTop: "1px solid var(--border-light)",
  },
  actionBtn: {
    display: "flex", alignItems: "center", gap: 4,
    background: "var(--card-bg)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "4px 12px", fontSize: 12,
    cursor: "pointer", transition: "background 0.15s", fontWeight: 600,
    color: "var(--text-secondary)",
  },

  /* Exercises section in messages */
  exercisesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTop: "1px solid var(--border-light)",
  },
  exercisesHeader: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: 600,
    color: "var(--text-muted)",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  exercisesList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  typingDots: { display: "flex", gap: 4, padding: "4px 0" },
  dot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "var(--text-muted)",
    animation: "pulse 1.2s ease-in-out infinite",
  },

  welcomeBox: {
    textAlign: "center", padding: "48px 10px 32px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
  },
  welcomeAvatar: {
    width: 60, height: 60, borderRadius: 18,
    background: "var(--gradient-primary)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 20, fontWeight: 800, marginBottom: 4,
    boxShadow: "0 4px 16px var(--btn-primary-shadow)",
  },
  welcomeTitle: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" },
  welcomeText: { fontSize: "var(--text-body)", color: "var(--text-secondary)", maxWidth: 300, lineHeight: 1.6, margin: 0 },
  suggestionsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
    width: "100%", maxWidth: 360, marginTop: 16,
  },
  adaptTip: {
    display: "flex", alignItems: "center", gap: 10, width: "100%", maxWidth: 360,
    padding: "12px 16px", borderRadius: "var(--radius-sm)", marginTop: 12,
    background: "var(--card-bg)", border: "1px solid var(--accent, #8B7DB5)",
    boxShadow: "var(--shadow)", cursor: "pointer",
    fontSize: 13, color: "var(--text-secondary)", textAlign: "left",
    fontWeight: 500, lineHeight: 1.4, fontFamily: "inherit",
    transition: "border-color 0.15s, background 0.15s",
  },
  suggestionBtn: {
    padding: "14px 14px", borderRadius: "var(--radius-sm)",
    background: "var(--card-bg)", border: "1px solid var(--border)",
    fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
    textAlign: "left", fontWeight: 600, lineHeight: 1.4,
    transition: "transform 0.15s var(--ease-spring), border-color 0.15s, box-shadow 0.15s",
    boxShadow: "var(--shadow)",
  },

  /* Input */
  inputArea: { padding: "12px 14px 8px", borderTop: "1px solid var(--border-light)", flexShrink: 0 },
  inputRow: { display: "flex", alignItems: "flex-end", gap: 10 },
  textInput: {
    flex: 1, border: "1.5px solid var(--border)", borderRadius: 22,
    padding: "13px 18px", fontSize: 14, fontFamily: "inherit",
    background: "var(--card-bg)", color: "var(--text)",
    resize: "none", outline: "none", lineHeight: 1.4, maxHeight: 100,
    transition: "border-color 0.15s, box-shadow 0.15s",
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: "50%",
    background: "var(--gradient-primary)", color: "white",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "transform 0.15s var(--ease-spring), box-shadow 0.15s",
    boxShadow: "0 4px 12px var(--btn-primary-shadow)",
  },

  emptyState: {
    textAlign: "center", padding: "60px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  emptyTitle: { fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" },
  emptyText: { fontSize: "var(--text-body)", color: "var(--text-secondary)", margin: 0, maxWidth: 260, lineHeight: 1.6 },
};
