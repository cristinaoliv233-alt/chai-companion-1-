/**
 * Servidor da Chai (Express).
 *
 *  POST /api/chat            → conversa. "Accept: application/json" devolve { reply, memory } (ideal para Raspberry Pi);
 *                              caso contrário, streaming NDJSON (usado pelo site).
 *  GET/PUT /api/profile      → nomes, memória on/off, personalidade
 *  GET/POST/PUT/DELETE /api/memories
 *  GET/DELETE /api/messages
 */
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { read, write, newId, DEFAULT_PERSONALITY } from "./store.js";
import { runChat, describeError } from "./chat.js";

const app = express();
app.use(express.json({ limit: "100kb" }));

// Autenticação opcional por token (para o dispositivo físico).
app.use("/api", (req, res, next) => {
  const token = process.env.API_TOKEN;
  if (token && req.headers.authorization !== `Bearer ${token}`) return res.status(401).json({ error: "Não autorizado" });
  next();
});

const clamp = (v) => Math.max(0, Math.min(100, Number.isFinite(+v) ? Math.round(+v) : 50));

/* ---- Perfil ---- */
app.get("/api/profile", (_req, res) => res.json(read().profile));
app.put("/api/profile", (req, res) => {
  const b = req.body ?? {};
  const out = write((d) => {
    const p = d.profile;
    if (typeof b.userName === "string") p.userName = b.userName.trim().slice(0, 40);
    if (typeof b.companionName === "string") p.companionName = b.companionName.trim().slice(0, 30) || "Chai";
    if (typeof b.memoryEnabled === "boolean") p.memoryEnabled = b.memoryEnabled;
    if (b.personality && typeof b.personality === "object") {
      for (const k of Object.keys(DEFAULT_PERSONALITY)) if (k in b.personality) p.personality[k] = clamp(b.personality[k]);
    }
  });
  res.json(out.profile);
});

/* ---- Memórias ---- */
app.get("/api/memories", (_req, res) => res.json(read().memories));
app.post("/api/memories", (req, res) => {
  const label = String(req.body?.label ?? "").trim().slice(0, 60);
  const content = String(req.body?.content ?? "").trim().slice(0, 500);
  if (!label || !content) return res.status(400).json({ error: "Preenche o título e o conteúdo." });
  const mem = { id: newId(), label, content, source: "manual", createdAt: Date.now() };
  write((d) => d.memories.push(mem));
  res.status(201).json(mem);
});
app.put("/api/memories/:id", (req, res) => {
  const label = String(req.body?.label ?? "").trim().slice(0, 60);
  const content = String(req.body?.content ?? "").trim().slice(0, 500);
  if (!label || !content) return res.status(400).json({ error: "Preenche o título e o conteúdo." });
  let found = null;
  write((d) => { found = d.memories.find((m) => m.id === req.params.id); if (found) Object.assign(found, { label, content }); });
  found ? res.json(found) : res.status(404).json({ error: "Memória não encontrada" });
});
app.delete("/api/memories/:id", (req, res) => { write((d) => { d.memories = d.memories.filter((m) => m.id !== req.params.id); }); res.status(204).end(); });
app.delete("/api/memories", (_req, res) => { write((d) => { d.memories = []; }); res.status(204).end(); });

/* ---- Mensagens ---- */
app.get("/api/messages", (_req, res) => res.json(read().messages.slice(-200)));
app.delete("/api/messages", (_req, res) => { write((d) => { d.messages = []; }); res.status(204).end(); });

/* ---- Chat ---- */
app.post("/api/chat", async (req, res) => {
  const message = String(req.body?.message ?? "").trim();
  if (!message || message.length > 2000) return res.status(400).json({ error: "Mensagem inválida" });

  const controller = new AbortController();
  res.on("close", () => { if (!res.writableEnded) controller.abort(); });

  if (req.headers.accept?.includes("application/json")) {
    try {
      const result = { reply: "", memory: null };
      for await (const ev of runChat(message, controller.signal)) {
        if (ev.type === "delta") result.reply += ev.text;
        if (ev.type === "memory") result.memory = ev.memory;
      }
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: describeError(err) });
    }
  }

  res.set({ "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" });
  try {
    for await (const ev of runChat(message, controller.signal)) res.write(JSON.stringify(ev) + "\n");
  } catch (err) {
    if (!controller.signal.aborted) res.write(JSON.stringify({ type: "error", message: describeError(err) }) + "\n");
  }
  res.end();
});

/* ---- Erros (ex.: JSON inválido) ---- */
app.use("/api", (err, _req, res, _next) => {
  res.status(err.status || 500).json({ error: err.status === 400 ? "Pedido inválido." : "Erro no servidor." });
});

/* ---- Site compilado (npm run build && npm start) ---- */
const dist = path.resolve("dist");
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Chai a ouvir em http://localhost:${port}`));
