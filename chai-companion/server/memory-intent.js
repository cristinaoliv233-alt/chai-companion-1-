/** Deteta pedidos explícitos como "lembra-te que..." e devolve o facto (ou null). */
const PATTERNS = [
  /\blembra-?te\s+(?:de\s+)?que\s+(.+)/is,
  /\bnão\s+te\s+esque[cç]as\s+(?:de\s+)?que\s+(.+)/is,
  /\bguarda\s+(?:isto|esta\s+informação)\s*:?\s*(?:que\s+)?(.+)/is,
  /\bguarda\s+que\s+(.+)/is,
  /\bremember\s+that\s+(.+)/is,
];

export function detectRememberIntent(message) {
  if (!/lembra|esque[cç]as|guarda|remember/i.test(message)) return null;
  for (const re of PATTERNS) {
    const m = message.match(re);
    if (m && m[1].trim().length > 2) return m[1].trim().replace(/[.!\s]+$/, "");
  }
  return null;
}
