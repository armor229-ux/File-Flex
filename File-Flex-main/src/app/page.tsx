"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Hero, WhyStrip } from "@/components/home/hero";
import { ToolsExplorer } from "@/components/home/tools-explorer";
import { FaqSection } from "@/components/home/faq-section";
import { AdSlot } from "@/components/ad-slot";
import { Button } from "@/components/ui/button";
import { useFaqs } from "@/lib/faq";
import { faqJsonLd } from "@/lib/seo";
import { tools } from "@/lib/tools";
import { useI18n } from "@/lib/i18n";

export default function Home() {
  const { t } = useI18n();
  const faqs = useFaqs();

  return (
    <>
      <Hero />

      {/* Ad below hero */}
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <AdSlot slot="homeTop" format="horizontal" />
      </div>

      {/* All tools showcase */}
      <section id="tools" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
              {t("home.allTools")}
            </h2>
            <p className="mt-1 text-muted-foreground">
              {t("home.allToolsDesc", { count: tools.length })}
            </p>
          </div>
          <Button asChild variant="ghost" className="shrink-0">
            <Link href="/tools">{t("home.viewAll")} <ArrowRight className="size-4" /></Link>
          </Button>
        </div>
        <ToolsExplorer />
      </section>

      {/* Why FileFlex */}
      <WhyStrip />

      {/* Ad between sections */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <AdSlot slot="homeMid" format="horizontal" />
      </div>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
            {t("home.faqTitle")}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {t("home.faqSubtitle")}
          </p>
        </div>
        <div className="mt-8">
          <FaqSection />
        </div>
      </section>

      {/* FAQ JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }}
      />
    </>
  );
}
