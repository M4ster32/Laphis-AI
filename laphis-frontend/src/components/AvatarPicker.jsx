import { useState, useRef } from "react";
import {
  User, Smile, Heart, Star, Flame, Mountain, Music, Coffee, Zap, Crown, Plus, X, Check, ImagePlus, Upload,
} from "lucide-react";

/**
 * 10 preset avatars — each has a unique icon + gradient
 */
const PRESETS = [
  { id: "preset_1",  icon: User,     bg: "var(--gradient-primary)", label: "Classic" },
  { id: "preset_2",  icon: Smile,    bg: "var(--gradient-zen)", label: "Happy" },
  { id: "preset_3",  icon: Heart,    bg: "linear-gradient(135deg, #E0607E, #F08DA0)", label: "Heart" },
  { id: "preset_4",  icon: Star,     bg: "var(--gradient-nutrition)", label: "Star" },
  { id: "preset_5",  icon: Flame,    bg: "linear-gradient(135deg, var(--danger), #F87171)", label: "Fire" },
  { id: "preset_6",  icon: Mountain, bg: "linear-gradient(135deg, #2E7D32, #4CAF50)", label: "Nature" },
  { id: "preset_7",  icon: Music,    bg: "linear-gradient(135deg, #1976D2, #42A5F5)", label: "Music" },
  { id: "preset_8",  icon: Coffee,   bg: "linear-gradient(135deg, #795548, #A1887F)", label: "Coffee" },
  { id: "preset_9",  icon: Zap,      bg: "var(--gradient-cta)", label: "Energy" },
  { id: "preset_10", icon: Crown,    bg: "linear-gradient(135deg, #7C3AED, #A78BFA)", label: "Royal" },
];

/**
 * Get the preset data by id
 */
export function getPreset(avatarValue) {
  return PRESETS.find((p) => p.id === avatarValue) || null;
}

/**
 * Check if a value is a custom URL (not a preset)
 */
export function isCustomAvatar(avatarValue) {
  if (!avatarValue) return false;
  return !avatarValue.startsWith("preset_");
}

/**
 * Render an avatar given a value + name fallback
 * Use this everywhere you need to display the user's avatar
 */
export function AvatarDisplay({ avatar, name, size = 48, style = {} }) {
  const preset = getPreset(avatar);
  const isCustom = isCustomAvatar(avatar);
  const radius = Math.round(size * 0.32);

  if (isCustom && avatar) {
    return (
      <div
        style={{
          width: size, height: size, borderRadius: radius,
          overflow: "hidden", flexShrink: 0,
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          ...style,
        }}
      >
        <img
          src={avatar}
          alt={name || "Avatar"}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      </div>
    );
  }

  if (preset) {
    const IconComp = preset.icon;
    return (
      <div
        style={{
          width: size, height: size, borderRadius: radius,
          background: preset.bg, color: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.12)", flexShrink: 0,
          ...style,
        }}
      >
        <IconComp size={Math.round(size * 0.45)} strokeWidth={1.8} />
      </div>
    );
  }

  // Fallback — initial letter
  return (
    <div
      style={{
        width: size, height: size, borderRadius: radius,
        background: "var(--gradient-primary)", color: "#fff",
        fontSize: Math.round(size * 0.42), fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px var(--btn-primary-shadow)", flexShrink: 0,
        ...style,
      }}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

/**
 * Avatar picker grid — 10 presets + custom file upload / URL "+"
 */
export default function AvatarPicker({ value, onChange }) {
  const [showCustom, setShowCustom] = useState(false);
  const [customUrl, setCustomUrl] = useState(isCustomAvatar(value) ? value : "");
  const [previewError, setPreviewError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handlePresetSelect = (presetId) => {
    setShowCustom(false);
    onChange(presetId);
  };

  const handleCustomConfirm = () => {
    if (customUrl.trim()) {
      onChange(customUrl.trim());
      setShowCustom(false);
    }
  };

  const handleCustomClear = () => {
    setCustomUrl("");
    setPreviewError(false);
    onChange(null);
    setShowCustom(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size (max 2MB)
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Imagem demasiado grande. Máximo 2MB.");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setCustomUrl(dataUrl);
      onChange(dataUrl);
      setPreviewError(false);
      setUploading(false);
      setShowCustom(true);
    };
    reader.onerror = () => {
      setUploading(false);
    };
    reader.readAsDataURL(file);

    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div style={s.wrapper}>
      <label style={s.label}>Escolhe o teu avatar ou carrega uma foto</label>

      <div style={s.grid}>
        {PRESETS.map((preset) => {
          const IconComp = preset.icon;
          const isSelected = value === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              style={{
                ...s.option,
                background: preset.bg,
                border: isSelected ? "3px solid var(--primary)" : "3px solid transparent",
                transform: isSelected ? "scale(1.08)" : "scale(1)",
                boxShadow: isSelected
                  ? "0 4px 16px var(--btn-primary-hover-shadow)"
                  : "0 2px 6px rgba(0,0,0,0.08)",
              }}
              title={preset.label}
            >
              <IconComp size={24} strokeWidth={1.8} color="#fff" />
              {isSelected && (
                <div style={s.checkBadge}>
                  <Check size={10} strokeWidth={3} color="#fff" />
                </div>
              )}
            </button>
          );
        })}

        {/* Custom "+" button */}
        <button
          type="button"
          onClick={() => {
            if (!showCustom) fileInputRef.current?.click();
            else setShowCustom(!showCustom);
          }}
          style={{
            ...s.option,
            background: isCustomAvatar(value)
              ? "var(--primary)"
              : "var(--bg)",
            border: isCustomAvatar(value)
              ? "3px solid var(--primary)"
              : showCustom
                ? "3px solid var(--primary)"
                : "3px solid transparent",
          }}
          title="Carregar foto"
        >
          {isCustomAvatar(value) ? (
            <img
              src={value}
              alt="Custom"
              style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }}
              onError={(e) => { e.target.style.display = "none"; }}
            />
          ) : uploading ? (
            <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          ) : (
            <Upload
              size={22}
              strokeWidth={1.5}
              color={showCustom ? "var(--primary)" : "var(--text-muted)"}
            />
          )}
          {isCustomAvatar(value) && (
            <div style={s.checkBadge}>
              <Check size={10} strokeWidth={3} color="#fff" />
            </div>
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: "none" }}
        />
      </div>

      {/* Custom photo panel */}
      {showCustom && isCustomAvatar(value) && (
        <div style={s.customPanel}>
          {/* Preview */}
          {value && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={s.previewBox}>
                <img
                  src={value}
                  alt="Preview"
                  style={s.previewImg}
                  onError={() => setPreviewError(true)}
                  onLoad={() => setPreviewError(false)}
                />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)" }}>Foto carregada ✓</span>
            </div>
          )}
          <div style={s.customActions}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: "8px 14px", fontSize: 13 }}
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />
              Trocar foto
            </button>
            <button
              type="button"
              style={s.clearBtn}
              onClick={handleCustomClear}
            >
              <X size={14} strokeWidth={1.5} style={{ marginRight: 4, verticalAlign: -2 }} />
              Remover
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  wrapper: { marginBottom: 8 },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "var(--text)", marginBottom: 10,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(6, 1fr)",
    gap: 10,
  },
  option: {
    width: "100%",
    aspectRatio: "1",
    borderRadius: 14,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s ease",
    position: "relative",
    overflow: "hidden",
    padding: 0,
  },
  checkBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 18, height: 18, borderRadius: "50%",
    background: "var(--primary)",
    display: "flex", alignItems: "center", justifyContent: "center",
    border: "2px solid #fff",
  },
  customPanel: {
    marginTop: 12,
    padding: "14px 16px",
    background: "var(--bg)",
    borderRadius: "var(--radius-sm)",
    border: "1px solid var(--border)",
  },
  customHint: {
    fontSize: 12, color: "var(--text-muted)", fontWeight: 500,
    margin: "0 0 10px",
  },
  customInputRow: {
    display: "flex", gap: 8, marginBottom: 10,
  },
  customActions: {
    display: "flex", gap: 8, alignItems: "center",
  },
  clearBtn: {
    padding: "8px 14px", borderRadius: 8,
    background: "var(--card-bg)", border: "1px solid var(--border)",
    fontSize: 13, fontWeight: 500, color: "var(--text-muted)",
    cursor: "pointer", display: "flex", alignItems: "center",
  },
  previewBox: {
    width: 64, height: 64, borderRadius: 16,
    overflow: "hidden", marginBottom: 10,
    border: "2px solid var(--border)",
  },
  previewImg: {
    width: "100%", height: "100%", objectFit: "cover", display: "block",
  },
  errorText: {
    fontSize: 12, color: "var(--danger)", fontWeight: 500, margin: "0 0 10px",
  },
};
