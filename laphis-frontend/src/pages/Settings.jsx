import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { Trash2, Plus, Bell, Play, Archive, Dumbbell, UtensilsCrossed, Zap } from "lucide-react";
import {
  requestNotificationPermission,
  getNotificationPermission,
  sendNotification,
  getReminders,
  addReminder,
  removeReminder,
  toggleReminder,
  startReminderChecker,
  REMINDER_PRESETS,
} from "../utils/notifications";

const DAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useApp();
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());
  const [reminders, setReminders] = useState(getReminders());
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState("treino");
  const [newTime, setNewTime] = useState("07:30");
  const [newMessage, setNewMessage] = useState("");
  const [newDays, setNewDays] = useState([1, 2, 3, 4, 5]);
  const [testSent, setTestSent] = useState(false);
  const [archivedPlans, setArchivedPlans] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  useEffect(() => {
    startReminderChecker();
    if (profile) loadArchivedPlans();
  }, [profile]);

  const loadArchivedPlans = async () => {
    try {
      setArchivedLoading(true);
      const resp = await ApiService.getPlans(profile.id, "archived");
      setArchivedPlans(Array.isArray(resp) ? resp : resp.plans || []);
    } catch (err) {
      console.error("Erro ao carregar planos arquivados:", err);
    } finally {
      setArchivedLoading(false);
    }
  };

  const handleActivatePlan = async (planId) => {
    try {
      await ApiService.updatePlan(planId, { status: "active" });
      await loadArchivedPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePlan = async (planId) => {
    try {
      await ApiService.deletePlan(planId);
      await loadArchivedPlans();
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "training": return <Dumbbell size={16} color="var(--primary)" strokeWidth={1.5} />;
      case "nutrition": return <UtensilsCrossed size={16} color="var(--p2)" strokeWidth={1.5} />;
      case "combined": return <Zap size={16} color="var(--p3)" strokeWidth={1.5} />;
      default: return <Archive size={16} color="var(--text-muted)" strokeWidth={1.5} />;
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setNotifPerm(result);
    if (result === "granted") {
      startReminderChecker();
    }
  };

  const handleTestNotification = () => {
    sendNotification("Teste LAPHIS", "As notificações estão a funcionar corretamente!");
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const handleAddReminder = () => {
    const preset = REMINDER_PRESETS.find((p) => p.type === newType);
    const updated = addReminder({
      type: newType,
      label: preset?.label || "Lembrete",
      time: newTime,
      message: newMessage || preset?.defaultMessage || "Lembrete LAPHIS",
      days: newDays,
    });
    setReminders(updated);
    setShowAddForm(false);
    resetForm();
  };

  const handleRemove = (id) => {
    const updated = removeReminder(id);
    setReminders(updated);
  };

  const handleToggle = (id) => {
    const updated = toggleReminder(id);
    setReminders(updated);
  };

  const resetForm = () => {
    setNewType("treino");
    setNewTime("07:30");
    setNewMessage("");
    setNewDays([1, 2, 3, 4, 5]);
  };

  const toggleDay = (day) => {
    setNewDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const selectPreset = (type) => {
    const preset = REMINDER_PRESETS.find((p) => p.type === type);
    if (preset) {
      setNewType(type);
      setNewTime(preset.defaultTime);
      setNewMessage(preset.defaultMessage);
      setNewDays(preset.defaultDays);
    }
  };

  const getReminderTypeIcon = (type) => {
    const labels = { treino: "T", agua: "A", refeicao: "R", zen: "Z", peso: "P" };
    return labels[type] || "•";
  };

  return (
    <div style={s.page}>
      <h2 style={s.pageTitle}>Definições</h2>

      {/* ===== APPEARANCE ===== */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Aparência</h3>
        <div style={s.settingRow}>
          <div>
            <span style={s.settingLabel}>Modo Escuro</span>
            <span style={s.settingDesc}>Tema escuro para conforto visual</span>
          </div>
          <button
            onClick={toggleTheme}
            style={{
              ...s.toggleBtn,
              background: theme === "dark" ? "var(--primary)" : "var(--border)",
            }}
          >
            <div
              style={{
                ...s.toggleDot,
                transform: theme === "dark" ? "translateX(22px)" : "translateX(2px)",
              }}
            />
          </button>
        </div>


      </div>

      {/* ===== NOTIFICATIONS ===== */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Notificações</h3>

        {/* Permission status */}
        <div style={s.permCard}>
          <div style={s.permInfo}>
            <Bell size={24} color="var(--primary)" strokeWidth={1.5} style={{flexShrink: 0}} />
            <div>
              <span style={s.permLabel}>
                {notifPerm === "granted"
                  ? "Notificações ativadas"
                  : notifPerm === "denied"
                  ? "Notificações bloqueadas"
                  : "Notificações pendentes"}
              </span>
              <span style={s.permDesc}>
                {notifPerm === "denied"
                  ? "Vai às definições do browser para desbloquear"
                  : notifPerm === "granted"
                  ? "Vais receber lembretes no horário definido"
                  : "Clica para ativar as notificações"}
              </span>
            </div>
          </div>
          {notifPerm !== "granted" && notifPerm !== "denied" && (
            <button className="btn btn-primary btn-sm" onClick={handleRequestPermission}>
              Ativar
            </button>
          )}
          {notifPerm === "granted" && (
            <button
              className="btn btn-ghost btn-sm"
              onClick={handleTestNotification}
              disabled={testSent}
            >
              {testSent ? "✓ Enviado" : "Testar"}
            </button>
          )}
        </div>

        {/* Reminders List */}
        <div style={s.remindersHeader}>
          <h4 style={s.remindersTitle}>Lembretes ({reminders.length})</h4>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => { setShowAddForm(!showAddForm); resetForm(); }}
            title={showAddForm ? "Cancelar" : "Novo lembrete"}
          >
            {showAddForm ? "✕" : <Plus size={18} strokeWidth={1.5} />}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div style={s.addForm}>
            {/* Type presets */}
            <div style={s.presetGrid}>
              {REMINDER_PRESETS.map((p) => (
                <button
                  key={p.type}
                  onClick={() => selectPreset(p.type)}
                  style={{
                    ...s.presetBtn,
                    borderColor: newType === p.type ? "var(--primary)" : "var(--border)",
                    background: newType === p.type ? "var(--primary-bg)" : "var(--bg)",
                  }}
                >
                  <span style={{
                    fontSize: 13, fontWeight: newType === p.type ? 700 : 500,
                    color: newType === p.type ? "var(--primary)" : "var(--text-secondary)",
                  }}>{p.label}</span>
                </button>
              ))}
            </div>

            {/* Time */}
            <div className="form-group">
              <label className="form-label">Horário</label>
              <input
                type="time" className="form-input"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>

            {/* Days */}
            <div className="form-group">
              <label className="form-label">Dias da semana</label>
              <div style={s.daysRow}>
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    style={{
                      ...s.dayBtn,
                      background: newDays.includes(idx) ? "var(--primary)" : "var(--bg)",
                      color: newDays.includes(idx) ? "white" : "var(--text-secondary)",
                      borderColor: newDays.includes(idx) ? "var(--primary)" : "var(--border)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label className="form-label">Mensagem (opcional)</label>
              <input
                type="text" className="form-input"
                placeholder="Ex: Não te esqueças do treino!"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>

            <button className="btn btn-primary btn-full" onClick={handleAddReminder}>
              Criar Lembrete
            </button>
          </div>
        )}

        {/* Reminder Items */}
        {reminders.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyText}>Sem lembretes configurados.</p>
            <p style={s.emptySubtext}>Cria um lembrete para nunca esqueceres os treinos!</p>
          </div>
        ) : (
          <div style={s.remindersList}>
            {reminders.map((r) => (
              <div key={r.id} style={{ ...s.reminderCard, opacity: r.active ? 1 : 0.5 }}>
                <div style={s.reminderLeft}>
                  <span style={s.reminderIcon}>{getReminderTypeIcon(r.type)}</span>
                  <div>
                    <span style={s.reminderLabel}>{r.label}</span>
                    <span style={s.reminderTime}>
                      {r.time} · {r.days?.map((d) => DAY_LABELS[d]).join(", ") || "Todos os dias"}
                    </span>
                    {r.message && <span style={s.reminderMsg}>{r.message}</span>}
                  </div>
                </div>
                <div style={s.reminderActions}>
                  <button
                    onClick={() => handleToggle(r.id)}
                    style={{
                      ...s.miniToggle,
                      background: r.active ? "var(--primary)" : "var(--border)",
                    }}
                  >
                    <div style={{
                      ...s.miniToggleDot,
                      transform: r.active ? "translateX(14px)" : "translateX(2px)",
                    }} />
                  </button>
                  <button style={s.deleteBtn} onClick={() => handleRemove(r.id)}>
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== ARCHIVED PLANS ===== */}
      <div style={s.section}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Archive size={18} color="var(--text-muted)" strokeWidth={1.5} />
          <h3 style={{ ...s.sectionTitle, margin: 0 }}>Planos Arquivados</h3>
        </div>

        {archivedLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 24 }}><div className="spinner" /></div>
        ) : archivedPlans.length === 0 ? (
          <div style={s.emptyState}>
            <p style={s.emptyText}>Sem planos arquivados</p>
            <p style={s.emptySubtext}>Quando arquivares um plano, aparece aqui.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {archivedPlans.map((plan) => (
              <div key={plan.id} style={s.archivedCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
                  {getTypeIcon(plan.type)}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={s.archivedTitle}>{plan.title || "Plano sem título"}</span>
                    <span style={s.archivedMeta}>
                      {new Date(plan.created_at).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    style={s.archivedActionBtn}
                    onClick={() => handleActivatePlan(plan.id)}
                    title="Reativar plano"
                  >
                    <Play size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Ativar
                  </button>
                  <button
                    style={{ ...s.archivedActionBtn, color: "var(--danger)" }}
                    onClick={() => handleDeletePlan(plan.id)}
                    title="Apagar plano"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== ABOUT ===== */}
      <div style={s.section}>
        <h3 style={s.sectionTitle}>Sobre</h3>
        <div style={s.aboutCard}>
          <div style={s.aboutLogo}>L</div>
          <p style={s.aboutName}>LAPHIS v1.0</p>
          <p style={s.aboutDesc}>O teu assistente pessoal de treino e nutrição com IA</p>
        </div>
      </div>
    </div>
  );
}

// ===== STYLES — Compact System Settings =====
const s = {
  page: { animation: "fadeUp 0.25s ease" },
  pageTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: "0 0 16px" },

  section: {
    background: "var(--card-bg)", borderRadius: 14,
    padding: "14px 16px", boxShadow: "var(--shadow)", marginBottom: 12,
    border: "var(--card-border)",
  },
  sectionTitle: {
    fontSize: 12, fontWeight: 700, color: "var(--text-muted)", margin: "0 0 10px",
    textTransform: "uppercase", letterSpacing: "0.05em",
  },

  settingRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 0",
  },
  settingLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)" },
  settingDesc: { display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 1 },

  toggleBtn: {
    width: 44, height: 24, borderRadius: 12, border: "none",
    cursor: "pointer", transition: "background 0.3s", position: "relative", flexShrink: 0,
    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.12)",
  },
  toggleDot: {
    width: 20, height: 20, borderRadius: "50%", background: "var(--bg-surface)",
    position: "absolute", top: 2, transition: "transform 0.3s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  },

  permCard: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", background: "var(--hover-overlay)", borderRadius: 10,
    marginBottom: 14, border: "none",
  },
  permInfo: { display: "flex", gap: 10, alignItems: "center" },
  permLabel: { display: "block", fontSize: 12, fontWeight: 600, color: "var(--text)" },
  permDesc: { display: "block", fontSize: 10, color: "var(--text-muted)", marginTop: 1 },

  remindersHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 8,
  },
  remindersTitle: { fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 },

  addForm: {
    background: "var(--hover-overlay)", borderRadius: 10,
    padding: "12px", marginBottom: 12, animation: "slideUp 0.2s ease",
    border: "none",
  },
  presetGrid: {
    display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 6, marginBottom: 12,
  },
  presetBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "8px 6px", borderRadius: 8,
    border: "1.5px solid var(--border)", cursor: "pointer", transition: "all 0.2s",
    background: "var(--card-bg)",
  },
  daysRow: { display: "flex", gap: 4, justifyContent: "space-between" },
  dayBtn: {
    width: 32, height: 32, borderRadius: "50%", border: "1.5px solid var(--border)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 10, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
  },

  remindersList: { display: "flex", flexDirection: "column", gap: 6 },
  reminderCard: {
    display: "flex", justifyContent: "space-between", alignItems: "flex-start",
    padding: "10px 12px", background: "var(--hover-overlay)", borderRadius: 10,
    transition: "opacity 0.3s", border: "none",
  },
  reminderLeft: { display: "flex", gap: 10, alignItems: "flex-start", flex: 1 },
  reminderIcon: { fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", flexShrink: 0, marginTop: 2 },
  reminderLabel: { display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)" },
  reminderTime: { display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 1 },
  reminderMsg: { display: "block", fontSize: 10, color: "var(--text-secondary)", marginTop: 2, fontStyle: "italic" },
  reminderActions: { display: "flex", gap: 6, alignItems: "center", flexShrink: 0 },

  miniToggle: {
    width: 30, height: 16, borderRadius: 8, border: "none",
    cursor: "pointer", transition: "background 0.3s", position: "relative",
  },
  miniToggleDot: {
    width: 12, height: 12, borderRadius: "50%", background: "var(--bg-surface)",
    position: "absolute", top: 2, transition: "transform 0.3s",
    boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
  },
  deleteBtn: {
    background: "none", border: "none", fontSize: 14, cursor: "pointer",
    padding: 3, opacity: 0.5, transition: "opacity 0.2s", color: "var(--text-muted)",
  },

  emptyState: { textAlign: "center", padding: "20px 12px" },
  emptyText: { fontSize: 13, color: "var(--text-muted)", margin: "6px 0 2px", fontWeight: 600 },
  emptySubtext: { fontSize: 11, color: "var(--text-muted)", margin: 0 },

  aboutCard: { textAlign: "center", padding: "10px 0" },
  aboutLogo: {
    width: 36, height: 36, borderRadius: 10, background: "var(--gradient-primary)",
    color: "white", fontSize: 16, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 8px",
    boxShadow: "0 2px 8px var(--btn-primary-hover-shadow)",
  },
  aboutName: { fontSize: 14, fontWeight: 700, color: "var(--text)", margin: "0 0 2px" },
  aboutDesc: { fontSize: 11, color: "var(--text-muted)", margin: 0 },

  archivedCard: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "10px 12px", background: "var(--hover-overlay)",
    borderRadius: 8, gap: 8, border: "none",
  },
  archivedTitle: {
    display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  archivedMeta: { display: "block", fontSize: 10, color: "var(--text-muted)", marginTop: 1 },
  archivedActionBtn: {
    background: "var(--card-bg)", border: "1px solid var(--border-light)",
    borderRadius: 6, padding: "5px 10px", fontSize: 11,
    fontWeight: 600, color: "var(--primary)", cursor: "pointer",
    transition: "background 0.15s", display: "flex", alignItems: "center",
  },
};
