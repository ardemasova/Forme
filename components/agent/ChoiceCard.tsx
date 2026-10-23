"use client";

import { Check } from "lucide-react";
import { getRef } from "@/lib/catalog";
import { Photo } from "@/components/ui/Photo";

export function ChoiceCard({
  refId,
  selected,
  dimmed,
  onSelect,
  label,
  aspect = "aspect-[4/5]",
  sizes = "(min-width:1024px) 22vw, 90vw",
}: {
  refId: string;
  selected: boolean;
  dimmed?: boolean;
  onSelect: () => void;
  label?: string;
  aspect?: string;
  sizes?: string;
}) {
  const ref = getRef(refId);
  if (!ref) return null;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`group block w-full text-left transition-opacity duration-500 ${dimmed ? "opacity-50 hover:opacity-90" : ""}`}
    >
      <span
        className={`relative block overflow-hidden outline outline-2 transition-[outline-offset,outline-color] duration-500 ${aspect} ${
          selected ? "outline-offset-[5px] outline-olive" : "outline-offset-0 outline-transparent group-hover:outline-line"
        }`}
      >
        <Photo refId={refId} w={700} sizes={sizes} className="absolute inset-0 h-full w-full transition-transform duration-[1.4s] ease-out group-hover:scale-[1.04]" />
        {label && (
          <span className="absolute left-3 top-3 bg-paper/90 px-2 py-0.5 text-[10.5px] font-medium tracking-[0.14em] uppercase">{label}</span>
        )}
        <span
          className={`absolute right-3 top-3 flex items-center gap-1.5 bg-olive px-2.5 py-1 text-[11px] font-medium text-ivory transition-all duration-300 ${
            selected ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
          aria-hidden={!selected}
        >
          <Check className="size-3" /> Elegida
        </span>
      </span>
      <span className="mt-3 block">
        <span className="font-display block text-[19px] leading-tight">{ref.title}</span>
        <span className="mt-1 block text-[13px] leading-snug text-espresso/65">{ref.caption}</span>
      </span>
    </button>
  );
}
