"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Download,
  FileText,
  Heart,
  HelpCircle,
  RotateCcw,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { ASPECTS, ATMOSPHERES, BUDGETS, FUNCTIONAL, ROOM_TYPES, TAG_META, getRef } from "@/lib/catalog";
import { buildHypothesis, buildRefinement, explainRef, feedbackState, rankPool } from "@/lib/agent/engine";
import { actions } from "@/lib/agent/actions";
import { downloadBrief } from "@/lib/brief/download";
import { Photo } from "@/components/ui/Photo";
import { btn } from "@/components/ui/styles";
import { ChoiceCard } from "@/components/agent/ChoiceCard";
import { MoodboardView } from "@/components/agent/Moodboard";
import { ConfidenceBadge, DirectionMeter, PaletteStrip } from "@/components/agent/ProfileBits";
import { FactorsPanel } from "@/components/agent/FactorsPanel";
import type { AspectId, Project, ProjectInfo } from "@/types";

const ease = [0.22, 0.61, 0.36, 1] as const;

export function StepWidget({ project, onReset }: { project: Project; onReset: () => void }) {
  const step = project.currentStep;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.45, ease }}
      >
        {step === 0 && <AtmosphereStep project={project} />}
        {step === 1 && <AspectsStep project={project} />}
        {step === 2 && <HypothesisStep project={project} />}
        {step === 3 && <RefinementStep project={project} />}
        {step === 4 && <ProfileStep project={project} />}
        {step === 5 && <FeedbackStep project={project} />}
        {step === 6 && <MoodboardStep project={project} />}
        {step === 7 && <ProjectStep project={project} />}
        {step === 8 && <BriefStep project={project} onReset={onReset} />}
      </motion.div>
    </AnimatePresence>
  );
}

// ——— 1. Atmosphere
function AtmosphereStep({ project }: { project: Project }) {
  const current = project.answers.atmosphere;
  return (
    <div role="radiogroup" aria-label="Atmósfera" className="grid gap-5 sm:grid-cols-3">
      {ATMOSPHERES.map((a) => (
        <ChoiceCard
          key={a.id}
          refId={a.refId}
          selected={current === a.id}
          dimmed={!!current && current !== a.id}
          onSelect={() => actions.chooseAtmosphere(a.id)}
          aspect="aspect-[3/4]"
          sizes="(min-width:1280px) 18vw, (min-width:640px) 30vw, 90vw"
        />
      ))}
    </div>
  );
}

// ——— 2. Aspects
function AspectsStep({ project }: { project: Project }) {
  const [sel, setSel] = useState<AspectId[]>(project.answers.aspects);
  const [note, setNote] = useState(project.answers.aspectsNote ?? "");
  const toggle = (id: AspectId) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const can = sel.length > 0 || note.trim().length > 2;
  return (
    <div className="border border-line bg-paper p-5 md:p-7">
      <fieldset>
        <legend className="eyebrow text-muted">Elige una o varias</legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {ASPECTS.map((a) => {
            const on = sel.includes(a.id);
            return (
              <button
                key={a.id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(a.id)}
                className={`border px-4 py-2.5 text-[13.5px] transition-all duration-300 ${
                  on ? "border-olive bg-olive text-ivory" : "border-line bg-ivory hover:border-espresso/40"
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <label className="mt-6 block">
        <span className="eyebrow text-muted">O con tus palabras (opcional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={240}
          placeholder="Por ejemplo: la luz que entra de lado, la madera sin barnizar…"
          className="mt-2 w-full resize-none border-b border-line bg-transparent py-2 text-[14.5px] outline-none placeholder:text-muted/70 focus:border-olive"
        />
      </label>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-[12px] text-muted">{sel.length ? `${sel.length} seleccionadas` : "Nada seleccionado"}</p>
        <button disabled={!can} onClick={() => actions.submitAspects(sel, note)} className={btn.primary}>
          Continuar <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ——— 3. Hypothesis
function HypothesisStep({ project }: { project: Project }) {
  const h = buildHypothesis(project.answers);
  const [why, setWhy] = useState(false);
  if (!h) return null;
  const chosen = project.answers.hypothesis?.id === h.id ? project.answers.hypothesis.choice : undefined;
  return (
    <div>
      <div role="radiogroup" aria-label="Comprobación de hipótesis" className="grid gap-5 sm:grid-cols-2">
        {(["a", "b"] as const).map((k) => (
          <ChoiceCard
            key={k}
            label={k === "a" ? "A" : "B"}
            refId={k === "a" ? h.a : h.b}
            selected={chosen === k}
            dimmed={!!chosen && chosen !== k}
            onSelect={() => actions.chooseHypothesis(h.id, k)}
            aspect="aspect-[5/4]"
            sizes="(min-width:1024px) 28vw, 90vw"
          />
        ))}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => actions.chooseHypothesis(h.id, "none")}
          aria-pressed={chosen === "none"}
          className={`${btn.secondary} ${chosen === "none" ? "!bg-espresso !text-ivory" : ""}`}
        >
          <X className="size-4" /> No me encaja ninguna
        </button>
        <button onClick={() => setWhy((w) => !w)} aria-expanded={why} className={btn.ghost}>
          <HelpCircle className="size-4" /> ¿En qué me baso?
        </button>
      </div>
      {why && (
        <ul className="mt-4 space-y-1.5 border-l-2 border-clay/50 pl-4 text-[13px] text-espresso/80">
          {h.factors.map((f) => (
            <li key={f}>{f.charAt(0).toUpperCase() + f.slice(1)}.</li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ——— 4. Refinement
function RefinementStep({ project }: { project: Project }) {
  const r = buildRefinement(project.answers);
  if (!r) return null;
  const chosen = project.answers.refinement?.id === r.id ? project.answers.refinement.choice : undefined;
  return (
    <div>
      {r.negative && <p className="mb-4 text-[12.5px] text-clay">Aquí eliges lo que quieres evitar.</p>}
      <div role="radiogroup" aria-label="Detalle" className="grid gap-5 sm:grid-cols-3">
        {r.options.map((id) => (
          <ChoiceCard
            key={id}
            refId={id}
            selected={chosen === id}
            dimmed={!!chosen && chosen !== id}
            onSelect={() => actions.chooseRefinement(r.id, id)}
            sizes="(min-width:1280px) 18vw, (min-width:640px) 30vw, 90vw"
          />
        ))}
      </div>
    </div>
  );
}

// ——— 5. Profile
function ProfileStep({ project }: { project: Project }) {
  const tp = project.snapshot!.tasteProfile;
  const [why, setWhy] = useState(false);
  const corrected = project.answers.corrections;
  return (
    <div className="border border-line bg-paper">
      <div className="grid gap-8 p-5 md:grid-cols-[1.1fr_1fr] md:p-8">
        <div>
          <p className="eyebrow text-muted">Tu perfil visual</p>
          <p className="font-display mt-3 text-[34px] leading-[1.02]">{tp.primary?.name ?? "En formación"}</p>
          {tp.secondary && <p className="mt-1 text-[13.5px] text-espresso/65">con matices de {tp.secondary.name.toLowerCase()}</p>}
          <dl className="mt-6 space-y-3 text-[13.5px]">
            <Line k="Atmósfera" v={tp.atmosphereWords.join(", ") || "—"} />
            <Line k="Materiales" v={tp.materials.map((m) => m.name.toLowerCase()).join(", ") || "Aún explorando"} />
            <Line k="Luz" v={tp.lighting.length ? tp.lighting.map((l) => l.split(":")[0].split(" (")[0].toLowerCase()).join("; ") : "Aún explorando"} />
            <Line k="Evitar" v={tp.avoidLines.join(", ").toLowerCase() || "Nada claro todavía"} />
          </dl>
          <div className="mt-6">
            <PaletteStrip palette={tp.palette} />
          </div>
        </div>
        <div>
          <p className="eyebrow text-muted">Direcciones</p>
          <div className="mt-3">
            <DirectionMeter directions={tp.directions} max={4} />
          </div>
          <p className="eyebrow mt-7 text-muted">Rasgos · ¿encajan?</p>
          <ul className="mt-2 divide-y divide-line border-y border-line">
            {tp.preferred.slice(0, 7).map((t) => (
              <li key={t.tag} className="flex items-center gap-3 py-2 text-[13px]">
                <span className="flex-1">{TAG_META[t.tag].label}</span>
                <ConfidenceBadge c={t.confidence} />
                <button onClick={() => actions.correct(t.tag)} className="px-1.5 py-1 text-[11px] text-muted underline-offset-4 hover:text-clay hover:underline" aria-label={`${TAG_META[t.tag].label} no encaja conmigo`}>
                  No encaja
                </button>
              </li>
            ))}
          </ul>
          {corrected.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {corrected.map((c) => (
                <li key={c.tag}>
                  <button onClick={() => actions.undoCorrection(c.tag)} className="flex items-center gap-1.5 border border-clay/40 px-2 py-0.5 text-[11.5px] text-espresso/70 hover:border-clay">
                    <Undo2 className="size-3" /> {TAG_META[c.tag].label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-4 md:px-8">
        <button onClick={() => setWhy((w) => !w)} aria-expanded={why} className={btn.ghost}>
          <HelpCircle className="size-4" /> Ver qué ha influido
        </button>
        <button onClick={() => actions.confirmProfile()} className={btn.primary}>
          Encaja, sigamos <ArrowRight className="size-4" />
        </button>
      </div>
      {why && (
        <div className="border-t border-line p-5 md:p-8">
          <FactorsPanel answers={project.answers} />
        </div>
      )}
    </div>
  );
}

function Line({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-3">
      <dt className="text-muted">{k}</dt>
      <dd>{v.charAt(0).toUpperCase() + v.slice(1)}</dd>
    </div>
  );
}

// ——— 6. Feedback
function FeedbackStep({ project }: { project: Project }) {
  const a = project.answers;
  const fb = feedbackState(a);
  const proposals = rankPool(a).slice(0, 4);
  const [why, setWhy] = useState<string | null>(null);
  const rated = fb.liked.length + fb.rejected.length;
  const canGo = fb.liked.length >= 2 || rated >= 4;

  return (
    <div>
      <ul className="grid gap-5 sm:grid-cols-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {proposals.map(({ ref }) => (
            <motion.li
              key={ref.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.45, ease }}
              className="border border-line bg-paper"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Photo refId={ref.id} w={700} sizes="(min-width:1024px) 28vw, 90vw" className="absolute inset-0 h-full w-full" />
              </div>
              <div className="p-4">
                <p className="font-display text-[19px] leading-tight">{ref.title}</p>
                <p className="mt-1 text-[12.5px] leading-snug text-espresso/65">{ref.caption}</p>
                <div className="mt-4 grid grid-cols-3 gap-1.5">
                  <button onClick={() => actions.feedback(ref.id, "like", "studio", "feedback")} className="flex items-center justify-center gap-1.5 border border-olive/30 py-2 text-[12px] text-olive transition-colors hover:bg-olive hover:text-ivory">
                    <Heart className="size-3.5" /> Me gusta
                  </button>
                  <button onClick={() => actions.feedback(ref.id, "reject", "studio", "feedback")} className="flex items-center justify-center gap-1.5 border border-line py-2 text-[12px] text-espresso/75 transition-colors hover:border-clay hover:text-clay">
                    <X className="size-3.5" /> No encaja
                  </button>
                  <button onClick={() => actions.feedback(ref.id, "save", "studio", "feedback")} className="flex items-center justify-center gap-1.5 border border-line py-2 text-[12px] text-espresso/75 transition-colors hover:border-espresso">
                    <Bookmark className="size-3.5" /> Guardar
                  </button>
                </div>
                <button
                  onClick={() => setWhy((w) => (w === ref.id ? null : ref.id))}
                  aria-expanded={why === ref.id}
                  className="mt-3 flex items-center gap-1.5 text-[12px] text-espresso/70 underline decoration-line underline-offset-4 hover:text-espresso"
                >
                  <HelpCircle className="size-3.5" /> ¿Por qué me lo propones?
                </button>
                <AnimatePresence initial={false}>
                  {why === ref.id && (
                    <motion.p
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <span className="mt-3 block border-l-2 border-clay/60 pl-3 text-[12.5px] leading-relaxed text-espresso/85">{explainRef(ref, a)}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      {proposals.length === 0 && <p className="border border-dashed border-line p-6 text-sm text-muted">Has valorado todas las propuestas disponibles en esta demo.</p>}

      <div className="mt-6 grid gap-4 border-t border-line pt-5 md:grid-cols-2">
        <div>
          <p className="eyebrow text-olive">Tu selección · {fb.liked.length}</p>
          {fb.liked.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {fb.liked.map((id) => (
                <li key={id} className="group relative size-16">
                  <Photo refId={id} w={160} sizes="64px" className="h-full w-full" />
                  {fb.saved.includes(id) && <BookmarkCheck className="absolute left-1 top-1 size-3.5 text-ivory drop-shadow" aria-label="Guardado" />}
                  <button onClick={() => actions.feedback(id, "unlike", "studio", "feedback")} className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-espresso text-ivory" aria-label={`Quitar «${getRef(id)?.title}» de tu selección`}>
                    <X className="size-3" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12.5px] text-muted">Lo que te guste aparecerá aquí.</p>
          )}
        </div>
        <div>
          <p className="eyebrow text-clay">Descartadas · {fb.rejected.length}</p>
          {fb.rejected.length ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {fb.rejected.map((id) => (
                <li key={id}>
                  <button onClick={() => actions.feedback(id, "restore", "studio", "feedback")} className="flex items-center gap-1.5 border border-line px-2 py-1 text-[11.5px] text-espresso/70 hover:border-espresso" aria-label={`Recuperar «${getRef(id)?.title}»`}>
                    <RotateCcw className="size-3" /> {getRef(id)?.title}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12.5px] text-muted">Nada descartado.</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-end gap-4">
        {!canGo && <p className="text-[12px] text-muted">Valora al menos dos que te gusten (o cuatro en total) para componer el moodboard.</p>}
        <button disabled={!canGo} onClick={() => actions.finishFeedback()} className={btn.primary}>
          Ver mi moodboard <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ——— 7. Moodboard
function MoodboardStep({ project }: { project: Project }) {
  const board = project.snapshot!.moodboard;
  const removed = project.answers.moodboardRemoved.length;
  return (
    <div>
      <MoodboardView
        board={board}
        title="Tu moodboard"
        editable
        onSave={(id) => actions.feedback(id, "save", "studio", "moodboard")}
        onUnsave={(id) => actions.feedback(id, "unsave", "studio", "moodboard")}
        onReject={(id) => actions.feedback(id, "reject", "studio", "moodboard")}
        onRemove={(id) => actions.removeFromBoard(id)}
      />
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        {removed > 0 ? (
          <button onClick={() => actions.restoreBoard()} className={btn.ghost}>
            <RotateCcw className="size-4" /> Recuperar piezas quitadas ({removed})
          </button>
        ) : (
          <span className="text-[12px] text-muted">Pasa el cursor por una pieza para guardarla, descartarla o quitarla.</span>
        )}
        <button onClick={() => actions.finishMoodboard()} className={btn.primary}>
          Datos del proyecto <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ——— 8. Project info
function ProjectStep({ project }: { project: Project }) {
  const [info, setInfo] = useState<ProjectInfo>(project.answers.project);
  const set = (patch: Partial<ProjectInfo>, persist = true) => {
    const next = { ...info, ...patch };
    setInfo(next);
    if (persist) actions.saveProject(next, false);
  };
  const toggleF = (f: string) => set({ functional: info.functional.includes(f) ? info.functional.filter((x) => x !== f) : [...info.functional, f] });
  const persistText = () => actions.saveProject(info, false);

  return (
    <form
      className="space-y-7 border border-line bg-paper p-5 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        actions.saveProject(info, true);
      }}
    >
      <Field n={1} label="¿Qué espacio quieres diseñar?">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tipo de espacio">
          {ROOM_TYPES.map((r) => (
            <Chip key={r} on={info.roomType === r} onClick={() => set({ roomType: info.roomType === r ? undefined : r })} radio>
              {r}
            </Chip>
          ))}
        </div>
      </Field>
      <Field n={2} label="Superficie aproximada" hint="Opcional · si no la sabes, déjala vacía">
        <div className="flex items-baseline gap-2">
          <input
            inputMode="decimal"
            value={info.roomArea ?? ""}
            onChange={(e) => set({ roomArea: e.target.value.replace(/[^\d.,]/g, "").slice(0, 6) || undefined }, false)}
            onBlur={persistText}
            placeholder="—"
            aria-label="Superficie en metros cuadrados"
            className="w-28 border-b border-line bg-transparent py-1.5 text-[18px] outline-none focus:border-olive"
          />
          <span className="text-muted">m²</span>
        </div>
      </Field>
      <Field n={3} label="Presupuesto previsto" hint="Opcional">
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Presupuesto">
          {BUDGETS.map((b) => (
            <Chip key={b} on={info.budget === b} onClick={() => set({ budget: info.budget === b ? undefined : b })} radio>
              {b}
            </Chip>
          ))}
        </div>
      </Field>
      <Field n={4} label="Necesidades funcionales" hint="Opcional · elige las que apliquen">
        <div className="flex flex-wrap gap-2">
          {FUNCTIONAL.map((f) => (
            <Chip key={f} on={info.functional.includes(f)} onClick={() => toggleF(f)}>
              {f}
            </Chip>
          ))}
        </div>
        <input
          value={info.functionalNote ?? ""}
          onChange={(e) => set({ functionalNote: e.target.value.slice(0, 200) || undefined }, false)}
          onBlur={persistText}
          placeholder="Otra necesidad…"
          aria-label="Otra necesidad funcional"
          className="mt-3 w-full border-b border-line bg-transparent py-2 text-[14px] outline-none placeholder:text-muted/70 focus:border-olive"
        />
      </Field>
      <Field n={5} label="Limitaciones o elementos obligatorios" hint="Opcional">
        <textarea
          rows={2}
          value={info.constraints ?? ""}
          onChange={(e) => set({ constraints: e.target.value.slice(0, 300) || undefined }, false)}
          onBlur={persistText}
          placeholder="Por ejemplo: mantener el suelo original, un piano que no se mueve…"
          className="w-full resize-none border-b border-line bg-transparent py-2 text-[14px] outline-none placeholder:text-muted/70 focus:border-olive"
        />
      </Field>
      <Field n={6} label="¿Qué te gustaría conseguir?" hint="Opcional · si lo dejas vacío, lo formularé a partir de tus respuestas">
        <textarea
          rows={2}
          value={info.goal ?? ""}
          onChange={(e) => set({ goal: e.target.value.slice(0, 300) || undefined }, false)}
          onBlur={persistText}
          className="w-full resize-none border-b border-line bg-transparent py-2 text-[14px] outline-none focus:border-olive"
        />
      </Field>
      <div className="flex justify-end border-t border-line pt-5">
        <button type="submit" className={btn.primary}>
          Preparar el brief <ArrowRight className="size-4" />
        </button>
      </div>
    </form>
  );
}

function Field({ n, label, hint, children }: { n: number; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-3 md:grid-cols-[28px_1fr]">
      <span className="font-display text-sm text-clay">{String(n).padStart(2, "0")}</span>
      <div>
        <p className="text-[14.5px] font-medium">{label}</p>
        {hint && <p className="mt-0.5 text-[12px] text-muted">{hint}</p>}
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

function Chip({ on, onClick, children, radio }: { on: boolean; onClick: () => void; children: React.ReactNode; radio?: boolean }) {
  return (
    <button
      type="button"
      role={radio ? "radio" : undefined}
      aria-checked={radio ? on : undefined}
      aria-pressed={radio ? undefined : on}
      onClick={onClick}
      className={`border px-3.5 py-2 text-[13px] transition-colors duration-300 ${on ? "border-olive bg-olive text-ivory" : "border-line bg-ivory hover:border-espresso/40"}`}
    >
      {children}
    </button>
  );
}

// ——— 9. Brief
function BriefStep({ project, onReset }: { project: Project; onReset: () => void }) {
  const brief = project.snapshot?.brief;
  const [err, setErr] = useState<string | null>(null);
  if (!brief) return null;
  return (
    <div className="border border-line bg-paper">
      <div className="grid gap-6 p-5 md:grid-cols-[1fr_1fr] md:p-8">
        <div>
          <p className="eyebrow text-clay">Brief listo</p>
          <p className="font-display mt-3 text-3xl leading-tight">{project.name}</p>
          <p className="mt-3 text-[13.5px] leading-relaxed text-espresso/75">{brief.goal}</p>
          <div className="mt-5">
            <PaletteStrip palette={brief.palette} labels={false} />
          </div>
        </div>
        <div className="text-[13px]">
          <p className="eyebrow text-muted">Preguntas abiertas para el diseñador</p>
          <ul className="mt-2 space-y-1.5">
            {brief.openQuestions.slice(0, 4).map((q) => (
              <li key={q} className="flex gap-2 leading-snug">
                <span className="text-clay">—</span>
                {q}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-muted">{brief.references.length} referencias · {brief.materials.length} materiales · {brief.avoid.length} cosas a evitar</p>
        </div>
      </div>
      <div className="grid gap-2 border-t border-line p-5 sm:grid-cols-2 md:p-6 lg:grid-cols-3">
        <Link href="/brief" className={btn.primary}>
          <FileText className="size-4" /> Ver el brief
        </Link>
        <button onClick={() => setErr(downloadBrief(brief, project.name))} className={btn.secondary}>
          <Download className="size-4" /> Descargar (.md)
        </button>
        <Link href="/telegram-demo" className={btn.secondary}>
          <Send className="size-4" /> Continuar en Telegram
        </Link>
        <button onClick={() => actions.goTo(0)} className={btn.ghost}>
          <Undo2 className="size-4" /> Cambiar respuestas
        </button>
        <Link href="/dashboard" className={btn.ghost}>
          Ver en el CRM
        </Link>
        <button onClick={onReset} className={`${btn.ghost} text-clay`}>
          <RotateCcw className="size-4" /> Empezar de nuevo
        </button>
      </div>
      {err && (
        <p role="alert" className="border-t border-line px-6 py-3 text-[12.5px] text-clay">
          {err}
        </p>
      )}
    </div>
  );
}
