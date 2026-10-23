import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";

export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <Photo refId="r-cortina-ramas" w={1800} sizes="100vw" className="absolute inset-0 -z-10 h-full w-full" />
      <div className="absolute inset-0 -z-10 bg-espresso/25" aria-hidden />
      <div className="mx-auto flex max-w-[1440px] px-5 py-28 md:px-10 lg:py-40">
        <Reveal className="max-w-2xl bg-ivory/95 p-8 backdrop-blur md:p-14">
          <h2 className="font-display text-[clamp(2.2rem,4.6vw,4.2rem)] leading-[1.02]">
            Tu futuro interior no empieza por un estilo. <span className="italic text-olive">Empieza por ti.</span>
          </h2>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-espresso/75">
            Explora, compara, cambia de opinión. Forme te ayuda a convertir sensaciones en una imagen clara de tu espacio.
          </p>
          <Link href="/explore" className="mt-10 inline-flex items-center gap-2 bg-olive px-7 py-4 text-[14px] font-medium text-ivory transition-colors hover:bg-espresso">
            Encuentra tu estilo <ArrowRight className="size-4" />
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
