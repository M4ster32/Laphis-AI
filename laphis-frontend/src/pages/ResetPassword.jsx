import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import ApiService from "../services/api";
import PasswordInput from "../components/PasswordInput";

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedEmail = location.state?.email || "";

  const [email, setEmail] = useState(passedEmail);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const inputsRef = useRef([]);

  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);
    if (value && index < 5) inputsRef.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const newCode = [...code];
    for (let i = 0; i < 6; i++) newCode[i] = pasted[i] || "";
    setCode(newCode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const codeStr = code.join("");
    if (!email.trim()) return setError("Preenche o email");
    if (codeStr.length !== 6) return setError("Introduz os 6 dígitos");
    if (newPassword.length < 4) return setError("Password mínimo 4 caracteres");
    if (newPassword !== confirmPassword) return setError("As passwords não coincidem");

    try {
      setLoading(true);
      setError(null);
      await ApiService.resetPassword(email.trim(), codeStr, newPassword);
      setSuccess(true);
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setError(err.message || "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" }}>
              Password atualizada!
            </h2>
            <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: 0 }}>
              A redirecionar para o login...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.brand}>
          <div style={s.logo}>L</div>
          <h1 style={s.title}>Nova Password</h1>
          <p style={s.subtitle}>
            Introduz o código que recebeste por email e a nova password
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email (if not passed) */}
          {!passedEmail && (
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email" className="form-input"
                placeholder="o-teu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading} autoComplete="email"
              />
            </div>
          )}

          {/* Code */}
          <div className="form-group">
            <label className="form-label">Código de recuperação</label>
            <div style={s.codeRow} onPaste={handlePaste}>
              {code.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (inputsRef.current[i] = el)}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  disabled={loading}
                  style={{
                    ...s.codeInput,
                    borderColor: digit ? "var(--primary)" : "var(--border)",
                    background: digit ? "var(--primary-bg)" : "var(--card-bg)",
                  }}
                  autoFocus={i === 0}
                />
              ))}
            </div>
          </div>

          {/* New password */}
          <PasswordInput
            label="Nova Password"
            value={newPassword}
            onChange={(v) => { setNewPassword(v); setError(null); }}
            placeholder="Mínimo 4 caracteres"
            disabled={loading}
            autoComplete="new-password"
          />
          <PasswordInput
            label="Confirmar Password"
            value={confirmPassword}
            onChange={(v) => { setConfirmPassword(v); setError(null); }}
            placeholder="Repete a password"
            disabled={loading}
            autoComplete="new-password"
          />

          <button type="submit" disabled={loading} className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A atualizar...</>
            ) : (
              "Redefinir Password"
            )}
          </button>
        </form>

        <p style={s.link}>
          Não recebeste o código?{" "}
          <Link to="/forgot-password" style={s.linkAccent}>Pedir novamente</Link>
        </p>
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
  logo: {
    fontSize: 22, fontWeight: 700, marginBottom: 16,
    width: 48, height: 48, borderRadius: 14, background: "var(--gradient-primary)", color: "white",
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px var(--btn-primary-shadow)",
  },
  title: { fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" },
  subtitle: { fontSize: 14, color: "var(--text-secondary)", margin: 0, fontWeight: 500 },

  codeRow: {
    display: "flex", gap: 8, justifyContent: "center",
  },
  codeInput: {
    width: 44, height: 52, textAlign: "center",
    fontSize: 22, fontWeight: 700, borderRadius: "var(--radius-sm)",
    border: "2px solid var(--border)", outline: "none",
    transition: "all 0.2s", color: "var(--text)",
  },

  link: {
    textAlign: "center", fontSize: 14, color: "var(--text-secondary)",
    marginTop: 16, fontWeight: 500,
  },
  linkAccent: {
    color: "var(--primary)", fontWeight: 700, textDecoration: "none",
  },
};
