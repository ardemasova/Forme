import type { Metadata, Viewport } from "next";
import "@fontsource-variable/fraunces/full.css";
import "@fontsource-variable/inter-tight/index.css";
import "./globals.css";
import { StorageNotice } from "@/components/ui/StorageNotice";

export const metadata: Metadata = {
  title: {
    default: "Forme — Encuentra el interior en el que eres tú",
    template: "%s · Forme",
  },
  description:
    "Forme es un diseñador de interiores con IA (prototipo de portfolio) que te ayuda a descubrir tu gusto, crear un moodboard y preparar un brief para un profesional.",
};

export const viewport: Viewport = {
  themeColor: "#F5F2EC",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <StorageNotice />
      </body>
    </html>
  );
}
