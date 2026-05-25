import { useNavigate } from "react-router-dom";
import { Bot, TrendingUp, Zap, Wind, Dumbbell, Leaf } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div style={s.page}>
      <div style={s.inner}>
        {/* Hero */}
        <div style={s.hero}>
          <div style={s.brand}>
            <div style={s.logoCircle}><Leaf size={26} strokeWidth={2.2} color="#fff" /></div>
            <h1 style={s.brandName}>LAPHIS</h1>
          </div>
          <p style={s.tagline}>O teu coach de fitness pessoal com inteligência artificial</p>
        </div>

        {/* Features */}
        <div style={s.features}>
          {[
            { icon: Bot, title: "Coach AI", desc: "Planos e conselhos personalizados com IA", color: "var(--primary)", bg: "var(--primary-bg)" },
            { icon: Dumbbell, title: "Tracking", desc: "Regista treinos, refeições e vê o progresso", color: "var(--p2)", bg: "var(--cta-bg)" },
            { icon: Wind, title: "Bem-estar", desc: "Meditação, respiração e equilíbrio zen", color: "var(--p3)", bg: "var(--primary-bg)" },
          ].map((f, i) => {
            const IconComponent = f.icon;
            return (
              <div key={i} style={s.featureCard}>
                <div style={{ ...s.featureIconWrap, background: f.bg }}>
                  <IconComponent size={24} color={f.color} strokeWidth={1.8} />
                </div>
                <div>
                  <h3 style={s.featureTitle}>{f.title}</h3>
                  <p style={s.featureDesc}>{f.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div style={s.ctaArea}>
          <button className="btn btn-primary btn-full" onClick={() => navigate("/register")}>
            Começar Agora
          </button>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => navigate("/login")}
          >
            Já tenho conta
          </button>
        </div>

        <p style={s.footer}>Feito para quem treina a sério</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    height: "100dvh",
    maxHeight: "100dvh",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
    background: "var(--bg)",
    animation: "fadeUp 0.4s ease",
    boxSizing: "border-box",
  },
  inner: {
    margin: "auto",
    width: "100%", maxWidth: 440,
    padding: "24px 24px",
    boxSizing: "border-box",
  },
  hero: { textAlign: "center", marginBottom: 22 },
  brand: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 12,
  },
  logoCircle: {
    width: 56, height: 56, borderRadius: 16,
    background: "var(--gradient-primary)", color: "#FFFFFF",
    fontSize: 24, fontWeight: 700,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "var(--btn-primary-shadow)",
  },
  brandName: {
    fontSize: "var(--text-h1)", fontWeight: 800, letterSpacing: 4,
    color: "var(--text)", margin: 0,
    fontFamily: "'Clash Display', sans-serif",
  },
  tagline: {
    fontSize: "var(--text-body)", color: "var(--text-secondary)", fontWeight: 500,
    lineHeight: 1.5, maxWidth: 300, margin: "0 auto",
  },

  features: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 22 },
  featureCard: {
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 16px", background: "var(--card-bg)",
    borderRadius: 16, boxShadow: "var(--shadow)",
    border: "1px solid var(--border)",
  },
  featureIconWrap: {
    width: 44, height: 44, borderRadius: 12, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  featureIcon: { fontSize: 14, fontWeight: 700, color: "var(--primary)", flexShrink: 0,
    width: 40, height: 40, borderRadius: 12, background: "var(--primary-bg)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  featureTitle: { fontSize: "var(--text-h3)", fontWeight: 700, color: "var(--text)", margin: "0 0 4px", letterSpacing: "-0.02em" },
  featureDesc: { fontSize: "var(--text-body)", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 },

  ctaArea: { display: "flex", flexDirection: "column", gap: 14 },

  footer: {
    textAlign: "center", fontSize: "var(--text-caption)", color: "var(--text-muted)",
    marginTop: 16, fontWeight: 500,
  },
};
