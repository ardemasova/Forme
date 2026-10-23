import type { Confidence, Direction, MaterialChip, Swatch } from "@/types";
import { unsplash } from "@/lib/catalog";

export function ConfidenceBadge({ c, className = "" }: { c: Confidence; className?: string }) {
  return c === "visible" ? (
    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-olive ${className}`}>
      <span className="size-1.5 rounded-full bg-olive" aria-hidden /> Ya se nota
    </span>
  ) : (
    <span className={`inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-clay ${className}`}>
      <span className="size-1.5 rounded-full border border-dashed border-clay" aria-hidden /> Aún explorando
    </span>
  );
}

export function PaletteStrip({ palette, tall = false, labels = true }: { palette: Swatch[]; tall?: boolean; labels?: boolean }) {
  if (!palette.length) return <p className="text-sm text-muted">La paleta aparecerá en cuanto haya más elecciones.</p>;
  return (
    <ul className="flex w-full" aria-label="Paleta de color">
      {palette.map((s) => (
        <li key={s.hex + s.name} className="min-w-0 flex-1">
          <span
            className={`block w-full border-y border-r border-espresso/5 first:border-l ${tall ? "h-24" : "h-12"}`}
            style={{ background: s.hex }}
            aria-hidden
          />
          {labels && (
            <span className="mt-2 block truncate pr-1 text-[11px] leading-tight text-espresso/80">
              {s.name}
              <span className="block text-[10px] uppercase tracking-wider text-muted">{s.hex}</span>
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

export function MaterialList({ materials, compact = false }: { materials: MaterialChip[]; compact?: boolean }) {
  if (!materials.length) return <p className="text-sm text-muted">Aún no hay materiales claros.</p>;
  return (
    <ul className={compact ? "space-y-2" : "grid grid-cols-2 gap-x-4 gap-y-4"}>
      {materials.map((m) => (
        <li key={m.tag} className="flex items-center gap-3">
          <span
            className={`${compact ? "size-8" : "size-11"} shrink-0 overflow-hidden rounded-full border border-espresso/10`}
            style={{
              background: m.image ? `${m.color} url(${unsplash(m.image, 160)}) center/cover` : m.color,
            }}
            aria-hidden
          />
          <span className="min-w-0 text-[13px] leading-tight">
            {m.name}
            {!compact && <span className="mt-0.5 block text-[11px] text-muted">{m.note}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function DirectionMeter({ directions, max = 3, dark = false }: { directions: Direction[]; max?: number; dark?: boolean }) {
  const top = directions.filter((d) => d.score > 0).slice(0, max);
  if (!top.length) return null;
  const best = top[0].score || 1;
  return (
    <ul className="space-y-2.5">
      {top.map((d, i) => (
        <li key={d.id}>
          <div className="flex items-baseline justify-between gap-3 text-[12.5px]">
            <span className={i === 0 ? "font-medium" : dark ? "text-ivory/70" : "text-espresso/70"}>{d.name}</span>
            <span className={`text-[11px] tabular-nums ${dark ? "text-ivory/50" : "text-muted"}`}>{Math.round((d.score / best) * 100)}</span>
          </div>
          <div className={`mt-1 h-[3px] ${dark ? "bg-ivory/15" : "bg-chalk"}`}>
            <div
              className={`h-full transition-[width] duration-700 ${i === 0 ? (dark ? "bg-clay" : "bg-olive") : dark ? "bg-ivory/45" : "bg-espresso/30"}`}
              style={{ width: `${Math.max(8, (d.score / best) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
