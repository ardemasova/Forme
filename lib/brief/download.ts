"use client";

import { briefToMarkdown } from "@/lib/brief/build";
import type { Brief } from "@/types";

/** Downloads the brief as a Markdown file. Returns an error message on failure. */
export function downloadBrief(brief: Brief, title: string): string | null {
  try {
    const md = briefToMarkdown(brief, title);
    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    a.href = url;
    a.download = `forme-brief-${slug || "proyecto"}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return null;
  } catch {
    return "No se pudo generar el archivo. Prueba con «Guardar como PDF».";
  }
}
