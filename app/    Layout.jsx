import { NavLink, Outlet } from "react-router-dom";
import "./layout.css";

export default function Layout() {
  return (
    <div className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="logo">L</div>
          <div>
            <div className="brandName">LAPHIS</div>
            <div className="brandTag">Prototype</div>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            Dashboard
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            Perfil
          </NavLink>
          <NavLink to="/logs" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            Registos
          </NavLink>
          <NavLink to="/chat" className={({ isActive }) => "navItem" + (isActive ? " active" : "")}>
            Chat (AI)
          </NavLink>
        </nav>

        <div className="sidebarFooter">
          <div className="miniCard">
            <div className="miniTitle">Estado</div>
            <div className="miniText">Backend: 127.0.0.1:8000</div>
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbarLeft">
            <div className="pageTitle">LAPHIS AI Service</div>
            <div className="pageSubtitle">UI do protótipo</div>
          </div>
          <div className="topbarRight">
            <button className="btnGhost">Definições</button>
            <button className="btnPrimary">Novo registo</button>
          </div>
        </header>

        <section className="content">
          <Outlet />
        </section>
      </main>
    </div>
  );
}