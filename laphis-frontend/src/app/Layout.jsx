import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../hooks/useApp";
import { Home, Dumbbell, ClipboardList, User, Settings, Bot } from "lucide-react";
import "./layout.css";

const NAV_LEFT = [
  { to: "/dashboard", label: "Início", icon: Home },
  { to: "/plans", label: "Planos", icon: Dumbbell },
];

const NAV_RIGHT = [
  { to: "/logs", label: "Registos", icon: ClipboardList },
  { to: "/profile", label: "Perfil", icon: User },
];

export default function Layout() {
  const { profile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const isChatActive = location.pathname === "/chat";

  return (
    <div className="layout-container">
      {/* Header */}
      <header className="layout-header">
        <div className="header-left">
          <div className="header-logo">L</div>
          <span className="header-brand">LAPHIS</span>
        </div>
        <div className="header-right">
          <button
            className="header-icon-btn"
            onClick={() => navigate("/settings")}
            title="Definições"
            style={{ fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Main content — keyed on pathname for page-enter animation */}
      <main className={`layout-main${isChatActive ? " layout-main--fill" : ""}`}>
        <div className="page-transition" key={location.pathname}>
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
          <Bot size={24} strokeWidth={2} color="#fff" />
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
