import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import Modal from "../components/Modal";
import EmptyState from "../components/EmptyState";
import { Tag, Plus, Archive, Copy, ChevronRight, ChevronDown, RotateCcw, Dumbbell, UtensilsCrossed, Zap, X } from "lucide-react";

const PLAN_TYPES = [
  { value: "training",  label: "Treino",     Icon: Dumbbell,         color: "var(--primary)", bg: "var(--primary-bg)" },
  { value: "nutrition", label: "Nutrição",    Icon: UtensilsCrossed,  color: "var(--p2)",      bg: "var(--cta-bg)" },
  { value: "combined",  label: "Combinado",   Icon: Zap,              color: "var(--p3)",      bg: "var(--primary-bg)" },
];
const QUICK_PROMPTS = [
  "Plano semanal de treino",
  "Nutrição para emagrecer",
  "Treino corpo inteiro",
  "Treino em casa",
];

const CATEGORY_ICONS = ["T", "F", "N", "Z", "C", "M", "O", "R", "S", "P", "H", "E"];

export default function Plans() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useApp();
  const [plans, setPlans] = useState([]);
  const [archivedPlans, setArchivedPlans] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null); // null = all
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Category form
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("reports");
  const [catSaving, setCatSaving] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  // Inline generate form state
  const [genType, setGenType] = useState("combined");
  const [genPrompt, setGenPrompt] = useState("");
  const [genCategory, setGenCategory] = useState(null);

  useEffect(() => {
    if (profile) {
      loadPlans();
      loadArchivedPlans();
      loadCategories();
    }
  }, [profile]);

  // Auto-open generate modal from URL param (e.g. /plans?generate=true)
  useEffect(() => {
    if (profile && searchParams.get("generate") === "true") {
      setShowGenerate(true);
      setSearchParams({}, { replace: true }); // Clean URL
    }
  }, [profile, searchParams]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const resp = await ApiService.getPlans(profile.id, "active", selectedCategory);
      setPlans(Array.isArray(resp) ? resp : resp.plans || []);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reload when category changes
  useEffect(() => {
    if (profile) { loadPlans(); loadArchivedPlans(); }
  }, [selectedCategory]);

  const loadArchivedPlans = async () => {
    try {
      const resp = await ApiService.getPlans(profile.id, "archived", selectedCategory);
      setArchivedPlans(Array.isArray(resp) ? resp : resp.plans || []);
    } catch (err) {
      console.error("Erro ao carregar arquivados:", err);
    }
  };

  const loadCategories = async () => {
    try {
      const resp = await ApiService.getCategories();
      setCategories(Array.isArray(resp) ? resp : []);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  };

  const handleGenerate = async () => {
    if (!genPrompt.trim()) return;
    try {
      setGenerating(true);
      setError(null);
      await ApiService.generatePlan(profile.id, genType, genPrompt.trim(), genCategory);
      setShowGenerate(false);
      setGenPrompt("");
      setGenCategory(null);
      await loadPlans();
    } catch (err) {
      setError(err.message || "Erro ao gerar plano");
    } finally {
      setGenerating(false);
    }
  };

  const handleArchive = async (planId) => {
    try {
      await ApiService.updatePlan(planId, { status: "archived" });
      await loadPlans();
      await loadArchivedPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestore = async (planId) => {
    try {
      await ApiService.updatePlan(planId, { status: "active" });
      await loadPlans();
      await loadArchivedPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (planId) => {
    try {
      await ApiService.duplicatePlan(planId);
      await loadPlans();
    } catch (err) {
      console.error(err);
    }
  };

  // ====== CATEGORIES ======
  const handleSaveCategory = async () => {
    if (!catName.trim()) return;
    try {
      setCatSaving(true);
      if (editingCat) {
        await ApiService.updateCategory(editingCat.id, { name: catName.trim(), icon: catIcon });
      } else {
        await ApiService.createCategory({ name: catName.trim(), icon: catIcon });
      }
      await loadCategories();
      setCatName("");
      setCatIcon("reports");
      setEditingCat(null);
    } catch (err) {
      setError(err.message || "Erro");
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (catId) => {
    try {
      await ApiService.deleteCategory(catId);
      if (selectedCategory === catId) setSelectedCategory(null);
      await loadCategories();
      await loadPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryName = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : null;
  };

  // Type labels only (no emoji icons)
  const typeLabels = { training: "Treino", nutrition: "Nutrição", combined: "Misto" };

  if (!profile) {
    return (
      <div style={s.page}>
        <EmptyState
          icon="📝"
          title="Cria o teu perfil primeiro"
          description="Para gerar planos, precisamos de conhecer-te."
          actionLabel="Criar Perfil"
          actionTo="/profile"
        />
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <h2 style={s.title}>Meus Planos</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button style={s.iconBtn} onClick={() => setShowCategoryModal(true)} title="Categorias">
            <Tag size={16} strokeWidth={1.5} />
          </button>
          <button
            className="btn btn-primary"
            style={s.newBtn}
            onClick={() => { setShowGenerate(!showGenerate); setError(null); }}
          >
            {showGenerate
              ? <X size={16} strokeWidth={2} style={{ marginRight: 4, verticalAlign: -2 }} />
              : <Plus size={16} strokeWidth={2} style={{ marginRight: 4, verticalAlign: -2 }} />}
            {showGenerate ? "Cancelar" : "Novo"}
          </button>
        </div>
      </div>

      {/* Category Chips */}
      {categories.length > 0 && (
        <div style={s.categoryChips}>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              ...s.chip,
              background: selectedCategory === null ? "var(--primary)" : "var(--card-bg)",
              color: selectedCategory === null ? "white" : "var(--text-secondary)",
              boxShadow: selectedCategory === null ? "0 2px 8px var(--btn-primary-shadow)" : "var(--shadow)",
            }}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
              style={{
                ...s.chip,
                background: selectedCategory === cat.id ? "var(--primary)" : "var(--card-bg)",
                color: selectedCategory === cat.id ? "white" : "var(--text-secondary)",
                boxShadow: selectedCategory === cat.id ? "0 2px 8px var(--btn-primary-shadow)" : "var(--shadow)",
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Inline Generate Form */}
      {showGenerate && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>Novo Plano</h3>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 12 }}>
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Type selector */}
          <div style={{ marginBottom: 14 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Tipo de plano</label>
            <div style={s.typeGrid}>
              {PLAN_TYPES.map((t) => {
                const isActive = genType === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setGenType(t.value)}
                    style={{
                      ...s.typeBtn,
                      borderColor: isActive ? t.color : "var(--border)",
                      background: isActive ? t.bg : "var(--card-bg)",
                    }}
                  >
                    <t.Icon size={20} color={isActive ? t.color : "var(--text-muted)"} strokeWidth={1.5} />
                    <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500, color: isActive ? t.color : "var(--text-secondary)" }}>
                      {t.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt */}
          <div style={{ marginBottom: 10 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Descreve o que queres</label>
            <textarea
              className="form-input"
              placeholder="Ex: Plano semanal de treino para ganhar massa, 4 dias"
              value={genPrompt}
              onChange={(e) => setGenPrompt(e.target.value)}
              rows={2}
              style={{ resize: "none" }}
              disabled={generating}
            />
          </div>

          {/* Quick prompts */}
          <div style={s.quickPrompts}>
            {QUICK_PROMPTS.map((p, i) => (
              <button key={i} style={s.quickPromptBtn} onClick={() => setGenPrompt(p)} type="button">
                {p}
              </button>
            ))}
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <label className="form-label" style={{ fontSize: 11 }}>Categoria (opcional)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {categories.map((cat) => {
                  const isActive = genCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setGenCategory(isActive ? null : cat.id)}
                      style={{
                        padding: "6px 12px", borderRadius: 16,
                        border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                        background: isActive ? "var(--primary)" : "var(--card-bg)",
                        color: isActive ? "white" : "var(--text-secondary)",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            className="btn btn-primary btn-full"
            style={{ marginTop: 16 }}
            onClick={handleGenerate}
            disabled={generating || !genPrompt.trim()}
          >
            {generating ? (
              <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> A gerar...</>
            ) : "Gerar com AI"}
          </button>
        </div>
      )}

      {/* Plans List */}
      {loading ? (
        <div style={s.loaderArea}><div className="spinner" /></div>
      ) : plans.length === 0 ? (
        <EmptyState
          icon="📋"
          title="Sem planos"
          description="Gera um plano com o Coach AI ou cria um novo."
          actionLabel="Gerar Plano"
          onAction={() => setShowGenerate(true)}
        />
      ) : (
        <div style={s.plansList}>
          {plans.map((plan) => {
            const getTypeIcon = (type) => {
              switch (type) {
                case "training": return <Dumbbell size={16} color="var(--primary)" strokeWidth={1.5} />;
                case "nutrition": return <UtensilsCrossed size={16} color="var(--p2)" strokeWidth={1.5} />;
                case "combined": return <Zap size={16} color="var(--p3)" strokeWidth={1.5} />;
                default: return null;
              }
            };
            const typeColors = {
              training: "var(--primary)",
              nutrition: "var(--p2)",
              combined: "var(--p3)",
            };
            return (
            <div key={plan.id} style={{ ...s.planCard, borderLeft: `3px solid ${typeColors[plan.type] || "var(--border)"}` }} onClick={() => navigate(`/plans/${plan.id}`)}>
              <div style={s.planTop}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {getTypeIcon(plan.type)}
                  <span style={{ fontSize: 13, fontWeight: 700, color: typeColors[plan.type] || "var(--primary)" }}>{typeLabels[plan.type] || plan.type}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={s.planTitle}>{plan.title || "Plano sem título"}</h4>
                  <p style={s.planMeta}>
                    {typeLabels[plan.type] || plan.type}
                    {" · "}
                    {new Date(plan.created_at).toLocaleDateString("pt-PT")}
                    {plan.category_id && (
                      <span style={s.planCatBadge}>{getCategoryName(plan.category_id)}</span>
                    )}
                  </p>
                </div>
                <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
              <div style={s.planActions} onClick={(e) => e.stopPropagation()}>
                <button style={s.planActionBtn} onClick={() => handleArchive(plan.id)} title="Arquivar">
                  <Archive size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Arquivar
                </button>
                <button style={s.planActionBtn} onClick={() => handleDuplicate(plan.id)} title="Duplicar">
                  <Copy size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Duplicar
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* ====== ARCHIVED PLANS (COLLAPSIBLE) ====== */}
      {archivedPlans.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={s.archivedToggle}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Archive size={15} strokeWidth={1.5} color="var(--text-muted)" />
              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)" }}>
                Arquivados
              </span>
              <span style={s.archivedBadge}>{archivedPlans.length}</span>
            </div>
            <ChevronDown
              size={16}
              color="var(--text-muted)"
              style={{
                transition: "transform 0.25s ease",
                transform: showArchived ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {showArchived && (
            <div style={{ ...s.plansList, marginTop: 10, opacity: 0.85 }}>
              {archivedPlans.map((plan) => {
                const typeColors = { training: "var(--primary)", nutrition: "var(--p2)", combined: "var(--p3)" };
                return (
                  <div key={plan.id} style={{ ...s.planCard, borderLeft: `3px solid var(--border)` }} onClick={() => navigate(`/plans/${plan.id}`)}>
                    <div style={s.planTop}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ ...s.planTitle, color: "var(--text-muted)" }}>{plan.title || "Plano sem título"}</h4>
                        <p style={s.planMeta}>
                          {typeLabels[plan.type] || plan.type}
                          {" · "}
                          {new Date(plan.created_at).toLocaleDateString("pt-PT")}
                        </p>
                      </div>
                      <ChevronRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    </div>
                    <div style={s.planActions} onClick={(e) => e.stopPropagation()}>
                      <button style={s.planActionBtn} onClick={() => handleRestore(plan.id)} title="Restaurar">
                        <RotateCcw size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Restaurar
                      </button>
                      <button style={s.planActionBtn} onClick={() => handleDuplicate(plan.id)} title="Duplicar">
                        <Copy size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Duplicar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ====== CATEGORY MANAGEMENT MODAL ====== */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setCatName(""); setEditingCat(null); }}
        title="Gerir Categorias"
        showFooter={false}
      >
        {/* Create / Edit form */}
        <div style={s.catForm}>
          <div style={s.catIconPicker}>
            {CATEGORY_ICONS.map((ic) => (
              <button
                key={ic} type="button"
                onClick={() => setCatIcon(ic)}
                style={{
                  ...s.catIconBtn,
                  background: catIcon === ic ? "var(--primary-bg)" : "var(--bg)",
                  borderColor: catIcon === ic ? "var(--primary)" : "transparent",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700 }}>{ic}</span>
              </button>
            ))}
          </div>
          <div style={s.catInputRow}>
            <input
              type="text" className="form-input"
              placeholder="Nome da categoria"
              value={catName} onChange={(e) => setCatName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              style={{ padding: "10px 16px", fontSize: 13 }}
              onClick={handleSaveCategory}
              disabled={!catName.trim() || catSaving}
            >
              {catSaving ? "..." : editingCat ? "Guardar" : "+ Criar"}
            </button>
          </div>
        </div>

        {/* List */}
        {categories.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 14, marginTop: 20 }}>
            Sem categorias criadas
          </p>
        ) : (
          <div style={s.catList}>
            {categories.map((cat) => (
              <div key={cat.id} style={s.catItem}>
                <span style={s.catItemIcon}>{cat.icon || "—"}</span>
                <span style={s.catItemName}>{cat.name}</span>
                <button
                  style={s.catItemAction}
                  onClick={() => { setEditingCat(cat); setCatName(cat.name); setCatIcon(cat.icon || "T"); }}
                  title="Editar"
                >Editar</button>
                <button
                  style={{ ...s.catItemAction, color: "var(--danger)" }}
                  onClick={() => handleDeleteCategory(cat.id)}
                  title="Apagar"
                >Apagar</button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

const s = {
  page: { animation: "fadeUp 0.3s ease" },

  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0 16px",
  },
  title: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" },
  newBtn: { padding: "8px 18px", fontSize: 14 },
  iconBtn: {
    width: 38, height: 38, borderRadius: "var(--radius-sm)",
    background: "var(--bg-card)", border: "1px solid var(--border)",
    fontSize: 18, cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center",
    boxShadow: "var(--shadow)",
    transition: "background 0.15s",
    color: "var(--text-secondary)",
  },

  /* Category chips */
  categoryChips: {
    display: "flex", gap: 8, overflowX: "auto", paddingBottom: 14,
    WebkitOverflowScrolling: "touch", msOverflowStyle: "none",
    scrollbarWidth: "none",
  },
  chip: {
    padding: "8px 14px", borderRadius: 20, border: "none",
    fontSize: 12, fontWeight: 600, cursor: "pointer",
    whiteSpace: "nowrap", transition: "all 0.2s",
    boxShadow: "var(--shadow)",
  },

  /* Plan cards */
  plansList: { display: "flex", flexDirection: "column", gap: 12 },
  planCard: {
    background: "var(--bg-card)", borderRadius: "var(--radius)",
    padding: "16px 18px", cursor: "pointer",
    boxShadow: "var(--shadow)", transition: "transform 0.2s, box-shadow 0.2s",
    border: "1px solid var(--border)", position: "relative", overflow: "hidden",
  },
  planTop: { display: "flex", alignItems: "flex-start", gap: 12 },
  planIcon: { fontSize: 26, marginTop: 2 },
  planTitle: {
    fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: "0 0 4px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.02em",
  },
  planMeta: { fontSize: "var(--text-caption)", color: "var(--text-muted)", margin: 0 },
  planCatBadge: {
    marginLeft: 6, padding: "2px 8px", borderRadius: 10,
    background: "var(--primary-bg)", fontSize: 11, fontWeight: 600,
    color: "var(--primary)",
  },
  statusBadge: {
    fontSize: 11, fontWeight: 600, padding: "4px 10px",
    borderRadius: 20, flexShrink: 0,
  },
  planActions: {
    display: "flex", gap: 8, marginTop: 10, paddingTop: 10,
    borderTop: "1px solid var(--border-light)",
  },
  planActionBtn: {
    background: "var(--card-bg)", border: "1px solid var(--border)",
    borderRadius: 8, padding: "6px 12px", fontSize: 16,
    cursor: "pointer", transition: "background 0.15s",
    fontSize: 12, fontWeight: 600, color: "var(--text-muted)",
  },

  /* Inline generate form */
  formCard: {
    background: "var(--card-bg)", borderRadius: "var(--radius)",
    padding: "20px", boxShadow: "var(--shadow-md)", marginBottom: 20,
    animation: "slideUp 0.25s ease", border: "1px solid var(--border)",
  },
  formTitle: { fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text)", margin: "0 0 16px", letterSpacing: "-0.02em" },
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 },
  typeBtn: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 4, padding: "10px 6px",
    borderRadius: "var(--radius-sm)", border: "2px solid var(--border)",
    cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
    boxShadow: "var(--shadow)",
  },
  quickPrompts: { display: "flex", flexWrap: "wrap", gap: 6 },
  quickPromptBtn: {
    padding: "5px 10px", borderRadius: 20,
    background: "var(--card-bg)", border: "1px solid var(--border)",
    fontSize: 11, color: "var(--text-secondary)", cursor: "pointer",
    fontWeight: 500, transition: "background 0.15s",
    boxShadow: "var(--shadow)",
  },

  /* Category modal */
  catForm: { marginBottom: 20 },
  catIconPicker: {
    display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10,
  },
  catIconBtn: {
    width: 36, height: 36, borderRadius: 8, border: "2px solid transparent",
    fontSize: 18, cursor: "pointer", display: "flex",
    alignItems: "center", justifyContent: "center", transition: "all 0.2s",
  },
  catInputRow: { display: "flex", gap: 8 },
  catList: { display: "flex", flexDirection: "column", gap: 8, marginTop: 16 },
  catItem: {
    display: "flex", alignItems: "center", gap: 10,
    padding: "12px 14px", background: "var(--bg)",
    borderRadius: "var(--radius-xs)",
  },
  catItemIcon: { fontSize: 20 },
  catItemName: { flex: 1, fontSize: 14, fontWeight: 600, color: "var(--text)" },
  catItemAction: {
    background: "none", border: "none", fontSize: 14,
    cursor: "pointer", padding: "4px",
  },

  /* Loader + Empty */
  loaderArea: { display: "flex", justifyContent: "center", padding: 40 },

  /* Archived toggle */
  archivedToggle: {
    width: "100%", display: "flex", justifyContent: "space-between",
    alignItems: "center", padding: "12px 16px",
    background: "var(--card-bg)", borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)", cursor: "pointer",
    boxShadow: "var(--shadow)", transition: "background 0.15s",
  },
  archivedBadge: {
    padding: "2px 8px", borderRadius: 10,
    background: "var(--border)", fontSize: 11,
    fontWeight: 700, color: "var(--text-muted)",
  },
  emptyState: {
    textAlign: "center", padding: "48px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 },
  emptyText: { fontSize: 14, color: "var(--text-secondary)", margin: 0, maxWidth: 260, lineHeight: 1.5 },
};
