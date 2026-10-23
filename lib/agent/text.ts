import type { Tag } from "@/types";

/**
 * Tiny keyword parser for free-text messages (Spanish).
 * Recognises interior vocabulary and simple negations — no language model involved.
 */
const LEXICON: [RegExp, Tag[]][] = [
  [/\b(madera|roble|nogal|fresno|pino|teca|maderas)\b/, ["madera"]],
  [/\b(lino|algodon|fibras? naturales?)\b/, ["lino"]],
  [/\b(textil|textiles|lana|boucle|mantas?|cortinas?|cojines?|alfombras?|tejidos?|terciopelo)\b/, ["textil"]],
  [/\b(piedra|marmol|travertino|granito|pizarra)\b/, ["piedra"]],
  [/\b(cal|estuco|yeso|tadelakt)\b/, ["cal"]],
  [/\b(ceramica|barro|terracota|azulejos?)\b/, ["ceramica"]],
  [/\b(hormigon|cemento|microcemento)\b/, ["hormigon"]],
  [/\b(metal|acero|cromo|aluminio|inox)\b/, ["metal"]],
  [/\b(brillo|brillante|brillantes|lacado|lacados|glossy|espejos?)\b/, ["brillo"]],
  [/\b(luz (suave|tenue|indirecta|difusa)|penumbra|lamparas?|apliques?)\b/, ["luz-difusa"]],
  [/\b(luz calida|luz amarilla|velas?)\b/, ["luz-calida"]],
  [/\b(luz natural|ventanas?|ventanales?|sol|luminos[oa])\b/, ["luz-natural"]],
  [/\b(luz fria|luz blanca|fluorescentes?|downlights?|focos?)\b/, ["luz-fria"]],
  [/\b(calm[ao]|seren[oa]|tranquil[oa]|neutros?|beige|arena|crema)\b/, ["paleta-calma"]],
  [/\b(calid[oa]|calidez|acogedor[a]?|tierra|terroso)\b/, ["paleta-calida"]],
  [/\b(gris|grises|blanco|blancos|monocrom[oa]|esteril|frio|fria)\b/, ["monocromo"]],
  [/\b(color|colores|colorido|intenso|verde|azul|rojo|mostaza)\b/, ["color"]],
  [/\b(lineas? (rectas|limpias|puras)|geometri[ac]a?|orden|ordenad[oa])\b/, ["lineas-puras"]],
  [/\b(curvas?|redondead[oa]s?|organic[oa]s?)\b/, ["curvas"]],
  [/\b(minimal|minimalista|sencill[oa]|despejad[oa]|vaci[oa]|pocos objetos)\b/, ["minimal"]],
  [/\b(contraste|contrastes|oscur[oa]s?|negro)\b/, ["contraste"]],
  [/\b(arte|cuadros?|pinturas?|obras?|grabados?|esculturas?|laminas?)\b/, ["arte"]],
  [/\b(vintage|antigu[oa]s?|retro|heredad[oa]s?|segunda mano|anticuario)\b/, ["vintage"]],
  [/\b(decoracion|objetos|recuerdos|adornos|recargad[oa])\b/, ["decoracion"]],
  [/\b(texturas?|mezcla)\b/, ["mezcla-texturas"]],
  [/\b(plantas?|vegetacion|jardin)\b/, ["plantas"]],
];

const NEGATORS = /\b(no|odio|detesto|evitar|evito|sin|nada de|ni|me agobia|me agobian|me sobra|me sobran|demasiad[oa]s?|menos|me cansa|me cansan|no soporto)\b/;

export function normalize(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export interface ParsedText {
  positive: Tag[];
  negative: Tag[];
}

export function parseText(raw: string): ParsedText {
  const text = normalize(raw);
  // Split into clauses so a negation only affects its own clause.
  const clauses = text.split(/[,.;!?]| pero | aunque | y no /);
  const pos = new Set<Tag>();
  const neg = new Set<Tag>();
  for (const clause of clauses) {
    if (!clause.trim()) continue;
    const negated = NEGATORS.test(clause);
    for (const [re, tags] of LEXICON) {
      if (re.test(clause)) {
        for (const t of tags) (negated ? neg : pos).add(t);
      }
    }
  }
  for (const t of neg) pos.delete(t);
  return { positive: [...pos], negative: [...neg] };
}
