"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

const PINS = [
  { id: "hyp-galeria-color", x: -40, y: -30, r: -7, keep: false },
  { id: "r-celosia-japandi", x: 30, y: 40, r: 5, keep: true },
  { id: "r-gris-sobrio", x: 60, y: -50, r: 9, keep: false },
  { id: "r-dormitorio-lino", x: -55, y: 35, r: -4, keep: true },
  { id: "r-gabinete", x: 25, y: -20, r: -10, keep: false },
  { id: "r-wabi-comedor", x: 45, y: 60, r: 6, keep: true },
];

const POINTS = [
  "Las imágenes guardadas a menudo se contradicen entre sí.",
  "Es difícil explicarle a un diseñador lo que sientes en un espacio.",
  "Los nombres de estilos no ayudan a expresar preferencias personales.",
  "Las referencias sueltas no se convierten en un brief claro.",
];

function Pin({ pin, progress, index }: { pin: (typeof PINS)[number]; progress: MotionValue<number>; index: number }) {
  const x = useTransform(progress, [0, 1], [`${pin.x}%`, "0%"]);
  const y = useTransform(progress, [0, 1], [`${pin.y}%`, "0%"]);
  const rotate = useTransform(progress, [0, 1], [pin.r, 0]);
  const opacity = useTransform(progress, [0.55, 1], [1, pin.keep ? 1 : 0.28]);
  const filter = useTransform(progress, [0.55, 1], ["grayscale(0)", pin.keep ? "grayscale(0)" : "grayscale(1)"]);
  return (
    <motion.figure style={{ x, y, rotate, opacity, filter, zIndex: 10 - index }} className="relative aspect-[4/5] bg-paper p-1.5 shadow-[0_18px_40px_-24px_rgba(40,39,34,0.6)]">
      <Photo refId={pin.id} w={420} sizes="(min-width:1024px) 14vw, 30vw" className="h-full w-full" />
      <figcaption className="absolute -bottom-5 left-1.5 text-[10px] tracking-[0.14em] text-muted uppercase">Pin {String(index * 7 + 12).padStart(2, "0")}</figcaption>
    </motion.figure>
  );
}

export function Problem() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "center 45%"] });
  const progress = useTransform(scrollYProgress, (v) => (reduce ? 1 : v));

  return (
    <section className="grain overflow-x-clip border-y border-line bg-chalk/60">
      <div className="mx-auto grid max-w-[1440px] gap-16 px-5 py-24 md:px-10 lg:grid-cols-12 lg:py-32">
        <div className="lg:col-span-5">
          <Reveal>
            <p className="eyebrow text-clay">El problema</p>
            <h2 className="font-display mt-6 text-[clamp(2.2rem,4.2vw,3.8rem)] leading-[1.02]">
              Pinterest sabe lo que es bonito. ¿Pero sabe lo que <em className="italic">te gusta a ti</em>?
            </h2>
          </Reveal>
          <ol className="mt-12 divide-y divide-line border-y border-line">
            {POINTS.map((p, i) => (
              <Reveal as="li" key={p} delay={i * 0.06} className="grid grid-cols-[48px_1fr] gap-2 py-5 text-[15.5px] leading-relaxed text-espresso/80">
                <span className="font-display text-lg text-clay">0{i + 1}</span>
                {p}
              </Reveal>
            ))}
          </ol>
        </div>

        <div ref={ref} className="lg:col-span-6 lg:col-start-7">
          <div className="grid grid-cols-3 gap-4 md:gap-6">
            {PINS.map((p, i) => (
              <Pin key={p.id} pin={p} progress={progress} index={i} />
            ))}
          </div>
          <p className="mt-10 text-[12.5px] text-muted">
            Seis pines, tres direcciones distintas. Al ordenarlos aparece un patrón: madera, lino, luz lateral.
          </p>
        </div>

        <Reveal className="lg:col-span-10 lg:col-start-2">
          <p className="font-display border-t border-espresso/80 pt-10 text-[clamp(1.6rem,3vw,2.6rem)] leading-[1.18]">
            En lugar de pedirte que formules tu gusto, Forme te ayuda a <span className="italic text-olive">descubrirlo</span>.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
