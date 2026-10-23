import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Hero } from "@/components/home/Hero";
import { Problem } from "@/components/home/Problem";
import { HowItWorks } from "@/components/home/HowItWorks";
import { AgentPreview } from "@/components/home/AgentPreview";
import { Results } from "@/components/home/Results";
import { TelegramTeaser } from "@/components/home/TelegramTeaser";
import { Designers } from "@/components/home/Designers";
import { FinalCta } from "@/components/home/FinalCta";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <AgentPreview />
        <Results />
        <TelegramTeaser />
        <Designers />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
