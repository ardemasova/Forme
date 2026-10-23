"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Search } from "lucide-react";
import { store, useStore } from "@/lib/storage/store";
import { sampleEntries, STATUS_LABEL, STATUS_ORDER, type CrmEntry } from "@/lib/crm/samples";
import { feedbackState } from "@/lib/agent/engine";
import { ROOM_TYPES, TAG_META, getRef } from "@/lib/catalog";
import { STEPS } from "@/lib/agent/scenario";
import { Photo } from "@/components/ui/Photo";
import { BriefDocument } from "@/components/brief/BriefDocument";
import { MoodboardView } from "@/components/agent/Moodboard";
import { ConfidenceBadge, DirectionMeter, PaletteStrip } from "@/components/agent/ProfileBits";
import { FactorsPanel } from "@/components/agent/FactorsPanel";
import { btn } from "@/components/ui/styles";
import type { CrmStatus } from "@/types";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });

function useEntries(): { hydrated: boolean; entries: CrmEntry[] } {
  const s = useStore();
  return useMemo(() => {
    const local: CrmEntry[] = Object.values(s.projects)
      .filter((p) => p.answers.atmosphere)
      .map((p) => ({
        id: p.conversationId,
        client: "Tú (este navegador)",
        status: s.crm.status[p.conversationId] ?? (p.snapshot?.brief ? "nuevo" : "borrador"),
        sample: false,
        project: p,
      }));
    const samples = sampleEntries().map((e) => ({ ...e, status: s.crm.status[e.id] ?? e.status }));
    const all = [...local, ...samples].sort((a, b) => b.project.updatedAt.localeCompare(a.project.updatedAt));
    return { hydrated: s.hydrated, entries: all };
  }, [s]);
}

export function Dashboard() {
  const { hydrated, entries } = useEntries();
  const [selected, setSelected] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<CrmStatus | "todos">("todos");
  const [room, setRoom] = useState<string>("todos");

  // ?p=ID deep link (read client-side, kept in sync with history)
  useEffect(() => {
    const read = () => setSelected(new URLSearchParams(window.location.search).get("p"));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, []);

  const open = (id: string | null) => {
    // Keep the current path (works with a basePath on GitHub Pages).
    const url = id ? `${window.location.pathname}?p=${encodeURIComponent(id)}` : window.location.pathname;
    window.history.pushState(null, "", url);
    setSelected(id);
    window.scrollTo({ top: 0 });
  };

  const filtered = entries.filter((e) => {
    const p = e.project;
    const hay = `${e.client} ${e.id} ${p.name} ${p.snapshot?.tasteProfile.primary?.name ?? ""}`.toLowerCase();
    return (
      (!q || hay.includes(q.toLowerCase())) &&
      (status === "todos" || e.status === status) &&
      (room === "todos" || p.answers.project.roomType === room)
    );
  });

  const current = selected ? entries.find((e) => e.id === selected) : null;

  if (selected && hydrated && !current) {
    return (
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-20 md:px-10">
        <p className="font-display text-3xl">Proyecto no encontrado</p>
        <p className="mt-2 text-muted">Puede que se haya borrado de este navegador.</p>
        <button onClick={() => open(null)} className={`${btn.secondary} mt-6`}>
          Volver a la lista
        </button>
      </div>
    );
  }
  if (current) return <ProjectDetail entry={current} onBack={() => open(null)} />;

  const counts = STATUS_ORDER.map((s) => [s, entries.filter((e) => e.status === s).length] as const);
  const localCount = entries.filter((e) => !e.sample).length;

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-10 md:px-10 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="eyebrow text-clay">CRM · Estudio de interiorismo</p>
          <h1 className="font-display mt-3 text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.02]">Proyectos</h1>
        </div>
        <p className="max-w-md text-[12.5px] leading-relaxed text-muted">
          Demo local. Los proyectos marcados como <em>ejemplo</em> son datos ficticios; los tuyos se guardan solo en este navegador y no
          son visibles para nadie más.
        </p>
      </div>

      <dl className="mt-8 grid grid-cols-3 gap-px border border-line bg-line sm:grid-cols-6">
        {counts.map(([s, n]) => (
          <button key={s} onClick={() => setStatus(status === s ? "todos" : s)} className={`bg-ivory p-3 text-left transition-colors hover:bg-paper ${status === s ? "!bg-paper" : ""}`} aria-pressed={status === s}>
            <dt className="text-[11px] text-muted">{STATUS_LABEL[s]}</dt>
            <dd className="font-display mt-1 text-2xl">{n}</dd>
          </button>
        ))}
      </dl>

      <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center">
        <label className="flex flex-1 items-center gap-2 border border-line bg-paper px-3">
          <Search className="size-4 text-muted" />
          <span className="sr-only">Buscar</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente, proyecto o dirección…" className="w-full bg-transparent py-2.5 text-[13.5px] outline-none" />
        </label>
        <label className="flex items-center gap-2 text-[12.5px] text-muted">
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value as CrmStatus | "todos")} className="border border-line bg-paper px-2 py-2.5 text-[13px] text-espresso">
            <option value="todos">Todos</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[12.5px] text-muted">
          Espacio
          <select value={room} onChange={(e) => setRoom(e.target.value)} className="border border-line bg-paper px-2 py-2.5 text-[13px] text-espresso">
            <option value="todos">Todos</option>
            {ROOM_TYPES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
      </div>

      {hydrated && localCount === 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border border-dashed border-line px-4 py-3 text-[13px]">
          <span className="text-espresso/75">Todavía no tienes un proyecto propio. Cuando completes el estudio, aparecerá aquí junto a los ejemplos.</span>
          <Link href="/explore" className={btn.link}>
            Ir al estudio
          </Link>
        </div>
      )}

      {/* Table (desktop) */}
      <div className="mt-6 hidden border border-line bg-paper md:block">
        <table className="w-full text-left text-[13px]">
          <thead className="border-b border-line text-[10.5px] tracking-[0.12em] text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="py-3 font-medium">Proyecto</th>
              <th className="py-3 font-medium">Estado</th>
              <th className="py-3 font-medium">Dirección</th>
              <th className="py-3 font-medium">Presupuesto</th>
              <th className="py-3 text-right font-medium">Refs.</th>
              <th className="px-4 py-3 text-right font-medium">Actualizado</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => {
              const p = e.project;
              const fb = feedbackState(p.answers);
              return (
                <tr key={e.id} onClick={() => open(e.id)} className="cursor-pointer border-b border-line transition-colors last:border-0 hover:bg-chalk/40">
                  <td className="px-4 py-3">
                    <button onClick={() => open(e.id)} className="text-left font-medium hover:underline">
                      {e.client}
                    </button>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-muted">
                      {e.id}
                      <SourceBadge sample={e.sample} />
                    </span>
                  </td>
                  <td className="py-3">
                    {p.answers.project.roomType ?? <span className="text-muted">Sin definir</span>}
                    {p.answers.project.roomArea && <span className="text-muted"> · {p.answers.project.roomArea} m²</span>}
                  </td>
                  <td className="py-3">
                    <StatusPill s={e.status} />
                  </td>
                  <td className="py-3">{p.snapshot?.tasteProfile.primary?.name ?? <span className="text-muted">—</span>}</td>
                  <td className="py-3">{p.answers.project.budget ?? <span className="text-muted">No indicado</span>}</td>
                  <td className="py-3 text-right tabular-nums">{fb.saved.length + fb.liked.filter((x) => !fb.saved.includes(x)).length}</td>
                  <td className="px-4 py-3 text-right text-muted">{fmt(p.updatedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted">Ningún proyecto coincide con los filtros.</p>}
      </div>

      {/* Cards (mobile) */}
      <ul className="mt-6 space-y-3 md:hidden">
        {filtered.map((e) => (
          <li key={e.id}>
            <button onClick={() => open(e.id)} className="flex w-full gap-3 border border-line bg-paper p-3 text-left">
              {e.project.snapshot?.moodboard.items[0] && (
                <Photo refId={e.project.snapshot.moodboard.items[0].refId} w={200} sizes="80px" className="size-20 shrink-0" />
              )}
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{e.client}</span>
                  <StatusPill s={e.status} />
                </span>
                <span className="mt-1 block truncate text-[12.5px] text-espresso/70">{e.project.name}</span>
                <span className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                  {fmt(e.project.updatedAt)} <SourceBadge sample={e.sample} />
                </span>
              </span>
            </button>
          </li>
        ))}
        {filtered.length === 0 && <p className="p-6 text-center text-sm text-muted">Ningún proyecto coincide con los filtros.</p>}
      </ul>
    </div>
  );
}

function SourceBadge({ sample }: { sample: boolean }) {
  return sample ? (
    <span className="border border-line px-1.5 text-[9.5px] tracking-[0.12em] uppercase">Ejemplo</span>
  ) : (
    <span className="bg-olive px-1.5 text-[9.5px] tracking-[0.12em] text-ivory uppercase">Local</span>
  );
}

const STATUS_TONE: Record<CrmStatus, string> = {
  borrador: "border-dashed border-muted/60 text-muted",
  nuevo: "border-clay/50 text-clay",
  revision: "border-olive/40 text-olive",
  reunion: "border-olive bg-olive text-ivory",
  concepto: "border-espresso/40 text-espresso",
  archivado: "border-line text-muted",
};

function StatusPill({ s }: { s: CrmStatus }) {
  return <span className={`inline-block whitespace-nowrap border px-2 py-0.5 text-[11px] ${STATUS_TONE[s]}`}>{STATUS_LABEL[s]}</span>;
}

// ——————————————————————————————————— Detail

const TABS = ["Brief", "Moodboard", "Perfil", "Historial", "Respuestas", "Notas"] as const;
type Tab = (typeof TABS)[number];

function ProjectDetail({ entry, onBack }: { entry: CrmEntry; onBack: () => void }) {
  const [tab, setTab] = useState<Tab>("Brief");
  const router = useRouter();
  const { crm } = useStore();
  const p = entry.project;
  const snap = p.snapshot!;
  const tp = snap.tasteProfile;
  const fb = feedbackState(p.answers);
  const pi = p.answers.project;

  return (
    <div className="mx-auto w-full max-w-[1440px] flex-1 px-5 py-8 md:px-10 md:py-10">
      <button onClick={onBack} className="flex items-center gap-2 text-[12.5px] text-muted hover:text-espresso">
        <ArrowLeft className="size-3.5" /> Todos los proyectos
      </button>

      <div className="mt-5 grid gap-6 border-b border-line pb-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="flex items-center gap-3 text-[12px] text-muted">
            {entry.id} <SourceBadge sample={entry.sample} />
          </p>
          <h1 className="font-display mt-2 text-[clamp(2rem,4vw,3.2rem)] leading-[1.02]">{entry.client}</h1>
          <p className="mt-1 text-[15px] text-espresso/70">{p.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[12.5px] text-muted">
            Estado
            <select value={entry.status} onChange={(e) => store.setStatus(entry.id, e.target.value as CrmStatus)} className="border border-line bg-paper px-2 py-2 text-[13px] text-espresso">
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          {!entry.sample && (
            <button
              onClick={() => {
                store.openProject(entry.id);
                router.push("/explore");
              }}
              className={btn.secondary}
            >
              Abrir en el estudio <ArrowUpRight className="size-4" />
            </button>
          )}
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-px border-b border-line bg-line md:grid-cols-5">
        {[
          ["Espacio", pi.roomType ?? "Sin definir"],
          ["Superficie", pi.roomArea ? `${pi.roomArea} m²` : "No indicada"],
          ["Presupuesto", pi.budget ?? "No indicado"],
          ["Referencias", `${fb.saved.length} guardadas · ${fb.liked.length - fb.saved.length} me gusta`],
          ["Progreso", p.snapshot?.brief ? "Brief completo" : `Paso ${p.maxStep + 1} de ${STEPS.length}`],
        ].map(([k, v]) => (
          <div key={k} className="bg-ivory py-4 pr-4">
            <dt className="text-[11px] text-muted">{k}</dt>
            <dd className="mt-1 text-[14px]">{v}</dd>
          </div>
        ))}
      </dl>

      <div role="tablist" aria-label="Secciones del proyecto" className="no-scrollbar mt-6 flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`-mb-px shrink-0 border-b-2 px-4 py-2.5 text-[13px] transition-colors ${tab === t ? "border-olive text-espresso" : "border-transparent text-muted hover:text-espresso"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-6">
        {tab === "Brief" &&
          (snap.brief ? (
            <div className="border border-line">
              <BriefDocument brief={snap.brief} title={p.name} client={`${entry.client} · ${entry.id}`} />
            </div>
          ) : (
            <Empty text={`El cliente aún está explorando (paso ${p.maxStep + 1} de ${STEPS.length}). El brief aparecerá cuando lo complete.`} />
          ))}

        {tab === "Moodboard" && (
          <div className="border border-line">
            <MoodboardView board={snap.moodboard} title="Moodboard del cliente" />
          </div>
        )}

        {tab === "Perfil" && (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="border border-line bg-paper p-6">
              <p className="eyebrow text-muted">Dirección</p>
              <p className="font-display mt-2 text-3xl">{tp.primary?.name ?? "—"}</p>
              {tp.secondary && <p className="text-[13px] text-espresso/65">con matices de {tp.secondary.name.toLowerCase()}</p>}
              <div className="mt-5">
                <DirectionMeter directions={tp.directions} max={4} />
              </div>
              <div className="mt-6">
                <PaletteStrip palette={tp.palette} />
              </div>
            </div>
            <div className="border border-line bg-paper p-6">
              <p className="eyebrow text-olive">Preferencias</p>
              <ul className="mt-2 divide-y divide-line">
                {tp.preferred.map((t) => (
                  <li key={t.tag} className="flex items-center justify-between py-2 text-[13px]">
                    {TAG_META[t.tag].label}
                    <ConfidenceBadge c={t.confidence} />
                  </li>
                ))}
              </ul>
              <p className="eyebrow mt-6 text-clay">Antipreferencias</p>
              <ul className="mt-2 space-y-1 text-[13px]">
                {tp.avoidLines.length ? tp.avoidLines.map((l) => <li key={l}>{l}</li>) : <li className="text-muted">Ninguna clara</li>}
              </ul>
            </div>
            <div className="border border-line bg-paper p-6">
              <p className="eyebrow mb-3 text-muted">Factores</p>
              <FactorsPanel answers={p.answers} />
            </div>
          </div>
        )}

        {tab === "Historial" && <History entry={entry} />}

        {tab === "Respuestas" && (
          <ol className="max-w-3xl space-y-3">
            {snap.messages.map((m) => (
              <li key={m.id} className={`text-[13.5px] leading-relaxed ${m.role === "user" ? "border-l-2 border-olive pl-3 font-medium" : "text-espresso/70"}`}>
                <span className="mr-2 text-[10.5px] tracking-[0.12em] text-muted uppercase">{m.role === "user" ? "Cliente" : "Forme"}</span>
                {m.text}
              </li>
            ))}
          </ol>
        )}

        {tab === "Notas" && (
          <div className="max-w-2xl">
            <label htmlFor="notes" className="eyebrow text-muted">
              Notas del diseñador (solo en este navegador)
            </label>
            <textarea
              id="notes"
              rows={8}
              defaultValue={crm.notes[entry.id] ?? ""}
              onBlur={(e) => store.setNote(entry.id, e.target.value)}
              placeholder="Ideas para la primera reunión, proveedores, medidas…"
              className="mt-3 w-full border border-line bg-paper p-4 text-[14px] leading-relaxed outline-none focus:border-olive"
            />
            <p className="mt-2 text-[12px] text-muted">Se guarda al salir del campo.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="border border-dashed border-line p-8 text-[14px] text-muted">{text}</p>;
}

function History({ entry }: { entry: CrmEntry }) {
  const a = entry.project.answers;
  const msgs = entry.project.snapshot!.messages;
  const decisions = msgs.filter((m) => m.role === "user" && !m.id.startsWith("fb-"));
  const events = [
    ...a.feedbackLog.map((e) => ({
      at: e.at,
      channel: e.channel,
      text: `${{ like: "Me gusta", save: "Guardó", reject: "Descartó", unsave: "Quitó de guardados", unlike: "Quitó de su selección", restore: "Recuperó" }[e.action]} «${getRef(e.refId)?.title ?? e.refId}»`,
    })),
    ...a.texts.map((t) => ({ at: t.at, channel: t.channel, text: `Escribió: «${t.text}»` })),
  ].sort((x, y) => y.at.localeCompare(x.at));
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div>
        <p className="eyebrow text-muted">Decisiones del escenario</p>
        <ol className="mt-3 border-l border-line">
          {decisions.map((m, i) => (
            <li key={m.id} className="relative pb-4 pl-5 text-[13.5px]">
              <span className="absolute -left-[4.5px] top-1.5 size-2 rounded-full bg-olive" />
              <span className="text-[11px] text-muted">{STEPS.find((s) => s.id === m.step)?.label ?? `Paso ${i + 1}`}</span>
              <p>{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
      <div>
        <p className="eyebrow text-muted">Valoraciones y mensajes</p>
        {events.length ? (
          <ol className="mt-3 divide-y divide-line border-y border-line">
            {events.map((e, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 py-2.5 text-[13px]">
                <span>{e.text}</span>
                <span className="shrink-0 text-[11px] text-muted">
                  {e.channel === "telegram" ? "Telegram" : "Estudio"} · {fmt(e.at)}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-[13px] text-muted">Sin valoraciones todavía.</p>
        )}
      </div>
    </div>
  );
}
