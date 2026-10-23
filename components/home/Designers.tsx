import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { sampleEntries, STATUS_LABEL } from "@/lib/crm/samples";
import { feedbackState } from "@/lib/agent/engine";
import { Photo } from "@/components/ui/Photo";
import { Reveal } from "@/components/ui/Reveal";
import { btn } from "@/components/ui/styles";

const BENEFITS = [
  ["Brief listo antes de la primera reunión", "Llegas sabiendo qué atmósfera, materiales y luz busca el cliente."],
  ["Referencias coherentes", "Un moodboard editado, no cuarenta pines contradictorios."],
  ["Preferencias y rechazos", "Lo que le gusta y, sobre todo, lo que no quiere ver."],
  ["Presupuesto y prioridades", "Solo lo que el cliente indicó. Nada inventado."],
  ["Historial de decisiones", "Cada elección y cada cambio de opinión, con su contexto."],
  ["Preguntas abiertas", "Las dudas que conviene resolver en persona."],
];

export function Designers() {
  const rows = sampleEntries().slice(0, 4);
  const lead = rows[1].project;
  return (
    <section id="disenadores" className="scroll-mt-16">
      <div className="mx-auto max-w-[1440px] px-5 py-24 md:px-10 lg:py-32">
        <Reveal className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="eyebrow text-clay">Para diseñadores</p>
            <h2 className="font-display mt-6 text-[clamp(2.2rem,4.4vw,4rem)] leading-[1.02]">
              Menos suposiciones. <span className="italic text-olive">Más comprensión del cliente.</span>
            </h2>
          </div>
        </Reveal>

        <div className="mt-16 grid gap-12 lg:grid-cols-12">
          <dl className="grid content-start gap-x-8 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1 xl:grid-cols-2">
            {BENEFITS.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.04} className="border-t border-line py-5">
                <dt className="text-[15px] font-medium">{t}</dt>
                <dd className="mt-1.5 text-[13.5px] leading-relaxed text-espresso/65">{d}</dd>
              </Reveal>
            ))}
          </dl>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="border border-line bg-paper shadow-[0_30px_70px_-45px_rgba(40,39,34,0.55)]">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <p className="text-[12px] font-medium">Estudio · Proyectos</p>
                <span className="text-[10px] tracking-[0.14em] text-muted uppercase">Datos de ejemplo</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-[12.5px]">
                  <thead className="text-[10.5px] tracking-[0.12em] text-muted uppercase">
                    <tr className="border-b border-line">
                      <th className="px-5 py-2.5 font-medium">Cliente</th>
                      <th className="py-2.5 font-medium">Espacio</th>
                      <th className="py-2.5 font-medium">Dirección</th>
                      <th className="py-2.5 pr-5 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={r.id} className={`border-b border-line last:border-0 ${i === 1 ? "bg-chalk/50" : ""}`}>
                        <td className="px-5 py-3">
                          {r.client}
                          <span className="block text-[10.5px] text-muted">{r.id}</span>
                        </td>
                        <td className="py-3">{r.project.answers.project.roomType}</td>
                        <td className="py-3">{r.project.snapshot?.tasteProfile.primary?.name}</td>
                        <td className="py-3 pr-5">
                          <span className="whitespace-nowrap border border-line px-2 py-0.5 text-[11px]">{STATUS_LABEL[r.status]}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-4 border-t border-line p-5 sm:grid-cols-[1fr_1.2fr]">
                <div className="grid grid-cols-2 gap-1.5">
                  {lead.snapshot!.moodboard.items.slice(0, 4).map((it) => (
                    <Photo key={it.refId} refId={it.refId} w={300} sizes="120px" className="aspect-square w-full" />
                  ))}
                </div>
                <div className="text-[13px] leading-relaxed">
                  <p className="eyebrow text-muted">Daniel y Marta · resumen</p>
                  <p className="font-display mt-2 text-xl">{lead.snapshot!.tasteProfile.primary?.name}</p>
                  <p className="mt-2 text-espresso/70">
                    {lead.snapshot!.tasteProfile.atmosphereWords.join(", ")}. {feedbackState(lead.answers).saved.length} referencias
                    guardadas, {lead.snapshot!.brief!.openQuestions.length} preguntas abiertas.
                  </p>
                  <p className="mt-2 text-clay">Evitar: {lead.snapshot!.tasteProfile.avoidLines.slice(0, 2).join(", ").toLowerCase()}.</p>
                </div>
              </div>
            </div>
            <Link href="/dashboard" className={`${btn.secondary} mt-8`}>
              Ver el CRM <ArrowRight className="size-4" />
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
