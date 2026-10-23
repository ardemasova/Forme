import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { Dashboard } from "@/components/crm/Dashboard";

export const metadata: Metadata = { title: "CRM", description: "CRM de demostración para estudios de interiorismo." };

export default function DashboardPage() {
  return (
    <>
      <SiteHeader variant="app" />
      <main className="flex flex-1 flex-col">
        <Dashboard />
      </main>
    </>
  );
}
