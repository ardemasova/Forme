import Link from "next/link";
import { ArrowRight, Bookmark, Send } from "lucide-react";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { PhoneFrame } from "@/components/telegram/PhoneFrame";
import { btn } from "@/components/ui/styles";

const FEATURES = [
  "Seguir la conversación con la IA",
  "Enviar fotos y enlaces",
  "Guardar las opciones que te gustan",
  "Responder preguntas de aclaración",
  "Volver a decisiones anteriores",
  "Recibir actualizaciones del moodboard",
];

export function TelegramTeaser() {
  return (
    <section className="grain border-y border-line bg-chalk/60">
      <div className="mx-auto grid max-w-[1440px] items-center gap-16 px-5 py-24 md:px-10 lg:grid-cols-12 lg:py-28">
        <Reveal className="lg:col-span-6">
          <p className="eyebrow text-clay">Telegram</p>
          <h2 className="font-display mt-6 text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.02]">Tu proyecto de interior, siempre a mano.</h2>
          <p className="mt-6 max-w-lg text-[16px] leading-relaxed text-espresso/75">
            En el producto imaginado, la conversación continúa donde ya hablas a diario. En una tienda, en casa de unos amigos, delante de
            una lámpara: le enseñas la foto a Forme y tu perfil se ajusta.
          </p>
          <ul className="mt-10 grid gap-x-8 sm:grid-cols-2">
            {FEATURES.map((f, i) => (
              <li key={f} className="flex gap-4 border-t border-line py-3.5 text-[14.5px]">
                <span className="font-display text-sm text-clay">{String(i + 1).padStart(2, "0")}</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap items-center gap-6">
            <Link href="/telegram-demo" className={btn.primary}>
              Probar la demo de Telegram <ArrowRight className="size-4" />
            </Link>
            <p className="text-[12px] text-muted">Prototipo interactivo dentro del sitio. No se conecta a Telegram.</p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-5 lg:col-start-8">
          <PhoneFrame
            className="h-[640px]"
            footer={
              <div className="flex items-center gap-2 border-t border-espresso/10 bg-paper px-3 py-2.5" aria-hidden>
                <span className="flex-1 rounded-full bg-chalk/70 px-4 py-2 text-[12.5px] text-muted">Mensaje</span>
                <span className="grid size-8 place-items-center rounded-full bg-olive text-ivory">
                  <Send className="size-3.5" />
                </span>
              </div>
            }
          >
            <div className="flex h-full flex-col justify-end gap-2 p-3 text-[13px] leading-snug" aria-label="Ejemplo de conversación">
              <p className="mx-auto mb-1 rounded-full bg-espresso/10 px-2.5 py-0.5 text-[10.5px] text-espresso/60">Hoy</p>
              <div className="max-w-[86%] rounded-2xl rounded-bl-md bg-paper px-3 py-2 shadow-sm">
                He notado que te atraen sobre todo los materiales naturales y la luz suave. ¿Quieres ver más opciones en esta línea?
                <span className="mt-1 block text-right text-[10px] text-muted">18:04</span>
              </div>
              <div className="grid max-w-[86%] grid-cols-2 gap-1 rounded-2xl rounded-bl-md bg-paper p-1 shadow-sm">
                <Photo refId="r-comedor-arco" w={300} sizes="160px" className="aspect-[4/5] w-full rounded-xl" />
                <Photo refId="r-cortina-ramas" w={300} sizes="160px" className="aspect-[4/5] w-full rounded-xl" />
              </div>
              <div className="flex max-w-[86%] gap-1">
                {["Me gusta la 1", "Más así", "No encaja"].map((x) => (
                  <span key={x} className="rounded-lg border border-olive/25 bg-paper/70 px-2.5 py-1.5 text-[11.5px] text-olive">
                    {x}
                  </span>
                ))}
              </div>
              <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-md bg-olive px-3 py-2 text-ivory">
                La primera. Me encanta el arco.
                <span className="mt-1 block text-right text-[10px] text-ivory/60">18:05 ✓✓</span>
              </div>
              <div className="max-w-[86%] rounded-2xl rounded-bl-md bg-paper px-3 py-2 shadow-sm">
                <span className="mb-1 flex items-center gap-1 text-[11px] font-medium text-clay">
                  <Bookmark className="size-3" /> Moodboard actualizado
                </span>
                Añadido. Refuerza la línea de paredes de cal y formas curvas.
              </div>
            </div>
          </PhoneFrame>
        </Reveal>
      </div>
    </section>
  );
}
