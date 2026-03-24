import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import ApiService from "../services/api";
import { Mail, CheckCircle } from "lucide-react";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef([]);

  // Redirect if no email
  useEffect(() => {
    if (!email) navigate("/register", { replace: true });
  }, [email, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // only digits
    const newCode = [...code];
    newCode[index] = value.slice(-1); // only last char
    setCode(newCode);
    setError(null);

    // Auto-focus next
    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (newCode.every((d) => d !== "")) {
      handleSubmit(null, newCode.join(""));
    }
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
    if (pasted.length === 6) handleSubmit(null, pasted);
  };

  const handleSubmit = async (e, codeStr) => {
    if (e) e.preventDefault();
    const finalCode = codeStr || code.join("");
    if (finalCode.length !== 6) return setError("Introduz os 6 dígitos");

    try {
      setLoading(true);
      setError(null);
      await ApiService.verifyEmail(email, finalCode);
      setSuccess("Email verificado com sucesso!");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
    } catch (err) {
      setError(err.message || "Código inválido");
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      setResending(true);
      setError(null);
      const res = await ApiService.resendVerificationCode(email);
      setSuccess(res.message || "Novo código enviado!");
      setCooldown(60);
      setCode(["", "", "", "", "", ""]);
      inputsRef.current[0]?.focus();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.logo}>L</div>
          <h1 style={s.title}>Verifica o teu Email</h1>
          <p style={{ ...s.subtitle, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            <Mail size={18} strokeWidth={1.5} />
            Enviámos um código para
          </p>
          <p style={s.email}>{email}</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ background: "var(--primary-bg)", border: "1px solid rgba(181, 113, 77, 0.2)", color: "var(--alert-success-text)" }}>
            <span>{success}</span>
          </div>
        )}

        {/* Code inputs */}
        <form onSubmit={handleSubmit}>
          <div style={s.codeRow} onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading || !!success}
                style={{
                  ...s.codeInput,
                  borderColor: digit ? "var(--primary)" : "var(--border)",
                  background: digit ? "rgba(181, 113, 77, 0.1)" : "var(--card-bg)",
                }}
                autoFocus={i === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading || code.some((d) => !d) || !!success}
            className="btn btn-primary btn-full"
            style={{ marginTop: 20 }}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> A verificar...</>
            ) : success ? (
              "Verificado!"
            ) : (
              "Verificar Email"
            )}
          </button>
        </form>

        {/* Resend */}
        <div style={s.resend}>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "0 0 8px" }}>
            Não recebeste o código?
          </p>
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0 || !!success}
            style={s.resendBtn}
          >
            {resending
              ? "A enviar..."
              : cooldown > 0
              ? `Reenviar em ${cooldown}s`
              : "Reenviar código"}
          </button>
        </div>

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
    boxShadow: "0 4px 12px rgba(181, 113, 77, 0.15)",
  },
  title: { fontSize: 20, fontWeight: 700, color: "var(--text)", margin: "0 0 8px" },
  subtitle: { fontSize: 14, color: "var(--text-secondary)", margin: "0 0 4px", fontWeight: 500 },
  email: { fontSize: 14, color: "var(--primary)", fontWeight: 700, margin: 0 },

  codeRow: {
    display: "flex", gap: 8, justifyContent: "center", margin: "24px 0 0",
  },
  codeInput: {
    width: 48, height: 56, textAlign: "center",
    fontSize: 24, fontWeight: 700, borderRadius: "var(--radius-sm)",
    border: "2px solid var(--border)", outline: "none",
    transition: "all 0.2s", color: "var(--text)",
  },

  resend: { textAlign: "center", marginTop: 24 },
  resendBtn: {
    background: "none", border: "none", color: "var(--primary)",
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    textDecoration: "underline",
  },

  link: {
    textAlign: "center", fontSize: 14, color: "var(--text-secondary)",
    marginTop: 20, fontWeight: 500,
  },
  linkAccent: {
    color: "var(--primary)", fontWeight: 700, textDecoration: "none",
  },
};
