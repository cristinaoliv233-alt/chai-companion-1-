/** Estrutura comum: navegação lateral (desktop), barra inferior (telemóvel) e avisos. */
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import Orb from "./Orb.jsx";

const NAV = [
  { to: "/chat", label: "Chat" },
  { to: "/personalidade", label: "Personalidade" },
  { to: "/memoria", label: "Memória" },
  { to: "/configuracoes", label: "Configurações" },
];

/** Mostra um aviso rápido: notify("Guardado") */
export const notify = (message, kind = "ok") =>
  window.dispatchEvent(new CustomEvent("chai-toast", { detail: { message, kind } }));

function Toasts() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    const onToast = (e) => {
      const id = Math.random();
      setItems((c) => [...c, { id, ...e.detail }]);
      setTimeout(() => setItems((c) => c.filter((t) => t.id !== id)), 3500);
    };
    window.addEventListener("chai-toast", onToast);
    return () => window.removeEventListener("chai-toast", onToast);
  }, []);
  return (
    <div className="toasts" role="status">
      {items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.message}</div>)}
    </div>
  );
}

export function Shell({ name, mood, children, fullHeight }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Orb size="sm" mood={mood} />
          <div>
            <p className="brand-name">{name}</p>
            <p className="muted small">companheira de IA</p>
          </div>
        </div>
        <nav>
          {NAV.map((n) => <NavLink key={n.to} to={n.to} className="nav-link">{n.label}</NavLink>)}
        </nav>
        <p className="side-note small muted">Protótipo digital. Versão para cápsula física em desenvolvimento.</p>
      </aside>
      <div className="content">
        <header className="topbar"><Orb size="sm" mood={mood} /><span className="brand-name">{name}</span></header>
        <main className={fullHeight ? "main full" : "main"}>{children}</main>
        <nav className="bottombar">
          {NAV.map((n) => <NavLink key={n.to} to={n.to} className="nav-link">{n.label}</NavLink>)}
        </nav>
      </div>
      <Toasts />
    </div>
  );
}

export function PageHeader({ title, description, children }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
