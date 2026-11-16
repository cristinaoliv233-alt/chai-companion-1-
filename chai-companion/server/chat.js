/**
 * Motor de conversa (apenas servidor). Usado pelo site e, no futuro, pelo Raspberry Pi.
 * Fluxo: carrega contexto → guarda mensagem → deteta "lembra-te que..." → responde em streaming → guarda resposta.
 */

import { read, write, newId } from "./store.js";
import { buildSystemPrompt } from "./personality.js";
import { detectRememberIntent } from "./memory-intent.js";

const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.CHAT_MODEL || "openrouter/auto";
const HISTORY_WINDOW = 20;
const MAX_MEMORIES_IN_PROMPT = 60;

function getHeaders() {
  const key = process.env.OPENROUTER_API_KEY;

  if (!key) {
    throw Object.assign(new Error("sem chave"), { code: "NO_KEY" });
  }

  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "X-Title": "Chai Companion",
  };
}

async function requestOpenRouter(body, signal) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const details = await response.text().catch(() => "");
    const error = new Error(`OpenRouter ${response.status}: ${details.slice(0, 500)}`);
    error.status = response.status;
    throw error;
  }

  return response;
}

/** Organiza um facto em { label, content } para guardar na memória. */
async function extractMemory(fact, userName) {
  try {
    const response = await requestOpenRouter({
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            'Responde APENAS com JSON {"label":"...","content":"..."}. ' +
            "label: título de 1 a 3 palavras (ex.: Nome, Projeto atual, Interesses, Gato). " +
            "content: o facto conciso em português de Portugal, sem repetir o título.",
        },
        {
          role: "user",
          content: `Utilizador: ${userName || "desconhecido"}\nFacto: ${fact}`,
        },
      ],
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content
      ?.replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(text || "{}");

    if (
      typeof parsed.label === "string" &&
      typeof parsed.content === "string" &&
      parsed.content.trim()
    ) {
      return {
        label: parsed.label.trim().slice(0, 60),
        content: parsed.content.trim().slice(0, 500),
      };
    }
  } catch (err) {
    console.error("[chai] extração de memória falhou:", err.message);
  }

  return { label: "Nota", content: fact.slice(0, 500) };
}

export function describeError(err) {
  console.error("[chai] erro:", err?.status ?? "", err?.message ?? err);

  if (err?.code === "NO_KEY") {
    return "Falta a OPENROUTER_API_KEY no ficheiro .env do servidor.";
  }

  if (err?.status === 401 || err?.status === 403) {
    return "A chave da OpenRouter não é válida ou não tem autorização. Verifica a configuração.";
  }

  if (err?.status === 402) {
    return "A conta OpenRouter não tem créditos disponíveis para este modelo.";
  }

  if (err?.status === 429) {
    return "Estou a receber demasiados pedidos. Tenta daqui a pouco.";
  }

  if (err?.status === 404) {
    return "O modelo configurado não foi encontrado. Verifica o CHAT_MODEL no .env.";
  }

  return "Não consegui pensar numa resposta agora. Tenta outra vez.";
}

/** Lê a resposta em streaming da OpenRouter e produz eventos delta. */
async function* streamResponse(body, signal) {
  const response = await requestOpenRouter(
    { ...body, stream: true },
    signal,
  );

  if (!response.body) {
    throw new Error("A OpenRouter não devolveu um fluxo de resposta.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trim();

        if (!trimmed.startsWith("data:")) continue;

        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;

        const data = JSON.parse(payload);

        if (data.error) {
          const error = new Error(data.error.message || "Erro no streaming.");
          error.status = data.error.code;
          throw error;
        }

        const text = data.choices?.[0]?.delta?.content;

        if (typeof text === "string" && text.length > 0) {
          yield text;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/** Gerador de eventos: { type: "memory" | "delta" | "done" }. */
export async function* runChat(message, signal) {
  // Verifica a chave antes de guardar a mensagem.
  getHeaders();

  const { profile, messages } = read();

  const history = messages
    .slice(-HISTORY_WINDOW)
    .map((m) => ({ role: m.role, content: m.content }));

  while (history.length && history[0].role !== "user") {
    history.shift();
  }

  write((d) =>
    d.messages.push({
      id: newId(),
      role: "user",
      content: message,
      createdAt: Date.now(),
    }),
  );

  let saved = null;
  const fact = profile.memoryEnabled
    ? detectRememberIntent(message)
    : null;

  if (fact) {
    const mem = await extractMemory(fact, profile.userName);

    saved = {
      id: newId(),
      ...mem,
      source: "chat",
      createdAt: Date.now(),
    };

    write((d) => d.memories.push(saved));
    yield { type: "memory", memory: saved };
  }

  const system = buildSystemPrompt({
    ...profile,
    memories: read().memories.slice(-MAX_MEMORIES_IN_PROMPT),
  });

  const userTurn = saved
    ? `${message}\n\n[Sistema: memória guardada — ${saved.label}: ${saved.content}]`
    : message;

  const requestBody = {
    model: MODEL,
    max_tokens: 600,
    messages: [
      { role: "system", content: system },
      ...history,
      { role: "user", content: userTurn },
    ],
  };

  let reply = "";

  for await (const text of streamResponse(requestBody, signal)) {
    reply += text;
    yield { type: "delta", text };
  }

  if (reply.trim()) {
    write((d) =>
      d.messages.push({
        id: newId(),
        role: "assistant",
        content: reply,
        createdAt: Date.now(),
      }),
    );
  }

  yield { type: "done" };
}