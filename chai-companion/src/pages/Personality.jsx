/** ÁREA 2 — PERSONALIDADE: 7 sliders com descrição textual em tempo real. */
import { useState } from "react";
import { useProfile } from "../App.jsx";
import Orb from "../components/Orb.jsx";
import { PageHeader, Shell, notify } from "../components/Shell.jsx";
import { DEFAULT_PERSONALITY, TRAITS, describe } from "../traits.js";

export default function Personality() {
  const { profile, save } = useProfile();
  const [draft, setDraft] = useState(profile.personality);
  const [busy, setBusy] = useState(false);
  const keys = Object.keys(TRAITS);
  const dirty = keys.some((k) => draft[k] !== profile.personality[k]);

  async function submit() {
    setBusy(true);
    try { await save({ personality: draft }); notify(`${profile.companionName} já tem a nova personalidade.`); }
    catch (e) { notify(e.message, "error"); }
    finally { setBusy(false); }
  }

  return (
    <Shell name={profile.companionName}>
      <div className="page">
        <PageHeader title="Personalidade" description={`Define como a ${profile.companionName} fala contigo. As alterações aplicam-se às próximas respostas.`}>
          <div className="row">
            <button className="btn glass" onClick={() => setDraft(DEFAULT_PERSONALITY)}>Repor padrão</button>
            <button className="btn glow" onClick={submit} disabled={!dirty || busy}>{busy ? "A guardar…" : "Guardar"}</button>
          </div>
        </PageHeader>
        <div className="two-col">
          <section className="panel sliders">
            {keys.map((k) => (
              <div key={k}>
                <div className="slider-head"><label htmlFor={k}>{TRAITS[k].label}</label><span className="value">{draft[k]}</span></div>
                <input id={k} type="range" min="0" max="100" value={draft[k]} onChange={(e) => setDraft({ ...draft, [k]: +e.target.value })} />
                <div className="slider-ends small muted"><span>{TRAITS[k].low}</span><span>{TRAITS[k].high}</span></div>
              </div>
            ))}
          </section>
          <aside className="panel side">
            <Orb size="md" />
            <p className="small muted">Personalidade atual</p>
            <p>{describe(draft, profile.companionName)}</p>
            {dirty && <p className="small muted">Alterações por guardar</p>}
          </aside>
        </div>
      </div>
    </Shell>
  );
}
