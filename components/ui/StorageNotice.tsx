"use client";

import { X } from "lucide-react";
import { store, useStore } from "@/lib/storage/store";

export function StorageNotice() {
  const { error } = useStore();
  if (!error) return null;
  return (
    <div
      role="alert"
      className="no-print fixed bottom-4 left-1/2 z-[60] flex w-[min(92vw,560px)] -translate-x-1/2 items-start gap-3 border border-clay/40 bg-paper px-4 py-3 text-sm text-espresso shadow-[0_12px_40px_-20px_rgba(40,39,34,0.5)]"
    >
      <span className="mt-1 size-2 shrink-0 rounded-full bg-clay" aria-hidden />
      <p className="flex-1 leading-relaxed">{error}</p>
      <button onClick={() => store.dismissError()} className="p-1 text-muted hover:text-espresso" aria-label="Cerrar aviso">
        <X className="size-4" />
      </button>
    </div>
  );
}
