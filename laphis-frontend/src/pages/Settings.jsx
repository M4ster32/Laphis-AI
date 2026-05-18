import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { Trash2, Play, Archive, Dumbbell, UtensilsCrossed, Zap } from "lucide-react";
import {
  requestNotificationPermission,
  getNotificationPermission,
} from "../utils/notifications";

export default function Settings() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { profile } = useApp();
  const [notifPerm, setNotifPerm] = useState(getNotificationPermission());
  const [archivedPlans, setArchivedPlans] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);

  useEffect(() => {
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
        <div style={s.settingRow}>
          <div>
            <span style={s.settingLabel}>Notificações</span>
            <span style={s.settingDesc}>
              {notifPerm === "denied"
                ? "Bloqueadas — permite nas definições do browser"
                : notifPerm === "granted"
                ? "Ativas"
                : "Desativadas"}
            </span>
          </div>
          <button
            onClick={notifPerm === "default" ? handleRequestPermission : undefined}
            style={{
              ...s.toggleBtn,
              background: notifPerm === "granted" ? "var(--primary)" : "var(--border)",
              opacity: notifPerm === "denied" ? 0.4 : 1,
              cursor: notifPerm === "denied" ? "not-allowed" : notifPerm === "granted" ? "default" : "pointer",
            }}
          >
            <div style={{
              ...s.toggleDot,
              transform: notifPerm === "granted" ? "translateX(22px)" : "translateX(2px)",
            }} />
          </button>
        </div>
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
  pageTitle: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: "0 0 20px", letterSpacing: "-0.03em" },

  section: {
    background: "var(--card-bg)", borderRadius: 14,
    padding: "16px 18px", boxShadow: "var(--shadow)", marginBottom: 14,
    border: "var(--card-border)",
  },
  sectionTitle: {
    fontSize: "var(--text-overline)", fontWeight: 700, color: "var(--text-muted)", margin: "0 0 12px",
    textTransform: "uppercase", letterSpacing: "0.06em",
  },

  settingRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "6px 0",
  },
  settingLabel: { display: "block", fontSize: "var(--text-body)", fontWeight: 600, color: "var(--text)" },
  settingDesc: { display: "block", fontSize: "var(--text-overline)", color: "var(--text-muted)", marginTop: 2 },

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
