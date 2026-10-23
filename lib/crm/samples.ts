/**
 * SAMPLE DATA — fictional clients for the CRM demo.
 * Their answers run through the same engine as real sessions, so profiles,
 * moodboards and briefs are computed, not hand-written.
 */
import { emptyAnswers } from "@/lib/agent/engine";
import { withSnapshot, SCHEMA } from "@/lib/project";
import type { Answers, CrmStatus, FeedbackAction, Project, StepId } from "@/types";

type Fb = [string, FeedbackAction];

function answers(base: Partial<Answers>, fb: Fb[], day: string): Answers {
  return {
    ...emptyAnswers(),
    ...base,
    profileConfirmed: true,
    feedbackDone: true,
    moodboardDone: true,
    projectDone: true,
    feedbackLog: fb.map(([refId, action], i) => ({
      refId,
      action,
      at: `${day}T10:${String(10 + i).padStart(2, "0")}:00.000Z`,
      channel: i === fb.length - 1 ? "telegram" : "studio",
      step: "feedback" as StepId,
    })),
  };
}

export interface CrmEntry {
  id: string;
  client: string;
  status: CrmStatus;
  sample: boolean;
  project: Project;
}

const RAW: { id: string; client: string; status: CrmStatus; date: string; a: Answers }[] = [
  {
    id: "FR-2041",
    client: "Lucía M.",
    status: "nuevo",
    date: "2026-10-21",
    a: answers(
      {
        atmosphere: "calidez",
        aspects: ["natural", "luz-suave", "paleta-calma"],
        hypothesis: { id: "h-calidez", choice: "a" },
        refinement: { id: "q-detalle", choice: "det-lampara" },
        project: {
          roomType: "Salón",
          roomArea: "32",
          budget: "15.000 – 40.000 €",
          functional: ["Teletrabajo", "Leer y descansar"],
          constraints: "Mantener el suelo de terrazo original.",
        },
      },
      [
        ["r-comedor-dorado", "like"],
        ["r-dormitorio-lino", "save"],
        ["r-gabinete", "reject"],
        ["r-cortina-ramas", "save"],
        ["r-wabi-comedor", "like"],
      ],
      "2026-10-21",
    ),
  },
  {
    id: "FR-2038",
    client: "Daniel y Marta",
    status: "reunion",
    date: "2026-10-18",
    a: answers(
      {
        atmosphere: "eclectica",
        aspects: ["detalles", "acogedor"],
        aspectsNote: "Nos encantan los muebles heredados y las plantas",
        hypothesis: { id: "h-expresion", choice: "b" },
        refinement: { id: "q-expresion", choice: "det-pieza-vintage" },
        project: {
          roomType: "Vivienda completa",
          roomArea: "85",
          budget: "Más de 40.000 €",
          goal: "Una casa que se sienta vivida desde el primer día, con sitio para nuestras cosas.",
          functional: ["Niños en casa", "Mascotas", "Recibir invitados"],
        },
      },
      [
        ["r-gabinete", "save"],
        ["r-selva", "like"],
        ["r-galeria", "reject"],
        ["r-chimenea", "save"],
        ["r-gris-sobrio", "reject"],
      ],
      "2026-10-18",
    ),
  },
  {
    id: "FR-2033",
    client: "Cliente 2033",
    status: "concepto",
    date: "2026-10-12",
    a: answers(
      {
        atmosphere: "claridad",
        aspects: ["lineas", "paleta-calma"],
        hypothesis: { id: "h-claridad", choice: "a" },
        refinement: { id: "q-habitar", choice: "det-textil" },
        project: { roomType: "Dormitorio", roomArea: "14", budget: "5.000 – 15.000 €", functional: ["Mucho almacenaje"] },
      },
      [
        ["r-ventana-jardin", "save"],
        ["r-panel-blanco", "like"],
        ["r-chimenea", "reject"],
        ["r-cactus-hormigon", "like"],
      ],
      "2026-10-12",
    ),
  },
  {
    id: "FR-2029",
    client: "Inés R.",
    status: "revision",
    date: "2026-10-08",
    a: answers(
      {
        atmosphere: "calidez",
        aspects: ["natural", "detalles"],
        aspectsNote: "Paredes de cal y cerámica hecha a mano, como en las casas de mi abuela",
        hypothesis: { id: "h-equilibrio", choice: "a" },
        refinement: { id: "q-detalle", choice: "det-madera" },
        project: { roomType: "Comedor", budget: "Aún no lo sé", functional: ["Cocinar a diario", "Recibir invitados"] },
      },
      [
        ["r-comedor-arco", "save"],
        ["r-ceramica", "save"],
        ["r-coleccionista", "reject"],
        ["r-cuencos", "save"],
        ["r-wabi-banco", "like"],
      ],
      "2026-10-08",
    ),
  },
  {
    id: "FR-2017",
    client: "Pablo G.",
    status: "archivado",
    date: "2026-09-26",
    a: answers(
      {
        atmosphere: "calidez",
        aspects: ["luz-suave"],
        hypothesis: { id: "h-calidez", choice: "none" },
        refinement: { id: "q-molestias", choice: "det-sin-frio" },
        project: { roomType: "Estudio o despacho", roomArea: "11", budget: "Hasta 5.000 €", functional: ["Teletrabajo"] },
      },
      [
        ["r-sofa-oliva", "like"],
        ["r-vidrio", "reject"],
        ["r-arte-lampara", "like"],
      ],
      "2026-09-26",
    ),
  },
];

let cache: CrmEntry[] | null = null;

export function sampleEntries(): CrmEntry[] {
  if (cache) return cache;
  cache = RAW.map((r) => {
    const at = `${r.date}T11:00:00.000Z`;
    const project = withSnapshot({
      schemaVersion: SCHEMA,
      conversationId: r.id,
      name: "",
      createdAt: `${r.date}T09:30:00.000Z`,
      updatedAt: at,
      currentStep: 8,
      maxStep: 8,
      answers: r.a,
      telegram: [],
      briefCreatedAt: at,
    });
    return { id: r.id, client: r.client, status: r.status, sample: true, project };
  });
  return cache;
}

export const STATUS_LABEL: Record<CrmStatus, string> = {
  borrador: "Explorando",
  nuevo: "Brief nuevo",
  revision: "En revisión",
  reunion: "Reunión agendada",
  concepto: "En concepto",
  archivado: "Archivado",
};

export const STATUS_ORDER: CrmStatus[] = ["borrador", "nuevo", "revision", "reunion", "concepto", "archivado"];
