"use client";

import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { TAG_META } from "@/lib/catalog";
import { Photo } from "@/components/ui/Photo";
import { ConfidenceBadge, DirectionMeter, MaterialList, PaletteStrip } from "@/components/agent/ProfileBits";
import { FactorsPanel } from "@/components/agent/FactorsPanel";
import type { Project } from "@/types";

export function TasteProfilePanel({ project }: { project: Project | null }) {
  const [why, setWhy] = useState(false);
  const tp = project?.snapshot?.tasteProfile;
  const mood = project?.snapshot?.moodboard;

  if (!project || !tp || tp.evidenceCount === 0) {
    return (
      <div className="p-6">
        <p className="eyebrow text-muted">Lo que voy entendiendo</p>
        <p className="font-display mt-4 text-2xl leading-snug text-espresso/80">Aún no sé nada de ti.</p>
        <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
          En cuanto elijas una atmósfera, aquí aparecerán tu perfil de gusto, los materiales, la paleta y un pequeño moodboard.
        </p>
        <div className="mt-8 grid grid-cols-3 gap-1.5" aria-hidden>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="aspect-square border border-dashed border-line" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-7 p-6">
      <div>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow text-muted">Lo que voy entendiendo</p>
          <span className="text-[11px] tabular-nums text-muted">{tp.evidenceCount} señales</span>
        </div>
        {tp.primary ? (
          <>
            <AnimatePresence mode="wait">
              <motion.p
                key={tp.primary.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-display mt-3 text-[28px] leading-[1.05]"
              >
                {tp.primary.name}
              </motion.p>
            </AnimatePresence>
            <p className="mt-1.5 text-[12.5px] leading-snug text-espresso/65">{tp.primary.description}</p>
          </>
        ) : (
          <p className="font-display mt-3 text-2xl text-espresso/70">Formándose…</p>
        )}
        <div className="mt-5">
          <DirectionMeter directions={tp.directions} />
        </div>
      </div>

      <div>
        <p className="eyebrow text-muted">Preferencias</p>
        <ul className="mt-2 divide-y divide-line border-y border-line">
          {tp.preferred.slice(0, 6).map((t) => (
            <li key={t.tag} className="flex items-center justify-between gap-3 py-2 text-[13px]">
              {TAG_META[t.tag].label}
              <ConfidenceBadge c={t.confidence} />
            </li>
          ))}
        </ul>
        {tp.avoided.length > 0 && (
          <>
            <p className="eyebrow mt-5 text-clay">Evitar</p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {tp.avoided.slice(0, 6).map((t) => (
                <li key={t.tag} className="border border-clay/35 px-2 py-0.5 text-[11.5px] text-espresso/80 line-through decoration-clay/60">
                  {TAG_META[t.tag].label}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {tp.palette.length > 0 && (
        <div>
          <p className="eyebrow mb-3 text-muted">Paleta</p>
          <PaletteStrip palette={tp.palette} labels={false} />
        </div>
      )}

      {tp.materials.length > 0 && (
        <div>
          <p className="eyebrow mb-3 text-muted">Materiales</p>
          <MaterialList materials={tp.materials} compact />
        </div>
      )}

      {mood && mood.items.length > 0 && project.maxStep >= 5 && (
        <div>
          <p className="eyebrow mb-3 text-muted">Moodboard</p>
          <LayoutGroup>
            <ul className="grid grid-cols-3 gap-1.5">
              <AnimatePresence initial={false}>
                {mood.items.slice(0, 6).map((it) => (
                  <motion.li
                    key={it.refId}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.35 }}
                    className="relative aspect-square overflow-hidden"
                  >
                    <Photo refId={it.refId} w={200} sizes="90px" className="h-full w-full" />
                    {it.origin === "guardado" && <span className="absolute bottom-1 left-1 size-1.5 rounded-full bg-clay" title="Guardado" />}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </LayoutGroup>
        </div>
      )}

      <div className="border-t border-line pt-4">
        <button
          onClick={() => setWhy((w) => !w)}
          aria-expanded={why}
          className="flex w-full items-center justify-between text-[12.5px] font-medium text-espresso/80 hover:text-espresso"
        >
          ¿Por qué pienso esto?
          <ChevronDown className={`size-4 transition-transform ${why ? "rotate-180" : ""}`} />
        </button>
        {why && (
          <div className="mt-4">
            <FactorsPanel answers={project.answers} />
          </div>
        )}
      </div>
    </div>
  );
}
