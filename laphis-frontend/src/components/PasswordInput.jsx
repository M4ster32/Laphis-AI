import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

/**
 * Reusable password input field with show/hide toggle.
 * Extracted from Login, Register and ResetPassword to follow DRY.
 *
 * @param {Object}   props
 * @param {string}   props.label          - Field label text.
 * @param {string}   props.value          - Controlled input value.
 * @param {Function} props.onChange        - Callback receiving the new string value.
 * @param {string}   [props.placeholder]  - Input placeholder.
 * @param {boolean}  [props.disabled]     - Whether the input is disabled.
 * @param {string}   [props.autoComplete] - HTML autocomplete attribute.
 * @param {boolean}  [props.showIcon]     - Whether to show the Lock icon in the label.
 */
export default function PasswordInput({
  label = "Password",
  value,
  onChange,
  placeholder = "••••••••",
  disabled = false,
  autoComplete = "current-password",
  showIcon = true,
}) {
  const [visible, setVisible] = useState(false);

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
};
