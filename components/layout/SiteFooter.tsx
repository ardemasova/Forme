import Link from "next/link";
import { Wordmark } from "@/components/layout/SiteHeader";

const COLS = [
  {
    title: "Producto",
    links: [
      { href: "/#como-funciona", label: "Cómo funciona" },
      { href: "/#agente", label: "Diseñador IA" },
      { href: "/#resultado", label: "Ejemplo de resultado" },
    ],
  },
  {
    title: "Prototipo",
    links: [
      { href: "/explore", label: "Estudio" },
      { href: "/brief", label: "Brief" },
      { href: "/telegram-demo", label: "Demo de Telegram" },
      { href: "/dashboard", label: "CRM para diseñadores" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-line bg-ivory">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-5 py-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <Wordmark className="text-[40px]" />
          <p className="font-display mt-5 max-w-sm text-xl italic leading-snug text-espresso/70">
            An experiment in spaces, taste and artificial intelligence.
          </p>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <p className="eyebrow text-muted">{c.title}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-espresso/75 transition-colors hover:text-espresso">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 border-t border-line px-5 py-6 text-xs text-muted md:flex-row md:justify-between md:px-10">
        <p>Concepto de producto para portfolio. El agente funciona con lógica local de demostración.</p>
        <p>Fotografía: Unsplash.</p>
      </div>
    </footer>
  );
}
