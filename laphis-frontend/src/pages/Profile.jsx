import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { Award, Edit3, LogOut, Settings, Calendar, ChevronRight, ChevronLeft, Leaf, AlertTriangle } from "lucide-react";
import AvatarPicker, { AvatarDisplay } from "../components/AvatarPicker";
import { SkeletonProfile } from "../components/Skeleton";

const ACHIEVEMENTS = [
  { key: "first_workout", label: "First Workout", desc: "Completou o primeiro treino" },
  { key: "streak_7", label: "7 Day Streak", desc: "Treinou 7 dias seguidos" },
  { key: "streak_30", label: "30 Day Streak", desc: "Treinou 30 dias seguidos" },
  { key: "first_meal", label: "First Meal Logged", desc: "Registou a primeira refeição" },
  { key: "plan_created", label: "Plan Created", desc: "Criou o primeiro plano" },
  { key: "profile_done", label: "Profile Complete", desc: "Perfil preenchido" },
];

const DIET_OPTIONS = [
  { value: "omnivoro", label: "Omnívoro", desc: "Como de tudo" },
  { value: "vegetariano", label: "Vegetariano", desc: "Sem carne nem peixe" },
  { value: "vegan", label: "Vegan", desc: "100% vegetal" },
  { value: "pescetariano", label: "Pescetariano", desc: "Sem carne, com peixe" },
  { value: "_custom", label: "Outro", desc: "Escreve a tua dieta" },
];

const ALLERGY_PRESETS = [
  "Glúten", "Lactose", "Frutos secos", "Marisco", "Ovo", "Soja",
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
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", age: "", sex: "", height_cm: "", weight_kg: "",
    goal: "", level: "", days_per_week: "3", diet_type: "omnivoro",
    allergies: "", avatar: null,
  });

  const [customDiet, setCustomDiet] = useState("");

  useEffect(() => {
    if (profile) {
      const knownDiets = ["omnivoro", "vegetariano", "vegan", "pescetariano"];
      const dt = profile.diet_type || "omnivoro";
      const isKnown = knownDiets.includes(dt);
      setFormData({
        name: profile.name || "",
        age: String(profile.age || ""),
        sex: profile.sex || "",
        height_cm: String(profile.height_cm || ""),
        weight_kg: String(profile.weight_kg || ""),
        goal: profile.goal || "",
        level: profile.level || "",
        days_per_week: String(profile.days_per_week || "3"),
        diet_type: isKnown ? dt : "_custom",
        allergies: profile.allergies || "",
        avatar: profile.avatar || null,
      });
      if (!isKnown) setCustomDiet(dt);
    }
  }, [profile]);

  useEffect(() => {
    if (!profile && !profileLoading) { setEditing(true); setStep(1); }
  }, [profile, profileLoading]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  const toggleAllergy = (allergy) => {
    const current = formData.allergies ? formData.allergies.split(",").map(a => a.trim()).filter(Boolean) : [];
    const idx = current.findIndex(a => a.toLowerCase() === allergy.toLowerCase());
    if (idx >= 0) current.splice(idx, 1);
    else current.push(allergy);
    handleChange("allergies", current.join(", "));
  };

  const hasAllergy = (allergy) => {
    if (!formData.allergies) return false;
    return formData.allergies.toLowerCase().includes(allergy.toLowerCase());
  };

  const validateStep = (s) => {
    if (s === 1) {
      if (!formData.name.trim()) return "Preenche o teu nome";
      if (!formData.age || formData.age < 12 || formData.age > 100) return "Idade entre 12 e 100";
      if (!formData.sex) return "Seleciona o sexo";
      if (!formData.height_cm || formData.height_cm < 120 || formData.height_cm > 230) return "Altura entre 120 e 230 cm";
      if (!formData.weight_kg || formData.weight_kg < 35 || formData.weight_kg > 250) return "Peso entre 35 e 250 kg";
    }
    if (s === 2) {
      if (!formData.goal) return "Seleciona um objetivo";
      if (!formData.level) return "Seleciona o nível";
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) return setError(err);
    setError(null);
    setStep(step + 1);
  };

  const handleBack = () => { setError(null); setStep(step - 1); };

  const handleSubmit = async () => {
    if (loading) return;
    for (let s = 1; s <= 2; s++) {
      const err = validateStep(s);
      if (err) { setStep(s); return setError(err); }
    }
    try {
      setLoading(true);
      setError(null);
      const dietValue = formData.diet_type === "_custom" ? (customDiet.trim() || null) : (formData.diet_type || null);
      const payload = {
        name: formData.name.trim(),
        age: parseInt(formData.age),
        sex: formData.sex,
        height_cm: parseInt(formData.height_cm),
        weight_kg: parseFloat(formData.weight_kg),
        goal: formData.goal,
        level: formData.level,
        days_per_week: parseInt(formData.days_per_week) || 3,
        diet_type: dietValue,
        allergies: formData.allergies || null,
        avatar: formData.avatar || null,
      };
      await ApiService.createProfile(payload);
      await loadMyProfile();
      setSuccess("Perfil guardado com sucesso!");
      toast.success("Perfil guardado!");
      setEditing(false);
      setStep(1);
      if (!profile) setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => { await ApiService.logout(); navigate("/login"); };

  const goalLabels = { perder_gordura: "Perder Gordura", ganhar_massa: "Ganhar Massa", manter: "Manter Forma", melhorar_saude: "Melhorar Saúde", ganhar_resistencia: "Resistência", definicao: "Definição" };
  const sexLabels = { masculino: "Masculino", feminino: "Feminino", outro: "Outro" };
  const levelLabels = { iniciante: "Iniciante", intermedio: "Intermédio", avancado: "Avançado" };
  const KNOWN_DIETS = { omnivoro: "Omnívoro", vegetariano: "Vegetariano", vegan: "Vegan", pescetariano: "Pescetariano" };
  const getDietLabel = (dt) => KNOWN_DIETS[dt] || dt || "Omnívoro";

  const memberSince = (() => {
    const d = profile?.created_at ? new Date(profile.created_at) : new Date();
    return d.toLocaleDateString("pt-PT", { month: "long", year: "numeric" });
  })();

  const unlockedKeys = new Set();
  if (profile) unlockedKeys.add("profile_done");

  const STEPS = [
    { num: 1, label: "Dados" },
    { num: 2, label: "Objetivos" },
    { num: 3, label: "Preferências" },
  ];

  /* While the profile is being fetched for the first time and the user has
     not opened the wizard, show a skeleton that mirrors the final layout.
     This prevents the full-screen empty flash that happens when the
     context is still loading. */
  if (profileLoading && !editing) {
    return <SkeletonProfile />;
  }

  // ====== EDIT FORM VIEW (WIZARD) ======
  if (editing) {
    return (
      <div style={s.page}>
        <div style={s.formCard}>
          <div style={s.formHeader}>
            <h2 style={s.formHeaderTitle}>
              {profile ? "Editar Perfil" : "Criar Perfil"}
            </h2>
            {profile && (
              <button style={s.formClose} onClick={() => { setEditing(false); setStep(1); setError(null); setSuccess(null); }}>✕</button>
            )}
          </div>

          {/* Step Indicator */}
          <div style={s.stepIndicator}>
            {STEPS.map((st, i) => (
              <div key={st.num} style={{ display: "flex", alignItems: "center" }}>
                <div
                  onClick={() => { if (st.num < step) setStep(st.num); }}
                  style={{
                    ...s.stepDot,
                    background: step >= st.num ? "var(--primary)" : "var(--border)",
                    color: step >= st.num ? "white" : "var(--text-muted)",
                    cursor: st.num < step ? "pointer" : "default",
                  }}
                >
                  {step > st.num ? "✓" : st.num}
                </div>
                <span style={{
                  ...s.stepLabelText,
                  color: step >= st.num ? "var(--primary)" : "var(--text-muted)",
                  fontWeight: step === st.num ? 700 : 500,
                }}>{st.label}</span>
                {i < STEPS.length - 1 && <div style={{ ...s.stepLine, background: step > st.num ? "var(--primary)" : "var(--border)" }} />}
              </div>
            ))}
          </div>

          {error && <div className="alert alert-error"><span className="alert-icon">⚠️</span><span>{error}</span></div>}
          {success && <div className="alert alert-success"><span className="alert-icon">✓</span><span>{success}</span></div>}

          <form onSubmit={(e) => e.preventDefault()}>
            {/* ===== STEP 1: Personal Data ===== */}
            {step === 1 && (
              <>
                <div className="form-group">
                  <label className="form-label">Nome <span className="required">*</span></label>
                  <input type="text" className="form-input" placeholder="O teu nome" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} disabled={loading} />
                </div>
                <div style={s.row}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Idade <span className="required">*</span></label>
                    <input type="number" className="form-input" placeholder="25" min="12" max="100" value={formData.age} onChange={(e) => handleChange("age", e.target.value)} disabled={loading} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Sexo <span className="required">*</span></label>
                    <select className="form-select" value={formData.sex} onChange={(e) => handleChange("sex", e.target.value)} disabled={loading}>
                      <option value="">Selecionar</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  </div>
                </div>
                <div style={s.row}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Altura (cm) <span className="required">*</span></label>
                    <input type="number" className="form-input" placeholder="175" min="120" max="230" value={formData.height_cm} onChange={(e) => handleChange("height_cm", e.target.value)} disabled={loading} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Peso (kg) <span className="required">*</span></label>
                    <input type="number" className="form-input" placeholder="75" min="35" max="250" step="0.1" value={formData.weight_kg} onChange={(e) => handleChange("weight_kg", e.target.value)} disabled={loading} />
                  </div>
                </div>
                {formData.height_cm && formData.weight_kg && parseInt(formData.height_cm) >= 120 && parseFloat(formData.weight_kg) >= 35 && (() => {
                  const h = parseInt(formData.height_cm) / 100;
                  const liveBMI = (parseFloat(formData.weight_kg) / (h * h));
                  const cat = getBMICategory(liveBMI);
                  const color = liveBMI < 18.5 ? "var(--p3)" : liveBMI < 25 ? "var(--p1)" : liveBMI < 30 ? "var(--p4)" : "var(--danger)";
                  return (
                    <div style={s.bmiPreview}>
                      <span style={s.bmiPreviewLabel}>IMC</span>
                      <span style={{ ...s.bmiPreviewValue, color }}>{liveBMI.toFixed(1)}</span>
                      <span style={{ ...s.bmiPreviewCat, color }}>{cat}</span>
                    </div>
                  );
                })()}
              </>
            )}

            {/* ===== STEP 2: Goals & Level ===== */}
            {step === 2 && (
              <>
                <div className="form-group">
                  <label className="form-label">Objetivo <span className="required">*</span></label>
                  <div style={s.optionGrid}>
                    {[
                      { value: "perder_gordura", label: "Perder Gordura", icon: "🔥" },
                      { value: "ganhar_massa", label: "Ganhar Massa", icon: "💪" },
                      { value: "manter", label: "Manter Forma", icon: "⚖️" },
                      { value: "melhorar_saude", label: "Melhorar Saúde", icon: "❤️" },
                      { value: "ganhar_resistencia", label: "Resistência", icon: "🏃" },
                      { value: "definicao", label: "Definição", icon: "🎯" },
                    ].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => handleChange("goal", opt.value)} style={{
                        ...s.optionCard,
                        borderColor: formData.goal === opt.value ? "var(--primary)" : "var(--border)",
                        background: formData.goal === opt.value ? "var(--primary-bg)" : "var(--card-bg)",
                      }} disabled={loading}>
                        <span style={{ fontSize: 22 }}>{opt.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: formData.goal === opt.value ? 700 : 500, color: formData.goal === opt.value ? "var(--primary)" : "var(--text-secondary)" }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Nível <span className="required">*</span></label>
                  <div style={s.optionGrid}>
                    {[
                      { value: "iniciante", label: "Iniciante", icon: "🌱" },
                      { value: "intermedio", label: "Intermédio", icon: "⚡" },
                      { value: "avancado", label: "Avançado", icon: "🏆" },
                    ].map((opt) => (
                      <button key={opt.value} type="button" onClick={() => handleChange("level", opt.value)} style={{
                        ...s.optionCard,
                        borderColor: formData.level === opt.value ? "var(--primary)" : "var(--border)",
                        background: formData.level === opt.value ? "var(--primary-bg)" : "var(--card-bg)",
                      }} disabled={loading}>
                        <span style={{ fontSize: 22 }}>{opt.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: formData.level === opt.value ? 700 : 500, color: formData.level === opt.value ? "var(--primary)" : "var(--text-secondary)" }}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Dias de treino por semana</label>
                  <div style={s.daysRow}>
                    {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                      <button key={d} type="button" onClick={() => handleChange("days_per_week", String(d))} style={{
                        ...s.dayBtn,
                        background: parseInt(formData.days_per_week) === d ? "var(--primary)" : "var(--card-bg)",
                        color: parseInt(formData.days_per_week) === d ? "white" : "var(--text-secondary)",
                        borderColor: parseInt(formData.days_per_week) === d ? "var(--primary)" : "var(--border)",
                      }} disabled={loading}>{d}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ===== STEP 3: Preferences ===== */}
            {step === 3 && (
              <>
                <div className="form-group">
                  <label className="form-label"><Leaf size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Tipo de Dieta</label>
                  <div style={s.dietGrid}>
                    {DIET_OPTIONS.map((opt) => (
                      <button key={opt.value} type="button" onClick={() => { handleChange("diet_type", opt.value); if (opt.value !== "_custom") setCustomDiet(""); }} style={{
                        ...s.dietCard,
                        borderColor: formData.diet_type === opt.value ? "var(--primary)" : "var(--border)",
                        background: formData.diet_type === opt.value ? "var(--primary-bg)" : "var(--card-bg)",
                      }} disabled={loading}>
                        <span style={{ fontSize: 14, fontWeight: formData.diet_type === opt.value ? 700 : 600, color: formData.diet_type === opt.value ? "var(--primary)" : "var(--text)" }}>{opt.label}</span>
                        <span style={{ fontSize: 11, color: formData.diet_type === opt.value ? "var(--primary)" : "var(--text-muted)" }}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                  {formData.diet_type === "_custom" && (
                    <input type="text" className="form-input" placeholder="Ex: Só como carne, sem hidratos, etc." value={customDiet} onChange={(e) => setCustomDiet(e.target.value)} disabled={loading} style={{ marginTop: 10, fontSize: 13 }} />
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label"><AlertTriangle size={14} style={{ marginRight: 4, verticalAlign: -2 }} />Alergias / Intolerâncias</label>
                  <div style={s.allergyChips}>
                    {ALLERGY_PRESETS.map((allergy) => (
                      <button key={allergy} type="button" onClick={() => toggleAllergy(allergy)} style={{
                        ...s.allergyChip,
                        background: hasAllergy(allergy) ? "var(--danger)" : "var(--card-bg)",
                        color: hasAllergy(allergy) ? "white" : "var(--text-secondary)",
                        borderColor: hasAllergy(allergy) ? "var(--danger)" : "var(--border)",
                      }} disabled={loading}>{allergy}</button>
                    ))}
                  </div>
                  <input type="text" className="form-input" placeholder="Outras alergias (separadas por vírgula)" value={formData.allergies} onChange={(e) => handleChange("allergies", e.target.value)} disabled={loading} style={{ marginTop: 8, fontSize: 13 }} />
                </div>
                <div className="form-group">
                  <AvatarPicker value={formData.avatar} onChange={(val) => handleChange("avatar", val)} />
                </div>
              </>
            )}

            {/* Navigation */}
            <div style={s.wizardNav}>
              {step > 1 && (
                <button type="button" onClick={handleBack} className="btn btn-ghost" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <ChevronLeft size={16} /> Anterior
                </button>
              )}
              <div style={{ flex: 1 }} />
              {step < 3 ? (
                <button type="button" onClick={handleNext} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  Seguinte <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {loading ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A guardar...</> : (profile ? "Guardar Alterações" : "Criar Perfil")}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ====== VIEW MODE ======
  const bmi = profile ? (profile.weight_kg / Math.pow(profile.height_cm / 100, 2)) : 0;

  return (
    <div style={s.page}>
      <div style={s.profileHeader}>
        <div style={s.avatarRing}>
          <AvatarDisplay avatar={profile?.avatar} name={profile?.name} size={80} style={{ borderRadius: 22 }} />
        </div>
        <h1 style={s.profileName}>{profile?.name}</h1>
        <p style={s.memberSinceText}><Calendar size={13} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />Membro desde {memberSince}</p>
      </div>

      {success && <div className="alert alert-success"><span className="alert-icon">✓</span><span>{success}</span></div>}

      <div style={s.infoCard}>
        {[
          { label: "Idade", value: `${profile?.age} anos` },
          { label: "Peso", value: `${profile?.weight_kg} kg` },
          { label: "Altura", value: `${profile?.height_cm} cm` },
          { label: "Sexo", value: sexLabels[profile?.sex] || profile?.sex },
          { label: "IMC", value: `${bmi.toFixed(1)} — ${getBMICategory(bmi)}`, color: bmi < 18.5 ? "var(--p3)" : bmi < 25 ? "var(--p1)" : bmi < 30 ? "var(--p4)" : "var(--danger)" },
          { label: "Objetivo", value: goalLabels[profile?.goal] || profile?.goal },
          { label: "Nível", value: levelLabels[profile?.level] || profile?.level },
          { label: "Treino", value: `${profile?.days_per_week}x por semana` },
          { label: "Dieta", value: getDietLabel(profile?.diet_type) },
          ...(profile?.allergies ? [{ label: "Alergias", value: profile.allergies }] : []),
        ].map((item, i, arr) => (
          <div key={item.label}>
            <div style={s.infoRow}>
              <span style={s.infoLabel}>{item.label}</span>
              <span style={{ ...s.infoValue, ...(item.color ? { color: item.color } : {}) }}>{item.value}</span>
            </div>
            {i < arr.length - 1 && <div style={s.infoDivider} />}
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-full" onClick={() => { setEditing(true); setStep(1); setSuccess(null); }}
        style={{ marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Edit3 size={16} strokeWidth={1.5} /> Editar Perfil
      </button>

      <button className="btn btn-ghost btn-full" onClick={() => navigate("/settings")}
        style={{ marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Settings size={16} strokeWidth={1.5} /> Definições
      </button>

      <h3 style={s.sectionTitle}>Conquistas</h3>
      <div style={s.badgesGrid}>
        {ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedKeys.has(a.key);
          return (
            <div key={a.key} style={{ ...s.badge, opacity: unlocked ? 1 : 0.35 }}>
              <Award size={24} color={unlocked ? "var(--primary)" : "var(--text-muted)"} strokeWidth={1.5} style={{ marginBottom: 6 }} />
              <span style={s.badgeLabel}>{a.label}</span>
            </div>
          );
        })}
      </div>

      <button onClick={handleLogout} style={s.logoutBtn}>
        <LogOut size={16} strokeWidth={1.5} style={{ marginRight: 8, verticalAlign: -2 }} />Terminar Sessão
      </button>
    </div>
  );
}

const gl = { bg: "var(--card-bg)", border: "1px solid var(--border)", shadow: "var(--shadow)", shadowMd: "var(--shadow-md)" };

const s = {
  page: { animation: "fadeUp 0.35s ease" },
  profileHeader: { textAlign: "center", marginBottom: 24, paddingTop: 8 },
  avatarRing: { width: 92, height: 92, borderRadius: 28, border: "3px solid var(--primary)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", padding: 3 },
  profileName: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: "0 0 4px", letterSpacing: "-0.03em" },
  memberSinceText: { fontSize: "var(--text-caption)", color: "var(--text-muted)", fontWeight: 500, margin: 0 },

  infoCard: { background: gl.bg, borderRadius: "var(--radius)", padding: "6px 20px", marginBottom: 16, boxShadow: gl.shadow, border: gl.border },
  infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0" },
  infoLabel: { fontSize: "var(--text-body)", color: "var(--text-muted)", fontWeight: 500 },
  infoValue: { fontSize: "var(--text-body)", fontWeight: 600, color: "var(--text)", textTransform: "capitalize" },
  infoDivider: { height: 1, background: "var(--border)" },

  sectionTitle: { fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: "0 0 16px", letterSpacing: "-0.02em" },
  badgesGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 32 },
  badge: { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 8px", background: gl.bg, borderRadius: "var(--radius-sm)", boxShadow: gl.shadow, transition: "opacity 0.3s", border: gl.border },
  badgeLabel: { fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", textAlign: "center" },
  logoutBtn: { width: "100%", padding: "14px", borderRadius: "var(--radius-sm)", background: "var(--card-bg)", border: gl.border, color: "var(--text-muted)", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all 0.25s", marginBottom: 16, boxShadow: "var(--shadow)" },

  formCard: { background: gl.bg, borderRadius: "var(--radius)", padding: "24px 20px", boxShadow: gl.shadowMd, border: gl.border },
  formHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--glass-border)" },
  formHeaderTitle: { fontSize: "var(--text-h2)", fontWeight: 800, color: "var(--text)", margin: 0, letterSpacing: "-0.02em" },
  formClose: { width: 34, height: 34, borderRadius: 12, background: "var(--card-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "var(--text-muted)", cursor: "pointer", border: gl.border, boxShadow: "var(--shadow)", transition: "background 0.15s" },

  stepIndicator: { display: "flex", alignItems: "center", justifyContent: "center", gap: 0, marginBottom: 24, padding: "0 4px" },
  stepDot: { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, transition: "all 0.3s", flexShrink: 0 },
  stepLabelText: { fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", marginLeft: 4, transition: "color 0.3s" },
  stepLine: { width: 20, height: 2, borderRadius: 1, marginLeft: 6, marginRight: 6, transition: "background 0.3s" },

  wizardNav: { display: "flex", alignItems: "center", gap: 8, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" },

  bmiPreview: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", marginBottom: 12, borderRadius: 12, background: "var(--bg-subtle, rgba(139,109,78,0.04))", border: "1px solid var(--border)" },
  bmiPreviewLabel: { fontSize: 12, fontWeight: 700, color: "var(--text-muted)" },
  bmiPreviewValue: { fontSize: 18, fontWeight: 700 },
  bmiPreviewCat: { fontSize: 12, fontWeight: 600 },
  row: { display: "flex", gap: 12 },
  optionGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  optionCard: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, padding: "16px 8px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", cursor: "pointer", transition: "border-color 0.15s, background 0.15s", minHeight: 52, boxShadow: "var(--shadow)" },
  daysRow: { display: "flex", gap: 8, justifyContent: "space-between" },
  dayBtn: { width: 42, height: 42, borderRadius: "50%", border: "2px solid var(--glass-border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "background 0.15s", boxShadow: "var(--shadow)" },
  dietGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  dietCard: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "16px 10px", borderRadius: "var(--radius-sm)", border: "1.5px solid var(--border)", cursor: "pointer", transition: "border-color 0.15s, background 0.15s", boxShadow: "var(--shadow)" },
  allergyChips: { display: "flex", flexWrap: "wrap", gap: 8 },
  allergyChip: { padding: "8px 14px", borderRadius: 20, border: "1.5px solid var(--border)", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s" },
};
