import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import ApiService from "../services/api";
import { Mail, ArrowLeft, Leaf } from "lucide-react";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Preenche o email");

    try {
      setLoading(true);
      setError(null);
      await ApiService.forgotPassword(email.trim());
      setSent(true);
      // Navegar para reset-password passando o email
      setTimeout(() => {
        navigate("/reset-password", { state: { email: email.trim() } });
      }, 2000);
    } catch (err) {
      setError(err.message || "Erro ao enviar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.brand}>
          <div style={s.logo}><Leaf size={26} strokeWidth={2.2} color="#fff" /></div>
          <h1 style={s.title}>Recuperar Password</h1>
          <p style={s.subtitle}>
            Introduz o teu email e enviaremos um código para redefinires a password
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {sent ? (
          <div style={s.sentBox}>
            <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
              Email enviado!
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: 0 }}>
              Verifica a tua caixa de entrada para o código de recuperação.
              A redirecionar...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={16} strokeWidth={1.5} />
                Email da conta
              </label>
              <input
                type="email" className="form-input"
                placeholder="o-teu@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null); }}
                disabled={loading} autoComplete="email" autoFocus
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
              {loading ? (
                <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A enviar...</>
              ) : (
                "Enviar Código"
              )}
            </button>
          </form>
        )}

        <p style={s.link}>
          <Link to="/login" style={s.linkAccent}>← Voltar ao Login</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", padding: "24px",
    background: "var(--bg)", animation: "fadeUp 0.35s ease",
  },
  container: {
    width: "100%", maxWidth: 400,
    background: "var(--card-bg)", borderRadius: "var(--radius)",
    padding: "32px 24px", boxShadow: "var(--shadow-md)",
    border: "1px solid var(--border)",
  },
  brand: { textAlign: "center", marginBottom: 28 },
  logo: { fontSize: 22, fontWeight: 700, color: "var(--primary)", marginBottom: 16, display: "block",
    width: 48, height: 48, borderRadius: 14, background: "var(--gradient-primary)", color: "white",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px var(--btn-primary-shadow)",
  },
  title: { fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" },
  subtitle: { fontSize: 14, color: "var(--text-secondary)", margin: 0, fontWeight: 500 },

  sentBox: {
    textAlign: "center", padding: "24px",
    background: "var(--primary-bg)", borderRadius: "var(--radius-sm)",
    boxShadow: "var(--shadow)",
    border: "1px solid var(--border)",
  },

  link: {
    textAlign: "center", fontSize: 14, color: "var(--text-secondary)",
    marginTop: 24, fontWeight: 500,
  },
  linkAccent: {
    color: "var(--primary)", fontWeight: 700, textDecoration: "none",
  },
};
