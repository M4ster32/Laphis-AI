import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import Modal from "../components/Modal";
import { Send, Trash2, Save, FileText } from "lucide-react";

const SUGGESTIONS = [
  "Cria um plano semanal de treino",
  "Sugere exercícios para costas",
  "O que devo comer pós-treino?",
  "Como melhorar a minha postura?",
];

export default function Chat() {
  const navigate = useNavigate();
  const { profile } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [savingPlan, setSavingPlan] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { scrollToBottom(); }, [messages]);

  const loadHistory = async () => {
    try {
      const resp = await ApiService.chatHistory();
      if (resp?.history?.length) {
        const mapped = resp.history.flatMap((h) => [
          { role: "user", content: h.question, ts: h.created_at },
          { role: "assistant", content: h.answer, ts: h.created_at },
        ]);
        setMessages(mapped);
      }
    } catch (e) {
      console.error("Erro ao carregar histórico:", e);
    } finally {
      setHistoryLoaded(true);
    }
  };

  const sendMessage = async (text = null) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      // Usa RAG endpoint (com contexto dos PDFs indexados)
      const resp = await ApiService.ragAsk(msg);
      const answer = resp.answer || resp.response || "Sem resposta.";
      
      // Se houver fontes, adiciona nota discreta no final
      const fullAnswer = resp.sources?.length 
        ? `${answer}\n\n📚 Fontes: ${resp.sources.length} documentos relevantes`
        : answer;
      
      setMessages((prev) => [...prev, { role: "assistant", content: fullAnswer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Erro: " + (err.message || "Sem ligação ao servidor") }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleClearHistory = async () => {
    try {
      await ApiService.clearChatHistory();
      setMessages([]);
      setShowClearModal(false);
    } catch (err) {
      console.error("Erro ao limpar:", err);
    }
  };

  const handleSaveAsPlan = async (content) => {
    setSavingPlan(content);
    try {
      await ApiService.generatePlan({ prompt: content, save: true });
      setSaveSuccess("Plano guardado com sucesso!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      console.error("Erro ao guardar plano:", err);
    } finally {
      setSavingPlan(null);
    }
  };

  const handleGeneratePlan = async (content) => {
    setSavingPlan(content);
    try {
      await ApiService.generatePlan({ prompt: content });
      navigate("/plans");
    } catch (err) {
      console.error("Erro ao gerar plano:", err);
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
        <div style={s.emptyState}>
          <h3 style={s.emptyTitle}>Cria o teu perfil primeiro</h3>
          <p style={s.emptyText}>Para ter recomendações personalizadas, precisamos de conhecer-te.</p>
          <button className="btn btn-primary" onClick={() => navigate("/profile")}>Criar Perfil</button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.chatHeader}>
        <div style={s.coachRow}>
          <div style={s.coachAvatar}>AI</div>
          <div>
            <h2 style={s.coachName}>AI Coach</h2>
            <span style={s.coachStatus}>Online</span>
          </div>
        </div>
        {messages.length > 0 && (
          <button style={s.clearBtn} onClick={() => setShowClearModal(true)} title="Limpar">
            <Trash2 size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={s.messagesArea}>
        {messages.length === 0 && historyLoaded && (
          <div style={s.welcomeBox}>
            <div style={s.welcomeAvatar}>AI</div>
            <h3 style={s.welcomeTitle}>Olá {profile?.name?.split(' ')[0]}</h3>
            <p style={s.welcomeText}>Sou o teu Coach AI pessoal. Pergunta-me sobre treino, nutrição ou planos.</p>
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
                    <Save size={16} strokeWidth={1.5} />
                  </button>
                  <button
                    style={s.actionBtn}
                    onClick={() => handleGeneratePlan(msg.content)}
                    disabled={savingPlan === msg.content}
                    title="Gerar plano"
                  >
                    <FileText size={16} strokeWidth={1.5} />
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
                <span style={s.dot} /><span style={{ ...s.dot, animationDelay: "0.2s" }} /><span style={{ ...s.dot, animationDelay: "0.4s" }} />
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
            style={{ ...s.sendBtn, opacity: (!input.trim() || loading) ? 0.4 : 1 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            <Send size={18} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <Modal
        isOpen={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="Limpar Conversa"
        confirmText="Limpar Tudo"
        onConfirm={handleClearHistory}
      >
        <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Tens a certeza que queres apagar todo o histórico? Esta ação não pode ser revertida.
        </p>
      </Modal>
    </div>
  );
}

const s = {
  page: {
    display: "flex", flexDirection: "column", height: "calc(100vh - 130px)",
    animation: "fadeUp 0.3s ease",
  },

  chatHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "12px 0 16px",
  },
  coachRow: { display: "flex", alignItems: "center", gap: 12 },
  coachAvatar: {
    width: 42, height: 42, borderRadius: 12,
    background: "var(--gradient-primary)", color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 14, fontWeight: 800, letterSpacing: -0.5,
  },
  coachName: { fontSize: 17, fontWeight: 700, color: "var(--text)", margin: 0 },
  coachStatus: { fontSize: 11, color: "var(--text-muted)", fontWeight: 500 },
  clearBtn: {
    width: 36, height: 36, borderRadius: "50%",
    background: "var(--card-bg)", border: "1px solid var(--border)",
    cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    color: "var(--text-muted)", transition: "background 0.15s",
    boxShadow: "var(--shadow)",
  },

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
