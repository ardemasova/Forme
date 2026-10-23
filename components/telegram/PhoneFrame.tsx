import type { ReactNode } from "react";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Wordmark } from "@/components/layout/SiteHeader";

/** Device frame + Telegram-like chat chrome, styled in Forme's palette. */
export function PhoneFrame({
  children,
  footer,
  className = "",
  status = "diseñador de interiores · demo",
  onBack,
}: {
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  status?: string;
  onBack?: () => void;
}) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[380px] rounded-[46px] bg-espresso p-[10px] shadow-[0_40px_80px_-40px_rgba(40,39,34,0.55)] ${className}`}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[37px] bg-[#EDE8DF]">
        {/* status bar */}
        <div className="flex items-center justify-between px-7 pb-1 pt-3 text-[11px] font-semibold text-espresso">
          <span>9:41</span>
          <span className="absolute left-1/2 top-2.5 h-[22px] w-[92px] -translate-x-1/2 rounded-full bg-espresso" aria-hidden />
          <span className="flex items-center gap-1" aria-hidden>
            <span className="h-2 w-3 rounded-[2px] border border-espresso/70" />
          </span>
        </div>
        {/* chat header */}
        <div className="flex items-center gap-3 border-b border-espresso/10 bg-paper/90 px-3 py-2.5">
          {onBack ? (
            <button onClick={onBack} className="p-1 text-olive" aria-label="Volver al proyecto">
              <ChevronLeft className="size-5" />
            </button>
          ) : (
            <ChevronLeft className="size-5 text-olive" aria-hidden />
          )}
          <span className="grid size-9 place-items-center rounded-full bg-olive text-ivory" aria-hidden>
            <span className="font-display text-lg leading-none">F</span>
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="flex items-center gap-1 text-[14px] font-semibold">
              <Wordmark className="!text-[15px] font-sans" />
              <span className="ml-1 rounded-sm bg-olive/10 px-1 text-[9px] font-medium uppercase tracking-wider text-olive">bot</span>
            </p>
            <p className="truncate text-[11px] text-muted">{status}</p>
          </div>
          <MoreVertical className="size-4 text-muted" aria-hidden />
        </div>
        <div
          className="relative flex-1 overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 10%, rgba(180,124,97,0.08), transparent 40%), radial-gradient(circle at 80% 80%, rgba(65,72,59,0.08), transparent 45%)",
          }}
        >
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}
