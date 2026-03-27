import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ApiService from "../services/api";
import { useToast } from "../components/Toast";
import { useApp } from "../contexts/AppContext";
import { Mail, Lock } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const toast = useToast();
  const { loadMyProfile } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      return setError("Preenche o email e a password");
    }
    try {
      setLoading(true);
      setError(null);
      const result = await ApiService.login(email.trim(), password);
      localStorage.setItem('authToken', result.access_token);
      localStorage.setItem('userEmail', result.email);
      // Carregar perfil imediatamente após login
      await loadMyProfile();
      toast.success("Login efetuado com sucesso!");
      if (!result.email_verified) {
        navigate("/verify-email", { state: { email: result.email } });
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao entrar. Verifica os dados.";
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
          <h1 style={s.title}>Entrar</h1>
          <p style={s.subtitle}>Bem-vindo de volta</p>
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
              placeholder="o-teu@email.com"
              value={email}
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
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }}
              disabled={loading} autoComplete="current-password"
            />
          </div>
          <div style={{ textAlign: "right", marginTop: -4, marginBottom: 8 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: "var(--accent-sport)", fontWeight: 600, textDecoration: "none" }}>
              Esqueceste a password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A entrar...</>
            ) : (
              "Entrar"
            )}
          </button>
        </form>

        <p style={s.link}>
          Não tens conta? <Link to="/register" style={s.linkAccent}>Criar conta</Link>
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
    boxShadow: "0 4px 12px var(--btn-primary-shadow)",
  },
  title: { fontSize: 22, fontWeight: 700, color: "var(--text)", margin: "0 0 6px" },
  subtitle: { fontSize: 14, color: "var(--text-secondary)", margin: 0, fontWeight: 500 },
  link: {
    textAlign: "center", fontSize: 14, color: "var(--text-secondary)",
    marginTop: 24, fontWeight: 500,
  },
  linkAccent: {
    color: "var(--accent-sport)", fontWeight: 700, textDecoration: "none",
  },
};
