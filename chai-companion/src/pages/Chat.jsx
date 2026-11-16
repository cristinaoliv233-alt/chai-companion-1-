/** ÁREA 1 — CHAT: conversa contínua com a Chai, guardada no servidor. */
import { useEffect, useRef, useState } from "react";
import { api, sendChat } from "../api.js";
import { useProfile } from "../App.jsx";
import Orb from "../components/Orb.jsx";
import { Shell, notify } from "../components/Shell.jsx";

const SUGGESTIONS = ["Olá! Quem és tu?", "Lembra-te que eu adoro robótica", "O que sabes sobre mim?", "Conta-me algo curioso"];

export default function Chat() {
  const { profile } = useProfile();
  const name = profile.companionName;
  const [messages, setMessages] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("ready"); // ready | thinking | speaking
  const abortRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    api.getMessages().then((rows) => { setMessages(rows); setLoaded(true); }).catch((e) => notify(e.message, "error"));
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  async function send(text) {
    const message = text.trim();
    if (!message || status !== "ready") return;
    const aId = `a-${Date.now()}`;
    setMessages((m) => [...m, { id: `u-${Date.now()}`, role: "user", content: message }]);
    setInput("");
    setStatus("thinking");
    const controller = new AbortController();
    abortRef.current = controller;
    let started = false;
    try {
      await sendChat(message, (ev) => {
        if (ev.type === "memory") {
          notify(`Memória guardada: ${ev.memory.label}`);
          setMessages((m) => m.map((x, i) => (i === m.length - 1 && x.role === "user" ? { ...x, memory: ev.memory } : x)));
        } else if (ev.type === "delta") {
          if (!started) {
            started = true;
            setStatus("speaking");
            setMessages((m) => [...m, { id: aId, role: "assistant", content: "" }]);
          }
          setMessages((m) => m.map((x) => (x.id === aId ? { ...x, content: x.content + ev.text } : x)));
        } else if (ev.type === "error") {
          throw new Error(ev.message);
        }
      }, controller.signal);
    } catch (err) {
      if (!controller.signal.aborted) {
        notify(err.message, "error");
        setInput((cur) => cur || message);
      }
    } finally {
      setStatus("ready");
      abortRef.current = null;
    }
  }

  const mood = status === "thinking" ? "thinking" : status === "speaking" ? "speaking" : "idle";
  const empty = loaded && messages.length === 0;

  return (
    <Shell name={name} mood={mood} fullHeight>
      <div className="chat">
        <div className="chat-scroll">
          {empty && (
            <div className="hero">
              <Orb size="lg" mood={mood} />
              <h1>Olá{profile.userName ? `, ${profile.userName}` : ""}. Eu sou a {name}.</h1>
              <p className="muted">Conta-me o que te apetecer. Se disseres “lembra-te que…”, eu guardo.</p>
              <div className="chips">
                {SUGGESTIONS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              {m.role === "assistant" && <span className="msg-name">{name}</span>}
              <div className="bubble">{m.content}</div>
              {m.memory && <span className="badge">Guardado: {m.memory.label}</span>}
            </div>
          ))}
          {status === "thinking" && <div className="msg assistant"><span className="msg-name">{name}</span><div className="bubble thinking">a pensar…</div></div>}
          <div ref={endRef} />
        </div>
        <form className="composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Escreve à ${name}…`} autoFocus maxLength={2000} />
          {status === "ready"
            ? <button className="btn glow" type="submit" disabled={!input.trim()}>Enviar</button>
            : <button className="btn glass" type="button" onClick={() => abortRef.current?.abort()}>Parar</button>}
        </form>
      </div>
    </Shell>
  );
}
