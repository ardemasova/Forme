import { getRef } from "@/lib/catalog";
import { Photo } from "@/components/ui/Photo";
import { ConfidenceBadge, PaletteStrip } from "@/components/agent/ProfileBits";
import type { Brief } from "@/types";

function Row({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="print-break grid gap-3 border-t border-line py-6 md:grid-cols-[220px_1fr] md:gap-8">
      <h3 className="flex items-baseline gap-3">
        <span className="font-display text-sm text-clay">{String(n).padStart(2, "0")}</span>
        <span className="text-[13px] font-medium tracking-wide">{title}</span>
      </h3>
      <div className="text-[14.5px] leading-relaxed text-espresso/85">{children}</div>
    </section>
  );
}

const Empty = ({ children }: { children: React.ReactNode }) => <span className="text-muted">{children}</span>;

export function BriefDocument({ brief, title, client }: { brief: Brief; title: string; client?: string }) {
  const date = new Date(brief.generatedAt).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
  return (
    <article className="bg-paper px-5 py-8 md:px-12 md:py-12">
      <header className="flex flex-col gap-6 pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-clay">Brief de interiorismo</p>
          <h2 className="font-display mt-3 text-[clamp(2rem,4vw,3.2rem)] leading-[1.02]">{title}</h2>
          {client && <p className="mt-2 text-[13px] text-muted">{client}</p>}
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-1 text-[12px] md:text-right">
          <dt className="text-muted">Fecha</dt>
          <dd>{date}</dd>
          <dt className="text-muted">Origen</dt>
          <dd>Forme · prototipo</dd>
        </dl>
      </header>

      <Row n={1} title="Tipo de espacio">
        {brief.roomType ?? <Empty>Sin especificar</Empty>}
        {brief.roomArea && <span className="text-muted"> · {brief.roomArea} m²</span>}
      </Row>
      <Row n={2} title="Objetivo del proyecto">
        <p>{brief.goal}</p>
        {!brief.goalFromUser && <p className="mt-1 text-[12px] text-muted">Formulado a partir de tus respuestas.</p>}
      </Row>
      <Row n={3} title="Atmósfera">
        {brief.atmosphere.length ? (
          <p className="font-display text-2xl leading-snug">{brief.atmosphere.join(" · ")}</p>
        ) : (
          <Empty>Aún sin definir</Empty>
        )}
      </Row>
      <Row n={4} title="Dirección visual">
        {brief.direction ? (
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-medium">{brief.direction.primary}</span>
            {brief.direction.secondary && <span className="text-espresso/65">con matices de {brief.direction.secondary.toLowerCase()}</span>}
            <ConfidenceBadge c={brief.direction.confidence} />
          </div>
        ) : (
          <Empty>Aún sin definir</Empty>
        )}
      </Row>
      <Row n={5} title="Paleta">
        <PaletteStrip palette={brief.palette} />
      </Row>
      <Row n={6} title="Materiales preferidos">
        {brief.materials.length ? (
          <ul className="space-y-1">
            {brief.materials.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <Empty>Sin preferencias claras</Empty>
        )}
      </Row>
      <Row n={7} title="Iluminación">
        {brief.lighting.length ? (
          <ul className="space-y-1">
            {brief.lighting.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        ) : (
          <Empty>Sin datos suficientes sobre la luz</Empty>
        )}
      </Row>
      <Row n={8} title="Antipreferencias">
        {brief.avoid.length ? (
          <ul className="flex flex-wrap gap-2">
            {brief.avoid.map((m) => (
              <li key={m} className="border border-clay/40 px-2.5 py-1 text-[13px]">
                {m}
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No se detectaron rechazos claros</Empty>
        )}
      </Row>
      <Row n={9} title="Referencias guardadas">
        {brief.references.length ? (
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {brief.references.map((r) => (
              <li key={r.id}>
                <Photo refId={r.id} w={260} sizes="120px" className="aspect-[4/5] w-full" />
                <p className="mt-1.5 text-[11px] leading-tight text-espresso/70">{getRef(r.id)?.title}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>Sin referencias</Empty>
        )}
      </Row>
      <Row n={10} title="Presupuesto">{brief.budget ?? <Empty>No indicado</Empty>}</Row>
      <Row n={11} title="Necesidades funcionales">
        {brief.functional.length ? brief.functional.join(" · ") : <Empty>No indicadas</Empty>}
        {brief.constraints && (
          <p className="mt-2">
            <span className="text-muted">Limitaciones / elementos obligatorios: </span>
            {brief.constraints}
          </p>
        )}
      </Row>
      <Row n={12} title="Preguntas abiertas">
        {brief.openQuestions.length ? (
          <ol className="space-y-2">
            {brief.openQuestions.map((q, i) => (
              <li key={q} className="flex gap-3">
                <span className="text-clay">{i + 1}.</span>
                {q}
              </li>
            ))}
          </ol>
        ) : (
          <Empty>Ninguna</Empty>
        )}
      </Row>
      <footer className="border-t border-line pt-5 text-[11.5px] leading-relaxed text-muted">
        Las preferencias de este brief son hipótesis construidas a partir de elecciones visuales, no conclusiones definitivas. Generado
        localmente por la lógica de demostración de Forme.
      </footer>
    </article>
  );
}
