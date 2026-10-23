"use client";

import { useEffect, useRef } from "react";
import { btn } from "@/components/ui/styles";

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      className="m-auto w-[min(92vw,440px)] border border-line bg-paper p-0 text-espresso backdrop:bg-espresso/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="p-7">
        <p className="eyebrow text-clay">Confirmación</p>
        <h2 className="font-display mt-3 text-2xl leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-espresso/75">{body}</p>
        <div className="mt-7 flex flex-wrap justify-end gap-3">
          <button onClick={onCancel} className={btn.ghost} autoFocus>
            Cancelar
          </button>
          <button onClick={onConfirm} className={btn.danger}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

