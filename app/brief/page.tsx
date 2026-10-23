import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { BriefView } from "@/components/brief/BriefView";

export const metadata: Metadata = { title: "Brief", description: "Tu moodboard y tu brief de interiorismo, listos para compartir." };

export default function BriefPage() {
  return (
    <>
      <SiteHeader variant="app" />
      <main className="flex flex-1 flex-col">
        <BriefView />
      </main>
    </>
  );
}
