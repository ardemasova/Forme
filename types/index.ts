/**
 * Shared domain model for Forme.
 * Everything here is plain JSON so it can live in localStorage.
 */

export type Tag =
  | "madera"
  | "lino"
  | "textil"
  | "piedra"
  | "cal"
  | "ceramica"
  | "hormigon"
  | "metal"
  | "brillo"
  | "luz-difusa"
  | "luz-calida"
  | "luz-natural"
  | "luz-fria"
  | "paleta-calma"
  | "paleta-calida"
  | "monocromo"
  | "color"
  | "lineas-puras"
  | "curvas"
  | "minimal"
  | "contraste"
  | "arte"
  | "vintage"
  | "decoracion"
  | "mezcla-texturas"
  | "plantas";

export type TagGroup = "material" | "luz" | "paleta" | "forma" | "densidad";

export type Room =
  | "salon"
  | "dormitorio"
  | "comedor"
  | "cocina"
  | "bano"
  | "estudio"
  | "detalle"
  | "material";

export interface InteriorRef {
  id: string;
  title: string;
  caption: string;
  /** Unsplash photo id (the part after `photo-`) */
  image: string;
  room: Room;
  /** 0..1 — how strongly the image expresses each attribute */
  tags: Partial<Record<Tag, number>>;
  /** Colours used by the offline fallback plate */
  palette: [string, string, string, string];
  /** Whether it can appear in the recommendation pool */
  pool?: boolean;
}

export type AtmosphereId = "calidez" | "claridad" | "eclectica";
export type AspectId =
  | "natural"
  | "luz-suave"
  | "paleta-calma"
  | "lineas"
  | "detalles"
  | "acogedor";

export type FeedbackAction = "like" | "reject" | "save" | "unsave" | "unlike" | "restore";
export type Channel = "studio" | "telegram";

export interface FeedbackEvent {
  refId: string;
  action: FeedbackAction;
  at: string;
  channel: Channel;
  step?: StepId;
}

export interface TextSignal {
  id: string;
  text: string;
  at: string;
  channel: Channel;
  step?: StepId;
}

export interface Correction {
  tag: Tag;
  at: string;
}

export interface ProjectInfo {
  roomType?: string;
  roomArea?: string;
  budget?: string;
  goal?: string;
  functional: string[];
  functionalNote?: string;
  constraints?: string;
}

export interface Answers {
  atmosphere?: AtmosphereId;
  aspects: AspectId[];
  aspectsNote?: string;
  hypothesis?: { id: string; choice: "a" | "b" | "none" };
  refinement?: { id: string; choice: string };
  profileConfirmed?: boolean;
  feedbackDone?: boolean;
  moodboardDone?: boolean;
  projectDone?: boolean;
  corrections: Correction[];
  feedbackLog: FeedbackEvent[];
  moodboardRemoved: string[];
  texts: TextSignal[];
  project: ProjectInfo;
}

export type StepId =
  | "atmosfera"
  | "aspectos"
  | "hipotesis"
  | "detalle"
  | "perfil"
  | "feedback"
  | "moodboard"
  | "proyecto"
  | "brief";

export interface ChatMessage {
  id: string;
  role: "agent" | "user";
  text: string;
  step: StepId;
  tone?: "question" | "hypothesis" | "note" | "reaction";
}

export type Confidence = "visible" | "explorando";

export interface TagScore {
  tag: Tag;
  score: number;
  positives: number;
  negatives: number;
  sources: string[];
  confidence: Confidence;
}

export interface Direction {
  id: string;
  name: string;
  description: string;
  score: number;
}

export interface Swatch {
  name: string;
  hex: string;
}

export interface MaterialChip {
  tag: Tag;
  name: string;
  note: string;
  image?: string;
  color: string;
}

export interface TasteProfile {
  ready: boolean;
  evidenceCount: number;
  primary?: Direction;
  secondary?: Direction;
  directions: Direction[];
  preferred: TagScore[];
  avoided: TagScore[];
  uncertain: TagScore[];
  materials: MaterialChip[];
  palette: Swatch[];
  lighting: string[];
  atmosphereWords: string[];
  avoidLines: string[];
  contradiction: boolean;
}

export interface MoodItem {
  refId: string;
  origin: "guardado" | "me-gusta" | "sugerido";
  note: string;
}

export interface Moodboard {
  items: MoodItem[];
  palette: Swatch[];
  materials: MaterialChip[];
  notes: string[];
}

export interface Brief {
  generatedAt: string;
  roomType?: string;
  roomArea?: string;
  goal: string;
  goalFromUser: boolean;
  atmosphere: string[];
  direction?: { primary: string; secondary?: string; confidence: Confidence };
  palette: Swatch[];
  materials: string[];
  lighting: string[];
  avoid: string[];
  references: { id: string; title: string }[];
  budget?: string;
  functional: string[];
  constraints?: string;
  openQuestions: string[];
}

export type CrmStatus = "borrador" | "nuevo" | "revision" | "reunion" | "concepto" | "archivado";

export interface TelegramMessage {
  id: string;
  from: "bot" | "user";
  text: string;
  at: string;
  cards?: string[];
  quick?: string[];
}

export interface Project {
  schemaVersion: 1;
  conversationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  currentStep: number;
  maxStep: number;
  answers: Answers;
  telegram: TelegramMessage[];
  /** Snapshots refreshed on every save, so other views (and the CRM) can read them directly */
  snapshot?: {
    messages: ChatMessage[];
    tasteProfile: TasteProfile;
    moodboard: Moodboard;
    brief: Brief | null;
  };
  briefCreatedAt?: string;
}

export interface SampleProject {
  id: string;
  client: string;
  name: string;
  status: CrmStatus;
  updatedAt: string;
  answers: Answers;
  steps: number;
  notes?: string;
}
