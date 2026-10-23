import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { TelegramDemo } from "@/components/telegram/TelegramDemo";

export const metadata: Metadata = { title: "Demo de Telegram", description: "Prototipo interactivo de Forme dentro de Telegram (sin conexión real)." };

export default function TelegramDemoPage() {
  return (
    <>
      <SiteHeader variant="app" />
      <main className="flex flex-1 flex-col">
        <TelegramDemo />
      </main>
    </>
  );
}
