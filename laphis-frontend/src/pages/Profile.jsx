import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { Award, TrendingUp, Edit3, LogOut, Settings, UserCircle, Target, Flame, Calendar } from "lucide-react";
import AvatarPicker, { AvatarDisplay } from "../components/AvatarPicker";

const ACHIEVEMENTS = [
  { key: "first_workout", label: "First Workout", desc: "Completou o primeiro treino" },
  { key: "streak_7", label: "7 Day Streak", desc: "Treinou 7 dias seguidos" },
  { key: "streak_30", label: "30 Day Streak", desc: "Treinou 30 dias seguidos" },
  { key: "first_meal", label: "First Meal Logged", desc: "Registou a primeira refeição" },
  { key: "plan_created", label: "Plan Created", desc: "Criou o primeiro plano" },
  { key: "profile_done", label: "Profile Complete", desc: "Perfil preenchido" },
];

function getBMICategory(bmi) {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidade";
}

export default function Profile() {
  const navigate = useNavigate();
  const toast = useToast();
  const { profile, loadMyProfile, loading: profileLoading } = useApp();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "", age: "", sex: "", height_cm: "", weight_kg: "",
    goal: "", level: "", days_per_week: "3", avatar: null,
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        age: String(profile.age || ""),
        sex: profile.sex || "",
        height_cm: String(profile.height_cm || ""),
        weight_kg: String(profile.weight_kg || ""),
        goal: profile.goal || "",
        level: profile.level || "",
        days_per_week: String(profile.days_per_week || "3"),
        avatar: profile.avatar || null,
      });
    }
  }, [profile]);

  // If no profile AND finished loading, go straight to form
  useEffect(() => {
    if (!profile && !profileLoading) setEditing(true);
  }, [profile, profileLoading]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return setError("Preenche o teu nome");
    if (!formData.age || formData.age < 12 || formData.age > 100) return setError("Idade entre 12 e 100");
    if (!formData.sex) return setError("Seleciona o sexo");
    if (!formData.height_cm || formData.height_cm < 120 || formData.height_cm > 230) return setError("Altura entre 120 e 230 cm");
    if (!formData.weight_kg || formData.weight_kg < 35 || formData.weight_kg > 250) return setError("Peso entre 35 e 250 kg");
    if (!formData.goal) return setError("Seleciona um objetivo");
    if (!formData.level) return setError("Seleciona o nível");

    try {
      setLoading(true);
      setError(null);
      const payload = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        sex: formData.sex,
        height_cm: parseInt(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        goal: formData.goal,
        level: formData.level,
        days_per_week: parseInt(formData.days_per_week) || 3,
        avatar: formData.avatar || null,
      };
      await ApiService.createProfile(payload);
      await loadMyProfile();
      setSuccess("Perfil guardado com sucesso!");
      toast.success("Perfil guardado!");
      setEditing(false);
      if (!profile) {
        setTimeout(() => navigate("/dashboard"), 1200);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await ApiService.logout();
    navigate("/login");
  };

  const goalLabels = {
    perder_gordura: "Perder Gordura",
    ganhar_massa: "Ganhar Massa",
    manter: "Manter Forma",
  };
  const sexLabels = { masculino: "Masculino", feminino: "Feminino", outro: "Outro" };
  const levelLabels = { iniciante: "Iniciante", intermedio: "Intermédio", avancado: "Avançado" };

  // Member since
  const memberSince = (() => {
    const d = profile?.created_at ? new Date(profile.created_at) : new Date();
    return d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  })();

  // Unlocked achievements (simplified based on profile existence)
  const unlockedKeys = new Set();
  if (profile) unlockedKeys.add("profile_done");

  // ====== EDIT FORM VIEW ======
  if (editing) {
    return (
      <div style={s.page}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h2 style={s.formHeaderTitle}>
              {profile ? "Editar Perfil" : "Criar Perfil"}
            </h2>
            {profile && (
              <button style={s.formClose} onClick={() => { setEditing(false); setError(null); setSuccess(null); }}>
                ✕
              </button>
            )}
          </div>

          {error && (
            <div className="alert alert-error">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="alert alert-success">
              <span className="alert-icon">✓</span>
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Avatar Picker */}
            <div className="form-group">
              <AvatarPicker
                value={formData.avatar}
                onChange={(val) => handleChange("avatar", val)}
              />
            </div>

            {/* Name */}
            <div className="form-group">
              <label className="form-label">Nome <span className="required">*</span></label>
              <input
                type="text" className="form-input" placeholder="O teu nome"
                value={formData.name} onChange={(e) => handleChange("name", e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Age + Sex */}
            <div style={s.row}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Idade <span className="required">*</span></label>
                <input
                  type="number" className="form-input" placeholder="25"
                  min="12" max="100" value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)} disabled={loading}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Sexo <span className="required">*</span></label>
                <select
                  className="form-select" value={formData.sex}
                  onChange={(e) => handleChange("sex", e.target.value)} disabled={loading}
                >
                  <option value="">Selecionar</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Height + Weight */}
            <div style={s.row}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Altura (cm) <span className="required">*</span></label>
                <input
                  type="number" className="form-input" placeholder="175"
                  min="120" max="230" value={formData.height_cm}
                  onChange={(e) => handleChange("height_cm", e.target.value)} disabled={loading}
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Peso (kg) <span className="required">*</span></label>
                <input
                  type="number" className="form-input" placeholder="75"
                  min="35" max="250" step="0.1" value={formData.weight_kg}
                  onChange={(e) => handleChange("weight_kg", e.target.value)} disabled={loading}
                />
              </div>
            </div>

            {/* Goal */}
            <div className="form-group">
              <label className="form-label">Objetivo <span className="required">*</span></label>
              <div style={s.optionGrid}>
                {[
                  { value: "perder_gordura", label: "Perder Gordura" },
                  { value: "ganhar_massa", label: "Ganhar Massa" },
                  { value: "manter", label: "Manter Forma" },
                ].map((opt) => (
                  <button
                    key={opt.value} type="button"
                    onClick={() => handleChange("goal", opt.value)}
                    style={{
                      ...s.optionCard,
                      borderColor: formData.goal === opt.value ? "var(--primary)" : "var(--border)",
                      background: formData.goal === opt.value ? "var(--primary-bg)" : "var(--card-bg)",
                    }}
                    disabled={loading}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: formData.goal === opt.value ? 700 : 500,
                      color: formData.goal === opt.value ? "var(--primary)" : "var(--text-secondary)",
                    }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Level */}
            <div className="form-group">
              <label className="form-label">Nível <span className="required">*</span></label>
              <div style={s.optionGrid}>
                {[
                  { value: "iniciante", label: "Iniciante" },
                  { value: "intermedio", label: "Intermédio" },
                  { value: "avancado", label: "Avançado" },
                ].map((opt) => (
                  <button
                    key={opt.value} type="button"
                    onClick={() => handleChange("level", opt.value)}
                    style={{
                      ...s.optionCard,
                      borderColor: formData.level === opt.value ? "var(--primary)" : "var(--border)",
                      background: formData.level === opt.value ? "var(--primary-bg)" : "var(--card-bg)",
                    }}
                    disabled={loading}
                  >
                    <span style={{
                      fontSize: 13, fontWeight: formData.level === opt.value ? 700 : 500,
                      color: formData.level === opt.value ? "var(--primary)" : "var(--text-secondary)",
                    }}>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Days */}
            <div className="form-group">
              <label className="form-label">Dias de treino por semana</label>
              <div style={s.daysRow}>
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d} type="button"
                    onClick={() => handleChange("days_per_week", String(d))}
                    style={{
                      ...s.dayBtn,
                      background: parseInt(formData.days_per_week) === d ? "var(--primary)" : "var(--card-bg)",
                      color: parseInt(formData.days_per_week) === d ? "white" : "var(--text-secondary)",
                      borderColor: parseInt(formData.days_per_week) === d ? "var(--primary)" : "var(--border)",
                    }}
                    disabled={loading}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 4 }}>
              {loading ? (
                <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A guardar...</>
              ) : (
                profile ? "Guardar Alterações" : "Criar Perfil"
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ====== VIEW MODE ======
  const bmi = profile ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)) : 0;

  return (
    <div style={s.page}>
      {/* Profile Header */}
      <div style={s.profileHeader}>
        <div style={s.avatarRing}>
          <AvatarDisplay avatar={profile?.avatar} name={profile?.name} size={80} style={{ borderRadius: 22 }} />
        </div>
        <h1 style={s.profileName}>{profile?.name}</h1>
        <p style={s.memberSince}>
          <Calendar size={13} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />
          Membro desde {memberSince}
        </p>
      </div>

      {/* Success */}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Info Card */}
      <div style={s.infoCard}>
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Idade</span>
          <span style={s.infoValue}>{profile?.age} anos</span>
        </div>
        <div style={s.infoDivider} />
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Peso</span>
          <span style={s.infoValue}>{profile?.weight_kg} kg</span>
        </div>
        <div style={s.infoDivider} />
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Altura</span>
          <span style={s.infoValue}>{profile?.height_cm} cm</span>
        </div>
        <div style={s.infoDivider} />
        <div style={s.infoRow}>
          <span style={s.infoLabel}>IMC</span>
          <span style={s.infoValue}>{bmi.toFixed(1)} — {getBMICategory(bmi)}</span>
        </div>
        <div style={s.infoDivider} />
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Objetivo</span>
          <span style={s.infoValue}>{goalLabels[profile?.goal] || profile?.goal}</span>
        </div>
        <div style={s.infoDivider} />
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Nível</span>
          <span style={s.infoValue}>{levelLabels[profile?.level] || profile?.level}</span>
        </div>
        <div style={s.infoDivider} />
        <div style={s.infoRow}>
          <span style={s.infoLabel}>Treino</span>
          <span style={s.infoValue}>{profile?.days_per_week}x por semana</span>
        </div>
      </div>

      {/* Edit Button */}
      <button
        className="btn btn-primary btn-full"
        onClick={() => { setEditing(true); setSuccess(null); }}
        style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <Edit3 size={16} strokeWidth={1.5} />
        Editar Perfil
      </button>

      {/* Settings Button */}
      <button
        className="btn btn-ghost btn-full"
        onClick={() => navigate("/settings")}
        style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
      >
        <Settings size={16} strokeWidth={1.5} />
        Definições
      </button>

      {/* Achievements */}
      <h3 style={s.sectionTitle}>Conquistas</h3>
      <div style={s.badgesGrid}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedKeys.has(a.key);
          return (
            <div key={a.key} style={{ ...s.badge, opacity: unlocked ? 1 : 0.35 }}>
              <Award size={24} color={unlocked ? "var(--primary)" : "var(--text-muted)"} strokeWidth={1.5} style={{marginBottom: 6}} />
              <span style={s.badgeLabel}>{a.label}</span>
            </div>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        style={s.logoutBtn}
      >
        <LogOut size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -2 }} />
        Terminar Sessão
      </button>
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

  /* View Mode */
  profileHeader: {
    textAlign: "center", marginBottom: 24, paddingTop: 8,
  },
  avatarRing: {
    width: 92, height: 92, borderRadius: 28,
    border: "3px solid var(--primary)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 14px",
    padding: 3,
  },
  avatar: {
    width: "100%", height: "100%", borderRadius: 24,
    background: "var(--gradient-primary)", color: "white",
    fontSize: 32, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px var(--btn-primary-shadow)",
  },
  profileName: {
    fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 4px",
  },
  memberSince: {
    fontSize: 13, color: "var(--text-muted)", fontWeight: 500, margin: 0,
  },

  infoCard: {
    background: gl.bg, borderRadius: "var(--radius)",
    padding: "6px 20px", marginBottom: 16, boxShadow: gl.shadow,
    border: gl.border,
  },
  infoRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "14px 0",
  },
  infoLabel: { fontSize: 14, color: "var(--text-muted)", fontWeight: 500 },
  infoValue: { fontSize: 14, fontWeight: 600, color: "var(--text)", textTransform: "capitalize" },
  infoDivider: { height: 1, background: "var(--border)" },

  sectionTitle: {
    fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 14px",
  },

  /* Badges */
  badgesGrid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32,
  },
  badge: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
    padding: "18px 8px", background: gl.bg, borderRadius: "var(--radius-sm)",
    boxShadow: gl.shadow, transition: "opacity 0.3s",
    border: gl.border,
  },
  badgeIcon: { fontSize: 28 },
  badgeLabel: { fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" },

  /* Logout */
  logoutBtn: {
    width: "100%", padding: "14px", borderRadius: "var(--radius-sm)",
    background: "var(--card-bg)", border: gl.border,
    color: "var(--text-muted)", fontSize: 14, fontWeight: 600,
    cursor: "pointer", transition: "all 0.25s", marginBottom: 16,
    boxShadow: "var(--shadow)",
  },

  /* Form */
  formCard: {
    background: gl.bg, borderRadius: "var(--radius)",
    padding: "24px 20px", boxShadow: gl.shadowMd,
    border: gl.border,
  },
  formHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--glass-border)",
  },
  formHeaderTitle: { fontSize: 18, fontWeight: 700, color: "var(--text)", margin: 0 },
  formClose: {
    width: 34, height: 34, borderRadius: 12, background: "var(--card-bg)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 16, color: "var(--text-muted)", cursor: "pointer", border: gl.border,
    boxShadow: "var(--shadow)",
    transition: "background 0.15s",
  },
  row: { display: "flex", gap: 12 },
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  optionCard: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 6, padding: "16px 8px",
    borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)",
    cursor: "pointer", transition: "border-color 0.15s, background 0.15s", minHeight: 52,
    boxShadow: "var(--shadow)",
  },
  daysRow: { display: "flex", gap: 8, justifyContent: "space-between" },
  dayBtn: {
    width: 42, height: 42, borderRadius: "50%",
    border: "2px solid var(--glass-border)", display: "flex",
    alignItems: "center", justifyContent: "center",
    fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background 0.15s",
    boxShadow: "var(--shadow)",
  },
};
