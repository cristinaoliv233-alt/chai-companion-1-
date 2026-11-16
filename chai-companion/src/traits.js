/** Os 7 traços da personalidade e a descrição textual em tempo real. */
export const DEFAULT_PERSONALITY = {
  humor: 70, carinho: 60, energia: 65, curiosidade: 85, sarcasmo: 35, formalidade: 20, confianca: 75,
};

export const TRAITS = {
  humor: { label: "Humor", low: "Séria", high: "Brincalhona" },
  carinho: { label: "Carinho", low: "Distante", high: "Afetuosa" },
  energia: { label: "Energia", low: "Calma", high: "Entusiasta" },
  curiosidade: { label: "Curiosidade", low: "Reservada", high: "Curiosa" },
  sarcasmo: { label: "Sarcasmo", low: "Sincera", high: "Sarcástica" },
  formalidade: { label: "Formalidade", low: "Descontraída", high: "Formal" },
  confianca: { label: "Confiança", low: "Humilde", high: "Confiante" },
};

const level = (v, a, b, c) => (v < 34 ? a : v < 67 ? b : c);

export function describe(p, name) {
  const parts = [
    level(p.humor, "séria", "bem-disposta", "muito brincalhona"),
    level(p.carinho, "reservada", "carinhosa sem exagero", "muito afetuosa"),
    level(p.energia, "calma", "com energia moderada", "cheia de energia"),
    level(p.curiosidade, "pouco inquisitiva", "curiosa", "muito curiosa"),
    level(p.sarcasmo, "sem sarcasmo", "ligeiramente sarcástica", "bastante sarcástica"),
    level(p.formalidade, "descontraída", "educada", "formal"),
    level(p.confianca, "humilde", "equilibrada", "muito confiante"),
  ];
  return `${name} é ${parts.slice(0, 3).join(", ")}, ${parts[3]}, ${parts[4]}, ${parts[5]} e ${parts[6]}.`;
}
