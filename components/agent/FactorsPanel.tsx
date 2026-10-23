"use client";

import { explainFactors } from "@/lib/agent/engine";
import { TAG_META } from "@/lib/catalog";
import type { Answers } from "@/types";

/** "¿Por qué?" — what shaped the profile. */
export function FactorsPanel({ answers }: { answers: Answers }) {
  const f = explainFactors(answers);
  return (
    <div className="space-y-4">
      <Block title="Tus elecciones" items={f.choices.slice(-8)} empty="Todavía no hay elecciones." />
      <Block
        title="Preferencias que se repiten"
        items={f.repeated.map((r) => `${TAG_META[r.tag].label} — aparece en ${r.count} elecciones`)}
        empty="Nada se repite aún: hace falta alguna elección más."
        tone="text-olive"
      />
      <Block title="Lo que descartaste" items={f.rejected.slice(-6)} empty="No has descartado nada todavía." tone="text-clay" />
      <Block
        title="Hipótesis inciertas"
        items={f.uncertain.map((t) => `${TAG_META[t.tag].label}: pocas señales o señales contradictorias`)}
        empty="Ninguna por ahora."
      />
      <p className="text-[11px] leading-relaxed text-muted">
        El perfil se calcula con reglas y pesos locales a partir de tus acciones. No hay un modelo de lenguaje detrás de este prototipo.
      </p>
    </div>
  );
}

function Block({ title, items, empty, tone }: { title: string; items: string[]; empty: string; tone?: string }) {
  return (
    <div className="border-t border-line pt-3">
      <p className={`eyebrow ${tone ?? "text-muted"}`}>{title}</p>
      {items.length ? (
        <ul className="mt-2 space-y-1.5 text-[12.5px] leading-snug text-espresso/80">
          {items.map((x) => (
            <li key={x} className="flex gap-2">
              <span className="text-muted">·</span>
              <span>{x.charAt(0).toUpperCase() + x.slice(1)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-[12.5px] text-muted">{empty}</p>
      )}
    </div>
  );
}
