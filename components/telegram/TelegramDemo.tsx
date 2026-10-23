"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Bookmark, Heart, HelpCircle, Paperclip, RotateCcw, Send, X } from "lucide-react";
import { store, useActiveProject } from "@/lib/storage/store";
import { greeting, QUICK, telegramTurn, type Intent, type QuickKey } from "@/lib/telegram/bot";
import { ATMOSPHERES, getRef } from "@/lib/catalog";
import { feedbackState } from "@/lib/agent/engine";
import { Photo } from "@/components/ui/Photo";
import { PhoneFrame } from "@/components/telegram/PhoneFrame";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DirectionMeter } from "@/components/agent/ProfileBits";
import { btn } from "@/components/ui/styles";
import type { TelegramMessage } from "@/types";
import { useRouter } from "next/navigation";

const time = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
};

export function TelegramDemo() {
  const { hydrated, project } = useActiveProject();
  const router = useRouter();
  const [text, setText] = useState("");
  const [confirm, setConfirm] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // A project that exists but has never opened Telegram gets its greeting persisted.
  useEffect(() => {
    if (hydrated && project && project.telegram.length === 0) {
      store.update((p) => (p.telegram.length ? p : telegramTurn(p, { type: "start" })));
    }
  }, [hydrated, project]);

  const messages: TelegramMessage[] = useMemo(
    () => (project?.telegram.length ? project.telegram : hydrated ? greeting(project) : []),
    [project, hydrated],
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const act = (intent: Intent) => {
    store.update((p) => telegramTurn(p.telegram.length ? p : { ...p, telegram: greeting(null) }, intent));
  };

  const send = () => {
    if (!text.trim()) return;
    act({ type: "text", text });
    setText("");
  };

  const fb = project ? feedbackState(project.answers) : null;
  const tp = project?.snapshot?.tasteProfile;
  const mood = project?.snapshot?.moodboard;
  const lastQuick = [...messages].reverse().find((m) => m.from === "bot")?.quick as QuickKey[] | undefined;

  return (
    <div className="mx-auto grid w-full max-w-[1440px] flex-1 gap-12 px-5 py-10 md:px-10 lg:grid-cols-12 lg:py-14">
      <div className="lg:col-span-5 xl:col-span-4">
        <p className="eyebrow text-clay">Demo de Telegram</p>
        <h1 className="font-display mt-5 text-[clamp(2.2rem,4vw,3.4rem)] leading-[1.02]">La conversación sigue en tu bolsillo.</h1>
        <p className="mt-5 text-[15px] leading-relaxed text-espresso/75">
          Así funcionaría Forme dentro de Telegram. Elige referencias, guárdalas, descártalas, pregunta por qué te las propone o
          escribe con tus palabras.
        </p>
        <p className="mt-4 border-l-2 border-clay/60 pl-3 text-[12.5px] leading-relaxed text-muted">
          Prototipo interactivo dentro del sitio: no se conecta con Telegram, no usa tokens ni envía datos a ningún servidor. Todo se
          guarda en este navegador.
        </p>

        <div className="mt-10 border border-line bg-paper p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow text-muted">Sincronizado con tu proyecto</p>
            <span className="flex items-center gap-1.5 text-[11px] text-olive">
              <span className="size-1.5 rounded-full bg-olive" /> en vivo
            </span>
          </div>
          {tp?.primary ? (
            <>
              <p className="font-display mt-3 text-2xl">{tp.primary.name}</p>
              <div className="mt-4">
                <DirectionMeter directions={tp.directions} />
              </div>
              <p className="mt-4 text-[12.5px] text-espresso/70">
                {fb?.saved.length ?? 0} guardadas · {fb?.liked.length ?? 0} me gusta · {fb?.rejected.length ?? 0} descartadas
              </p>
              {mood && mood.items.length > 0 && (
                <ul className="mt-4 grid grid-cols-6 gap-1">
                  <AnimatePresence initial={false}>
                    {mood.items.map((it) => (
                      <motion.li key={it.refId} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="aspect-square overflow-hidden">
                        <Photo refId={it.refId} w={140} sizes="60px" className="h-full w-full" />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </>
          ) : (
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">
              Aún no hay perfil. Puedes empezar aquí mismo: lo que elijas en el chat aparecerá también en el estudio.
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/explore" className={btn.primary}>
            <ArrowLeft className="size-4" /> Volver al proyecto
          </Link>
          {project && project.telegram.length > 0 && (
            <button onClick={() => setConfirm(true)} className={btn.ghost}>
              <RotateCcw className="size-4" /> Reiniciar el chat
            </button>
          )}
        </div>
      </div>

      <div className="lg:col-span-6 lg:col-start-7 xl:col-span-5 xl:col-start-7">
        <PhoneFrame
          className="h-[min(780px,86svh)] min-h-[560px]"
          status={tp?.primary ? `en línea · ${tp.primary.name.toLowerCase()}` : "diseñador de interiores · demo"}
          onBack={() => router.push("/explore")}
          footer={
            <div className="border-t border-espresso/10 bg-paper">
              {lastQuick && lastQuick.length > 0 && (
                <div className="no-scrollbar flex gap-1.5 overflow-x-auto px-2.5 pt-2">
                  {lastQuick.map((k) => (
                    <button key={k} onClick={() => act({ type: "quick", key: k })} className="shrink-0 rounded-full border border-olive/30 px-3 py-1.5 text-[12px] text-olive transition-colors hover:bg-olive hover:text-ivory">
                      {QUICK[k]}
                    </button>
                  ))}
                </div>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="flex items-center gap-2 px-2.5 py-2.5"
              >
                <span className="p-1 text-muted" title="Adjuntar fotos (no disponible en la demo)" aria-hidden>
                  <Paperclip className="size-4" />
                </span>
                <label htmlFor="tg-input" className="sr-only">
                  Mensaje
                </label>
                <input
                  id="tg-input"
                  value={text}
                  maxLength={400}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Mensaje"
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-full bg-chalk/70 px-4 py-2 text-[13.5px] outline-none placeholder:text-muted focus:ring-1 focus:ring-olive/40"
                />
                <button type="submit" disabled={!text.trim()} className="grid size-9 shrink-0 place-items-center rounded-full bg-olive text-ivory disabled:opacity-40" aria-label="Enviar">
                  <Send className="size-4" />
                </button>
              </form>
            </div>
          }
        >
          <div ref={scrollRef} className="absolute inset-0 overflow-y-auto px-2.5 py-3 scrollbar-thin" aria-live="polite">
            <p className="mx-auto mb-3 w-fit rounded-full bg-espresso/10 px-2.5 py-0.5 text-[10.5px] text-espresso/60">Hoy</p>
            <ol className="space-y-2">
              <AnimatePresence initial={false}>
                {messages.map((m) => (
                  <motion.li key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: m.from === "bot" ? 0.15 : 0 }}>
                    <TgMessage m={m} onAct={act} fbSaved={fb?.saved ?? []} fbRejected={fb?.rejected ?? []} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          </div>
        </PhoneFrame>
      </div>

      <ConfirmDialog
        open={confirm}
        title="¿Reiniciar el chat de Telegram?"
        body="Se borra solo el historial de mensajes de esta demo. Tu perfil, tus referencias y tu moodboard se mantienen."
        confirmLabel="Reiniciar chat"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          store.update((p) => telegramTurn({ ...p, telegram: [] }, { type: "start" }));
          setConfirm(false);
        }}
      />
    </div>
  );
}

function TgMessage({
  m,
  onAct,
  fbSaved,
  fbRejected,
}: {
  m: TelegramMessage;
  onAct: (i: Intent) => void;
  fbSaved: string[];
  fbRejected: string[];
}) {
  if (m.from === "user") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[80%] whitespace-pre-line rounded-2xl rounded-br-md bg-olive px-3 py-2 text-[13.5px] leading-snug text-ivory">
          {m.text}
          <span className="mt-0.5 block text-right text-[10px] text-ivory/60">{time(m.at)} ✓✓</span>
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      <p className="max-w-[86%] whitespace-pre-line rounded-2xl rounded-bl-md bg-paper px-3 py-2 text-[13.5px] leading-snug shadow-sm">
        {m.text}
        <span className="mt-0.5 block text-right text-[10px] text-muted">{time(m.at)}</span>
      </p>
      {m.cards && m.cards.length > 0 && (
        <div className={`grid max-w-[92%] gap-1.5 ${m.cards.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {m.cards.map((id) => {
            const ref = getRef(id);
            if (!ref) return null;
            const atm = ATMOSPHERES.find((a) => a.refId === id);
            const saved = fbSaved.includes(id);
            const rejected = fbRejected.includes(id);
            return (
              <div key={id} className={`overflow-hidden rounded-xl bg-paper shadow-sm ${rejected ? "opacity-50" : ""}`}>
                <Photo refId={id} w={360} sizes="170px" className="aspect-[4/5] w-full" />
                <p className="px-2 pt-1.5 text-[11.5px] font-medium leading-tight">{ref.title}</p>
                {atm ? (
                  <button onClick={() => onAct({ type: "atmosphere", id: atm.id })} className="m-1.5 w-[calc(100%-12px)] rounded-lg bg-olive py-1.5 text-[11.5px] text-ivory">
                    Elegir esta
                  </button>
                ) : (
                  <div className="grid grid-cols-4 gap-0.5 p-1.5">
                    <CardBtn label={`Me gusta «${ref.title}»`} onClick={() => onAct({ type: "card", refId: id, action: "like" })}>
                      <Heart className="size-3.5" />
                    </CardBtn>
                    <CardBtn label={`Guardar «${ref.title}» en el moodboard`} active={saved} onClick={() => onAct({ type: "card", refId: id, action: "save" })}>
                      <Bookmark className={`size-3.5 ${saved ? "fill-current" : ""}`} />
                    </CardBtn>
                    <CardBtn label={`«${ref.title}» no encaja`} onClick={() => onAct({ type: "card", refId: id, action: "reject" })}>
                      <X className="size-3.5" />
                    </CardBtn>
                    <CardBtn label={`¿Por qué «${ref.title}»?`} onClick={() => onAct({ type: "card", refId: id, action: "why" })}>
                      <HelpCircle className="size-3.5" />
                    </CardBtn>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CardBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className={`grid h-8 place-items-center rounded-lg transition-colors ${active ? "bg-olive text-ivory" : "bg-chalk/60 text-olive hover:bg-olive hover:text-ivory"}`}>
      {children}
    </button>
  );
}
