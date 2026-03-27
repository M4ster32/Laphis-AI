import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import Modal from "../components/Modal";
import { Dumbbell, UtensilsCrossed, Zap, Tag, Plus, Archive, Play, Copy, ChevronRight } from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "Todos" },
  { key: "active", label: "Ativos" },
  { key: "archived", label: "Arquivados" },
];

const CATEGORY_ICONS = ["T", "F", "N", "Z", "C", "M", "O", "R", "S", "P", "H", "E"];

export default function Plans() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useApp();
  const [plans, setPlans] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState(null); // null = all
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [genType, setGenType] = useState("combined");
  const [genCategory, setGenCategory] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Category form
  const [catName, setCatName] = useState("");
  const [catIcon, setCatIcon] = useState("reports");
  const [catSaving, setCatSaving] = useState(false);
  const [editingCat, setEditingCat] = useState(null);

  useEffect(() => {
    if (profile) {
      loadPlans();
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
      const statusFilter = tab === "all" ? null : tab;
      const resp = await ApiService.getPlans(profile.id, statusFilter, selectedCategory);
      setPlans(Array.isArray(resp) ? resp : resp.plans || []);
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    } finally {
      setLoading(false);
    }
  };

  // Reload when tab or category changes
  useEffect(() => {
    if (profile) loadPlans();
  }, [tab, selectedCategory]);

  const loadCategories = async () => {
    try {
      const resp = await ApiService.getCategories();
      setCategories(Array.isArray(resp) ? resp : []);
    } catch (err) {
      console.error("Erro ao carregar categorias:", err);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      setGenerating(true);
      setError(null);
      await ApiService.generatePlan(profile.id, genType, prompt.trim(), genCategory);
      setShowGenerate(false);
      setPrompt("");
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleActivate = async (planId) => {
    try {
      await ApiService.updatePlan(planId, { status: "active" });
      await loadPlans();
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
        <div style={s.emptyState}>
          <h3 style={s.emptyTitle}>Cria o teu perfil primeiro</h3>
          <p style={s.emptyText}>Para gerar planos, precisamos de conhecer-te.</p>
          <button className="btn btn-primary" onClick={() => navigate("/profile")}>Criar Perfil</button>
        </div>
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
          <button className="btn btn-primary" style={s.newBtn} onClick={() => setShowGenerate(true)}>
            <Plus size={16} strokeWidth={2} style={{ marginRight: 4, verticalAlign: -2 }} /> Novo
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

      {/* Status Tabs */}
      <div style={s.tabs}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              ...s.tab,
              background: tab === t.key ? "var(--primary)" : "transparent",
              color: tab === t.key ? "white" : "var(--text-secondary)",
              fontWeight: tab === t.key ? 600 : 500,
              boxShadow: tab === t.key ? "0 2px 8px var(--btn-primary-shadow)" : "none",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Plans List */}
      {loading ? (
        <div style={s.loaderArea}><div className="spinner" /></div>
      ) : plans.length === 0 ? (
        <div style={s.emptyState}>
          <h3 style={s.emptyTitle}>Sem planos</h3>
          <p style={s.emptyText}>Gera um plano com o Coach AI ou cria um novo.</p>
        </div>
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
                <span style={{
                  ...s.statusBadge,
                  background: plan.status === "active" ? "var(--primary-bg)" : "var(--bg)",
                  color: plan.status === "active" ? "var(--primary)" : "var(--text-muted)",
                }}>
                  {plan.status === "active" ? "Ativo" : "Arquivado"}
                </span>
              </div>
              <div style={s.planActions} onClick={(e) => e.stopPropagation()}>
                {plan.status === "active" ? (
                  <button style={s.planActionBtn} onClick={() => handleArchive(plan.id)} title="Arquivar">
                    <Archive size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Arquivar
                  </button>
                ) : (
                  <button style={s.planActionBtn} onClick={() => handleActivate(plan.id)} title="Ativar">
                    <Play size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Ativar
                  </button>
                )}
                <button style={s.planActionBtn} onClick={() => handleDuplicate(plan.id)} title="Duplicar">
                  <Copy size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Duplicar
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* ====== GENERATE MODAL ====== */}
      <Modal
        isOpen={showGenerate}
        onClose={() => { setShowGenerate(false); setError(null); setPrompt(""); }}
        title="Gerar Novo Plano"
        confirmText="Gerar com AI"
        onConfirm={handleGenerate}
        loading={generating}
      >
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 12 }}>
            <span className="alert-icon">⚠️</span><span>{error}</span>
          </div>
        )}

        {/* Plan Type */}
        <div className="form-group">
          <label className="form-label">Tipo de plano</label>
          <div style={s.typeGrid}>
            {[
              { value: "training", label: "Treino", icon: Dumbbell, color: "var(--primary)", bg: "var(--primary-bg)" },
              { value: "nutrition", label: "Nutrição", icon: UtensilsCrossed, color: "var(--p2)", bg: "var(--cta-bg)" },
              { value: "combined", label: "Combinado", icon: Zap, color: "var(--p3)", bg: "var(--primary-bg)" },
            ].map((t) => (
              <button
                key={t.value} type="button"
                onClick={() => setGenType(t.value)}
                style={{
                  ...s.typeBtn,
                  borderColor: genType === t.value ? t.color : "var(--border)",
                  background: genType === t.value ? t.bg : "var(--card-bg)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <t.icon size={24} color={genType === t.value ? t.color : "var(--text-secondary)"} strokeWidth={1.5} />
                <span style={{
                  fontSize: 13, fontWeight: genType === t.value ? 700 : 500,
                  color: genType === t.value ? t.color : "var(--text-secondary)",
                }}>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category select */}
        {categories.length > 0 && (
          <div className="form-group">
            <label className="form-label">Categoria (opcional)</label>
            <select
              className="form-select"
              value={genCategory || ""}
              onChange={(e) => setGenCategory(e.target.value ? parseInt(e.target.value) : null)}
            >
              <option value="">Sem categoria</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Descreve o plano que queres</label>
          <textarea
            className="form-input"
            placeholder="Ex: Plano semanal de treino para ganhar massa, 4 dias"
            value={prompt} onChange={(e) => setPrompt(e.target.value)}
            rows={4} style={{ resize: "vertical" }} disabled={generating}
          />
        </div>
        <div style={s.quickPrompts}>
          {["Plano semanal de treino", "Plano de nutrição para emagrecer", "Treino de corpo inteiro"].map((p, i) => (
            <button key={i} style={s.quickPromptBtn} onClick={() => setPrompt(p)} type="button">{p}</button>
          ))}
        </div>
      </Modal>

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
  title: { fontSize: 20, fontWeight: 700, color: "var(--text)", margin: 0 },
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

  /* Status Tabs */
  tabs: {
    display: "flex", gap: 6, marginBottom: 20,
    background: "var(--bg-card)", borderRadius: 12, padding: 4,
    boxShadow: "var(--shadow)",
  },
  tab: {
    flex: 1, padding: "10px 12px", borderRadius: 10,
    border: "none", fontSize: 13, cursor: "pointer",
    transition: "all 0.2s", textAlign: "center",
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
    fontSize: 15, fontWeight: 700, color: "var(--text)", margin: "0 0 4px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  planMeta: { fontSize: 12, color: "var(--text-muted)", margin: 0 },
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

  /* Generate modal extras */
  typeGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  typeBtn: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 6, padding: "14px 8px",
    borderRadius: "var(--radius-sm)", border: "2px solid var(--border)",
    cursor: "pointer", transition: "border-color 0.15s, background 0.15s",
    boxShadow: "var(--shadow)",
  },
  quickPrompts: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 },
  quickPromptBtn: {
    padding: "8px 14px", borderRadius: 20,
    background: "var(--card-bg)", border: "1px solid var(--border)",
    fontSize: 12, color: "var(--text-secondary)", cursor: "pointer",
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
  emptyState: {
    textAlign: "center", padding: "48px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 },
  emptyText: { fontSize: 14, color: "var(--text-secondary)", margin: 0, maxWidth: 260, lineHeight: 1.5 },
};
