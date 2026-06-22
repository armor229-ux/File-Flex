"use client";

import Link from "next/link";
import { ArrowRight, HelpCircle, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFaqs } from "@/lib/faq";
import { useI18n } from "@/lib/i18n";

export function HelpContent() {
  const faqs = useFaqs();
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <HelpCircle className="size-6" />
        </div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
          {t("nav.helpCenter")}
        </h1>
        <p className="mt-3 text-muted-foreground">
          {t("nav.helpCenterHint")}
        </p>
      </div>

      <div className="mt-10 space-y-3">
        {faqs.map((f, i) => (
          <Card key={i} className="gap-0 p-5">
            <h2 className="font-semibold">{f.question}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{f.answer}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-10 gap-0 p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-semibold">{t("nav.contact")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link href="/contact" className="font-medium text-primary hover:underline">
                {t("nav.contactHint")} <ArrowRight className="inline size-3.5 align-text-bottom" />
              </Link>
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
