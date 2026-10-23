"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useActiveProject } from "@/lib/storage/store";
import { STEPS } from "@/lib/agent/scenario";

const MARKETING = [
  { href: "/#como-funciona", label: "Cómo funciona" },
  { href: "/#agente", label: "Diseñador IA" },
  { href: "/#resultado", label: "Ejemplo de resultado" },
  { href: "/#disenadores", label: "Para diseñadores" },
];

const APP = [
  { href: "/explore", label: "Estudio" },
  { href: "/brief", label: "Brief" },
  { href: "/telegram-demo", label: "Telegram" },
  { href: "/dashboard", label: "CRM" },
];

export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display text-[26px] leading-none tracking-[-0.03em] ${className}`}>
      Forme<span className="text-clay">.</span>
    </span>
  );
}

export function SiteHeader({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { hydrated, project } = useActiveProject();
  const links = variant === "marketing" ? MARKETING : APP;

  // Close the mobile menu when this route is hidden/kept alive by the router.
  useLayoutEffect(() => () => setOpen(false), []);

  const step = project ? Math.min(project.currentStep, STEPS.length - 1) : null;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-line/70 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-5 md:px-10">
        <Link href="/" aria-label="Forme, inicio" className="shrink-0">
          <Wordmark />
        </Link>

        <nav aria-label="Principal" className="hidden flex-1 items-center gap-7 lg:flex">
          {links.map((l) => {
            const active = variant === "app" && pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`text-[13px] tracking-wide transition-colors ${active ? "text-espresso" : "text-espresso/60 hover:text-espresso"}`}
              >
                {l.label}
                {active && <span className="mt-0.5 block h-px bg-clay" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto hidden items-center gap-5 md:flex">
          <Link href="/explore" className="group flex items-center gap-2 text-[13px] text-espresso/75 hover:text-espresso">
            <span>Mi proyecto</span>
            {hydrated && project && step !== null && (
              <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted group-hover:border-espresso/30">
                {step + 1}/{STEPS.length}
              </span>
            )}
          </Link>
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 bg-olive px-4 py-2.5 text-[13px] font-medium text-ivory transition-colors hover:bg-espresso"
          >
            Encuentra tu estilo <ArrowUpRight className="size-3.5" />
          </Link>
        </div>

        <button
          className="ml-auto -mr-2 p-2 md:ml-4 lg:hidden"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Menú móvil" className="border-t border-line bg-ivory px-5 pb-6 pt-2 lg:hidden">
          <ul className="divide-y divide-line">
            {[...links, ...(variant === "marketing" ? APP.slice(1) : MARKETING.slice(0, 0))].map((l) => (
              <li key={l.href + l.label}>
                <Link href={l.href} onClick={() => setOpen(false)} className="flex items-center justify-between py-3.5 text-[15px]">
                  {l.label}
                  <ArrowUpRight className="size-4 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-5 grid grid-cols-2 gap-3 md:hidden">
            <Link href="/explore" onClick={() => setOpen(false)} className="border border-espresso/25 px-4 py-3 text-center text-[13px]">
              Mi proyecto
            </Link>
            <Link href="/explore" onClick={() => setOpen(false)} className="bg-olive px-4 py-3 text-center text-[13px] text-ivory">
              Encuentra tu estilo
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
