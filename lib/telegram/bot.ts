/**
 * Telegram demo bot — local, deterministic.
 * Each user intent becomes a pure transformation of the shared project:
 * the answer is recorded (so the Studio sees it) and the bot's reply is appended.
 * No Telegram API, no network.
 */
import { ATMOSPHERES, TAG_META, getRef } from "@/lib/catalog";
import {
  ATMOSPHERE_REACTION,
  computeProfile,
  explainRef,
  feedbackReaction,
  listJoin,
  rankPool,
} from "@/lib/agent/engine";
import { buildMoodboard, textReply } from "@/lib/agent/scenario";
import { parseText } from "@/lib/agent/text";
import { newId } from "@/lib/project";
import type { AtmosphereId, Project, TelegramMessage } from "@/types";

export type QuickKey = "mas" | "atrevido" | "moodboard" | "perfil";

export const QUICK: Record<QuickKey, string> = {
  mas: "Muéstrame más",
  atrevido: "Algo más atrevido",
  moodboard: "Ver mi moodboard",
  perfil: "Resumen de mi perfil",
};

export type Intent =
  | { type: "start" }
  | { type: "atmosphere"; id: AtmosphereId }
  | { type: "card"; refId: string; action: "like" | "save" | "reject" | "why" }
  | { type: "quick"; key: QuickKey }
  | { type: "text"; text: string };

const DEFAULT_QUICK = Object.keys(QUICK) as QuickKey[];

function msg(from: "bot" | "user", text: string, extra: Partial<TelegramMessage> = {}): TelegramMessage {
  return { id: newId(), from, text, at: new Date().toISOString(), ...extra };
}

function shownInChat(p: Project) {
  return new Set(p.telegram.flatMap((m) => m.cards ?? []));
}

function nextCards(p: Project, n = 2, bold = false): string[] {
  const shown = shownInChat(p);
  let ranked = rankPool(p.answers).filter((r) => !shown.has(r.ref.id));
  if (bold) {
    const expr = (id: string) => {
      const t = getRef(id)!.tags;
      return (t.arte ?? 0) + (t.color ?? 0) + (t.contraste ?? 0) + (t.curvas ?? 0) + (t.vintage ?? 0);
    };
    ranked = ranked.slice(0, 10).sort((a, b) => expr(b.ref.id) - expr(a.ref.id));
  }
  return ranked.slice(0, n).map((r) => r.ref.id);
}

/** Opening message, based on whatever the project already knows. */
export function greeting(p: Project | null): TelegramMessage[] {
  if (!p || !p.answers.atmosphere) {
    return [
      msg("bot", "Hola, soy Forme, tu diseñador de interiores. Todavía no tenemos proyecto, así que empecemos aquí mismo."),
      msg("bot", "Imagina que vuelves a casa después de un día largo. ¿Qué atmósfera sientes más tuya?", {
        cards: ATMOSPHERES.map((a) => a.refId),
      }),
    ];
  }
  const tp = computeProfile(p.answers);
  const top = tp.preferred.slice(0, 2).map((t) => TAG_META[t.tag].positive);
  return [
    msg(
      "bot",
      top.length
        ? `He notado que te atraen especialmente ${listJoin(top)}. ¿Quieres ver algunas opciones más en esta línea?`
        : "He retomado tu proyecto. ¿Quieres ver algunas opciones nuevas?",
      { cards: nextCards(p), quick: DEFAULT_QUICK },
    ),
  ];
}

export function telegramTurn(p: Project, intent: Intent): Project {
  const now = new Date().toISOString();
  const answers = p.answers;
  const log = (refId: string, action: "like" | "save" | "reject") => ({
    ...answers,
    feedbackLog: [...answers.feedbackLog, { refId, action, at: now, channel: "telegram" as const }],
  });

  switch (intent.type) {
    case "start":
      return { ...p, telegram: [...p.telegram, ...greeting(p)] };

    case "atmosphere": {
      const a = ATMOSPHERES.find((x) => x.id === intent.id)!;
      const next: Project = {
        ...p,
        answers: { ...answers, atmosphere: intent.id },
        currentStep: Math.max(p.currentStep, 1),
        maxStep: Math.max(p.maxStep, 1),
        telegram: [...p.telegram, msg("user", `Me quedo con «${a.label}»`)],
      };
      return {
        ...next,
        telegram: [
          ...next.telegram,
          msg("bot", `${ATMOSPHERE_REACTION[a.id]} Te enseño dos referencias en esa dirección:`, {
            cards: nextCards(next),
            quick: DEFAULT_QUICK,
          }),
        ],
      };
    }

    case "card": {
      const ref = getRef(intent.refId);
      if (!ref) return p;
      if (intent.action === "why") {
        return {
          ...p,
          telegram: [...p.telegram, msg("user", `¿Por qué me propones «${ref.title}»?`), msg("bot", explainRef(ref, answers), { quick: DEFAULT_QUICK })],
        };
      }
      const userText =
        intent.action === "like" ? `Me gusta «${ref.title}»` : intent.action === "save" ? `Guardar «${ref.title}» en el moodboard` : `«${ref.title}» no encaja`;
      const reply = feedbackReaction(ref, intent.action, answers);
      const next: Project = { ...p, answers: log(ref.id, intent.action), telegram: [...p.telegram, msg("user", userText)] };
      const cards = intent.action === "save" ? [] : nextCards(next);
      return {
        ...next,
        telegram: [
          ...next.telegram,
          msg("bot", cards.length ? `${reply} ${intent.action === "reject" ? "Prueba con estas:" : "Sigo en esa línea:"}` : reply, {
            cards: cards.length ? cards : undefined,
            quick: DEFAULT_QUICK,
          }),
        ],
      };
    }

    case "quick": {
      const label = QUICK[intent.key];
      const withUser: Project = { ...p, telegram: [...p.telegram, msg("user", label)] };
      if (intent.key === "mas" || intent.key === "atrevido") {
        const cards = nextCards(withUser, 2, intent.key === "atrevido");
        const text = !cards.length
          ? "Ya te he enseñado todas las referencias que tengo en esta demo. Puedes revisar tu moodboard en el estudio."
          : intent.key === "atrevido"
            ? "Probemos a salir un poco de tu zona de confort: la misma base, con más carácter."
            : "Aquí tienes dos más en tu línea.";
        return { ...withUser, telegram: [...withUser.telegram, msg("bot", text, { cards: cards.length ? cards : undefined, quick: DEFAULT_QUICK })] };
      }
      if (intent.key === "moodboard") {
        const board = buildMoodboard(answers);
        const text = board.items.length
          ? `Tu moodboard tiene ${board.items.length} piezas. ${board.notes[0] ?? ""}`
          : "Tu moodboard aún está vacío. Guarda alguna referencia y lo empezamos.";
        return {
          ...withUser,
          telegram: [...withUser.telegram, msg("bot", text, { cards: board.items.slice(0, 4).map((i) => i.refId), quick: DEFAULT_QUICK })],
        };
      }
      const tp = computeProfile(answers);
      const lines = tp.primary
        ? [
            `Dirección: ${tp.primary.name}${tp.secondary ? `, con matices de ${tp.secondary.name.toLowerCase()}` : ""}.`,
            tp.atmosphereWords.length ? `Atmósfera: ${tp.atmosphereWords.join(", ")}.` : "",
            tp.materials.length ? `Materiales: ${tp.materials.map((m) => m.name.toLowerCase()).join(", ")}.` : "",
            tp.avoidLines.length ? `Evitar: ${tp.avoidLines.slice(0, 3).join(", ").toLowerCase()}.` : "",
          ]
        : ["Todavía no tengo datos suficientes para un perfil. Elige un par de referencias y vuelvo a intentarlo."];
      return { ...withUser, telegram: [...withUser.telegram, msg("bot", lines.filter(Boolean).join("\n"), { quick: DEFAULT_QUICK })] };
    }

    case "text": {
      const text = intent.text.trim().slice(0, 400);
      if (!text) return p;
      const next: Project = {
        ...p,
        answers: { ...answers, texts: [...answers.texts, { id: newId(), text, at: now, channel: "telegram" }] },
        telegram: [...p.telegram, msg("user", text)],
      };
      const parsed = parseText(text);
      const recognized = parsed.positive.length + parsed.negative.length > 0;
      const cards = recognized && next.answers.atmosphere ? nextCards(next) : [];
      return {
        ...next,
        telegram: [
          ...next.telegram,
          msg("bot", recognized && cards.length ? `${textReply(text)} Mira estas:` : textReply(text), {
            cards: cards.length ? cards : undefined,
            quick: DEFAULT_QUICK,
          }),
        ],
      };
    }
  }
}
