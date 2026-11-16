/** ÁREA 4 — CONFIGURAÇÕES: nomes, memória on/off, limpar memórias e conversa. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useProfile } from "../App.jsx";
import { PageHeader, Shell, notify } from "../components/Shell.jsx";

export default function Settings() {
  const { profile, save } = useProfile();
  const [userName, setUserName] = useState(profile.userName);
  const [companionName, setCompanionName] = useState(profile.companionName);
  const [confirm, setConfirm] = useState(null); // "memories" | "messages"

  const run = async (fn, ok) => {
    try { await fn(); notify(ok); } catch (e) { notify(e.message, "error"); }
  };

  return (
    <Shell name={profile.companionName}>
      <div className="page narrow">
        <PageHeader title="Configurações" description="Ajusta a tua companheira." />

        <section className="panel form">
          <label>Nome da companheira<input value={companionName} maxLength={30} onChange={(e) => setCompanionName(e.target.value)} /></label>
          <label>O teu nome<input value={userName} maxLength={40} onChange={(e) => setUserName(e.target.value)} /></label>
          <div><button className="btn glow" onClick={() => run(() => save({ userName, companionName }), "Nomes guardados.")}>Guardar nomes</button></div>
        </section>

        <section className="panel row between">
          <div><strong>Memória</strong><p className="muted small">Permite à {profile.companionName} guardar e usar memórias.</p></div>
          <label className="switch">
            <input type="checkbox" checked={profile.memoryEnabled} onChange={(e) => run(() => save({ memoryEnabled: e.target.checked }), e.target.checked ? "Memória ligada." : "Memória desligada.")} />
            <span />
          </label>
        </section>

        <section className="panel row between">
          <strong>Personalidade</strong>
          <Link className="btn glass" to="/personalidade">Abrir</Link>
        </section>

        <section className="panel row">
          <button className="btn glass" onClick={() => setConfirm("memories")}>Limpar todas as memórias</button>
          <button className="btn glass" onClick={() => setConfirm("messages")}>Apagar conversa</button>
        </section>
      </div>

      {confirm && (
        <div className="overlay" onClick={() => setConfirm(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>{confirm === "memories" ? "Limpar todas as memórias?" : "Apagar a conversa?"}</h2>
            <p className="muted">Esta ação não pode ser desfeita.</p>
            <div className="row end">
              <button className="btn ghost" onClick={() => setConfirm(null)}>Cancelar</button>
              <button className="btn glow" onClick={() => {
                run(() => (confirm === "memories" ? api.clearMemories() : api.clearMessages()), confirm === "memories" ? "Memórias apagadas." : "Conversa apagada.");
                setConfirm(null);
              }}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
