import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import { Home, Dumbbell, ClipboardList, User, Leaf, Bot } from "lucide-react";
import MonsterLogo from "../components/MonsterLogo";
import "./layout.css";

const NAV_LEFT = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/plans", label: "Planos", icon: Dumbbell },
];

const NAV_RIGHT = [
  { to: "/logs", label: "Registos", icon: ClipboardList },
  { to: "/zen", label: "Zen", icon: Leaf },
];

/**
 * Pick a page-transition variant based on the destination path so that
 * navigation *feels* spatial: drilling into detail screens uses a
 * horizontal slide (drill); swapping between top-level tabs uses the
 * default soft lift; chat uses a pure fade (it is its own full-height
 * context and a slide would compete with the message list animation).
 *
 * @param {string} pathname - Current location pathname.
 * @returns {string} Class name to apply to the transition wrapper.
 */
function resolveTransitionClass(pathname) {
  if (pathname === "/chat") return "page-transition page-transition--fade";
  // Detail / nested screens — horizontal drill-in feels like "going deeper"
  if (pathname.startsWith("/plans/")) return "page-transition page-transition--drill";
  if (pathname === "/settings") return "page-transition page-transition--drill";
  // Default: soft entrance with staggered children for list/dashboard pages
  return "page-transition page-transition--stagger";
}

export default function Layout() {
  const { profile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isChatActive = location.pathname === "/chat";
  const transitionClass = resolveTransitionClass(location.pathname);

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div className="header-left">
          <div className="header-logo" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Leaf size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <span className="header-brand">LAPHIS</span>
        </div>
        <div className="header-right">
          <button
            className="header-icon-btn"
            onClick={() => navigate("/profile")}
            title="Perfil"
            style={{ fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <User size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Main content — keyed on pathname so React remounts + re-runs animation */}
      <main className={`layout-main${isChatActive ? " layout-main--fill" : ""}`}>
        <div className={transitionClass} key={location.pathname}>
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — 4 tabs + center AI */}
      <nav className="bottom-nav">
        {NAV_LEFT.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            title={item.label}
          >
            <item.icon size={22} strokeWidth={1.5} style={{ marginBottom: 4 }} />
            <span className="nav-tab-label">{item.label}</span>
          </NavLink>
        ))}

        {/* CENTER AI CHAT */}
        <NavLink
          to="/chat"
          className={`nav-chat-fab ${isChatActive ? "active" : ""}`}
        >
          <MonsterLogo size={26} color="#fff" strokeWidth={2} />
        </NavLink>

        {NAV_RIGHT.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-tab ${isActive ? "active" : ""}`}
            title={item.label}
          >
            <item.icon size={22} strokeWidth={1.5} style={{ marginBottom: 4 }} />
            <span className="nav-tab-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
