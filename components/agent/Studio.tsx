"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, Check, ListOrdered, RotateCcw, SendHorizontal, SlidersHorizontal, X } from "lucide-react";
import { useActiveProject } from "@/lib/storage/store";
import { STEPS, stepIndex } from "@/lib/agent/scenario";
import { actions } from "@/lib/agent/actions";
import { GREETING } from "@/lib/agent/scenario";
import { TasteProfilePanel } from "@/components/agent/TasteProfile";
import { StepWidget } from "@/components/agent/Steps";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ChatMessage, Project } from "@/types";

export function Studio() {
  const { hydrated, project } = useActiveProject();
  const [confirmReset, setConfirmReset] = useState(false);
  const [sheet, setSheet] = useState<null | "steps" | "profile">(null);

  if (!hydrated) {
    return <div className="flex-1" aria-busy="true" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:grid lg:h-[calc(100svh-65px)] lg:flex-none lg:grid-rows-1 lg:overflow-hidden lg:grid-cols-[250px_minmax(0,1fr)_330px] xl:grid-cols-[270px_minmax(0,1fr)_360px]">
      {/* Left — steps */}
      <aside className="hidden overflow-y-auto border-r border-line scrollbar-thin lg:block" aria-label="Etapas">
        <StepRail project={project} onReset={() => setConfirmReset(true)} />
      </aside>

      {/* Mobile top bar */}
      <MobileBar project={project} onOpen={setSheet} />

      {/* Center — conversation */}
      <Conversation project={project} onReset={() => setConfirmReset(true)} />

      {/* Right — profile */}
      <aside className="hidden overflow-y-auto border-l border-line bg-paper/60 scrollbar-thin lg:block" aria-label="Tu perfil de gusto">
        <TasteProfilePanel project={project} />
      </aside>

      {/* Mobile sheets */}
      <AnimatePresence>
        {sheet && (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <button className="absolute inset-0 bg-espresso/40" aria-label="Cerrar" onClick={() => setSheet(null)} />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={sheet === "steps" ? "Etapas" : "Tu perfil"}
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
              className="absolute inset-x-0 bottom-0 max-h-[85svh] overflow-y-auto bg-ivory"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-ivory px-5 py-3">
                <p className="text-[13px] font-medium">{sheet === "steps" ? "Etapas" : "Tu perfil de gusto"}</p>
                <button onClick={() => setSheet(null)} className="p-1" aria-label="Cerrar">
                  <X className="size-5" />
                </button>
              </div>
              {sheet === "steps" ? (
                <StepRail
                  project={project}
                  onNavigate={() => setSheet(null)}
                  onReset={() => {
                    setSheet(null);
                    setConfirmReset(true);
                  }}
                />
              ) : (
                <TasteProfilePanel project={project} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={confirmReset}
        title="¿Empezar de nuevo?"
        body="Se borrarán las respuestas, el perfil, el moodboard y el brief de este proyecto en este navegador. No se puede deshacer."
        confirmLabel="Sí, borrar y empezar"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          actions.reset();
          setConfirmReset(false);
        }}
      />
    </div>
  );
}

// ——————————————————————————————————— Step rail

function StepRail({ project, onReset, onNavigate }: { project: Project | null; onReset: () => void; onNavigate?: () => void }) {
  const current = project?.currentStep ?? 0;
  const max = project?.maxStep ?? 0;
  const pct = Math.round((max / (STEPS.length - 1)) * 100);
  return (
    <div className="flex h-full flex-col p-6">
      <p className="eyebrow text-muted">Estudio de gusto</p>
      <p className="font-display mt-2 text-2xl leading-tight">Paso {current + 1} de {STEPS.length}</p>
      <div className="mt-4 h-[3px] bg-chalk" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso">
        <div className="h-full bg-olive transition-[width] duration-700" style={{ width: `${pct}%` }} />
      </div>
      <ol className="mt-6 space-y-0.5">
        {STEPS.map((s, i) => {
          const reachable = i <= max;
          const done = i < max;
          const active = i === current;
          return (
            <li key={s.id}>
              <button
                disabled={!reachable}
                onClick={() => {
                  actions.goTo(i);
                  onNavigate?.();
                }}
                aria-current={active ? "step" : undefined}
                className={`group grid w-full grid-cols-[22px_1fr] items-start gap-3 px-2 py-2 text-left transition-colors ${
                  active ? "bg-chalk/80" : reachable ? "hover:bg-chalk/50" : "cursor-not-allowed"
                }`}
              >
                <span
                  className={`mt-0.5 grid size-[18px] place-items-center rounded-full border text-[9.5px] ${
                    done ? "border-olive bg-olive text-ivory" : active ? "border-olive text-olive" : "border-line text-muted"
                  }`}
                >
                  {done ? <Check className="size-2.5" /> : i + 1}
                </span>
                <span>
                  <span className={`block text-[13px] ${reachable ? "text-espresso" : "text-muted"} ${active ? "font-medium" : ""}`}>{s.label}</span>
                  <span className="block text-[11.5px] leading-snug text-muted">{s.hint}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="mt-6 text-[12px] leading-relaxed text-muted">
        Puedes volver a cualquier paso completado y cambiar tu respuesta: el perfil y las propuestas se recalculan.
      </p>
      <div className="mt-auto pt-6">
        {project && (
          <button onClick={onReset} className="flex items-center gap-2 text-[12px] text-muted transition-colors hover:text-clay">
            <RotateCcw className="size-3.5" /> Empezar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}

function MobileBar({ project, onOpen }: { project: Project | null; onOpen: (s: "steps" | "profile") => void }) {
  const current = project?.currentStep ?? 0;
  const max = project?.maxStep ?? 0;
  return (
    <div className="sticky top-16 z-30 border-b border-line bg-ivory/95 px-5 py-2.5 backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <button onClick={() => onOpen("steps")} className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-label="Ver etapas">
          <ListOrdered className="size-4 shrink-0 text-muted" />
          <span className="truncate text-[13px]">
            <span className="text-muted">{current + 1}/{STEPS.length}</span> · {STEPS[current].label}
          </span>
        </button>
        <button onClick={() => onOpen("profile")} className="flex items-center gap-1.5 border border-line px-3 py-1.5 text-[12px]">
          <SlidersHorizontal className="size-3.5" /> Perfil
          {project?.snapshot?.tasteProfile.evidenceCount ? (
            <span className="rounded-full bg-olive px-1.5 text-[10px] text-ivory">{project.snapshot.tasteProfile.evidenceCount}</span>
          ) : null}
        </button>
      </div>
      <div className="mt-2 flex gap-1" aria-hidden>
        {STEPS.map((s, i) => (
          <span key={s.id} className={`h-[3px] flex-1 ${i < max ? "bg-olive" : i === current ? "bg-olive/50" : "bg-chalk"}`} />
        ))}
      </div>
    </div>
  );
}

// ——————————————————————————————————— Conversation

function visibleMessages(project: Project | null): ChatMessage[] {
  if (!project?.snapshot) {
    return [
      { id: "hello", role: "agent", text: GREETING, step: "atmosfera" },
      {
        id: "atm-q",
        role: "agent",
        text: "Imagina que vuelves a casa después de un día largo. ¿Qué atmósfera sientes más tuya?",
        step: "atmosfera",
        tone: "question",
      },
    ];
  }
  const cur = project.currentStep;
  const reviewing = cur < project.maxStep;
  const out: ChatMessage[] = [];
  let seenUserInCurrent = false;
  for (const m of project.snapshot.messages) {
    const si = stepIndex(m.step);
    if (si < cur) out.push(m);
    else if (si === cur) {
      if (reviewing && m.role === "user") seenUserInCurrent = true;
      if (!(reviewing && seenUserInCurrent)) out.push(m);
    }
  }
  return out;
}

function Conversation({ project, onReset }: { project: Project | null; onReset: () => void }) {
  const messages = useMemo(() => visibleMessages(project), [project]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [text, setText] = useState("");
  const [showJump, setShowJump] = useState(false);
  const current = project?.currentStep ?? 0;
  const reviewing = !!project && project.currentStep < project.maxStep;

  // Keep the newest exchange in view when the conversation advances.
  const lastId = messages[messages.length - 1]?.id;
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = endRef.current;
    // Scroll so the latest agent message and the widget are visible.
    const anchor = el.querySelector<HTMLElement>("[data-last-agent]");
    const top = anchor ? anchor.offsetTop - 24 : target?.offsetTop ?? el.scrollHeight;
    const desktop = el.scrollHeight > el.clientHeight + 4;
    if (desktop) el.scrollTo({ top, behavior: "smooth" });
    else window.scrollTo({ top: (anchor?.getBoundingClientRect().top ?? 0) + window.scrollY - 140, behavior: "smooth" });
  }, [lastId, current]);

  const lastAgentIndex = messages.map((m) => m.role).lastIndexOf("agent");

  const send = () => {
    if (!text.trim()) return;
    actions.sendText(text, "studio", STEPS[current].id);
    setText("");
  };

  return (
    <section className="relative flex min-h-0 flex-1 flex-col" aria-label="Conversación con Forme">
      <div
        ref={scrollRef}
        onScroll={(e) => {
          const el = e.currentTarget;
          setShowJump(el.scrollHeight - el.scrollTop - el.clientHeight > 600);
        }}
        className="flex-1 overflow-y-auto scrollbar-thin"
      >
        <div className="mx-auto w-full max-w-[880px] px-5 pb-10 pt-8 md:px-10">
          {reviewing && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border border-clay/40 bg-clay-soft/40 px-4 py-3 text-[13px]">
              <span>
                Estás revisando <strong className="font-medium">«{STEPS[current].label}»</strong>. Si cambias la respuesta, lo que viene después se adapta.
              </span>
              <button onClick={() => actions.goTo(project!.maxStep)} className="text-[12.5px] font-medium underline underline-offset-4">
                Volver al paso {project!.maxStep + 1}
              </button>
            </div>
          )}
          <ol className="space-y-5" aria-live="polite" aria-relevant="additions">
            <AnimatePresence initial={false}>
              {messages.map((m, i) => (
                <motion.li
                  key={m.id}
                  layout="position"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1], delay: m.role === "agent" ? 0.12 : 0 }}
                  data-last-agent={i === lastAgentIndex ? "" : undefined}
                >
                  <Bubble m={m} />
                </motion.li>
              ))}
            </AnimatePresence>
          </ol>
          <div ref={endRef} className="mt-7">
            <StepWidget project={project ?? emptyProjectShell()} onReset={onReset} />
          </div>
        </div>
      </div>

      {showJump && (
        <button
          onClick={() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })}
          className="absolute bottom-24 right-6 hidden size-10 place-items-center rounded-full border border-line bg-paper shadow lg:grid"
          aria-label="Ir al final"
        >
          <ArrowDown className="size-4" />
        </button>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="sticky bottom-0 border-t border-line bg-ivory/95 backdrop-blur"
      >
        <div className="mx-auto flex w-full max-w-[880px] items-end gap-3 px-5 py-3 md:px-10">
          <label htmlFor="studio-input" className="sr-only">
            Escribe un mensaje a Forme
          </label>
          <textarea
            id="studio-input"
            rows={1}
            value={text}
            maxLength={400}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Cuéntamelo con tus palabras: «me agobia el blanco frío»…"
            className="max-h-32 min-h-[44px] flex-1 resize-none border border-line bg-paper px-4 py-2.5 text-[14px] outline-none placeholder:text-muted/80 focus:border-olive"
          />
          <button type="submit" disabled={!text.trim()} className="grid size-11 shrink-0 place-items-center bg-olive text-ivory transition-colors hover:bg-espresso disabled:opacity-40" aria-label="Enviar mensaje">
            <SendHorizontal className="size-4" />
          </button>
        </div>
      </form>
    </section>
  );
}

function emptyProjectShell(): Project {
  // Rendered before the first answer: the widget only needs step 0.
  return {
    schemaVersion: 1,
    conversationId: "nuevo",
    name: "",
    createdAt: "",
    updatedAt: "",
    currentStep: 0,
    maxStep: 0,
    answers: { aspects: [], corrections: [], feedbackLog: [], moodboardRemoved: [], texts: [], project: { functional: [] } },
    telegram: [],
  };
}

function Bubble({ m }: { m: ChatMessage }) {
  if (m.role === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] bg-olive px-4 py-2.5 text-[14px] leading-relaxed text-ivory">{m.text}</p>
      </div>
    );
  }
  if (m.tone === "hypothesis") {
    return (
      <div className="flex gap-3">
        <AgentMark />
        <div className="max-w-[640px] border-l-2 border-clay pl-4">
          <p className="eyebrow text-clay">Hipótesis</p>
          <p className="font-display mt-1.5 text-[22px] leading-snug">{m.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <AgentMark />
      <p
        className={`max-w-[640px] pt-0.5 leading-relaxed ${
          m.tone === "question" ? "font-display text-[22px] leading-snug" : m.tone === "reaction" ? "text-[14.5px] text-espresso/80" : "text-[15px]"
        }`}
      >
        {m.text}
      </p>
    </div>
  );
}

function AgentMark() {
  return (
    <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-olive text-ivory" aria-label="Forme">
      <span className="font-display text-[13px] leading-none">F</span>
    </span>
  );
}
