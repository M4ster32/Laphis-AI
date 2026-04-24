import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { Dumbbell, UtensilsCrossed, Trash2, Plus, Zap, Calendar, Clock, Flame, Search, Pencil } from "lucide-react";
import Modal from "../components/Modal";
import { SkeletonLogs } from "../components/Skeleton";

const TABS = [
  { key: "treino", label: "Treino", icon: Dumbbell, color: "var(--primary)", shadow: "var(--btn-primary-shadow)" },
  { key: "refeicao", label: "Refeição", icon: UtensilsCrossed, color: "var(--p2)", shadow: "var(--btn-primary-shadow)" },
];

export default function Logs() {
  const { profile } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState("treino");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);

  // Form state
  const [form, setForm] = useState({
    description: "",
    duration_min: "",
    calories: "",
    notes: "",
    meal_type: "almoco",
    foods: "",
  });

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const resp = await ApiService.getLogs(200, 0);
      setLogs(Array.isArray(resp) ? resp : resp?.logs || []);
    } catch (err) {
      console.error("Erro ao carregar registos:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ description: "", duration_min: "", calories: "", notes: "", meal_type: "almoco", foods: "" });
    setError(null);
    setEditTarget(null);
  };

  const handleEdit = (log) => {
    setEditTarget(log);
    setTab(log.log_type);
    setForm({
      description: log.description || "",
      duration_min: log.duration_min != null ? String(log.duration_min) : "",
      calories: log.calories != null ? String(log.calories) : "",
      notes: log.notes || "",
      meal_type: log.meal_type || "almoco",
      foods: log.foods || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab === "treino" && !form.description.trim()) return setError("Descreve o treino");
    if (tab === "refeicao" && !form.foods.trim()) return setError("Descreve a refeição");

    try {
      setSaving(true);
      setError(null);
      const payload = tab === "treino"
        ? {
            log_type: "treino",
            description: form.description.trim(),
            duration_min: parseInt(form.duration_min) || null,
            calories: parseInt(form.calories) || null,
            notes: form.notes.trim() || null,
          }
        : {
            log_type: "refeicao",
            meal_type: form.meal_type,
            foods: form.foods.trim(),
            calories: parseInt(form.calories) || null,
            notes: form.notes.trim() || null,
          };

      if (editTarget) {
        await ApiService.updateLog(editTarget.id, payload);
      } else {
        await ApiService.createLog(payload);
      }
      await loadLogs();
      resetForm();
      setShowForm(false);
      setSuccess(editTarget ? "Registo atualizado! ✓" : "Registo guardado! ✓");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Erro ao guardar");
    } finally {
      setSaving(false);
    }
  };

  /**
   * Optimistic delete: remove the log from the UI immediately and fire the
   * API call in the background. Roll the entry back into the list if the
   * server rejects the operation so data stays consistent without making
   * the user wait for the round-trip.
   */
  const handleDelete = async (logId, logType) => {
    const snapshot = logs;
    setLogs((prev) => prev.filter((l) => !(l.id === logId && l.log_type === logType)));
    setDeleteTarget(null);
    setSuccess("Registo apagado ✓");
    setTimeout(() => setSuccess(null), 2000);
    try {
      await ApiService.deleteLog(logId, logType);
    } catch (err) {
      console.error(err);
      /* Rollback on failure so the UI never lies to the user */
      setLogs(snapshot);
      setError("Não foi possível apagar. Tenta de novo.");
      setTimeout(() => setError(null), 3000);
    }
  };

  const filtered = logs.filter((l) => l.log_type === tab);
  const searched = search.trim()
    ? filtered.filter((l) => {
        const q = search.toLowerCase();
        return (l.description || "").toLowerCase().includes(q)
          || (l.foods || "").toLowerCase().includes(q)
          || (l.notes || "").toLowerCase().includes(q)
          || (l.meal_type || "").toLowerCase().includes(q);
      })
    : filtered;
  const mealLabels = {
    "pequeno-almoco": "Peq. Almoço",
    "pequeno_almoco": "Peq. Almoço",
    almoco: "Almoço",
    lanche: "Lanche",
    jantar: "Jantar",
    snack: "Snack",
  };

  // Stats
  const totalWorkouts = logs.filter(l => l.log_type === "treino").length;
  const totalMeals = logs.filter(l => l.log_type === "refeicao").length;
  const totalCalories = logs.filter(l => l.log_type === "refeicao").reduce((s, l) => s + (l.calories || 0), 0);
  const totalMinutes = logs.filter(l => l.log_type === "treino").reduce((s, l) => s + (l.duration_min || 0), 0);

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={s.title}>Registos</h2>
          <p style={s.subtitle}>{logs.length} registos no total</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={s.aiBtn}
            onClick={() => navigate("/plans?generate=true")}
            title="Gerar treino com AI"
          >
            <Zap size={16} strokeWidth={2} />
          </button>
          <button
            className="btn btn-primary"
            style={s.addBtn}
            onClick={() => { setShowForm(!showForm); resetForm(); }}
            title={showForm ? "Cancelar" : "Novo registo"}
          >
            {showForm ? "✕" : <Plus size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div style={s.statsRow}>
        <div style={s.statChip}>
          <span style={s.statChipValue}>{totalWorkouts}</span>
          <span style={s.statChipLabel}>treinos</span>
        </div>
        <div style={s.statChip}>
          <span style={s.statChipValue}>{totalMinutes}</span>
          <span style={s.statChipLabel}>min</span>
        </div>
        <div style={s.statChip}>
          <span style={s.statChipValue}>{totalMeals}</span>
          <span style={s.statChipLabel}>refeições</span>
        </div>
        <div style={s.statChip}>
          <span style={s.statChipValue}>{totalCalories}</span>
          <span style={s.statChipLabel}>kcal</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setShowForm(false); resetForm(); }}
            style={{
              ...s.tab,
              background: tab === t.key ? t.color : "transparent",
              color: tab === t.key ? "white" : "var(--text-secondary)",
              fontWeight: tab === t.key ? 600 : 500,
              boxShadow: tab === t.key ? `0 2px 8px ${t.shadow}` : "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <t.icon size={18} strokeWidth={1.5} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={s.searchWrap}>
        <Search size={15} color="var(--text-muted)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
        <input
          type="text" style={s.searchInput}
          placeholder={`Pesquisar ${tab === "treino" ? "treinos" : "refeições"}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={s.searchClear} onClick={() => setSearch("")}>✕</button>
        )}
      </div>

      {/* Success */}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div style={s.formCard}>
          <h3 style={s.formTitle}>
            {editTarget
              ? (tab === "treino" ? "Editar Treino" : "Editar Refeição")
              : (tab === "treino" ? "Novo Treino" : "Nova Refeição")}
          </h3>

          {error && (
            <div className="alert alert-error" style={{ marginBottom: 12 }}>
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {tab === "treino" ? (
              <>
                <div className="form-group">
                  <label className="form-label">Descrição *</label>
                  <input
                    type="text" className="form-input"
                    placeholder="Ex: Treino de peito e tríceps"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    disabled={saving}
                  />
                </div>
                <div style={s.row}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Duração (min)</label>
                    <input
                      type="number" className="form-input" placeholder="60"
                      value={form.duration_min}
                      onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Calorias</label>
                    <input
                      type="number" className="form-input" placeholder="350"
                      value={form.calories}
                      onChange={(e) => setForm({ ...form, calories: e.target.value })}
                      disabled={saving}
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Tipo de refeição</label>
                  <div style={s.mealGrid}>
                    {Object.entries(mealLabels).filter(([k]) => !k.includes("_")).map(([val, label]) => (
                      <button
                        key={val} type="button"
                        onClick={() => setForm({ ...form, meal_type: val })}
                        style={{
                          ...s.mealBtn,
                          background: form.meal_type === val ? "var(--primary)" : "var(--card-bg)",
                          color: form.meal_type === val ? "white" : "var(--text-secondary)",
                          borderColor: form.meal_type === val ? "var(--primary)" : "var(--border)",
                          boxShadow: form.meal_type === val ? "0 2px 8px var(--btn-primary-shadow)" : "var(--shadow)",
                        }}
                        disabled={saving}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Alimentos *</label>
                  <textarea
                    className="form-input" rows={3}
                    placeholder="Ex: Arroz, frango grelhado, salada"
                    value={form.foods}
                    onChange={(e) => setForm({ ...form, foods: e.target.value })}
                    disabled={saving} style={{ resize: "vertical" }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Calorias (estimativa)</label>
                  <input
                    type="number" className="form-input" placeholder="500"
                    value={form.calories}
                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                    disabled={saving}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Notas</label>
              <input
                type="text" className="form-input"
                placeholder="Notas opcionais..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                disabled={saving}
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> A guardar...</>
              ) : editTarget ? "Atualizar Registo" : "Guardar Registo"}
            </button>
          </form>
        </div>
      )}

      {/* Logs list */}
      {loading ? (
        <SkeletonLogs count={5} />
      ) : searched.length === 0 ? (
        <div style={s.emptyState}>
          {search ? (
            <>
              <Search size={36} color="var(--text-muted)" strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 4 }} />
              <h3 style={s.emptyTitle}>Sem resultados</h3>
              <p style={s.emptyText}>Nenhum registo encontrado para "{search}"</p>
              <button className="btn btn-secondary btn-sm" onClick={() => setSearch("")}>Limpar pesquisa</button>
            </>
          ) : tab === "treino" ? (
            <>
              <Dumbbell size={36} color="var(--text-muted)" strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 4 }} />
              <h3 style={s.emptyTitle}>Sem treinos</h3>
              <p style={s.emptyText}>Regista o teu primeiro treino!</p>
              <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap", justifyContent: "center" }}>
                <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
                  <Plus size={14} strokeWidth={2} style={{ marginRight: 4 }} />Adicionar Treino
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate("/plans?generate=true")}>
                  <Zap size={14} strokeWidth={2} style={{ marginRight: 4 }} />Gerar com AI
                </button>
              </div>
            </>
          ) : (
            <>
              <UtensilsCrossed size={36} color="var(--text-muted)" strokeWidth={1.5} style={{ opacity: 0.4, marginBottom: 4 }} />
              <h3 style={s.emptyTitle}>Sem refeições</h3>
              <p style={s.emptyText}>Regista a tua primeira refeição!</p>
              <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} style={{ marginTop: 16 }}>
                <Plus size={14} strokeWidth={2} style={{ marginRight: 4 }} />Adicionar Refeição
              </button>
            </>
          )}
        </div>
      ) : (
        <div style={s.logsList}>
          {searched.map((log) => (
            <div key={`${log.log_type}-${log.id}`} className="card-lift" style={s.logCard}>
              <div style={s.logTop}>
                <div style={s.logIconWrap}>
                  {tab === "treino"
                    ? <Dumbbell size={16} color="var(--primary)" strokeWidth={1.5} />
                    : <UtensilsCrossed size={16} color="var(--p2)" strokeWidth={1.5} />
                  }
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={s.logTitle}>
                    {tab === "treino"
                      ? (log.description || "Treino")
                      : (mealLabels[log.meal_type] || log.meal_type || "Refeição")}
                  </h4>
                  <p style={s.logDate}>
                    <Calendar size={11} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -1 }} />
                    {log.date || (log.created_at ? new Date(log.created_at).toLocaleDateString("pt-PT") : "—")}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button style={s.editBtn} onClick={() => handleEdit(log)} title="Editar">
                    <Pencil size={14} strokeWidth={1.5} />
                  </button>
                  <button style={s.deleteBtn} onClick={() => setDeleteTarget(log)} title="Apagar">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>

              <div style={s.logMeta}>
                {log.calories != null && log.calories > 0 && (
                  <span style={s.logTag}>
                    <Flame size={12} strokeWidth={1.5} style={{ marginRight: 3, verticalAlign: -1 }} />
                    {log.calories} kcal
                  </span>
                )}
                {log.duration_min != null && log.duration_min > 0 && (
                  <span style={s.logTag}>
                    <Clock size={12} strokeWidth={1.5} style={{ marginRight: 3, verticalAlign: -1 }} />
                    {log.duration_min} min
                  </span>
                )}
              </div>

              {log.foods && (
                <p style={s.logFoods}>{log.foods}</p>
              )}

              {log.notes && (
                <p style={s.logNotes}>{log.notes}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Apagar Registo"
        confirmText="Apagar"
        onConfirm={() => handleDelete(deleteTarget.id, deleteTarget.log_type)}
      >
        <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.5 }}>
          Tens a certeza que queres apagar este registo?
          {deleteTarget?.description && <><br /><strong>{deleteTarget.description}</strong></>}
          {deleteTarget?.foods && <><br /><strong>{deleteTarget.foods}</strong></>}
        </p>
      </Modal>
    </div>
  );
}

const g = {
  bg: "var(--card-bg)", border: "1px solid var(--border)",
  shadow: "var(--shadow)", shadowMd: "var(--shadow-md)",
};

const s = {
  page: { animation: "fadeUp 0.3s ease" },

  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "8px 0 16px",
  },
  title: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.03em" },
  subtitle: { fontSize: "var(--text-caption)", color: "var(--text-muted)", margin: "3px 0 0", fontWeight: 500 },
  addBtn: { padding: "8px 18px", fontSize: 14 },
  aiBtn: {
    width: 38, height: 38, borderRadius: "var(--radius-sm)",
    background: "var(--primary-bg)", border: "1px solid var(--border)",
    color: "var(--primary)", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "background 0.15s, transform 0.15s",
    boxShadow: "var(--shadow)",
  },

  /* Stats */
  statsRow: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8,
    marginBottom: 16,
  },
  statChip: {
    display: "flex", alignItems: "center", gap: 5, padding: "10px 8px",
    background: g.bg, borderRadius: 14, boxShadow: g.shadow,
    justifyContent: "center", flexWrap: "wrap",
    border: g.border, minWidth: 0, overflow: "hidden",
  },
  statChipValue: { fontSize: "var(--text-h3)", fontWeight: 800, color: "var(--text)", whiteSpace: "nowrap", fontFamily: "var(--font-heading)" },
  statChipLabel: { fontSize: "var(--text-overline)", color: "var(--text-muted)", fontWeight: 600, whiteSpace: "nowrap" },

  /* Search */
  searchWrap: {
    display: "flex", alignItems: "center", gap: 8,
    padding: "10px 14px", marginBottom: 16,
    background: g.bg, borderRadius: 14,
    border: g.border, boxShadow: g.shadow,
  },
  searchInput: {
    flex: 1, border: "none", background: "transparent",
    color: "var(--text)", fontSize: 13, fontFamily: "inherit",
    outline: "none", fontWeight: 500,
  },
  searchClear: {
    background: "none", border: "none", cursor: "pointer",
    color: "var(--text-muted)", fontSize: 14, padding: "2px 4px",
  },

  /* Tabs */
  tabs: {
    display: "flex", gap: 6, marginBottom: 20,
    background: g.bg, borderRadius: 14, padding: 4,
    boxShadow: g.shadow, border: g.border,
  },
  tab: {
    flex: 1, padding: "10px 12px", borderRadius: 12,
    border: "none", fontSize: 13, cursor: "pointer",
    transition: "all 0.25s", textAlign: "center",
  },

  /* Form */
  formCard: {
    background: g.bg, borderRadius: "var(--radius)",
    padding: "20px", boxShadow: g.shadowMd, marginBottom: 20,
    animation: "slideUp 0.25s ease", border: g.border,
  },
  formTitle: { fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text)", margin: "0 0 18px", letterSpacing: "-0.02em" },
  row: { display: "flex", gap: 12 },
  mealGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  mealBtn: {
    padding: "8px 14px", borderRadius: 20,
    border: "1px solid var(--border)", fontSize: 12,
    fontWeight: 600, cursor: "pointer", transition: "all 0.25s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.4)",
  },

  /* Logs */
  logsList: { display: "flex", flexDirection: "column", gap: 12 },
  logCard: {
    background: g.bg, borderRadius: "var(--radius)",
    padding: "16px 18px", boxShadow: g.shadow, border: g.border,
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  logTop: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10,
  },
  logIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    background: "var(--bg-subtle, rgba(139, 109, 78, 0.04))",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  logTitle: {
    fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: "0 0 4px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: "-0.01em",
  },
  logDate: { fontSize: "var(--text-caption)", color: "var(--text-muted)", margin: 0 },
  deleteBtn: {
    background: "var(--card-bg)", border: g.border,
    borderRadius: 10, padding: "4px 8px", fontSize: 14,
    cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
    boxShadow: "var(--shadow)", color: "var(--text-muted)",
  },
  editBtn: {
    background: "var(--card-bg)", border: g.border,
    borderRadius: 10, padding: "4px 8px", fontSize: 14,
    cursor: "pointer", flexShrink: 0, transition: "background 0.15s",
    boxShadow: "var(--shadow)", color: "var(--primary)",
  },
  logMeta: {
    display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10,
  },
  logTag: {
    padding: "4px 10px", borderRadius: 12,
    background: "var(--bg-subtle)", fontSize: "var(--text-caption)", fontWeight: 600,
    color: "var(--text-secondary)",
  },
  logFoods: {
    fontSize: "var(--text-body)", color: "var(--text-secondary)", margin: "10px 0 0",
    lineHeight: 1.5, width: "100%",
  },
  logNotes: {
    fontSize: "var(--text-body)", color: "var(--text-muted)", margin: "8px 0 0",
    fontStyle: "italic", lineHeight: 1.5,
  },

  /* Empty */
  emptyState: {
    textAlign: "center", padding: "48px 20px",
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
    background: g.bg, borderRadius: "var(--radius)", boxShadow: g.shadow,
    border: g.border,
  },
  emptyTitle: { fontSize: "var(--text-h2)", fontWeight: 700, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" },
  emptyText: { fontSize: "var(--text-body)", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 },
};
