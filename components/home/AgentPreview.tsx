"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { ATMOSPHERES, TAG_META, getRef } from "@/lib/catalog";
import { ATMOSPHERE_REACTION, computeProfile, emptyAnswers } from "@/lib/agent/engine";
import { store, useActiveProject } from "@/lib/storage/store";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { ConfidenceBadge } from "@/components/agent/ProfileBits";
import type { AtmosphereId } from "@/types";

export function AgentPreview() {
  const [choice, setChoice] = useState<AtmosphereId | null>(null);
  const router = useRouter();
  const { project } = useActiveProject();

  const profile = useMemo(() => (choice ? computeProfile({ ...emptyAnswers(), atmosphere: choice }) : null), [choice]);

  const start = () => {
    // Carry the preview choice into the studio, unless a project is already under way.
    if (choice && !project?.answers.atmosphere) {
      store.advance((p) => ({ ...p, answers: { ...p.answers, atmosphere: choice } }), 1);
    }
    router.push("/explore");
  };

  return (
    <section id="agente" className="scroll-mt-16 bg-olive text-ivory">
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-12">
          <Reveal className="lg:col-span-6">
            <p className="eyebrow text-clay-soft">El diseñador IA</p>
            <h2 className="font-display mt-6 text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.02]">Averigüemos qué te gusta de verdad.</h2>
          </Reveal>
          <Reveal delay={0.1} className="self-end lg:col-span-4 lg:col-start-9">
            <p className="text-[16px] leading-relaxed text-ivory/75">
              Unas cuantas elecciones y tendremos la primera hipótesis sobre tu interior. Pruébalo aquí: elige una atmósfera.
            </p>
          </Reveal>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-12">
          <div className="grid gap-4 sm:grid-cols-3 lg:col-span-8" role="radiogroup" aria-label="Atmósfera">
            {ATMOSPHERES.map((a) => {
              const ref = getRef(a.refId)!;
              const selected = choice === a.id;
              return (
                <button
                  key={a.id}
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setChoice(a.id)}
                  className={`group relative text-left transition-all duration-500 ${choice && !selected ? "opacity-55" : ""}`}
                >
                  <div className={`relative aspect-[3/4] overflow-hidden outline outline-1 transition-[outline-color,outline-offset] duration-500 ${selected ? "outline-offset-4 outline-clay-soft" : "outline-offset-0 outline-transparent"}`}>
                    <Photo refId={a.refId} w={600} sizes="(min-width:1024px) 22vw, 90vw" className="h-full w-full transition-transform duration-[1.2s] group-hover:scale-[1.04]" />
                    {selected && (
                      <span className="absolute right-3 top-3 grid size-7 place-items-center rounded-full bg-ivory text-olive">
                        <Check className="size-4" />
                      </span>
                    )}
                  </div>
                  <p className="font-display mt-4 text-xl">{a.label}</p>
                  <p className="mt-1 text-[13px] leading-snug text-ivory/60">{ref.caption}</p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-4" aria-live="polite">
            <div className="flex h-full flex-col border border-ivory/15 p-6">
              <p className="flex items-center gap-2 text-[11px] font-medium text-clay-soft">
                <span className="size-1.5 rounded-full bg-clay-soft" /> Forme
              </p>
              <AnimatePresence mode="wait">
                {!choice ? (
                  <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 text-[15px] leading-relaxed text-ivory/80">
                    Imagina que vuelves a casa tras un día largo. ¿Qué atmósfera sientes más tuya?
                  </motion.p>
                ) : (
                  <motion.div key={choice} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                    <p className="mt-4 text-[15px] leading-relaxed">{ATMOSPHERE_REACTION[choice]}</p>
                    <p className="eyebrow mt-8 text-ivory/50">Primera hipótesis</p>
                    <ul className="mt-3 divide-y divide-ivory/10 border-y border-ivory/10">
                      {profile?.preferred.slice(0, 4).map((t) => (
                        <li key={t.tag} className="flex items-center justify-between py-2.5 text-[13px]">
                          {TAG_META[t.tag].label}
                          <ConfidenceBadge c={t.confidence} className="!text-clay-soft" />
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[11.5px] leading-relaxed text-ivory/50">
                      Con una sola elección todo es «aún explorando». En el estudio lo confirmamos o lo descartamos.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="mt-auto pt-8">
                <button onClick={start} className="inline-flex w-full items-center justify-center gap-2 bg-ivory px-5 py-3.5 text-[13px] font-medium text-olive transition-colors hover:bg-clay-soft">
                  Empezar el diálogo <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
