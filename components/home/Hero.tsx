import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { btn } from "@/components/ui/styles";

const BARS = [
  { label: "Calidez", v: 78, tone: "bg-olive" },
  { label: "Calma", v: 64, tone: "bg-olive/70" },
  { label: "Expresión", v: 22, tone: "bg-clay" },
];

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto grid max-w-[1440px] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-12">
        <div className="relative z-10 flex flex-col justify-between px-5 pb-12 pt-10 md:px-10 lg:col-span-7 lg:pb-14 lg:pt-16">
          <div className="flex items-center gap-4 text-muted animate-fade">
            <span className="eyebrow text-espresso">Your space. Your sense.</span>
            <span className="h-px w-16 bg-line" aria-hidden />
            <span className="eyebrow">N.º 01 — Estudio de gusto</span>
          </div>

          <div className="mt-12 lg:mt-0">
            <h1 className="font-display text-[clamp(3.1rem,7.6vw,7.4rem)] leading-[0.94] animate-rise">
              Encuentra
              <br />
              el interior
              <br />
              en el que <em className="font-display italic text-olive">eres tú</em>.
            </h1>
            <p className="mt-9 max-w-[33rem] text-[17px] leading-[1.65] text-espresso/75 animate-rise [animation-delay:120ms]">
              No necesitas conocer nombres de estilos ni coleccionar cientos de referencias. Elige lo que te resuene. Forme
              te ayuda a entender tu gusto y prepara la base de un interior que de verdad sea tuyo.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 animate-rise [animation-delay:220ms]">
              <Link href="/explore" className={`${btn.primary} px-7 py-4 text-[14px]`}>
                Explorar mi estilo <ArrowRight className="size-4" />
              </Link>
              <a href="#como-funciona" className={btn.link}>
                Ver cómo funciona
              </a>
            </div>
          </div>

          <p className="mt-12 text-[12.5px] tracking-wide text-muted lg:mt-0">
            5–7 minutos <span className="mx-2 text-line">·</span> Sin cuestionarios complicados
            <span className="mx-2 text-line">·</span> Moodboard personal
          </p>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative h-[68svh] min-h-[440px] lg:absolute lg:inset-0 lg:h-auto">
            <Photo refId="r-comedor-dorado" priority w={1400} sizes="(min-width:1024px) 42vw, 100vw" className="absolute inset-0 h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-espresso/35 to-transparent" aria-hidden />
            <p className="absolute right-5 top-5 bg-ivory/85 px-2.5 py-1 text-[10.5px] tracking-[0.14em] text-espresso/80 uppercase backdrop-blur">
              Ref. 014 — Comedor de luz dorada
            </p>
          </div>

          {/* Agent fragment */}
          <div className="relative z-10 mx-5 -mt-28 mb-10 max-w-[360px] border border-line bg-paper/95 p-5 shadow-[0_30px_60px_-30px_rgba(40,39,34,0.45)] backdrop-blur md:mx-10 lg:absolute lg:bottom-12 lg:-left-28 lg:m-0 animate-rise [animation-delay:380ms]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-medium text-olive">
                <span className="size-1.5 animate-pulse rounded-full bg-olive" aria-hidden /> Forme · diseñador IA
              </span>
              <span className="eyebrow text-[9.5px] text-muted">Vista previa</span>
            </div>
            <p className="mt-3 text-[13.5px] leading-relaxed">
              Eliges madera natural y luz suave, y descartas el gris frío. <span className="text-espresso/60">¿Probamos algo en esta línea?</span>
            </p>
            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {["r-celosia-japandi", "r-dormitorio-lino", "m-travertino"].map((id, i) => (
                <div key={id} className="relative aspect-square overflow-hidden">
                  <Photo refId={id} w={240} sizes="120px" className="h-full w-full" />
                  {i === 1 && (
                    <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-olive text-ivory" aria-label="Elegida">
                      <Check className="size-2.5" />
                    </span>
                  )}
                </div>
              ))}
            </div>
            <ul className="mt-4 space-y-1.5" aria-label="Perfil de gusto de ejemplo">
              {BARS.map((b) => (
                <li key={b.label} className="grid grid-cols-[70px_1fr] items-center gap-2 text-[11px] text-espresso/70">
                  {b.label}
                  <span className="h-[3px] bg-chalk">
                    <span className={`block h-full ${b.tone}`} style={{ width: `${b.v}%` }} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
