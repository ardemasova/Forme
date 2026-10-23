import { computeProfile, listJoin } from "@/lib/agent/engine";
import { buildMoodboard } from "@/lib/agent/scenario";
import { TAG_META, getRef } from "@/lib/catalog";
import type { Answers, Brief } from "@/types";

const FUNCTIONAL_QUESTIONS: Record<string, string> = {
  Teletrabajo: "¿Cuántas horas al día se trabaja en casa y qué iluminación de tarea se necesita?",
  "Niños en casa": "¿Qué edades tienen los niños? Afecta a tejidos, esquinas y almacenaje a su altura.",
  Mascotas: "¿Qué mascotas hay? Conviene elegir tapicerías y suelos resistentes.",
  "Mucho almacenaje": "¿Qué hay que guardar exactamente y cuánto? Mejor medirlo antes de proponer.",
  "Recibir invitados": "¿Con qué frecuencia y cuántas personas? Define asientos extra y mesa extensible.",
  "Cocinar a diario": "¿Qué equipamiento es imprescindible en la cocina?",
  "Leer y descansar": "¿Dónde está hoy el rincón de lectura y qué luz tiene?",
  Accesibilidad: "¿Qué necesidades concretas de accesibilidad hay que contemplar?",
};

export function buildBrief(answers: Answers, generatedAt: string): Brief {
  const profile = computeProfile(answers);
  const mood = buildMoodboard(answers);
  const pi = answers.project;
  const room = pi.roomType;

  const goalFromUser = !!pi.goal?.trim();
  const goal = goalFromUser
    ? pi.goal!.trim()
    : `Crear ${room ? `un ${room.toLowerCase()}` : "un espacio"} con una atmósfera ${listJoin(profile.atmosphereWords.slice(0, 3)) || "propia"}, a partir de las preferencias exploradas con Forme.`;

  const openQuestions: string[] = [];
  if (!room) openQuestions.push("Confirmar qué espacio se va a diseñar.");
  if (!pi.roomArea) openQuestions.push("Medir la superficie y tomar fotos del estado actual.");
  if (!pi.budget || pi.budget === "Aún no lo sé") openQuestions.push("Definir un rango de presupuesto antes del concepto.");
  for (const t of profile.preferred.filter((x) => x.confidence === "explorando").slice(0, 2)) {
    openQuestions.push(`Validar en persona cuánta presencia debe tener «${TAG_META[t.tag].label.toLowerCase()}»: es una preferencia aún poco confirmada.`);
  }
  if (profile.contradiction) {
    openQuestions.push("Equilibrio entre calma y expresión: ¿cuántos objetos y piezas de carácter quiere ver a diario?");
  }
  if (answers.hypothesis?.choice === "none") {
    openQuestions.push("Ninguna de las direcciones iniciales convenció del todo: revisar referencias juntos en la primera reunión.");
  }
  for (const f of pi.functional) if (FUNCTIONAL_QUESTIONS[f]) openQuestions.push(FUNCTIONAL_QUESTIONS[f]);

  const visible = profile.primary
    ? profile.preferred.filter((t) => t.confidence === "visible").length >= 3
      ? "visible"
      : "explorando"
    : "explorando";

  return {
    generatedAt,
    roomType: room,
    roomArea: pi.roomArea?.trim() || undefined,
    goal,
    goalFromUser,
    atmosphere: profile.atmosphereWords,
    direction: profile.primary
      ? { primary: profile.primary.name, secondary: profile.secondary?.name, confidence: visible }
      : undefined,
    palette: profile.palette,
    materials: profile.materials.map((m) => `${m.name} — ${m.note}`),
    lighting: profile.lighting,
    avoid: profile.avoidLines,
    references: mood.items.map((i) => ({ id: i.refId, title: getRef(i.refId)?.title ?? i.refId })),
    budget: pi.budget,
    functional: [...pi.functional, ...(pi.functionalNote?.trim() ? [pi.functionalNote.trim()] : [])],
    constraints: pi.constraints?.trim() || undefined,
    openQuestions,
  };
}

export function briefToMarkdown(b: Brief, title: string): string {
  const d = new Date(b.generatedAt);
  const lines: string[] = [];
  const list = (arr: string[], empty = "—") => (arr.length ? arr.map((x) => `- ${x}`).join("\n") : empty);
  lines.push(`# ${title}`);
  lines.push(`Brief generado con Forme (prototipo de demostración) · ${d.toLocaleDateString("es-ES")}`);
  lines.push("");
  lines.push(`## 1. Tipo de espacio\n${b.roomType ?? "Sin especificar"}${b.roomArea ? ` · ${b.roomArea} m²` : ""}`);
  lines.push(`## 2. Objetivo del proyecto\n${b.goal}${b.goalFromUser ? "" : "\n_(Formulado a partir de las respuestas)_"}`);
  lines.push(`## 3. Atmósfera\n${b.atmosphere.length ? b.atmosphere.join(", ") : "—"}`);
  lines.push(
    `## 4. Dirección visual\n${b.direction ? `${b.direction.primary}${b.direction.secondary ? `, con matices de ${b.direction.secondary.toLowerCase()}` : ""} (${b.direction.confidence === "visible" ? "ya se nota" : "aún explorando"})` : "Aún sin definir"}`,
  );
  lines.push(`## 5. Paleta\n${list(b.palette.map((s) => `${s.name} ${s.hex}`))}`);
  lines.push(`## 6. Materiales\n${list(b.materials)}`);
  lines.push(`## 7. Iluminación\n${list(b.lighting, "Sin preferencias claras todavía")}`);
  lines.push(`## 8. Evitar\n${list(b.avoid, "No se han detectado rechazos claros")}`);
  lines.push(`## 9. Referencias guardadas\n${list(b.references.map((r) => r.title))}`);
  lines.push(`## 10. Presupuesto\n${b.budget ?? "No indicado"}`);
  lines.push(`## 11. Necesidades funcionales\n${list(b.functional, "No indicadas")}${b.constraints ? `\n\n**Limitaciones / elementos obligatorios:** ${b.constraints}` : ""}`);
  lines.push(`## 12. Preguntas abiertas para el diseñador\n${list(b.openQuestions, "Ninguna")}`);
  lines.push("");
  lines.push("---\nLas preferencias son hipótesis construidas a partir de elecciones visuales, no conclusiones definitivas.");
  return lines.join("\n\n");
}
