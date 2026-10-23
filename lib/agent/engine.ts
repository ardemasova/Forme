/**
 * Forme demo engine.
 *
 * A deterministic, local "agent": a scenario tree + preference weights + rules.
 * Every output (questions, hypotheses, profile, recommendations, brief) is a pure
 * function of the user's recorded answers — no network, no randomness, no LLM.
 */
import {
  ASPECTS,
  ATMOSPHERES,
  POOL,
  REF_BY_ID,
  TAG_META,
  getRef,
} from "@/lib/catalog";
import { parseText } from "@/lib/agent/text";
import type {
  Answers,
  AspectId,
  Confidence,
  Direction,
  InteriorRef,
  MaterialChip,
  Swatch,
  Tag,
  TagScore,
  TasteProfile,
} from "@/types";

// ————————————————————————————————————————————— Signals

export type SignalKind = "eleccion" | "rechazo" | "texto" | "correccion";

export interface Signal {
  tag: Tag;
  weight: number;
  source: string;
  kind: SignalKind;
}

/** Stage limits which answers are taken into account (used to keep early questions stable). */
export type Stage = 2 | 3 | 4 | 99;

const q = (s: string) => `«${s}»`;

function fromRef(
  ref: InteriorRef,
  factor: number,
  source: string,
  kind: SignalKind,
  min = 0.4,
): Signal[] {
  return Object.entries(ref.tags)
    .filter(([, v]) => (v ?? 0) >= min)
    .map(([tag, v]) => ({ tag: tag as Tag, weight: (v ?? 0) * factor, source, kind }));
}

export function emptyAnswers(): Answers {
  return {
    aspects: [],
    corrections: [],
    feedbackLog: [],
    moodboardRemoved: [],
    texts: [],
    project: { functional: [] },
  };
}

export interface FeedbackState {
  liked: string[];
  saved: string[];
  rejected: string[];
}

/** Replay the feedback log into its current state (last action wins). */
export function feedbackState(answers: Answers): FeedbackState {
  const liked: string[] = [];
  const saved: string[] = [];
  const rejected: string[] = [];
  const drop = (arr: string[], id: string) => {
    const i = arr.indexOf(id);
    if (i >= 0) arr.splice(i, 1);
  };
  for (const e of answers.feedbackLog) {
    switch (e.action) {
      case "like":
        drop(rejected, e.refId);
        if (!liked.includes(e.refId)) liked.push(e.refId);
        break;
      case "save":
        drop(rejected, e.refId);
        if (!liked.includes(e.refId)) liked.push(e.refId);
        if (!saved.includes(e.refId)) saved.push(e.refId);
        break;
      case "unsave":
        drop(saved, e.refId);
        break;
      case "unlike":
        drop(liked, e.refId);
        drop(saved, e.refId);
        break;
      case "reject":
        drop(liked, e.refId);
        drop(saved, e.refId);
        if (!rejected.includes(e.refId)) rejected.push(e.refId);
        break;
      case "restore":
        drop(rejected, e.refId);
        break;
    }
  }
  return { liked, saved, rejected };
}

export function collectSignals(answers: Answers, stage: Stage = 99): Signal[] {
  const out: Signal[] = [];
  const atm = ATMOSPHERES.find((a) => a.id === answers.atmosphere);
  if (atm) {
    const ref = REF_BY_ID[atm.refId];
    out.push(...fromRef(ref, 1, `elegiste ${q(atm.label)} como atmósfera para volver a casa`, "eleccion", 0.5));
  }
  for (const id of answers.aspects) {
    const a = ASPECTS.find((x) => x.id === id);
    if (!a) continue;
    for (const [tag, w] of Object.entries(a.tags)) {
      out.push({ tag: tag as Tag, weight: w ?? 0, source: `marcaste ${q(a.label)}`, kind: "eleccion" });
    }
  }
  if (answers.aspectsNote) {
    const parsed = parseText(answers.aspectsNote);
    const src = `escribiste ${q(clip(answers.aspectsNote))}`;
    parsed.positive.forEach((t) => out.push({ tag: t, weight: 0.8, source: src, kind: "texto" }));
    parsed.negative.forEach((t) => out.push({ tag: t, weight: -0.8, source: src, kind: "texto" }));
  }
  if (stage <= 2) return out;

  const hyp = buildHypothesis(answers);
  if (hyp && answers.hypothesis?.id === hyp.id) {
    const a = REF_BY_ID[hyp.a];
    const b = REF_BY_ID[hyp.b];
    const choice = answers.hypothesis.choice;
    if (choice === "a" || choice === "b") {
      const win = choice === "a" ? a : b;
      const lose = choice === "a" ? b : a;
      const src = `en la comprobación preferiste ${q(win.title)} frente a ${q(lose.title)}`;
      out.push(...fromRef(win, 0.9, src, "eleccion", 0.5));
      for (const [tag, v] of Object.entries(lose.tags)) {
        if ((v ?? 0) >= 0.5 && (win.tags[tag as Tag] ?? 0) < 0.4) {
          out.push({ tag: tag as Tag, weight: -0.7 * (v ?? 0), source: `descartaste ${q(lose.title)}`, kind: "rechazo" });
        }
      }
    } else {
      for (const ref of [a, b]) {
        for (const [tag, v] of Object.entries(ref.tags)) {
          const other = ref === a ? b : a;
          if ((v ?? 0) >= 0.6 && (other.tags[tag as Tag] ?? 0) < 0.4) {
            out.push({ tag: tag as Tag, weight: -0.4 * (v ?? 0), source: `ninguna opción te convenció (${ref.title.toLowerCase()})`, kind: "rechazo" });
          }
        }
      }
    }
  }
  if (stage <= 3) return out;

  const ref = buildRefinement(answers);
  if (ref && answers.refinement?.id === ref.id) {
    const opt = REF_BY_ID[answers.refinement.choice];
    if (opt) {
      if (ref.negative) {
        const src = `te molesta ${q(opt.title.toLowerCase())}`;
        out.push(...fromRef(opt, -0.9, src, "rechazo", 0.5));
        if (opt.id === "det-sin-luz") out.push({ tag: "luz-natural", weight: 1.2, source: src, kind: "eleccion" });
      } else {
        out.push(...fromRef(opt, 1, `para el detalle elegiste ${q(opt.title)}`, "eleccion", 0.5));
      }
    }
  }
  if (stage <= 4) return out;

  for (const c of answers.corrections) {
    out.push({ tag: c.tag, weight: -1.6, source: `corregiste el perfil: ${q(TAG_META[c.tag].label)} no encaja`, kind: "correccion" });
  }

  const fb = feedbackState(answers);
  for (const id of fb.liked) {
    const r = getRef(id);
    if (!r) continue;
    const isSaved = fb.saved.includes(id);
    out.push(...fromRef(r, isSaved ? 0.75 : 0.6, `${isSaved ? "guardaste" : "te gustó"} ${q(r.title)}`, "eleccion", 0.5));
  }
  for (const id of fb.rejected) {
    const r = getRef(id);
    if (!r) continue;
    out.push(...fromRef(r, -0.6, `marcaste ${q(r.title)} como “no encaja”`, "rechazo", 0.6));
  }
  for (const t of answers.texts) {
    const parsed = parseText(t.text);
    const src = `escribiste ${q(clip(t.text))}${t.channel === "telegram" ? " en Telegram" : ""}`;
    parsed.positive.forEach((tag) => out.push({ tag, weight: 0.8, source: src, kind: "texto" }));
    parsed.negative.forEach((tag) => out.push({ tag, weight: -0.8, source: src, kind: "texto" }));
  }
  return out;
}

function clip(s: string, n = 48) {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

// ————————————————————————————————————————————— Scores

export type ScoreMap = Partial<Record<Tag, number>>;

export function scoreMap(signals: Signal[]): ScoreMap {
  const m: ScoreMap = {};
  for (const s of signals) m[s.tag] = (m[s.tag] ?? 0) + s.weight;
  return m;
}

function tagScores(signals: Signal[]): TagScore[] {
  const by = new Map<Tag, TagScore>();
  for (const s of signals) {
    const cur = by.get(s.tag) ?? { tag: s.tag, score: 0, positives: 0, negatives: 0, sources: [], confidence: "explorando" as Confidence };
    cur.score += s.weight;
    if (s.weight > 0) cur.positives += 1;
    else cur.negatives += 1;
    if (!cur.sources.includes(s.source)) cur.sources.push(s.source);
    by.set(s.tag, cur);
  }
  return [...by.values()].map((t) => ({ ...t, score: Math.round(t.score * 100) / 100 }));
}

// ————————————————————————————————————————————— Directions

const DIRECTIONS: { id: string; name: string; description: string; vector: ScoreMap; palette: Swatch[] }[] = [
  {
    id: "minimalismo-calido",
    name: "Minimalismo cálido",
    description: "Pocos objetos, materiales naturales y una luz que envuelve.",
    vector: { madera: 1, lino: 0.8, "luz-difusa": 0.8, "paleta-calma": 1, minimal: 0.7, textil: 0.6, "luz-calida": 0.6, "paleta-calida": 0.4 },
    palette: [
      { name: "Lechoso", hex: "#EFE8DC" },
      { name: "Arena", hex: "#D8C6A9" },
      { name: "Oliva apagado", hex: "#8B8A6B" },
      { name: "Roble", hex: "#B08A62" },
    ],
  },
  {
    id: "japandi",
    name: "Japandi sereno",
    description: "Orden japonés y calidez nórdica: madera, cerámica y vacío.",
    vector: { madera: 1, "lineas-puras": 0.7, minimal: 0.8, ceramica: 0.7, "paleta-calma": 0.7, "luz-natural": 0.5, plantas: 0.3 },
    palette: [
      { name: "Papel", hex: "#F1ECE3" },
      { name: "Fresno", hex: "#CDB596" },
      { name: "Musgo", hex: "#6F7559" },
      { name: "Carbón", hex: "#3B3832" },
    ],
  },
  {
    id: "wabi-mediterraneo",
    name: "Wabi-sabi mediterráneo",
    description: "Cal, madera en bruto y la belleza de lo imperfecto.",
    vector: { cal: 1, piedra: 0.6, madera: 0.7, ceramica: 0.8, "mezcla-texturas": 0.6, "luz-natural": 0.6, "paleta-calida": 0.6 },
    palette: [
      { name: "Cal", hex: "#ECE4D7" },
      { name: "Barro", hex: "#B47C61" },
      { name: "Piedra", hex: "#BDB2A0" },
      { name: "Nogal", hex: "#5E4433" },
    ],
  },
  {
    id: "claridad",
    name: "Claridad arquitectónica",
    description: "Geometría limpia, materia honesta y luz natural como protagonista.",
    vector: { "lineas-puras": 1, hormigon: 0.8, piedra: 0.6, minimal: 0.8, contraste: 0.6, "luz-natural": 0.6, monocromo: 0.4 },
    palette: [
      { name: "Tiza", hex: "#E8E3DA" },
      { name: "Hormigón", hex: "#A39E95" },
      { name: "Grafito", hex: "#4A4844" },
      { name: "Lino crudo", hex: "#D6CCBC" },
    ],
  },
  {
    id: "eclectico",
    name: "Ecléctico contemporáneo",
    description: "Arte, piezas con historia y color con intención.",
    vector: { arte: 1, color: 0.8, vintage: 0.7, decoracion: 0.8, "mezcla-texturas": 0.8, plantas: 0.4, curvas: 0.3 },
    palette: [
      { name: "Terracota", hex: "#C0643F" },
      { name: "Petróleo", hex: "#2F5560" },
      { name: "Mostaza", hex: "#C9A23F" },
      { name: "Crema", hex: "#EFE5D3" },
    ],
  },
  {
    id: "mid-century",
    name: "Mid-century cálido",
    description: "Maderas tostadas, curvas suaves y piezas de autor.",
    vector: { madera: 0.8, vintage: 0.8, "paleta-calida": 0.8, curvas: 0.6, "luz-calida": 0.7, textil: 0.4, color: 0.3 },
    palette: [
      { name: "Teca", hex: "#9A6238" },
      { name: "Caramelo", hex: "#C99A63" },
      { name: "Verde botella", hex: "#3F5442" },
      { name: "Hueso", hex: "#EEE5D6" },
    ],
  },
  {
    id: "sobrio",
    name: "Modernismo sobrio",
    description: "Monocromía, metal y una luz nítida.",
    vector: { metal: 0.8, "luz-fria": 0.7, monocromo: 0.8, brillo: 0.5, "lineas-puras": 0.6, contraste: 0.6 },
    palette: [
      { name: "Niebla", hex: "#C9CACB" },
      { name: "Acero", hex: "#8E9093" },
      { name: "Grafito", hex: "#3E3F41" },
      { name: "Blanco", hex: "#F4F4F2" },
    ],
  },
];

function rankDirections(scores: ScoreMap): Direction[] {
  return DIRECTIONS.map((d) => {
    let s = 0;
    let norm = 0;
    for (const [tag, w] of Object.entries(d.vector)) {
      const v = Math.max(-3, Math.min(3, scores[tag as Tag] ?? 0));
      s += v * (w ?? 0);
      norm += w ?? 0;
    }
    return { id: d.id, name: d.name, description: d.description, score: Math.round((s / norm) * 100) / 100 };
  }).sort((a, b) => b.score - a.score);
}

// ————————————————————————————————————————————— Profile

const MATERIAL_INFO: Partial<Record<Tag, { name: string; note: string; refId?: string; color: string }>> = {
  madera: { name: "Roble y maderas naturales", note: "acabado mate, veta visible", refId: "m-madera", color: "#B08A62" },
  lino: { name: "Lino lavado", note: "cortinas y ropa de cama", refId: "m-lino", color: "#E3DBCD" },
  textil: { name: "Bouclé y lana", note: "tapicerías táctiles", refId: "r-dormitorio-rayas", color: "#D9CFBF" },
  piedra: { name: "Piedra mate / travertino", note: "sin pulir, poro abierto", refId: "m-travertino", color: "#CDBB9E" },
  cal: { name: "Estuco de cal", note: "paredes con movimiento", refId: "r-wabi-banco", color: "#E2D8C8" },
  ceramica: { name: "Cerámica artesanal", note: "piezas sueltas, no colecciones", refId: "r-ceramica", color: "#B9714F" },
  hormigon: { name: "Microcemento", note: "superficies continuas", refId: "m-hormigon", color: "#A39E95" },
  metal: { name: "Acero cepillado", note: "perfiles finos", color: "#8E9093" },
  brillo: { name: "Lacados", note: "en superficies pequeñas", color: "#D7D9DB" },
  "mezcla-texturas": { name: "Mezcla de texturas", note: "contraste táctil", refId: "m-muestras", color: "#9B8F80" },
};

const LIGHT_LINES: Partial<Record<Tag, string>> = {
  "luz-difusa": "Luz difusa en capas: lámparas de pie y sobremesa en lugar de un único punto de luz.",
  "luz-calida": "Temperatura cálida (≈2700 K) en la iluminación general.",
  "luz-natural": "Prioridad a la luz natural: visillos ligeros, nada de opacos permanentes.",
  "luz-fria": "Luz neutra (3500–4000 K) para un ambiente nítido.",
};

const WORDS: Partial<Record<Tag, string>> = {
  "paleta-calma": "serena",
  madera: "natural",
  lino: "natural",
  cal: "natural",
  textil: "táctil",
  "luz-calida": "cálida",
  "paleta-calida": "cálida",
  "luz-difusa": "envolvente",
  "lineas-puras": "ordenada",
  minimal: "despejada",
  arte: "con carácter",
  color: "vibrante",
  vintage: "con historia",
  "luz-natural": "luminosa",
  contraste: "rotunda",
  curvas: "suave",
  plantas: "viva",
  "mezcla-texturas": "rica en texturas",
  ceramica: "artesanal",
  hormigon: "mineral",
};

const EXPRESSIVE: Tag[] = ["arte", "decoracion", "color", "vintage"];
const CALM: Tag[] = ["minimal", "paleta-calma", "lineas-puras"];

function sum(scores: ScoreMap, tags: Tag[]) {
  return tags.reduce((acc, t) => acc + Math.max(0, scores[t] ?? 0), 0);
}

export function hasContradiction(scores: ScoreMap) {
  return sum(scores, EXPRESSIVE) >= 1.4 && sum(scores, CALM) >= 1.4;
}

export function computeProfile(answers: Answers, stage: Stage = 99): TasteProfile {
  const signals = collectSignals(answers, stage);
  const scores = scoreMap(signals);
  const ts = tagScores(signals);

  const preferred = ts
    .filter((t) => t.score >= 0.6)
    .map((t) => ({ ...t, confidence: (t.score >= 1.4 && t.positives >= 2 ? "visible" : "explorando") as Confidence }))
    .sort((a, b) => b.score - a.score);
  const avoided = ts
    .filter((t) => t.score <= -0.5)
    .map((t) => ({ ...t, confidence: (t.score <= -1 || t.negatives >= 2 ? "visible" : "explorando") as Confidence }))
    .sort((a, b) => a.score - b.score);
  const uncertain = ts.filter(
    (t) => (t.positives > 0 && t.negatives > 0 && Math.abs(t.score) < 0.6) || (t.score > 0.3 && t.score < 0.6),
  );

  const directions = rankDirections(scores);
  const decisions =
    (answers.atmosphere ? 1 : 0) +
    (answers.aspects.length || answers.aspectsNote ? 1 : 0) +
    (answers.hypothesis ? 1 : 0) +
    (answers.refinement ? 1 : 0) +
    answers.feedbackLog.length +
    answers.texts.length;

  const materials: MaterialChip[] = preferred
    .filter((t) => MATERIAL_INFO[t.tag])
    .slice(0, 4)
    .map((t) => {
      const info = MATERIAL_INFO[t.tag]!;
      const ref = info.refId ? getRef(info.refId) : undefined;
      return { tag: t.tag, name: info.name, note: info.note, image: ref?.image, color: info.color };
    });

  const primaryDef = DIRECTIONS.find((d) => d.id === directions[0]?.id);
  const secondaryDef = DIRECTIONS.find((d) => d.id === directions[1]?.id);
  const palette: Swatch[] = [];
  if (primaryDef) palette.push(...primaryDef.palette);
  if (secondaryDef) {
    const extra = secondaryDef.palette.find((s) => !palette.some((p) => p.name === s.name));
    if (extra) palette.push(extra);
  }
  // Respect explicit dislikes when composing the palette
  const avoidColor = (scores.color ?? 0) <= -0.5;
  const avoidMono = (scores.monocromo ?? 0) <= -0.5;
  const finalPalette = palette.filter((s) => {
    if (avoidColor && ["Terracota", "Petróleo", "Mostaza", "Verde botella"].includes(s.name)) return false;
    if (avoidMono && ["Niebla", "Acero", "Blanco"].includes(s.name)) return false;
    return true;
  });

  const lighting = preferred
    .filter((t) => LIGHT_LINES[t.tag])
    .map((t) => LIGHT_LINES[t.tag]!) ;

  const words: string[] = [];
  for (const t of preferred) {
    const w = WORDS[t.tag];
    if (w && !words.includes(w)) words.push(w);
    if (words.length >= 4) break;
  }

  const avoidLines = avoided.map((t) => capital(TAG_META[t.tag].negative));

  const ready = decisions >= 2 && !!directions[0] && directions[0].score > 0;

  return {
    ready,
    evidenceCount: decisions,
    primary: ready ? directions[0] : undefined,
    secondary: ready && directions[1] && directions[1].score > 0.15 ? directions[1] : undefined,
    directions,
    preferred,
    avoided,
    uncertain,
    materials,
    palette: ready ? finalPalette : [],
    lighting,
    atmosphereWords: words,
    avoidLines,
    contradiction: hasContradiction(scores),
  };
}

export function capital(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function listJoin(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

// ————————————————————————————————————————————— Scenario: hypothesis & refinement

export interface Hypothesis {
  id: "h-calidez" | "h-claridad" | "h-expresion" | "h-equilibrio";
  text: string;
  a: string;
  b: string;
  factors: string[];
}

export function buildHypothesis(answers: Answers): Hypothesis | null {
  if (!answers.atmosphere) return null;
  const signals = collectSignals(answers, 2);
  const scores = scoreMap(signals);
  const has = (a: AspectId) => answers.aspects.includes(a);
  const top = tagScores(signals)
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((t) => TAG_META[t.tag].positive);
  const factors = [...new Set(signals.filter((s) => s.weight > 0).map((s) => s.source))];

  const contradiction =
    (answers.atmosphere !== "eclectica" && has("detalles")) ||
    (answers.atmosphere === "eclectica" && (has("lineas") || has("paleta-calma"))) ||
    hasContradiction(scores);

  if (contradiction) {
    return {
      id: "h-equilibrio",
      text:
        "Veo que te atraen los espacios tranquilos, pero también te llaman los detalles expresivos. Quizá no se trata de minimalismo como tal, sino de cuántos elementos quieres ver a tu alrededor. ¿Lo comprobamos?",
      a: "hyp-calma-protagonista",
      b: "hyp-capas-intensas",
      factors,
    };
  }
  const warm = sum(scores, ["madera", "lino", "textil", "luz-difusa", "luz-calida", "paleta-calida", "paleta-calma"]);
  const clear = sum(scores, ["lineas-puras", "hormigon", "minimal", "contraste", "piedra"]);
  const expr = sum(scores, ["arte", "decoracion", "vintage", "color", "mezcla-texturas"]);

  if (expr >= warm && expr >= clear) {
    return {
      id: "h-expresion",
      text: `Parece que disfrutas de los espacios que cuentan historias: ${listJoin(top)}. La pregunta es cuánta intensidad buscas. ¿Lo comprobamos?`,
      a: "hyp-capas-serenas",
      b: "hyp-galeria-color",
      factors,
    };
  }
  if (clear > warm) {
    return {
      id: "h-claridad",
      text: `Parece que buscas orden visual: ${listJoin(top)}, pocas distracciones. Lo que aún no sé es si lo prefieres templado o absolutamente puro. ¿Lo comprobamos?`,
      a: "hyp-loft-templado",
      b: "hyp-galeria-blanca",
      factors,
    };
  }
  return {
    id: "h-calidez",
    text: `Parece que lo importante para ti no es la cantidad de decoración, sino la sensación de calidez: ${listJoin(top)} te resultan más cómodos que las superficies frías y rígidas. ¿Lo comprobamos?`,
    a: "hyp-roble-textil",
    b: "hyp-piedra-fria",
    factors,
  };
}

const HYP_REACTIONS: Record<Hypothesis["id"], Record<"a" | "b" | "none", string>> = {
  "h-calidez": {
    a: "Confirmado, al menos por ahora: la calidez pesa más que la pureza. Lo marco como algo que «ya se nota».",
    b: "Interesante: la versión fría te atrae más de lo que esperaba. Corrijo la hipótesis: quizá buscas orden y sobriedad más que calidez.",
    none: "Bien visto: ninguna de las dos. Eso me dice que la cuestión no es solo cálido o frío. Busquemos por otro lado.",
  },
  "h-claridad": {
    a: "Lo que te atrae es una claridad habitada: geometría, sí, pero con materia y luz natural.",
    b: "Prefieres la versión más pura: pocas texturas, blanco y volumen. No añadiré ruido.",
    none: "Ninguna de las dos. Quizá la claridad no sea el centro de la cuestión. Probemos otro enfoque.",
  },
  "h-expresion": {
    a: "Te gusta la expresión con contención: objetos con historia sobre una base tranquila.",
    b: "Vas a por todas: color, arte y capas. Nada tímido.",
    none: "Ni la versión contenida ni la intensa. Exploremos qué es lo que te incomoda.",
  },
  "h-equilibrio": {
    a: "Entonces no buscas minimalismo estricto, sino calma con un punto focal. Para el diseñador es una diferencia importante.",
    b: "Ajusto: la calma que buscas convive con bastante densidad. Te gustan los espacios llenos, siempre que resulten acogedores.",
    none: "Ninguno de los dos extremos. Busquemos qué es lo que te molesta en un espacio.",
  },
};

export function hypothesisReaction(h: Hypothesis, choice: "a" | "b" | "none") {
  return HYP_REACTIONS[h.id][choice];
}

export interface Refinement {
  id: "q-detalle" | "q-habitar" | "q-expresion" | "q-molestias";
  text: string;
  options: string[];
  negative?: boolean;
}

export function buildRefinement(answers: Answers): Refinement | null {
  const h = buildHypothesis(answers);
  if (!h || answers.hypothesis?.id !== h.id) return null;
  if (answers.hypothesis.choice === "none") {
    return {
      id: "q-molestias",
      text: "Probemos desde el otro lado. ¿Qué es lo que más te incomoda en un espacio?",
      options: ["det-sin-ruido", "det-sin-frio", "det-sin-luz"],
      negative: true,
    };
  }
  const scores = scoreMap(collectSignals(answers, 3));
  const warm = sum(scores, ["madera", "lino", "textil", "luz-difusa", "luz-calida", "paleta-calida", "paleta-calma"]);
  const clear = sum(scores, ["lineas-puras", "hormigon", "minimal", "contraste", "piedra", "monocromo"]);
  const expr = sum(scores, ["arte", "decoracion", "vintage", "color"]);

  if (expr > warm && expr > clear) {
    return {
      id: "q-expresion",
      text: "La expresión es parte de ti. ¿Dónde quieres que se concentre: en el color, en una pieza con pasado o en el arte?",
      options: ["det-color", "det-pieza-vintage", "det-arte"],
    };
  }
  if (clear > warm) {
    return {
      id: "q-habitar",
      text: "La claridad te atrae. ¿Qué la haría más habitable para ti: textiles, madera en bruto o una lámpara con presencia?",
      options: ["det-textil", "det-banco", "det-lampara"],
    };
  }
  return {
    id: "q-detalle",
    text: "Eliges espacios tranquilos, pero algo tiene que destacar. ¿Qué te resulta más cercano: una lámpara singular, una obra de arte o la textura expresiva de la madera?",
    options: ["det-lampara", "det-arte", "det-madera"],
  };
}

const REF_REACTIONS: Record<string, string> = {
  "det-lampara": "Una lámpara como pieza de autor: la luz será tu gesto expresivo. Encaja con lo que llevas elegido.",
  "det-arte": "Un lienzo grande en lugar de muchos objetos pequeños. Lo anoto: expresión concentrada.",
  "det-madera": "La expresión, en la materia. Buscaremos maderas con veta visible y acabados que envejezcan bien.",
  "det-textil": "Suavizar con tejido: la arquitectura se mantiene, pero el espacio se vuelve habitable.",
  "det-banco": "Madera en bruto contra superficies limpias: contraste de materia, no de color.",
  "det-color": "Color con carácter. Lo trataremos como protagonista en una o dos superficies, no en todas.",
  "det-pieza-vintage": "Piezas con pasado: el diseñador debería buscar una o dos de segunda mano, no un decorado de época.",
  "det-sin-ruido": "Anotado: nada de saturación. Menos objetos, mejor elegidos.",
  "det-sin-frio": "Anotado: fuera la luz fría y el brillo. Lo paso a la lista de cosas que evitar.",
  "det-sin-luz": "La luz natural es prioritaria para ti. Lo trasladaré al brief como requisito, no como deseo.",
};

export function refinementReaction(choice: string) {
  return REF_REACTIONS[choice] ?? "Anotado.";
}

export const ATMOSPHERE_REACTION: Record<string, string> = {
  calidez: "Buen comienzo. La calidez suele venir de los materiales y de la luz más que de la decoración.",
  claridad: "La claridad tiene mucho que ver con el orden: pocas líneas, bien resueltas.",
  eclectica: "Los espacios eclécticos cuentan quién vive en ellos. Veamos qué parte de esa mezcla es la tuya.",
};

// ————————————————————————————————————————————— Recommendations

/** Images the user already saw in the scenario (so we never show the same photo twice). */
export function shownImages(answers: Answers): Set<string> {
  const ids: string[] = ATMOSPHERES.map((a) => a.refId);
  const h = buildHypothesis(answers);
  if (h) ids.push(h.a, h.b);
  const r = buildRefinement(answers);
  if (r) ids.push(...r.options);
  return new Set(ids.map((id) => REF_BY_ID[id]?.image).filter(Boolean) as string[]);
}

export function refScore(ref: InteriorRef, scores: ScoreMap) {
  let s = 0;
  for (const [tag, v] of Object.entries(ref.tags)) {
    s += Math.max(-3, Math.min(3, scores[tag as Tag] ?? 0)) * (v ?? 0);
  }
  return s;
}

export function rankPool(answers: Answers, opts: { excludeRated?: boolean; excludeShown?: boolean } = {}) {
  const { excludeRated = true, excludeShown = true } = opts;
  const scores = scoreMap(collectSignals(answers));
  const fb = feedbackState(answers);
  const shown = excludeShown ? shownImages(answers) : new Set<string>();
  return POOL.filter((r) => !fb.rejected.includes(r.id))
    .filter((r) => !excludeRated || (!fb.liked.includes(r.id) && !fb.saved.includes(r.id)))
    .filter((r) => !shown.has(r.image))
    .map((r) => ({ ref: r, score: refScore(r, scores) }))
    .sort((a, b) => b.score - a.score || a.ref.id.localeCompare(b.ref.id));
}

/** Plain-language explanation for "¿Por qué me lo propones?" */
export function explainRef(ref: InteriorRef, answers: Answers): string {
  const signals = collectSignals(answers);
  const scores = scoreMap(signals);
  const matches = Object.entries(ref.tags)
    .filter(([t, v]) => (v ?? 0) >= 0.5 && (scores[t as Tag] ?? 0) > 0.5)
    .sort((a, b) => (scores[b[0] as Tag] ?? 0) * (b[1] ?? 0) - (scores[a[0] as Tag] ?? 0) * (a[1] ?? 0))
    .slice(0, 2)
    .map(([t]) => t as Tag);
  const conflicts = Object.entries(ref.tags)
    .filter(([t, v]) => (v ?? 0) >= 0.5 && (scores[t as Tag] ?? 0) <= -0.5)
    .map(([t]) => t as Tag);

  if (!matches.length) {
    return `Es una propuesta exploratoria: todavía no tengo suficientes datos sobre ${TAG_META[(Object.keys(ref.tags)[0] as Tag) ?? "madera"].positive}, así que quiero ver cómo reaccionas.`;
  }
  const src = signals.filter((s) => s.tag === matches[0] && s.weight > 0).pop()?.source;
  let text = `Te lo propongo porque te atraen ${listJoin(matches.map((t) => TAG_META[t].positive))}${src ? ` (${src})` : ""}.`;
  const lowDecor = (ref.tags.decoracion ?? 0) < 0.4 && (scores.decoracion ?? 0) < 0.5;
  const ROOM: Partial<Record<InteriorRef["room"], string>> = { dormitorio: "un dormitorio", comedor: "un comedor", bano: "un baño", estudio: "un espacio de trabajo", detalle: "un detalle a pequeña escala" };
  if (conflicts.length) {
    text += ` Ojo: tiene algo de ${TAG_META[conflicts[0]].positive}, que antes descartaste; lo incluyo para comprobar si es un límite firme.`;
  } else if ((ref.tags.curvas ?? 0) >= 0.6 && (scores.curvas ?? 0) < 0.5) {
    text += " Además suma formas curvas, algo que aún no habíamos probado contigo.";
  } else if (ROOM[ref.room]) {
    text += ` Aquí esa combinación aparece en ${ROOM[ref.room]}.`;
  } else if (lowDecor) {
    text += " Aquí aparece una combinación parecida, pero con menos decoración.";
  } else if ((ref.tags["luz-natural"] ?? 0) >= 0.8) {
    text += " Aquí la luz natural tiene todavía más protagonismo.";
  } else {
    text += " Es la misma idea, resuelta de otra manera.";
  }
  return text;
}

/** Short reaction after a like / reject / save */
export function feedbackReaction(ref: InteriorRef, action: "like" | "reject" | "save", answers: Answers): string {
  const before = scoreMap(collectSignals(answers));
  const strong = Object.entries(ref.tags)
    .filter(([, v]) => (v ?? 0) >= 0.6)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .map(([t]) => t as Tag);
  const named = strong.slice(0, 2).map((t) => TAG_META[t].positive);
  if (action === "reject") {
    const heavy = (ref.tags.decoracion ?? 0) >= 0.7 || (ref.tags["mezcla-texturas"] ?? 0) >= 0.8;
    const warmUser = (before["paleta-calida"] ?? 0) + (before["luz-calida"] ?? 0) > 1;
    if (heavy && warmUser) return "Entendido. Probemos a mantener la paleta cálida pero quitando carga visual.";
    return `Entendido, retiro ${q(ref.title)}. Le resto peso a ${listJoin(named)} y ajusto las siguientes propuestas.`;
  }
  const expressive = sum(ref.tags as ScoreMap, EXPRESSIVE) >= 1.6;
  const calmUser = sum(before, CALM) >= 2 && sum(before, EXPRESSIVE) < 1;
  if (expressive && calmUser) {
    return `Interesante: ${q(ref.title)} es más expresivo que lo que venías eligiendo. Quizá lo tuyo sea la calma con un punto de carácter. Lo tendré en cuenta.`;
  }
  if (action === "save") return `Guardado en tu moodboard. Refuerza la línea de ${listJoin(named)}.`;
  return `Anotado. ${q(ref.title)} refuerza ${listJoin(named)}.`;
}

// ————————————————————————————————————————————— Moodboard & brief helpers

export function itemNote(ref: InteriorRef, answers: Answers, origin: "guardado" | "me-gusta" | "sugerido") {
  const scores = scoreMap(collectSignals(answers));
  const best = Object.entries(ref.tags)
    .filter(([t, v]) => (v ?? 0) >= 0.5 && (scores[t as Tag] ?? 0) > 0.4)
    .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    .slice(0, 2)
    .map(([t]) => TAG_META[t as Tag].positive);
  const lead = origin === "guardado" ? "Lo guardaste" : origin === "me-gusta" ? "Te gustó" : "Sugerencia";
  return best.length ? `${lead}: ${listJoin(best)}.` : `${lead}: amplía tu dirección.`;
}

// ————————————————————————————————————————————— Explainability

export interface Factors {
  choices: string[];
  repeated: { tag: Tag; count: number }[];
  rejected: string[];
  uncertain: TagScore[];
}

/** What shaped the profile, grouped for the "¿Por qué?" panel. */
export function explainFactors(answers: Answers): Factors {
  const signals = collectSignals(answers);
  const profile = computeProfile(answers);
  const uniq = (arr: string[]) => [...new Set(arr)];
  return {
    choices: uniq(signals.filter((s) => s.weight > 0).map((s) => s.source)),
    repeated: profile.preferred
      .filter((t) => t.positives >= 2)
      .map((t) => ({ tag: t.tag, count: t.positives }))
      .slice(0, 6),
    rejected: uniq(signals.filter((s) => s.weight < 0).map((s) => s.source)),
    uncertain: [...profile.uncertain, ...profile.preferred.filter((t) => t.confidence === "explorando")].slice(0, 6),
  };
}
