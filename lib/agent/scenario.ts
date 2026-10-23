import { ASPECTS, ATMOSPHERES, REF_BY_ID, getRef } from "@/lib/catalog";
import {
  ATMOSPHERE_REACTION,
  buildHypothesis,
  buildRefinement,
  computeProfile,
  feedbackReaction,
  feedbackState,
  hypothesisReaction,
  itemNote,
  listJoin,
  rankPool,
  refinementReaction,
  capital,
} from "@/lib/agent/engine";
import { parseText } from "@/lib/agent/text";
import { TAG_META } from "@/lib/catalog";
import type { Answers, ChatMessage, Moodboard, MoodItem, StepId } from "@/types";

export const STEPS: { id: StepId; label: string; hint: string }[] = [
  { id: "atmosfera", label: "Atmósfera", hint: "Cómo quieres sentirte al llegar" },
  { id: "aspectos", label: "Lo que te atrae", hint: "Qué hay detrás de tu elección" },
  { id: "hipotesis", label: "Hipótesis", hint: "Comprobamos una primera idea" },
  { id: "detalle", label: "El detalle", hint: "Dónde está la expresión" },
  { id: "perfil", label: "Tu perfil", hint: "Lo que ya se nota" },
  { id: "feedback", label: "Nuevas propuestas", hint: "Valora y ajusta" },
  { id: "moodboard", label: "Moodboard", hint: "Tu selección editada" },
  { id: "proyecto", label: "Tu proyecto", hint: "Espacio, metros, presupuesto" },
  { id: "brief", label: "Brief", hint: "Listo para el diseñador" },
];

export const stepIndex = (id: StepId) => STEPS.findIndex((s) => s.id === id);

/** Highest step the user may open, given which answers are still valid. */
export function reachableStep(answers: Answers, storedMax: number): number {
  if (!answers.atmosphere) return 0;
  if (!answers.aspects.length && !answers.aspectsNote) return Math.min(storedMax, 1);
  const h = buildHypothesis(answers);
  if (!h || answers.hypothesis?.id !== h.id) return Math.min(storedMax, 2);
  const r = buildRefinement(answers);
  if (!r || answers.refinement?.id !== r.id) return Math.min(storedMax, 3);
  if (!answers.profileConfirmed) return Math.min(storedMax, 4);
  if (!answers.feedbackDone) return Math.min(storedMax, 5);
  if (!answers.moodboardDone) return Math.min(storedMax, 6);
  if (!answers.projectDone) return Math.min(storedMax, 7);
  return Math.min(storedMax, 8);
}

/** Remove answers that no longer make sense after an earlier answer changed. */
export function pruneAnswers(a: Answers): Answers {
  const next = { ...a };
  const h = buildHypothesis(next);
  if (next.hypothesis && (!h || next.hypothesis.id !== h.id)) next.hypothesis = undefined;
  const r = buildRefinement(next);
  if (next.refinement && (!r || next.refinement.id !== r.id || !r.options.includes(next.refinement.choice))) {
    next.refinement = undefined;
  }
  return next;
}

// ————————————————————————————————————————————— Transcript

export const GREETING =
  "Hola. Vamos a intentar encontrar el interior en el que te sientas realmente bien. No hace falta saber nombres de estilos: elige lo que sientas.";

export function textReply(text: string): string {
  const { positive, negative } = parseText(text);
  if (!positive.length && !negative.length) {
    return "No he reconocido materiales ni sensaciones concretas en ese mensaje, así que no cambio tu perfil. Prueba con algo como «me agobia el blanco frío» o «me encanta el lino».";
  }
  const parts: string[] = [];
  if (positive.length) parts.push(`sumo ${listJoin(positive.map((t) => TAG_META[t].positive))}`);
  if (negative.length) parts.push(`resto peso a ${listJoin(negative.map((t) => TAG_META[t].positive))}`);
  return `Anotado: ${parts.join(" y ")}. El perfil y las propuestas ya lo tienen en cuenta.`;
}

export function buildTranscript(answers: Answers, currentStep: number): ChatMessage[] {
  const out: ChatMessage[] = [];
  const add = (m: ChatMessage) => out.push(m);
  const texts = (step: StepId) =>
    answers.texts
      .filter((t) => t.channel === "studio" && t.step === step)
      .forEach((t) => {
        add({ id: `${t.id}-u`, role: "user", text: t.text, step });
        add({ id: `${t.id}-a`, role: "agent", text: textReply(t.text), step, tone: "reaction" });
      });

  // 1 — atmosphere
  add({ id: "hello", role: "agent", text: GREETING, step: "atmosfera" });
  add({
    id: "atm-q",
    role: "agent",
    text: "Imagina que vuelves a casa después de un día largo. ¿Qué atmósfera sientes más tuya?",
    step: "atmosfera",
    tone: "question",
  });
  const atm = ATMOSPHERES.find((a) => a.id === answers.atmosphere);
  if (atm) {
    add({ id: "atm-u", role: "user", text: atm.label, step: "atmosfera" });
    add({ id: "atm-r", role: "agent", text: ATMOSPHERE_REACTION[atm.id], step: "atmosfera", tone: "reaction" });
  }
  texts("atmosfera");
  if (!atm || currentStep < 1) return out;

  // 2 — aspects
  add({ id: "asp-q", role: "agent", text: "Interesante. ¿Qué es lo que más te atrae de ese espacio? Puedes elegir varias cosas o escribirlo con tus palabras.", step: "aspectos", tone: "question" });
  const aspectLabels = answers.aspects.map((id) => ASPECTS.find((a) => a.id === id)?.label).filter(Boolean) as string[];
  if (aspectLabels.length || answers.aspectsNote) {
    const parts = [aspectLabels.join(" · "), answers.aspectsNote ? `«${answers.aspectsNote}»` : ""].filter(Boolean);
    add({ id: "asp-u", role: "user", text: parts.join(" — "), step: "aspectos" });
    const p = computeProfile(answers, 2);
    const words = p.atmosphereWords.slice(0, 3);
    add({
      id: "asp-r",
      role: "agent",
      text: words.length
        ? `Entonces buscas una atmósfera ${listJoin(words)}. Tengo una primera idea.`
        : "Gracias. Con esto ya puedo formular una primera idea.",
      step: "aspectos",
      tone: "reaction",
    });
  }
  texts("aspectos");
  if (currentStep < 2) return out;

  // 3 — hypothesis
  const h = buildHypothesis(answers);
  if (h) {
    add({ id: `hyp-q-${h.id}`, role: "agent", text: h.text, step: "hipotesis", tone: "hypothesis" });
    if (answers.hypothesis?.id === h.id) {
      const c = answers.hypothesis.choice;
      const label = c === "none" ? "Ninguna de las dos" : REF_BY_ID[c === "a" ? h.a : h.b].title;
      add({ id: "hyp-u", role: "user", text: label, step: "hipotesis" });
      add({ id: "hyp-r", role: "agent", text: hypothesisReaction(h, c), step: "hipotesis", tone: "reaction" });
    }
  }
  texts("hipotesis");
  if (currentStep < 3) return out;

  // 4 — refinement
  const r = buildRefinement(answers);
  if (r) {
    add({ id: `ref-q-${r.id}`, role: "agent", text: r.text, step: "detalle", tone: "question" });
    if (answers.refinement?.id === r.id) {
      add({ id: "ref-u", role: "user", text: REF_BY_ID[answers.refinement.choice]?.title ?? "", step: "detalle" });
      add({ id: "ref-r", role: "agent", text: refinementReaction(answers.refinement.choice), step: "detalle", tone: "reaction" });
    }
  }
  texts("detalle");
  if (currentStep < 4) return out;

  // 5 — profile
  const p = computeProfile(answers);
  add({
    id: "prof-q",
    role: "agent",
    text: `Con lo que me has enseñado, este es tu perfil por ahora${p.primary ? `: la dirección que más encaja es ${p.primary.name.toLowerCase()}` : ""}. Lo marcado como «ya se nota» está confirmado por varias elecciones; lo que pone «aún explorando» es una hipótesis. Si algo no encaja, quítalo.`,
    step: "perfil",
    tone: "note",
  });
  answers.corrections.forEach((c, i) =>
    add({ id: `corr-${i}`, role: "user", text: `${TAG_META[c.tag].label}: no encaja conmigo.`, step: "perfil" }),
  );
  if (answers.corrections.length) {
    add({ id: "corr-r", role: "agent", text: "Corregido. Esos rasgos pasan a la lista de cosas que evitar y dejan de pesar en las propuestas.", step: "perfil", tone: "reaction" });
  }
  if (answers.profileConfirmed) add({ id: "prof-u", role: "user", text: "Encaja. Sigamos.", step: "perfil" });
  texts("perfil");
  if (currentStep < 5) return out;

  // 6 — feedback
  add({
    id: "fb-q",
    role: "agent",
    text: "Te propongo referencias nuevas. Valóralas: cada «me gusta» o «no encaja» cambia lo que te enseño después. Si quieres saber por qué aparece una imagen, pregúntamelo.",
    step: "feedback",
    tone: "question",
  });
  timeline(answers, "feedback").forEach(add);
  if (currentStep < 6) return out;

  // 7 — moodboard
  add({
    id: "mb-q",
    role: "agent",
    text: "He reunido tu moodboard: lo que guardaste y te gustó, completado con lo que mejor encaja. Puedes quitar piezas o marcar las que no te convencen; lo recompongo al momento.",
    step: "moodboard",
    tone: "note",
  });
  timeline(answers, "moodboard").forEach(add);
  if (currentStep < 7) return out;

  // 8 — project
  add({
    id: "pr-q",
    role: "agent",
    text: "Antes de preparar el brief, unos datos del proyecto. Todo es opcional: si algo no lo sabes, déjalo en blanco. No voy a inventarlo.",
    step: "proyecto",
    tone: "question",
  });
  if (answers.projectDone) {
    const pi = answers.project;
    const bits = [pi.roomType, pi.roomArea ? `${pi.roomArea} m²` : null, pi.budget, ...pi.functional].filter(Boolean);
    add({ id: "pr-u", role: "user", text: bits.length ? bits.join(" · ") : "Prefiero no concretar todavía.", step: "proyecto" });
  }
  texts("proyecto");
  if (currentStep < 8) return out;

  add({
    id: "br-q",
    role: "agent",
    text: "Tu brief está listo. Lo he construido solo con lo que me has dicho y enseñado; las dudas quedan como preguntas abiertas para el diseñador.",
    step: "brief",
    tone: "note",
  });
  texts("brief");
  return out;
}

/** Feedback events and free-text messages of a step, in chronological order. */
function timeline(answers: Answers, step: StepId): ChatMessage[] {
  const fb = feedbackMessages(answers, step);
  const tx = answers.texts
    .filter((t) => t.channel === "studio" && t.step === step)
    .map((t) => ({
      at: t.at,
      msgs: [
        { id: `${t.id}-u`, role: "user", text: t.text, step } as ChatMessage,
        { id: `${t.id}-a`, role: "agent", text: textReply(t.text), step, tone: "reaction" } as ChatMessage,
      ],
    }));
  return [...fb, ...tx].sort((a, b) => a.at.localeCompare(b.at)).flatMap((x) => x.msgs);
}

function feedbackMessages(answers: Answers, step: StepId): { at: string; msgs: ChatMessage[] }[] {
  const out: { at: string; msgs: ChatMessage[] }[] = [];
  answers.feedbackLog.forEach((e, i) => {
    if (e.channel !== "studio" || e.step !== step) return;
    const ref = getRef(e.refId);
    if (!ref) return;
    if (e.action !== "like" && e.action !== "save" && e.action !== "reject") return;
    const verb = e.action === "like" ? "Me gusta" : e.action === "save" ? "Guardar" : "No encaja";
    const prior = { ...answers, feedbackLog: answers.feedbackLog.slice(0, i) };
    out.push({
      at: e.at,
      msgs: [
        { id: `fb-${i}-u`, role: "user", text: `${verb}: ${ref.title}`, step },
        { id: `fb-${i}-a`, role: "agent", text: feedbackReaction(ref, e.action, prior), step, tone: "reaction" },
      ],
    });
  });
  return out;
}

// ————————————————————————————————————————————— Moodboard

export function buildMoodboard(answers: Answers): Moodboard {
  const fb = feedbackState(answers);
  const removed = new Set(answers.moodboardRemoved);
  const items: MoodItem[] = [];
  const push = (id: string, origin: MoodItem["origin"]) => {
    const ref = getRef(id);
    if (!ref || removed.has(id) || fb.rejected.includes(id) || items.some((x) => x.refId === id)) return;
    items.push({ refId: id, origin, note: itemNote(ref, answers, origin) });
  };
  fb.saved.forEach((id) => push(id, "guardado"));
  fb.liked.forEach((id) => push(id, "me-gusta"));
  if (items.length < 6) {
    for (const { ref } of rankPool(answers, { excludeShown: true })) {
      if (items.length >= 6) break;
      push(ref.id, "sugerido");
    }
  }
  const profile = computeProfile(answers);
  const notes: string[] = [];
  if (profile.primary) {
    notes.push(
      `La base es ${profile.primary.name.toLowerCase()}${profile.materials.length ? `: ${listJoin(profile.materials.slice(0, 3).map((m) => m.name.toLowerCase()))}` : ""}.`,
    );
  }
  if (profile.lighting[0]) notes.push(profile.lighting[0]);
  if (profile.avoidLines.length) notes.push(`Fuera del tablero: ${listJoin(profile.avoidLines.slice(0, 3).map((l) => l.toLowerCase()))}.`);
  if (profile.contradiction) notes.push("Tensión interesante: calma de fondo con un punto de carácter. Merece una conversación con el diseñador.");
  return { items: items.slice(0, 6), palette: profile.palette, materials: profile.materials, notes };
}

export function projectTitle(answers: Answers) {
  const p = computeProfile(answers);
  const room = answers.project.roomType ?? "Espacio sin definir";
  return p.primary ? `${room} · ${capital(p.primary.name.toLowerCase())}` : room;
}
