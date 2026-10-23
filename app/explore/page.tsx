import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Studio } from "@/components/agent/Studio";

export const metadata: Metadata = {
  title: "Estudio",
  description: "Explora tu gusto con el diseñador IA de Forme y crea tu moodboard y tu brief.",
};

export default function ExplorePage() {
  return (
    <>
      <SiteHeader variant="app" />
      <main className="flex flex-1 flex-col">
        <h1 className="sr-only">Estudio de gusto de Forme</h1>
        <Studio />
      </main>
    </>
  );
}
