import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { useApp } from "../contexts/AppContext";
import PasswordInput from "../components/PasswordInput";
import { Mail, Leaf } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { loadMyProfile } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
      // Refrescar o contexto com a conta nova (perfil ainda não existe → null),
      // senão fica em memória o perfil do utilizador anterior.
      await loadMyProfile();
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
          <div style={s.logo}><Leaf size={26} strokeWidth={2.2} color="#fff" /></div>
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
            {email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
              <span style={{ fontSize: 11, color: "var(--danger, #e74c3c)", marginTop: 4, display: "block" }}>Email inválido</span>
            )}
          </div>
          <PasswordInput
            label="Password"
            value={password}
            onChange={(v) => { setPassword(v); setError(null); }}
            placeholder="Mínimo 4 caracteres"
            disabled={loading}
            autoComplete="new-password"
            showStrength
          />
          <PasswordInput
            label="Confirmar Password"
            value={confirm}
            onChange={(v) => { setConfirm(v); setError(null); }}
            placeholder="Repete a password"
            disabled={loading}
            autoComplete="new-password"
          />
          {confirm && password !== confirm && (
            <span style={{ fontSize: 11, color: "var(--danger, #e74c3c)", marginTop: -8, marginBottom: 8, display: "block" }}>As passwords não coincidem</span>
          )}

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
    background: "var(--card-bg)", borderRadius: 22,
    padding: "36px 26px", boxShadow: "var(--shadow-md)",
    border: "1px solid var(--border)",
  },
  brand: { textAlign: "center", marginBottom: 32 },
  logo: {
    width: 56, height: 56, borderRadius: 16,
    background: "var(--gradient-primary)", color: "#FFFFFF",
    fontSize: 22, fontWeight: 700,
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    boxShadow: "0 4px 12px var(--btn-primary-shadow)",
  },
  title: { fontSize: "var(--text-h1)", fontWeight: 800, color: "var(--text)", margin: "0 0 6px", letterSpacing: "-0.03em" },
  subtitle: { fontSize: "var(--text-body)", color: "var(--text-secondary)", margin: 0, fontWeight: 500 },

  link: {
    textAlign: "center", fontSize: 14, color: "var(--text-secondary)",
    marginTop: 24, fontWeight: 500,
  },
  linkAccent: {
    color: "var(--accent-sport)", fontWeight: 700, textDecoration: "none",
  },
};
