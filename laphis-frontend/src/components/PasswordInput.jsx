import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

/**
 * Reusable password input field with show/hide toggle and optional strength meter.
 *
 * @param {Object}   props
 * @param {string}   props.label          - Field label text.
 * @param {string}   props.value          - Controlled input value.
 * @param {Function} props.onChange        - Callback receiving the new string value.
 * @param {string}   [props.placeholder]  - Input placeholder.
 * @param {boolean}  [props.disabled]     - Whether the input is disabled.
 * @param {string}   [props.autoComplete] - HTML autocomplete attribute.
 * @param {boolean}  [props.showIcon]     - Whether to show the Lock icon in the label.
 * @param {boolean}  [props.showStrength] - Whether to show a password strength meter.
 */
export default function PasswordInput({
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  disabled = false,
  autoComplete = "current-password",
  showIcon = true,
  showStrength = false,
}) {
  const [visible, setVisible] = useState(false);

  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: "", color: "transparent" };
    let score = 0;
    if (pw.length >= 4) score++;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { level: 1, label: "Fraca", color: "var(--danger, #e74c3c)" };
    if (score <= 2) return { level: 2, label: "Razoável", color: "var(--p4, #f59e0b)" };
    if (score <= 3) return { level: 3, label: "Boa", color: "var(--p2, #22c55e)" };
    return { level: 4, label: "Forte", color: "var(--p1, #10b981)" };
  };

  const strength = showStrength ? getStrength(value) : null;

  return (
    <div className="form-group">
      <label
        className="form-label"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        {showIcon && <Lock size={16} strokeWidth={1.5} />}
        {label}
      </label>
      <div style={styles.wrapper}>
        <input
          type={visible ? "text" : "password"}
          className="form-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoComplete={autoComplete}
          style={{ paddingRight: 40 }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{
            ...styles.toggle,
            cursor: disabled ? "not-allowed" : "pointer",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {visible ? (
            <EyeOff size={18} strokeWidth={1.5} color="var(--text-muted)" />
          ) : (
            <Eye size={18} strokeWidth={1.5} color="var(--text-muted)" />
          )}
        </button>
      </div>
      {showStrength && value && (
        <div style={styles.strengthWrap}>
          <div style={styles.strengthTrack}>
            {[1, 2, 3, 4].map((n) => (
              <div key={n} style={{
                ...styles.strengthBar,
                background: n <= strength.level ? strength.color : "var(--border)",
              }} />
            ))}
          </div>
          <span style={{ ...styles.strengthLabel, color: strength.color }}>{strength.label}</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  toggle: {
    position: "absolute",
    right: 12,
    background: "none",
    border: "none",
    padding: 4,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "opacity 0.2s",
  },
  strengthWrap: {
    display: "flex", alignItems: "center", gap: 8, marginTop: 6,
  },
  strengthTrack: {
    display: "flex", gap: 3, flex: 1,
  },
  strengthBar: {
    height: 3, flex: 1, borderRadius: 2,
    transition: "background 0.25s",
  },
  strengthLabel: {
    fontSize: 11, fontWeight: 600, whiteSpace: "nowrap",
  },
};
