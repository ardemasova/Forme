"use client";

import { AnimatePresence, motion } from "motion/react";
import { Bookmark, BookmarkCheck, MinusCircle, ThumbsDown } from "lucide-react";
import { getRef } from "@/lib/catalog";
import { Photo } from "@/components/ui/Photo";
import { MaterialList, PaletteStrip } from "@/components/agent/ProfileBits";
import type { Moodboard as MoodboardT } from "@/types";

const AREAS: { col: string; row: string }[] = [
  { col: "1 / 4", row: "1 / 5" },
  { col: "4 / 7", row: "1 / 3" },
  { col: "4 / 6", row: "3 / 5" },
  { col: "1 / 3", row: "5 / 8" },
  { col: "3 / 5", row: "5 / 7" },
  { col: "5 / 7", row: "5 / 8" },
];

const ORIGIN: Record<string, string> = { guardado: "Guardado", "me-gusta": "Te gustó", sugerido: "Sugerencia" };

export function MoodboardView({
  board,
  title,
  editable = false,
  onSave,
  onUnsave,
  onReject,
  onRemove,
}: {
  board: MoodboardT;
  title?: string;
  editable?: boolean;
  onSave?: (id: string) => void;
  onUnsave?: (id: string) => void;
  onReject?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  if (!board.items.length) {
    return (
      <div className="border border-dashed border-line p-10 text-center">
        <p className="font-display text-2xl">El tablero está vacío</p>
        <p className="mt-2 text-sm text-muted">Valora algunas propuestas o recupera las piezas que quitaste.</p>
      </div>
    );
  }
  return (
    <div className="bg-paper p-3 md:p-5">
      {title && (
        <div className="mb-4 flex items-baseline justify-between gap-4 px-1">
          <p className="font-display text-xl">{title}</p>
          <p className="text-[11px] tracking-[0.14em] text-muted uppercase">{board.items.length} piezas</p>
        </div>
      )}
      <ul className="grid grid-cols-2 gap-2 md:grid-cols-6 md:[grid-auto-rows:84px] lg:[grid-auto-rows:96px]">
        <AnimatePresence initial={false}>
          {board.items.map((it, i) => {
            const ref = getRef(it.refId);
            if (!ref) return null;
            const area = AREAS[i];
            return (
              <motion.li
                key={it.refId}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.45, ease: [0.22, 0.61, 0.36, 1] }}
                className="group relative aspect-[4/5] overflow-hidden md:aspect-auto md:[grid-column:var(--c)] md:[grid-row:var(--r)]"
                style={{ ["--c" as string]: area?.col, ["--r" as string]: area?.row }}
              >
                <Photo refId={ref.id} w={i === 0 ? 900 : 520} sizes="(min-width:768px) 30vw, 50vw" className="absolute inset-0 h-full w-full transition-transform duration-[1.2s] group-hover:scale-[1.03]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-espresso/75 via-espresso/30 to-transparent p-3 pt-10 text-ivory">
                  <p className="text-[10px] tracking-[0.14em] text-ivory/75 uppercase">{ORIGIN[it.origin]}</p>
                  <p className="font-display text-[17px] leading-tight">{ref.title}</p>
                  <p className="mt-0.5 hidden text-[11.5px] leading-snug text-ivory/80 md:block">{it.note}</p>
                </div>
                {editable && (
                  <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                    {it.origin === "guardado" ? (
                      <IconBtn label={`Quitar «${ref.title}» de guardados`} onClick={() => onUnsave?.(ref.id)}>
                        <BookmarkCheck className="size-3.5 text-clay" />
                      </IconBtn>
                    ) : (
                      <IconBtn label={`Guardar «${ref.title}»`} onClick={() => onSave?.(ref.id)}>
                        <Bookmark className="size-3.5" />
                      </IconBtn>
                    )}
                    <IconBtn label={`«${ref.title}» no encaja`} onClick={() => onReject?.(ref.id)}>
                      <ThumbsDown className="size-3.5" />
                    </IconBtn>
                    <IconBtn label={`Quitar «${ref.title}» del tablero`} onClick={() => onRemove?.(ref.id)}>
                      <MinusCircle className="size-3.5" />
                    </IconBtn>
                  </div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
        {board.palette.length > 0 && (
          <li className="col-span-2 flex h-20 md:col-span-1 md:h-auto md:flex-col md:[grid-column:6/7] md:[grid-row:3/5]" aria-label="Paleta">
            {board.palette.slice(0, 5).map((s) => (
              <span key={s.hex} className="flex-1" style={{ background: s.hex }} title={`${s.name} ${s.hex}`} />
            ))}
          </li>
        )}
        {board.notes[0] && (
          <li className="col-span-2 flex items-center bg-olive p-4 text-ivory md:[grid-column:3/5] md:[grid-row:7/8]">
            <p className="text-[12px] leading-snug">{board.notes[0]}</p>
          </li>
        )}
      </ul>

      <div className="mt-6 grid gap-8 px-1 md:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="eyebrow mb-3 text-muted">Paleta</p>
          <PaletteStrip palette={board.palette} />
        </div>
        <div>
          <p className="eyebrow mb-3 text-muted">Materiales y texturas</p>
          <MaterialList materials={board.materials} compact />
        </div>
      </div>
      {board.notes.length > 1 && (
        <ul className="mt-6 space-y-2 border-t border-line px-1 pt-4">
          {board.notes.slice(1).map((n) => (
            <li key={n} className="flex gap-3 text-[13px] leading-relaxed text-espresso/80">
              <span className="font-display text-clay">F.</span>
              {n}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="grid size-8 place-items-center bg-paper/95 text-espresso shadow-sm transition-colors hover:bg-ivory">
      {children}
    </button>
  );
}
