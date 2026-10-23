import { Heart, X } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { ConfidenceBadge } from "@/components/agent/ProfileBits";

const STEPS = [
  {
    n: "01",
    title: "Explora",
    text: "La IA te enseña interiores, materiales, luz y detalles. Tú eliges lo que sientes cercano.",
  },
  {
    n: "02",
    title: "Explica",
    text: "El agente hace preguntas breves: qué te gusta exactamente, qué te resulta incómodo y por qué una opción te acerca más que otra.",
  },
  {
    n: "03",
    title: "Descubre",
    text: "La IA detecta patrones, formula hipótesis y las pone a prueba con nuevas propuestas.",
  },
  {
    n: "04",
    title: "Crea",
    text: "Aparecen tu moodboard, tu perfil de gusto y un brief estructurado para el diseñador.",
  },
];

function Visual({ n }: { n: string }) {
  if (n === "01")
    return (
      <div className="relative h-full">
        <Photo refId="r-wabi-comedor" w={600} sizes="(min-width:1024px) 22vw, 90vw" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-x-3 bottom-3 flex gap-2">
          <span className="flex items-center gap-1.5 bg-paper px-3 py-1.5 text-[11px] font-medium text-olive">
            <Heart className="size-3 fill-olive" /> Me gusta
          </span>
          <span className="flex items-center gap-1.5 bg-paper/80 px-3 py-1.5 text-[11px] text-espresso/60">
            <X className="size-3" /> No encaja
          </span>
        </div>
      </div>
    );
  if (n === "02")
    return (
      <div className="flex h-full flex-col justify-end gap-2.5 bg-paper p-4 text-[12.5px] leading-snug">
        <p className="max-w-[85%] bg-chalk/70 px-3 py-2">¿Qué te atrae más de este espacio?</p>
        <p className="ml-auto max-w-[80%] bg-olive px-3 py-2 text-ivory">La luz que entra de lado y la madera.</p>
        <p className="max-w-[85%] bg-chalk/70 px-3 py-2">¿Y qué te resulta incómodo del segundo?</p>
        <p className="ml-auto max-w-[80%] bg-olive px-3 py-2 text-ivory">Demasiado gris, parece una oficina.</p>
      </div>
    );
  if (n === "03")
    return (
      <div className="flex h-full flex-col justify-between bg-olive p-5 text-ivory">
        <p className="eyebrow text-ivory/60">Hipótesis</p>
        <p className="font-display text-xl leading-snug">«Te importa más la calidez que la cantidad de objetos.»</p>
        <ul className="space-y-1.5 text-[12px]">
          <li className="flex justify-between border-t border-ivory/15 pt-2">
            Madera natural <ConfidenceBadge c="visible" className="!text-ivory" />
          </li>
          <li className="flex justify-between border-t border-ivory/15 pt-2">
            Formas curvas <ConfidenceBadge c="explorando" className="!text-clay-soft" />
          </li>
        </ul>
      </div>
    );
  return (
    <div className="grid h-full grid-cols-2 grid-rows-[1fr_1fr_auto] gap-1.5 bg-paper p-1.5">
      <Photo refId="r-cortina-ramas" w={320} sizes="12vw" className="row-span-2 h-full w-full" />
      <Photo refId="m-lino" w={320} sizes="12vw" className="h-full w-full" />
      <Photo refId="r-ceramica" w={320} sizes="12vw" className="h-full w-full" />
      <div className="col-span-2 flex h-6">
        {["#EFE8DC", "#D8C6A9", "#8B8A6B", "#B08A62", "#B47C61"].map((c) => (
          <span key={c} className="flex-1" style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="como-funciona" className="scroll-mt-16">
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 lg:py-32">
        <Reveal className="grid gap-8 lg:grid-cols-12">
          <p className="eyebrow text-clay lg:col-span-3">Cómo funciona</p>
          <h2 className="font-display text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.02] lg:col-span-8">
            El gusto no hace falta conocerlo de antemano. <span className="italic text-olive">Se puede explorar.</span>
          </h2>
        </Reveal>

        <ol className="mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:mt-24 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.n} delay={i * 0.08} className={`group ${i % 2 === 1 ? "lg:mt-16" : ""}`}>
                <div className="aspect-[4/5] overflow-hidden border border-line transition-transform duration-700 group-hover:-translate-y-1">
                  <Visual n={s.n} />
                </div>
                <div className="mt-6 flex items-baseline gap-4 border-t border-espresso/70 pt-4">
                  <span className="font-display text-sm text-clay">{s.n}</span>
                  <h3 className="font-display text-[28px] leading-none">{s.title}</h3>
                </div>
                <p className="mt-3 text-[14.5px] leading-relaxed text-espresso/70">{s.text}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
