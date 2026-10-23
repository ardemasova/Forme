"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Printer, RotateCcw, Send, Undo2 } from "lucide-react";
import { useActiveProject } from "@/lib/storage/store";
import { actions } from "@/lib/agent/actions";
import { STEPS } from "@/lib/agent/scenario";
import { downloadBrief } from "@/lib/brief/download";
import { BriefDocument } from "@/components/brief/BriefDocument";
import { MoodboardView } from "@/components/agent/Moodboard";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { btn } from "@/components/ui/styles";

export function BriefView() {
  const { hydrated, project } = useActiveProject();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (!hydrated) return <div className="flex-1" aria-busy="true" />;

  const brief = project?.snapshot?.brief;
  if (!project || !brief) {
    const step = project ? project.maxStep : 0;
    return (
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 py-24 md:px-10">
        <p className="eyebrow text-clay">Brief</p>
        <h1 className="font-display mt-5 max-w-3xl text-[clamp(2.2rem,5vw,4.2rem)] leading-[1.02]">Tu brief aún no está listo.</h1>
        <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-espresso/75">
          {project
            ? `Vas por el paso ${step + 1} de ${STEPS.length} («${STEPS[step].label}»). El brief se genera al final, solo con la información que hayas compartido.`
            : "Empieza en el estudio: en unos minutos tendrás un perfil de gusto, un moodboard y un brief para tu diseñador."}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link href="/explore" className={btn.primary}>
            {project ? "Continuar en el estudio" : "Empezar en el estudio"}
          </Link>
          <Link href="/dashboard" className={btn.ghost}>
            Ver briefs de ejemplo en el CRM
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] flex-1 px-5 py-10 md:px-10 md:py-14">
      <div className="no-print flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <Link href="/explore" className="flex items-center gap-2 text-[12.5px] text-muted hover:text-espresso">
            <ArrowLeft className="size-3.5" /> Volver al estudio
          </Link>
          <h1 className="font-display mt-4 text-[clamp(2.2rem,4.4vw,3.6rem)] leading-[1.02]">Tu brief</h1>
          <p className="mt-2 text-[14px] text-espresso/70">Moodboard y brief para compartir con un profesional.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className={btn.primary}>
            <Printer className="size-4" /> Guardar como PDF
          </button>
          <button onClick={() => setErr(downloadBrief(brief, project.name))} className={btn.secondary}>
            <Download className="size-4" /> Descargar (.md)
          </button>
          <Link href="/telegram-demo" className={btn.secondary}>
            <Send className="size-4" /> Continuar en Telegram
          </Link>
          <button
            onClick={() => {
              actions.goTo(0);
              router.push("/explore");
            }}
            className={btn.ghost}
          >
            <Undo2 className="size-4" /> Cambiar respuestas
          </button>
          <button onClick={() => setConfirm(true)} className={`${btn.ghost} text-clay`}>
            <RotateCcw className="size-4" /> Empezar de nuevo
          </button>
        </div>
      </div>
      {err && (
        <p role="alert" className="no-print mt-4 text-[13px] text-clay">
          {err}
        </p>
      )}
      <p className="no-print mt-3 text-[12px] text-muted">«Guardar como PDF» abre el diálogo de impresión del navegador: elige «Guardar como PDF» como destino.</p>

      <div className="mt-10 border border-line">
        <MoodboardView board={project.snapshot!.moodboard} title="Moodboard" />
      </div>
      <div className="mt-8 border border-line">
        <BriefDocument brief={brief} title={project.name} />
      </div>

      <ConfirmDialog
        open={confirm}
        title="¿Empezar de nuevo?"
        body="Se borrará este proyecto (respuestas, moodboard y brief) de este navegador. No se puede deshacer."
        confirmLabel="Sí, borrar"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          actions.reset();
          setConfirm(false);
          router.push("/explore");
        }}
      />
    </div>
  );
}
