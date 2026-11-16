/**
 * Cliente da API da Chai. Tudo passa por /api, a mesma API que o
 * futuro dispositivo (Raspberry Pi) vai usar.
 */
async function request(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { "content-type": "application/json" },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? "Algo correu mal.");
  }
  return res.status === 204 ? null : res.json();
}

export const api = {
  getProfile: () => request("/profile"),
  saveProfile: (patch) => request("/profile", { method: "PUT", body: patch }),
  getMemories: () => request("/memories"),
  addMemory: (m) => request("/memories", { method: "POST", body: m }),
  editMemory: (id, m) => request(`/memories/${id}`, { method: "PUT", body: m }),
  deleteMemory: (id) => request(`/memories/${id}`, { method: "DELETE" }),
  clearMemories: () => request("/memories", { method: "DELETE" }),
  getMessages: () => request("/messages"),
  clearMessages: () => request("/messages", { method: "DELETE" }),
};

/** Envia uma mensagem e entrega cada evento (memory | delta | error | done) em streaming NDJSON. */
export async function sendChat(message, onEvent, signal) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message }),
    signal,
  });
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error ?? "Não foi possível falar com a Chai.");
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let nl;
    while ((nl = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (line) onEvent(JSON.parse(line));
    }
  }
}
