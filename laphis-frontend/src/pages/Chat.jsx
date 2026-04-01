import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { Send, Trash2, Save, FileText, Plus, MessageSquare, Pencil, Clock, ChevronLeft, Menu } from "lucide-react";

const SUGGESTIONS = [
  "Cria um plano semanal de treino",
  "Sugere exercícios para costas",
  "O que devo comer pós-treino?",
  "Como melhorar a minha postura?",
];

function daysLeft(expiresAt) {
  if (!expiresAt) return 0;
  const diff = new Date(expiresAt) - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

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

  const sendMessage = async (text = null) => {
    const msg = (text || input).trim();
    if (!msg || loading || !profile) return;
    setInput("");

    const userMsg = { role: "user", content: msg, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

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
      await ApiService.generatePlan(profile.id, type, content);
      setSaveSuccess("✅ Plano guardado com sucesso! Vai a Planos para ver.");
      setTimeout(() => setSaveSuccess(null), 5000);
    } catch (err) {
      setSaveSuccess("❌ Erro ao guardar plano: " + (err.message || "tenta novamente"));
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
      {/* Sidebar overlay */}
      {showSidebar && <div style={s.overlay} onClick={() => setShowSidebar(false)} />}

      {/* Session sidebar */}
      <div style={{ ...s.sidebar, transform: showSidebar ? "translateX(0)" : "translateX(-100%)" }}>
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
              <div style={s.msgContent}>{msg.content}</div>
              {msg.role === "assistant" && !msg.content.startsWith("Erro") && (
                <div style={s.msgActions}>
                  <button
                    style={s.actionBtn}
                    onClick={() => handleSaveAsPlan(msg.content)}
                    disabled={savingPlan === msg.content}
                    title="Guardar como plano"
                  >
                    <Save size={14} strokeWidth={1.5} /> Guardar
                  </button>
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
    </div>
  );
}

const s = {
  page: {
    display: "flex", flexDirection: "column", height: "calc(100vh - 130px)",
    animation: "fadeUp 0.3s ease", position: "relative",
  },

  /* Sidebar */
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
    zIndex: 90, animation: "fadeIn 0.2s ease",
  },
  sidebar: {
    position: "fixed", top: 0, left: 0, bottom: 0,
    width: 280, background: "var(--bg-surface)",
    borderRight: "1px solid var(--border)", zIndex: 100,
    display: "flex", flexDirection: "column",
    transition: "transform 0.25s ease", overflowY: "auto",
    boxShadow: "4px 0 16px rgba(0,0,0,0.15)",
  },
  sidebarHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "16px 14px 12px", borderBottom: "1px solid var(--border)",
  },
  sidebarTitle: { fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 },
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
    padding: "12px 0 16px",
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
    width: 38, height: 38, borderRadius: 10,
    background: "var(--gradient-primary)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 800, letterSpacing: -0.5,
  },
  coachName: {
    fontSize: 15, fontWeight: 700, color: "var(--text)", margin: 0,
    maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  coachStatus: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },

  /* Messages */
  messagesArea: {
    flex: 1, overflowY: "auto", paddingBottom: 8,
    display: "flex", flexDirection: "column", gap: 10,
  },
  userBubbleWrap: { display: "flex", justifyContent: "flex-end" },
  assistantBubbleWrap: { display: "flex", justifyContent: "flex-start" },
  userBubble: {
    background: "var(--gradient-primary)", color: "white",
    borderRadius: "18px 18px 4px 18px", padding: "12px 16px",
    maxWidth: "80%", fontSize: 14, lineHeight: 1.55, fontWeight: 500,
    boxShadow: "0 1px 4px var(--btn-primary-shadow)",
  },
  assistantBubble: {
    background: "var(--card-bg)", color: "var(--text)",
    borderRadius: "18px 18px 18px 4px", padding: "12px 16px",
    maxWidth: "85%", fontSize: 14, lineHeight: 1.55, fontWeight: 500,
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

  typingDots: { display: "flex", gap: 4, padding: "4px 0" },
  dot: {
    width: 7, height: 7, borderRadius: "50%",
    background: "var(--text-muted)",
    animation: "pulse 1.2s ease-in-out infinite",
  },

  welcomeBox: {
    textAlign: "center", padding: "40px 10px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
  },
  welcomeAvatar: {
    width: 56, height: 56, borderRadius: 16,
    background: "var(--gradient-primary)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 18, fontWeight: 800, marginBottom: 4,
  },
  welcomeTitle: { fontSize: 19, fontWeight: 700, color: "var(--text)", margin: 0 },
  welcomeText: { fontSize: 14, color: "var(--text-secondary)", maxWidth: 300, lineHeight: 1.5, margin: 0 },
  suggestionsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8,
    width: "100%", maxWidth: 360, marginTop: 16,
  },
  suggestionBtn: {
    padding: "14px 12px", borderRadius: "var(--radius-sm)",
    background: "var(--card-bg)", border: "1px solid var(--border)",
    fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
    textAlign: "left", fontWeight: 500, lineHeight: 1.4,
    transition: "border-color 0.15s", boxShadow: "var(--shadow)",
  },

  /* Input */
  inputArea: { padding: "12px 0 4px", borderTop: "1px solid var(--border-light)" },
  inputRow: { display: "flex", alignItems: "flex-end", gap: 8 },
  textInput: {
    flex: 1, border: "1px solid var(--border)", borderRadius: 20,
    padding: "12px 18px", fontSize: 14, fontFamily: "inherit",
    background: "var(--card-bg)", color: "var(--text)",
    resize: "none", outline: "none", lineHeight: 1.4, maxHeight: 100,
    transition: "border-color 0.2s",
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: "50%",
    background: "var(--gradient-primary)", color: "white",
    border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "opacity 0.15s",
    boxShadow: "0 2px 8px var(--btn-primary-shadow)",
  },

  emptyState: {
    textAlign: "center", padding: "60px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 },
  emptyText: { fontSize: 14, color: "var(--text-secondary)", margin: 0, maxWidth: 260, lineHeight: 1.5 },
};
