import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { Mail, Lock, User } from "lucide-react";

const GOALS = [
  { value: "perder_gordura", label: "Perder Gordura" },
  { value: "ganhar_massa", label: "Ganhar Massa" },
  { value: "manter", label: "Manter Forma" },
];

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Preenche o email");
    if (password.length < 4) return setError("Password mínimo 4 caracteres");
    if (password !== confirm) return setError("As passwords não coincidem");

    try {
      setLoading(true);
      setError(null);
      const result = await ApiService.register(email.trim(), password);
      localStorage.setItem('authToken', result.access_token);
      localStorage.setItem('userEmail', result.email);
      toast.success("Conta criada! Verifica o teu email");
      navigate("/verify-email", { state: { email: email.trim() } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao criar conta";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.brand}>
          <div style={s.logo}>L</div>
          <h1 style={s.title}>Criar Conta</h1>
          <p style={s.subtitle}>Começa a tua jornada</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Mail size={16} strokeWidth={1.5} />
              Email
            </label>
            <input
              type="email" className="form-input"
              placeholder="o-teu@email.com" value={email}
              onChange={(e) => { setEmail(e.target.value); setError(null); }}
              disabled={loading} autoComplete="email"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={16} strokeWidth={1.5} />
              Password
            </label>
            <input
              type="password" className="form-input"
              placeholder="Mínimo 4 caracteres" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              disabled={loading} autoComplete="new-password"
            />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Lock size={16} strokeWidth={1.5} />
              Confirmar Password
            </label>
            <input
              type="password" className="form-input"
              placeholder="Repete a password" value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null); }}
              disabled={loading} autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Objetivo (opcional)</label>
            <div style={s.goalGrid}>
              {GOALS.map((g) => (
                <button
                  key={g.value} type="button"
                  onClick={() => setGoal(goal === g.value ? "" : g.value)}
                  style={{
                    ...s.goalCard,
                    borderColor: goal === g.value ? "var(--accent-sport)" : "var(--border)",
                    background: goal === g.value ? "rgba(181, 113, 77, 0.1)" : "var(--bg-subtle)",
                  }}
                  disabled={loading}
                >
                  <span style={{
                    fontSize: 13, fontWeight: goal === g.value ? 700 : 500,
                    color: goal === g.value ? "var(--accent-sport)" : "var(--text-secondary)",
                  }}>{g.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A criar...</>
            ) : (
              "Criar Conta"
            )}
          </button>
        </form>

        <p style={s.link}>
          Já tens conta? <Link to="/login" style={s.linkAccent}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "24px",
    background: "var(--bg)",
    animation: "fadeUp 0.35s ease",
  },
  container: {
    width: "100%", maxWidth: 400,
    background: "var(--card-bg)", borderRadius: 20,
    padding: "32px 24px", boxShadow: "var(--shadow-md)",
    border: "1px solid var(--border)",
  },
  brand: { textAlign: "center", marginBottom: 28 },
  logo: {
    width: 56, height: 56, borderRadius: 16,
    background: "var(--gradient-primary)", color: "#FFFFFF",
    fontSize: 22, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    boxShadow: "0 4px 12px rgba(181, 113, 77, 0.15)",
  },
  title: { fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" },
  subtitle: { fontSize: 14, color: "var(--text-secondary)", margin: 0, fontWeight: 500 },

  goalGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 },
  goalCard: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", gap: 6, padding: "14px 8px",
    borderRadius: 14, border: "1.5px solid var(--border)",
    cursor: "pointer", transition: "all 0.25s",
  },

  link: {
    textAlign: "center", fontSize: 14, color: "var(--text-secondary)",
    marginTop: 24, fontWeight: 500,
  },
  linkAccent: {
    color: "var(--accent-sport)", fontWeight: 700, textDecoration: "none",
  },
};
