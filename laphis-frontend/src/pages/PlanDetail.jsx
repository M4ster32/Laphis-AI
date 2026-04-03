import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ApiService from "../services/api";
import Modal from "../components/Modal";
import jsPDF from "jspdf";
import { Edit2, Trash2, Download, ArrowLeft, Star, ThumbsUp, ThumbsDown, MessageSquare, Dumbbell, UtensilsCrossed, Lightbulb, Check, X, RefreshCw, Calendar } from "lucide-react";

export default function PlanDetail() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategory, setEditCategory] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState(null);

  // Feedback state
  const [feedback, setFeedback] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [fbRating, setFbRating] = useState(0);
  const [fbDifficulty, setFbDifficulty] = useState(0);
  const [fbEnjoyment, setFbEnjoyment] = useState(0);
  const [fbEffectiveness, setFbEffectiveness] = useState(0);
  const [fbComment, setFbComment] = useState("");
  const [fbCompleted, setFbCompleted] = useState(50);
  const [fbSaving, setFbSaving] = useState(false);

  // Adaptation suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [respondingId, setRespondingId] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    loadPlan();
    loadCategories();
    loadFeedback();
    loadSuggestions();
  }, [planId]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      const resp = await ApiService.getPlanDetail(planId);
      const p = resp.plan || resp;
      setPlan(p);
      setEditTitle(p.title || "");
      setEditContent(typeof p.content_json === "string" ? p.content_json : JSON.stringify(p.content_json, null, 2));
      setEditCategory(p.category_id || null);
    } catch (err) {
      setError("Erro ao carregar plano");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const resp = await ApiService.getCategories();
      setCategories(Array.isArray(resp) ? resp : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await ApiService.updatePlan(planId, {
        title: editTitle,
        notes: editContent,
        category_id: editCategory,
      });
      await loadPlan();
      setEditing(false);
    } catch (err) {
      setError("Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      // Use updatePlan to archive since there's no delete endpoint
      await ApiService.updatePlan(planId, { status: "archived" });
      navigate("/plans");
    } catch (err) {
      console.error(err);
    }
  };

  const handleArchive = async () => {
    try {
      await ApiService.updatePlan(planId, { status: "archived" });
      await loadPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async () => {
    try {
      await ApiService.updatePlan(planId, { status: "active" });
      await loadPlan();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async () => {
    try {
      const resp = await ApiService.duplicatePlan(planId);
      if (resp?.id) navigate(`/plans/${resp.id}`);
      else navigate("/plans");
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryLabel = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : null;
  };

  const loadFeedback = async () => {
    try {
      const fb = await ApiService.getPlanFeedback(planId);
      if (fb) {
        setFeedback(fb);
        setFbRating(fb.rating || 0);
        setFbDifficulty(fb.difficulty_rating || 0);
        setFbEnjoyment(fb.enjoyment_rating || 0);
        setFbEffectiveness(fb.effectiveness_rating || 0);
        setFbComment(fb.comment || "");
        setFbCompleted(fb.completed_pct ?? 50);
      }
    } catch (err) {
      // No feedback yet — that's fine
    }
  };

  const handleSubmitFeedback = async () => {
    if (fbRating === 0) return;
    try {
      setFbSaving(true);
      const result = await ApiService.submitPlanFeedback({
        plan_id: parseInt(planId),
        rating: fbRating,
        difficulty_rating: fbDifficulty || null,
        enjoyment_rating: fbEnjoyment || null,
        effectiveness_rating: fbEffectiveness || null,
        comment: fbComment.trim() || null,
        completed_pct: fbCompleted,
      });
      setFeedback(result);
      setShowFeedback(false);
    } catch (err) {
      setError(err.message || "Erro ao enviar feedback");
    } finally {
      setFbSaving(false);
    }
  };

  // ===== ADAPTATION SUGGESTIONS =====
  const loadSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      const data = await ApiService.getAdaptationSuggestions("pending");
      // Filter to this plan only (or show all if no plan_id)
      const filtered = Array.isArray(data)
        ? data.filter(s => !s.plan_id || s.plan_id === parseInt(planId))
        : [];
      setSuggestions(filtered);
    } catch (err) {
      console.error("Erro ao carregar sugestões:", err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleRespondSuggestion = async (suggestionId, status) => {
    try {
      setRespondingId(suggestionId);
      await ApiService.respondToSuggestion(suggestionId, status);
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    } catch (err) {
      setError("Erro ao responder à sugestão");
    } finally {
      setRespondingId(null);
    }
  };

  const handleTriggerAnalysis = async () => {
    try {
      setSuggestionsLoading(true);
      await ApiService.triggerAnalysis();
      await loadSuggestions();
    } catch (err) {
      setError("Erro ao analisar plano");
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // ===== WEEKLY CALENDAR HELPERS =====
  const getTrainingSections = () => {
    if (!plan?.content_json) return [];
    const cj = plan.content_json;
    if (cj.training?.sections) return cj.training.sections;
    if (cj.sections) return cj.sections;
    return [];
  };

  const buildWeeklyCalendar = () => {
    const sections = getTrainingSections();
    const WEEKDAYS = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
    const days = WEEKDAYS.map((name, idx) => ({ name, shortName: name.slice(0, 3), dayIndex: idx, section: null }));

    // Try to map sections to days using header patterns like "Dia 1", "Segunda", etc.
    sections.forEach((sec, idx) => {
      const header = (sec.header || "").toLowerCase();
      // Match "dia X" pattern
      const diaMatch = header.match(/dia\s*(\d+)/);
      if (diaMatch) {
        const dayNum = parseInt(diaMatch[1]) - 1;
        if (dayNum >= 0 && dayNum < 7) {
          days[dayNum].section = sec;
          return;
        }
      }
      // Match weekday name
      const dayIdx = WEEKDAYS.findIndex(d => header.includes(d.toLowerCase()));
      if (dayIdx >= 0) {
        days[dayIdx].section = sec;
        return;
      }
      // Fallback: assign sequentially
      if (idx < 7 && !days[idx].section) {
        days[idx].section = sec;
      }
    });

    return days;
  };

  // ===== PDF EXPORT =====
  const handleExportPDF = () => {
    if (!plan) return;
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxW = pageW - margin * 2;
    let y = 20;

    const checkPage = (needed = 12) => {
      if (y + needed > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        y = 20;
      }
    };

    // Header
    doc.setFillColor(155, 106, 74);
    doc.rect(0, 0, pageW, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("LAPHIS", margin, 18);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("O teu assistente pessoal de treino e nutricao", margin, 28);
    y = 50;

    // Plan title
    doc.setTextColor(74, 52, 39);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    const titleLines = doc.splitTextToSize(plan.title || "Plano sem titulo", maxW);
    doc.text(titleLines, margin, y);
    y += titleLines.length * 8 + 4;

    // Meta info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(125, 107, 96);
    const typeLabels = { training: "Treino", nutrition: "Nutricao", combined: "Combinado" };
    const metaText = `${typeLabels[plan.type] || plan.type || ""} | ${plan.created_at ? new Date(plan.created_at).toLocaleDateString("pt-PT") : ""} | ${plan.status === "active" ? "Ativo" : "Arquivado"}`;
    doc.text(metaText, margin, y);
    y += 10;

    // Divider
    doc.setDrawColor(216, 201, 188);
    doc.line(margin, y, pageW - margin, y);
    y += 8;

    // Content
    const renderPDFContent = (raw) => {
      if (!raw) return;
      let text = "";
      if (typeof raw === "object") {
        text = flattenContent(raw);
      } else {
        text = String(raw);
      }

      const lines = text.split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          y += 4;
          continue;
        }

        checkPage(10);

        if (trimmed.startsWith("### ") || trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
          const hLevel = trimmed.startsWith("### ") ? 3 : trimmed.startsWith("## ") ? 2 : 1;
          const hText = trimmed.replace(/^#{1,3}\s*/, "");
          doc.setFontSize(hLevel === 1 ? 16 : hLevel === 2 ? 14 : 12);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(74, 52, 39);
          const wrapped = doc.splitTextToSize(hText, maxW);
          checkPage(wrapped.length * 7 + 6);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 7 + 4;
        } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(74, 52, 39);
          const itemText = trimmed.replace(/^[-*•]\s*/, "");
          const wrapped = doc.splitTextToSize(itemText, maxW - 8);
          checkPage(wrapped.length * 5 + 2);
          doc.text("•", margin + 2, y);
          doc.text(wrapped, margin + 8, y);
          y += wrapped.length * 5 + 2;
        } else {
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(74, 52, 39);
          const wrapped = doc.splitTextToSize(trimmed, maxW);
          checkPage(wrapped.length * 5 + 2);
          doc.text(wrapped, margin, y);
          y += wrapped.length * 5 + 2;
        }
      }
    };

    const flattenContent = (obj) => {
      const parts = [];
      if (obj.title) parts.push(`# ${obj.title}`);
      const flatSections = (sections) => {
        if (!Array.isArray(sections)) return;
        for (const sec of sections) {
          if (sec.header) parts.push(`## ${sec.header}`);
          if (sec.items) {
            for (const item of sec.items) parts.push(`- ${item}`);
          }
        }
      };
      if (obj.sections) flatSections(obj.sections);
      if (obj.training) {
        parts.push(`
# Training: ${obj.training.title || "Treino"}`);
        flatSections(obj.training.sections);
      }
      if (obj.nutrition) {
        parts.push(`
# Nutrition: ${obj.nutrition.title || "Nutricao"}`);
        flatSections(obj.nutrition.sections);
      }
      if (obj.summary) {
        parts.push("\n## Resumo");
        for (const [k, v] of Object.entries(obj.summary)) {
          parts.push(`- ${k}: ${v}`);
        }
      }
      return parts.join("\n");
    };

    renderPDFContent(plan.content_json);

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(168, 152, 136);
      doc.text(`LAPHIS - Pagina ${i}/${pageCount}`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: "center" });
    }

    const fileName = `LAPHIS_${(plan.title || "plano").replace(/\s+/g, "_").substring(0, 30)}.pdf`;
    doc.save(fileName);
  };

  // Render content_json into readable sections
  const renderContent = (raw) => {
    if (!raw) return <p style={s.noContent}>Sem conteúdo</p>;

    // If it's a structured JSON object
    if (typeof raw === "object") {
      return renderStructuredContent(raw);
    }

    // If string, parse markdown-like
    const text = typeof raw === "string" ? raw : JSON.stringify(raw, null, 2);
    const lines = text.split("\n");
    const elements = [];
    let key = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        elements.push(<div key={key++} style={{ height: 8 }} />);
      } else if (trimmed.startsWith("### ")) {
        elements.push(<h4 key={key++} style={s.h4}>{trimmed.slice(4)}</h4>);
      } else if (trimmed.startsWith("## ")) {
        elements.push(<h3 key={key++} style={s.h3}>{trimmed.slice(3)}</h3>);
      } else if (trimmed.startsWith("# ")) {
        elements.push(<h2 key={key++} style={s.h2}>{trimmed.slice(2)}</h2>);
      } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        elements.push(
          <div key={key++} style={s.listItem}>
            <span style={s.bullet}>•</span>
            <span>{trimmed.replace(/^[-*•]\s*/, "")}</span>
          </div>
        );
      } else {
        elements.push(<p key={key++} style={s.paragraph}>{trimmed}</p>);
      }
    }
    return elements;
  };

  const renderStructuredContent = (obj) => {
    const elements = [];
    let key = 0;

    const renderSections = (sections, prefix = "") => {
      if (!Array.isArray(sections)) return;
      for (const section of sections) {
        if (section.header) {
          elements.push(<h3 key={key++} style={s.h3}>{section.header}</h3>);
        }
        if (section.items) {
          for (const item of section.items) {
            elements.push(
              <div key={key++} style={s.listItem}>
                <span style={s.bullet}>•</span>
                <span>{item}</span>
              </div>
            );
          }
        }
      }
    };

    if (obj.title) {
      elements.push(<h2 key={key++} style={s.h2}>{obj.title}</h2>);
    }
    if (obj.sections) {
      renderSections(obj.sections);
    }
    // Combined plan
    if (obj.training) {
      elements.push(<h2 key={key++} style={{ ...s.h2, marginTop: 20 }}><Dumbbell size={20} color="currentColor" style={{ display: "inline", verticalAlign: -4 }} /> {obj.training.title || "Treino"}</h2>);
      renderSections(obj.training.sections);
    }
    if (obj.nutrition) {
      elements.push(<h2 key={key++} style={{ ...s.h2, marginTop: 20 }}><UtensilsCrossed size={20} color="currentColor" style={{ display: "inline", verticalAlign: -4 }} /> {obj.nutrition.title || "Nutrição"}</h2>);
      renderSections(obj.nutrition.sections);
    }
    // Summary
    if (obj.summary) {
      elements.push(
        <div key={key++} style={s.summaryCard}>
          <h3 style={s.summaryTitle}>Resumo</h3>
          {Object.entries(obj.summary).map(([k, v]) => (
            <p key={k} style={s.summaryText}><strong>{k}:</strong> {v}</p>
          ))}
        </div>
      );
    }

    return elements.length > 0 ? elements : <p style={s.noContent}>Conteúdo sem formatação</p>;
  };

  if (loading) {
    return <div style={s.loaderArea}><div className="spinner" /></div>;
  }

  if (error && !plan) {
    return (
      <div style={s.page}>
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
        <button className="btn" onClick={() => navigate("/plans")}>← Voltar</button>
      </div>
    );
  }

  const typeLabels = { training: "Treino", nutrition: "Nutrição", combined: "Combinado" };

  return (
    <div style={s.page}>
      <button style={s.backBtn} onClick={() => navigate("/plans")} title="Voltar">
        <ArrowLeft size={18} strokeWidth={1.5} style={{marginRight: 6}} />
        Planos
      </button>

      {/* Header */}
      <div style={s.headerCard}>
        <div style={s.headerTop}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>{typeLabels[plan?.type] || "Plano"}</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {plan?.category_id && (
              <span style={s.catBadge}>{getCategoryLabel(plan.category_id)}</span>
            )}
            <span style={{
              ...s.statusBadge,
              background: plan?.status === "active" ? "var(--primary-bg)" : "var(--bg)",
              color: plan?.status === "active" ? "#2E7D32" : "var(--text-muted)",
            }}>
              {plan?.status === "active" ? "Ativo" : "Arquivado"}
            </span>
          </div>
        </div>

        {editing ? (
          <>
            <input
              className="form-input"
              value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Título do plano"
              style={{ marginTop: 12, fontWeight: 700, fontSize: 18 }}
            />
            {categories.length > 0 && (
              <select
                className="form-select"
                value={editCategory || ""}
                onChange={(e) => setEditCategory(e.target.value ? parseInt(e.target.value) : null)}
                style={{ marginTop: 8 }}
              >
                <option value="">Sem categoria</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </>
        ) : (
          <h1 style={s.planTitle}>{plan?.title || "Sem título"}</h1>
        )}

        <div style={s.meta}>
          <span>{typeLabels[plan?.type] || plan?.type}</span>
          <span>·</span>
          <span>{plan?.created_at ? new Date(plan.created_at).toLocaleDateString("pt-PT") : ""}</span>
        </div>

        <div style={s.headerActions}>
          {!editing ? (
            <>
              <button style={s.actionBtn} onClick={() => setEditing(true)} title="Editar"><Edit2 size={16} strokeWidth={1.5} /></button>
              <button style={s.actionBtn} onClick={handleExportPDF} title="Exportar PDF"><Download size={16} strokeWidth={1.5} /></button>
              {plan?.status === "active" ? (
                <button style={s.actionBtn} onClick={handleArchive} title="Arquivar">Arquivar</button>
              ) : (
                <button style={s.actionBtn} onClick={handleActivate} title="Ativar">Ativar</button>
              )}
              <button style={s.actionBtn} onClick={handleDuplicate} title="Duplicar">Duplicar</button>
              <button style={{ ...s.actionBtn, color: "#D32F2F" }} onClick={() => setShowDelete(true)} title="Apagar"><Trash2 size={16} strokeWidth={1.5} /></button>
            </>
          ) : (
            <>
              <button className="btn btn-primary" style={{ fontSize: 13, padding: "8px 16px" }} onClick={handleSave} disabled={saving}>
                {saving ? "A guardar..." : "Guardar"}
              </button>
              <button style={s.actionBtn} onClick={() => { setEditing(false); setEditTitle(plan?.title || ""); setEditCategory(plan?.category_id || null); }}>
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={s.contentCard}>
        <div style={s.contentBody}>
          {renderContent(plan?.content_json)}
        </div>
      </div>

      {/* Feedback Section */}
      <div style={s.feedbackCard}>
        <div style={s.feedbackHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <MessageSquare size={18} strokeWidth={1.5} color="var(--primary)" />
            <h3 style={s.feedbackTitle}>Feedback</h3>
          </div>
          {!showFeedback && (
            <button
              style={s.feedbackToggle}
              onClick={() => setShowFeedback(true)}
            >
              {feedback ? "Editar" : "Avaliar plano"}
            </button>
          )}
        </div>

        {/* Existing feedback display */}
        {feedback && !showFeedback && (
          <div style={s.feedbackDisplay}>
            <div style={s.feedbackStars}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={18} strokeWidth={1.5}
                  fill={i <= feedback.rating ? "var(--primary)" : "none"}
                  color={i <= feedback.rating ? "var(--primary)" : "var(--border)"}
                />
              ))}
              <span style={s.feedbackRatingText}>{feedback.rating}/5</span>
            </div>
            {feedback.difficulty_rating && (
              <p style={s.feedbackMeta}>Dificuldade: {feedback.difficulty_rating}/5</p>
            )}
            {feedback.completed_pct != null && (
              <p style={s.feedbackMeta}>Completado: {feedback.completed_pct}%</p>
            )}
            {feedback.comment && (
              <p style={s.feedbackComment}>"{feedback.comment}"</p>
            )}
          </div>
        )}

        {/* Feedback form */}
        {showFeedback && (
          <div style={s.feedbackForm}>
            {/* Overall rating */}
            <div style={s.fbField}>
              <label style={s.fbLabel}>Avaliação geral *</label>
              <div style={s.starRow}>
                {[1,2,3,4,5].map(i => (
                  <button key={i} onClick={() => setFbRating(i)}
                    style={{ ...s.starBtn, transform: i <= fbRating ? "scale(1.1)" : "scale(1)" }}>
                    <Star size={24} strokeWidth={1.5}
                      fill={i <= fbRating ? "var(--primary)" : "none"}
                      color={i <= fbRating ? "var(--primary)" : "var(--border)"}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div style={s.fbField}>
              <label style={s.fbLabel}>Dificuldade</label>
              <div style={s.fbChips}>
                {[
                  { val: 1, label: "Muito fácil" },
                  { val: 2, label: "Fácil" },
                  { val: 3, label: "Adequado" },
                  { val: 4, label: "Difícil" },
                  { val: 5, label: "Impossível" },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setFbDifficulty(opt.val)}
                    style={{
                      ...s.fbChip,
                      background: fbDifficulty === opt.val ? "var(--primary)" : "var(--bg)",
                      color: fbDifficulty === opt.val ? "white" : "var(--text-secondary)",
                    }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Effectiveness */}
            <div style={s.fbField}>
              <label style={s.fbLabel}>Eficácia (sentiste resultados?)</label>
              <div style={s.fbChips}>
                {[
                  { val: 1, icon: <ThumbsDown size={14} />, label: "Nada" },
                  { val: 2, label: "Pouco" },
                  { val: 3, label: "Razoável" },
                  { val: 4, label: "Bom" },
                  { val: 5, icon: <ThumbsUp size={14} />, label: "Muito" },
                ].map(opt => (
                  <button key={opt.val} onClick={() => setFbEffectiveness(opt.val)}
                    style={{
                      ...s.fbChip,
                      background: fbEffectiveness === opt.val ? "var(--primary)" : "var(--bg)",
                      color: fbEffectiveness === opt.val ? "white" : "var(--text-secondary)",
                    }}>
                    {opt.icon && <span style={{ marginRight: 4, display: "inline-flex", verticalAlign: -2 }}>{opt.icon}</span>}
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Completed % */}
            <div style={s.fbField}>
              <label style={s.fbLabel}>Quanto do plano completaste? {fbCompleted}%</label>
              <input
                type="range" min={0} max={100} step={10}
                value={fbCompleted}
                onChange={(e) => setFbCompleted(parseInt(e.target.value))}
                style={s.fbRange}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-muted)" }}>
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>

            {/* Comment */}
            <div style={s.fbField}>
              <label style={s.fbLabel}>Comentário (opcional)</label>
              <textarea
                className="form-input"
                value={fbComment}
                onChange={(e) => setFbComment(e.target.value)}
                placeholder="O que gostaste ou mudarias..."
                rows={3}
                style={{ resize: "vertical", fontSize: 14 }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-primary"
                onClick={handleSubmitFeedback}
                disabled={fbSaving || fbRating === 0}
                style={{ fontSize: 13, padding: "10px 20px", opacity: fbRating === 0 ? 0.5 : 1 }}
              >
                {fbSaving ? "A guardar..." : feedback ? "Atualizar" : "Enviar"}
              </button>
              <button style={s.actionBtn} onClick={() => setShowFeedback(false)}>Cancelar</button>
            </div>
          </div>
        )}
      </div>

      {/* Adaptation Suggestions Section */}
      <div style={s.feedbackCard}>
        <div style={s.feedbackHeader}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Lightbulb size={18} strokeWidth={1.5} color="var(--primary)" />
            <h3 style={s.feedbackTitle}>Sugestões de Adaptação</h3>
          </div>
          <button
            style={s.feedbackToggle}
            onClick={handleTriggerAnalysis}
            disabled={suggestionsLoading}
          >
            <RefreshCw size={14} strokeWidth={1.5} style={{
              display: "inline", verticalAlign: -2, marginRight: 4,
              animation: suggestionsLoading ? "spin 1s linear infinite" : "none"
            }} />
            {suggestionsLoading ? "A analisar..." : "Analisar"}
          </button>
        </div>

        {suggestions.length === 0 && !suggestionsLoading && (
          <div style={s.emptyAdaptation}>
            <Lightbulb size={28} strokeWidth={1.2} color="var(--text-muted)" />
            <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted)" }}>
              Sem sugestões pendentes. Clica em "Analisar" para verificar.
            </p>
          </div>
        )}

        {suggestions.map(sug => {
          const typeLabelsAdapt = {
            increase_volume: "↑ Volume",
            decrease_intensity: "↓ Intensidade",
            change_split: "Mudar split",
            adjust_calories: "Ajustar calorias",
            suggest_deload: "Deload",
            level_up: "Subir nível",
          };
          const typeColors = {
            increase_volume: "#2E7D32",
            decrease_intensity: "#E65100",
            change_split: "#1565C0",
            adjust_calories: "#6A1B9A",
            suggest_deload: "#F9A825",
            level_up: "#00838F",
          };
          return (
            <div key={sug.id} style={s.suggestionCard}>
              <div style={s.suggestionTop}>
                <span style={{
                  ...s.suggestionBadge,
                  background: (typeColors[sug.adaptation_type] || "var(--primary)") + "18",
                  color: typeColors[sug.adaptation_type] || "var(--primary)",
                }}>
                  {typeLabelsAdapt[sug.adaptation_type] || sug.adaptation_type}
                </span>
                <span style={s.suggestionDate}>
                  {sug.created_at ? new Date(sug.created_at).toLocaleDateString("pt-PT") : ""}
                </span>
              </div>
              <p style={s.suggestionReason}>{sug.reason}</p>
              {sug.suggestion_json && (
                <div style={s.suggestionDetail}>
                  {Object.entries(sug.suggestion_json).map(([k, v]) => (
                    <span key={k} style={s.suggestionDetailItem}>
                      <strong>{k}:</strong> {typeof v === "object" ? JSON.stringify(v) : String(v)}
                    </span>
                  ))}
                </div>
              )}
              <div style={s.suggestionActions}>
                <button
                  style={s.suggestionAccept}
                  onClick={() => handleRespondSuggestion(sug.id, "accepted")}
                  disabled={respondingId === sug.id}
                >
                  <Check size={15} strokeWidth={2} style={{ marginRight: 4 }} />
                  Aceitar
                </button>
                <button
                  style={s.suggestionReject}
                  onClick={() => handleRespondSuggestion(sug.id, "rejected")}
                  disabled={respondingId === sug.id}
                >
                  <X size={15} strokeWidth={2} style={{ marginRight: 4 }} />
                  Rejeitar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly Calendar View — only for training/combined plans */}
      {plan && (plan.type === "training" || plan.type === "combined") && (
        <div style={s.feedbackCard}>
          <div style={s.feedbackHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Calendar size={18} strokeWidth={1.5} color="var(--primary)" />
              <h3 style={s.feedbackTitle}>Calendário Semanal</h3>
            </div>
            <button style={s.feedbackToggle} onClick={() => setShowCalendar(v => !v)}>
              {showCalendar ? "Esconder" : "Ver semana"}
            </button>
          </div>

          {showCalendar && (() => {
            const weekDays = buildWeeklyCalendar();
            return (
              <div style={s.calendarGrid}>
                {weekDays.map((day, idx) => (
                  <div key={idx} style={{
                    ...s.calendarDay,
                    background: day.section ? "var(--primary-bg)" : "var(--bg)",
                    borderColor: day.section ? "var(--primary)" : "var(--border)",
                    opacity: day.section ? 1 : 0.6,
                  }}>
                    <div style={s.calendarDayHeader}>
                      <span style={s.calendarDayName}>{day.shortName}</span>
                      {day.section && (
                        <Dumbbell size={13} strokeWidth={1.5} color="var(--primary)" />
                      )}
                    </div>
                    {day.section ? (
                      <>
                        <p style={s.calendarDayTitle}>
                          {(day.section.header || "").replace(/^dia\s*\d+\s*[-–—:]\s*/i, "").trim() || "Treino"}
                        </p>
                        {day.section.items && (
                          <span style={s.calendarDayCount}>
                            {day.section.items.length} exercício{day.section.items.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </>
                    ) : (
                      <p style={s.calendarDayRest}>Descanso</p>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Delete/Archive Modal */}
      <Modal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        title="Apagar Plano"
        confirmText="Arquivar"
        onConfirm={handleDelete}
      >
        <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          O plano será arquivado. Podes reativá-lo mais tarde na lista de planos.
        </p>
      </Modal>
    </div>
  );
}

const s = {
  page: { animation: "fadeUp 0.3s ease", paddingBottom: 24 },
  loaderArea: { display: "flex", justifyContent: "center", padding: 60 },

  backBtn: {
    background: "none", border: "none", color: "var(--primary)",
    fontSize: 14, fontWeight: 600, cursor: "pointer", padding: "8px 0 16px",
  },

  headerCard: {
    background: "var(--card-bg)", borderRadius: "var(--radius)",
    padding: "20px", boxShadow: "var(--shadow)", marginBottom: 16,
    border: "1px solid var(--border)",
  },
  headerTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  },
  headerIcon: { fontSize: 32 },
  catBadge: {
    padding: "4px 10px", borderRadius: 12,
    background: "var(--primary-bg)", fontSize: 11,
    fontWeight: 600, color: "var(--primary)",
  },
  statusBadge: {
    fontSize: 12, fontWeight: 600, padding: "5px 12px", borderRadius: 20,
  },
  planTitle: {
    fontSize: 20, fontWeight: 700, color: "var(--text)",
    margin: "12px 0 8px", lineHeight: 1.3,
  },
  meta: {
    display: "flex", gap: 8, fontSize: 13,
    color: "var(--text-muted)", fontWeight: 500,
  },
  headerActions: {
    display: "flex", gap: 8, marginTop: 16, paddingTop: 14,
    borderTop: "1px solid var(--border-light)", flexWrap: "wrap",
  },
  actionBtn: {
    background: "var(--card-bg)", border: "1px solid var(--border)",
    borderRadius: 10, padding: "8px 14px", fontSize: 13,
    cursor: "pointer", fontWeight: 600, color: "var(--text-secondary)",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "var(--shadow)",
  },

  contentCard: {
    background: "var(--card-bg)", borderRadius: "var(--radius)",
    padding: "20px", boxShadow: "var(--shadow)", marginBottom: 16,
    border: "1px solid var(--border)",
  },
  contentBody: { lineHeight: 1.6 },
  h2: { fontSize: 19, fontWeight: 700, color: "var(--text)", margin: "20px 0 8px" },
  h3: { fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "16px 0 6px" },
  h4: { fontSize: 14, fontWeight: 700, color: "var(--text-secondary)", margin: "12px 0 4px" },
  paragraph: { fontSize: 14, color: "var(--text)", margin: "4px 0", lineHeight: 1.6 },
  listItem: {
    display: "flex", gap: 10, fontSize: 14, color: "var(--text)",
    margin: "4px 0", lineHeight: 1.5, paddingLeft: 4,
  },
  bullet: { color: "var(--primary)", fontWeight: 700, fontSize: 16, lineHeight: 1.3 },
  noContent: { fontSize: 14, color: "var(--text-muted)", fontStyle: "italic" },

  summaryCard: {
    background: "var(--primary-bg)", borderRadius: "var(--radius)",
    padding: "18px 20px", borderLeft: "4px solid var(--primary)", marginTop: 20,
  },
  summaryTitle: { fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" },
  summaryText: { fontSize: 14, color: "var(--text-secondary)", margin: "2px 0", lineHeight: 1.5 },

  // Feedback styles
  feedbackCard: {
    background: "var(--card-bg)", borderRadius: "var(--radius)",
    padding: "20px", boxShadow: "var(--shadow)", marginBottom: 16,
    border: "1px solid var(--border)",
  },
  feedbackHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12,
  },
  feedbackTitle: { fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 },
  feedbackToggle: {
    background: "none", border: "1px solid var(--primary)", borderRadius: 8,
    color: "var(--primary)", fontSize: 13, fontWeight: 600, padding: "6px 14px",
    cursor: "pointer",
  },
  feedbackDisplay: { display: "flex", flexDirection: "column", gap: 6 },
  feedbackStars: { display: "flex", alignItems: "center", gap: 4 },
  feedbackRatingText: { fontSize: 13, color: "var(--text-secondary)", marginLeft: 8, fontWeight: 600 },
  feedbackMeta: { fontSize: 13, color: "var(--text-secondary)", margin: 0 },
  feedbackComment: {
    fontSize: 13, color: "var(--text)", margin: 0, fontStyle: "italic",
    background: "var(--bg)", padding: "10px 14px", borderRadius: 8, marginTop: 4,
  },
  feedbackForm: { display: "flex", flexDirection: "column", gap: 16 },
  fbField: { display: "flex", flexDirection: "column", gap: 6 },
  fbLabel: { fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", margin: 0 },
  starRow: { display: "flex", gap: 4 },
  starBtn: {
    background: "none", border: "none", cursor: "pointer", padding: 2,
    display: "flex", transition: "transform 0.15s ease",
  },
  fbChips: { display: "flex", flexWrap: "wrap", gap: 6 },
  fbChip: {
    border: "1px solid var(--border)", borderRadius: 20, fontSize: 12,
    fontWeight: 500, padding: "5px 12px", cursor: "pointer", transition: "all 0.15s ease",
  },
  fbRange: { width: "100%", accentColor: "var(--primary)" },

  // Adaptation suggestion styles
  emptyAdaptation: {
    display: "flex", flexDirection: "column", alignItems: "center",
    padding: "20px 0", gap: 4, textAlign: "center",
  },
  suggestionCard: {
    background: "var(--bg)", borderRadius: 12, padding: "14px 16px",
    marginTop: 10, border: "1px solid var(--border-light)",
    transition: "box-shadow 0.2s",
  },
  suggestionTop: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 6,
  },
  suggestionBadge: {
    fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 12,
    textTransform: "uppercase", letterSpacing: 0.3,
  },
  suggestionDate: { fontSize: 11, color: "var(--text-muted)" },
  suggestionReason: {
    fontSize: 13, color: "var(--text)", lineHeight: 1.5, margin: "4px 0 8px",
  },
  suggestionDetail: {
    display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10,
  },
  suggestionDetailItem: {
    fontSize: 11, color: "var(--text-secondary)", background: "var(--card-bg)",
    padding: "3px 8px", borderRadius: 6, border: "1px solid var(--border-light)",
  },
  suggestionActions: { display: "flex", gap: 8 },
  suggestionAccept: {
    display: "flex", alignItems: "center", background: "#E8F5E9",
    color: "#2E7D32", border: "1px solid #A5D6A7", borderRadius: 8,
    padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s",
  },
  suggestionReject: {
    display: "flex", alignItems: "center", background: "#FFEBEE",
    color: "#C62828", border: "1px solid #EF9A9A", borderRadius: 8,
    padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s",
  },

  // Weekly calendar styles
  calendarGrid: {
    display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8,
    marginTop: 12,
  },
  calendarDay: {
    borderRadius: 10, padding: "10px 8px", border: "1.5px solid",
    textAlign: "center", minHeight: 90, display: "flex",
    flexDirection: "column", alignItems: "center", gap: 4,
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  calendarDayHeader: {
    display: "flex", alignItems: "center", gap: 4, justifyContent: "center",
    marginBottom: 2,
  },
  calendarDayName: {
    fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
    textTransform: "uppercase", letterSpacing: 0.5,
  },
  calendarDayTitle: {
    fontSize: 11, fontWeight: 600, color: "var(--text)", margin: 0,
    lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis",
    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
  },
  calendarDayCount: {
    fontSize: 10, color: "var(--primary)", fontWeight: 600, marginTop: "auto",
  },
  calendarDayRest: {
    fontSize: 11, color: "var(--text-muted)", fontStyle: "italic",
    margin: "auto 0",
  },
};
