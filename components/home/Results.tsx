import { sampleEntries } from "@/lib/crm/samples";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { ConfidenceBadge, MaterialList, PaletteStrip } from "@/components/agent/ProfileBits";
import { TAG_META } from "@/lib/catalog";

export function Results() {
  const sample = sampleEntries()[0].project;
  const tp = sample.snapshot!.tasteProfile;
  const mood = sample.snapshot!.moodboard;
  const brief = sample.snapshot!.brief!;
  const items = mood.items;

  return (
    <section id="resultado" className="scroll-mt-16">
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 lg:py-32">
        <Reveal className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="eyebrow text-clay">El resultado</p>
            <h2 className="font-display mt-6 text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.02]">
              No solo imágenes bonitas. <span className="italic text-olive">Comprender tu gusto.</span>
            </h2>
          </div>
          <p className="self-end text-[13px] leading-relaxed text-muted lg:col-span-3 lg:col-start-10">
            <span className="mb-2 inline-block border border-clay/50 px-2 py-0.5 text-[10px] tracking-[0.16em] text-clay uppercase">Ejemplo de demostración</span>
            <br />
            Proyecto ficticio FR-2041: un salón de 32 m². Todo lo que ves está calculado por el motor de Forme a partir de sus elecciones.
          </p>
        </Reveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-12">
          {/* Moodboard */}
          <Reveal className="grid grid-cols-6 grid-rows-[repeat(6,minmax(0,1fr))] gap-2 lg:col-span-7 aspect-[6/5]">
            <Photo refId={items[0].refId} w={900} sizes="(min-width:1024px) 34vw, 60vw" className="col-span-4 row-span-4 h-full w-full" />
            <Photo refId={items[1].refId} w={500} sizes="20vw" className="col-span-2 row-span-3 h-full w-full" />
            <div className="col-span-2 row-span-1 flex items-center bg-olive px-3 text-[11px] leading-tight text-ivory">
              {tp.primary?.name}
            </div>
            <Photo refId={items[2].refId} w={500} sizes="20vw" className="col-span-2 row-span-2 h-full w-full" />
            <Photo refId={items[3].refId} w={500} sizes="20vw" className="col-span-2 row-span-2 h-full w-full" />
            <div className="col-span-2 row-span-2 flex flex-col">
              {tp.palette.slice(0, 4).map((s) => (
                <span key={s.hex} className="flex-1" style={{ background: s.hex }} title={s.name} />
              ))}
            </div>
          </Reveal>

          {/* Profile */}
          <Reveal delay={0.1} className="flex flex-col gap-6 lg:col-span-5">
            <div className="border border-line bg-paper p-6 md:p-8">
              <p className="eyebrow text-muted">Perfil visual</p>
              <p className="font-display mt-3 text-3xl leading-tight">{tp.primary?.name}</p>
              <p className="mt-1 text-[13.5px] text-espresso/65">
                con matices de {tp.secondary?.name.toLowerCase()} · atmósfera {tp.atmosphereWords.slice(0, 3).join(", ")}
              </p>
              <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-line pt-5">
                {tp.preferred.slice(0, 6).map((t) => (
                  <li key={t.tag} className="flex flex-col text-[13px]">
                    {TAG_META[t.tag].label}
                    <ConfidenceBadge c={t.confidence} />
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-line pt-5">
                <p className="eyebrow mb-4 text-muted">Materiales</p>
                <MaterialList materials={tp.materials} />
              </div>
              <div className="mt-6 border-t border-line pt-5">
                <p className="eyebrow mb-3 text-muted">Paleta</p>
                <PaletteStrip palette={tp.palette} />
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="border-t border-espresso/80 pt-4">
                <p className="eyebrow text-muted">Luz</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-espresso/80">{tp.lighting[0]}</p>
              </div>
              <div className="border-t border-espresso/80 pt-4">
                <p className="eyebrow text-clay">Evitar</p>
                <p className="mt-2 text-[13.5px] leading-relaxed text-espresso/80">{tp.avoidLines.slice(0, 3).join(" · ")}</p>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-6 grid gap-6 lg:grid-cols-12">
          <blockquote className="border-l-2 border-clay pl-5 lg:col-span-5">
            <p className="font-display text-xl italic leading-snug">«{mood.notes[0]}»</p>
            <footer className="mt-2 text-[12px] text-muted">Comentario del agente sobre el moodboard</footer>
          </blockquote>
          <div className="bg-chalk/70 p-6 lg:col-span-7">
            <p className="eyebrow text-muted">Del brief · preguntas abiertas para el diseñador</p>
            <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed">
              {brief.openQuestions.slice(0, 3).map((qq) => (
                <li key={qq} className="flex gap-3">
                  <span className="text-clay">—</span>
                  {qq}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
