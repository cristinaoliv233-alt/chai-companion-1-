/** ÁREA 3 — MEMÓRIA: ver, adicionar, editar e apagar o que a Chai sabe sobre o utilizador. */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import { useProfile } from "../App.jsx";
import { PageHeader, Shell, notify } from "../components/Shell.jsx";

export default function Memory() {
  const { profile } = useProfile();
  const name = profile.companionName;
  const [memories, setMemories] = useState(null);
  const [editing, setEditing] = useState(null); // { id?, label, content }
  const [toDelete, setToDelete] = useState(null);

  const load = () => api.getMemories().then(setMemories).catch((e) => notify(e.message, "error"));
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    try {
      editing.id ? await api.editMemory(editing.id, editing) : await api.addMemory(editing);
      notify(editing.id ? "Memória atualizada." : "Memória adicionada.");
      setEditing(null);
      load();
    } catch (err) { notify(err.message, "error"); }
  }

  async function confirmDelete() {
    try { await api.deleteMemory(toDelete.id); notify("Memória apagada."); load(); }
    catch (err) { notify(err.message, "error"); }
    setToDelete(null);
  }

  return (
    <Shell name={name}>
      <div className="page">
        <PageHeader title="Memória" description={`Tudo o que a ${name} sabe sobre ti. No chat, diz “lembra-te que…” para ela guardar algo novo.`}>
          <button className="btn glow" onClick={() => setEditing({ label: "", content: "" })}>Adicionar memória</button>
        </PageHeader>

        {!profile.memoryEnabled && (
          <div className="alert">A memória está desativada. A {name} não usa nem guarda memórias até a ligares em <Link to="/configuracoes">Configurações</Link>.</div>
        )}

        <div className="stack">
          {memories === null && <p className="muted">A carregar memórias…</p>}
          {memories?.length === 0 && (
            <div className="panel empty">
              <p><strong>Ainda sem memórias</strong></p>
              <p className="muted">Adiciona uma aqui ou diz no chat: “lembra-te que o meu projeto é uma companheira de IA”.</p>
            </div>
          )}
          {memories?.map((m) => (
            <article key={m.id} className="panel memory">
              <div>
                <h2>{m.label} {m.source === "chat" && <span className="tag">do chat</span>}</h2>
                <p>{m.content}</p>
              </div>
              <div className="row">
                <button className="btn ghost" onClick={() => setEditing({ id: m.id, label: m.label, content: m.content })}>Editar</button>
                <button className="btn ghost" onClick={() => setToDelete(m)}>Apagar</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {editing && (
        <div className="overlay" onClick={() => setEditing(null)}>
          <form className="dialog" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
            <h2>{editing.id ? "Editar memória" : "Nova memória"}</h2>
            <label>Título<input value={editing.label} maxLength={60} placeholder="Nome, Projeto atual, Interesses…" autoFocus onChange={(e) => setEditing({ ...editing, label: e.target.value })} /></label>
            <label>Conteúdo<textarea rows={3} value={editing.content} maxLength={500} onChange={(e) => setEditing({ ...editing, content: e.target.value })} /></label>
            <div className="row end">
              <button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn glow">Guardar</button>
            </div>
          </form>
        </div>
      )}
      {toDelete && (
        <div className="overlay" onClick={() => setToDelete(null)}>
          <div className="dialog" onClick={(e) => e.stopPropagation()}>
            <h2>Apagar “{toDelete.label}”?</h2>
            <p className="muted">A {name} vai esquecer esta informação.</p>
            <div className="row end">
              <button className="btn ghost" onClick={() => setToDelete(null)}>Cancelar</button>
              <button className="btn glow" onClick={confirmDelete}>Apagar</button>
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
