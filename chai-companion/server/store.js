/**
 * Armazenamento local em ficheiro JSON (data/chai.json).
 * Sem contas nem base de dados: ideal para a demonstração.
 * Para migrar para uma base de dados, basta reescrever este ficheiro.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const FILE = path.resolve("data", "chai.json");

export const DEFAULT_PERSONALITY = {
  humor: 70, carinho: 60, energia: 65, curiosidade: 85, sarcasmo: 35, formalidade: 20, confianca: 75,
};

const initial = () => ({
  profile: { userName: "", companionName: "Chai", memoryEnabled: true, personality: { ...DEFAULT_PERSONALITY } },
  memories: [],
  messages: [],
});

let db = null;

function load() {
  if (db) return db;
  try {
    const base = initial();
    const saved = JSON.parse(fs.readFileSync(FILE, "utf8"));
    db = {
      ...base,
      ...saved,
      profile: { ...base.profile, ...saved.profile, personality: { ...base.profile.personality, ...saved.profile?.personality } },
    };
  } catch {
    db = initial();
  }
  return db;
}

function save() {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(db, null, 2));
}

export const newId = () => crypto.randomUUID();

export function read() { return load(); }
export function write(mutator) { mutator(load()); save(); return db; }
