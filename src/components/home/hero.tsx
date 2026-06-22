"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Sparkles, ShieldCheck, Zap, Gift, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { tools } from "@/lib/tools";
import { useUsageCounter } from "@/lib/usage";
import { useI18n } from "@/lib/i18n";

export function Hero() {
  const featured = tools.filter((t) => t.featured).slice(0, 8);
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();

  // Headline words for the staggered entrance. Split ONLY by whitespace —
  // never by characters — so glyphs always render intact.
  const headline = t("hero.title");
  const words = headline.split(/\s+/);

  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="hero-glow pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 text-center sm:px-6 sm:pt-24">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          className="pill-breath mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur"
        >
          <Sparkles className="size-3.5 text-primary" />
          {t("hero.badge", { count: tools.length })}
        </motion.div>

        {/* H1 — word-by-word staggered fade-up + subtle shimmer sweep + soft
            red halo. The H1 itself stays solid (no background-clip) so glyphs
            never break. min-h reserves space to prevent CLS during entrance. */}
        <div className="relative inline-block w-full min-h-[3rem] sm:min-h-[4.5rem] lg:min-h-[6rem]">
          <div className="hero-h1-halo" aria-hidden="true" />
          <motion.h1
            initial={reduceMotion ? false : "hidden"}
            whileInView="show"
            viewport={{ once: true, margin: "-10% 0px" }}
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
            }}
            className="mx-auto mt-5 max-w-5xl text-balance text-5xl leading-none tracking-tight sm:text-7xl lg:text-8xl"
            style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}
          >
            {reduceMotion
              ? headline
              : words.map((w, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
                      show: {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                        transition: { duration: 0.55, ease: "easeOut" },
                      },
                    }}
                    style={{ display: "inline-block", whiteSpace: "pre" }}
                  >
                    {w + " "}
                  </motion.span>
                ))}
          </motion.h1>
          <span className="hero-h1-shimmer" aria-hidden="true" />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground"
        >
          {t("hero.subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button asChild size="lg" className="w-full rounded-full sm:w-auto">
            <Link href="/tools">{t("hero.cta")} <ArrowRight className="size-4" /></Link>
          </Button>
        </motion.div>

        <UsageCounter />

        {/* Featured tools */}
        {featured.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {featured.map((t, i) => {
              const Icon = t.icon;
              return (
                <motion.div
                  key={t.slug}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.35 + i * 0.04 }}
                >
                  <Link
                    href={`/tools/${t.slug}`}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                  >
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10">
                      <Icon className="size-5 text-primary" />
                    </span>
                    <span className="text-center text-xs font-medium leading-tight">{t.name}</span>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}

export function WhyStrip() {
  const { t } = useI18n();
  const items = [
    { icon: ShieldCheck, title: t("why.private"), text: t("why.privateText") },
    { icon: Zap, title: t("why.fast"), text: t("why.fastText") },
    { icon: Gift, title: t("why.free"), text: t("why.freeText") },
    { icon: UserX, title: t("why.noSignup"), text: t("why.noSignupText") },
  ];
  return (
    <section className="border-y border-border/60 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {items.map((it, i) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border bg-card p-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-medium">{it.title}</p>
                  <p className="text-xs text-muted-foreground">{it.text}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Client-side usage counter — increments per tool run, stored in localStorage. */
function UsageCounter() {
  const { count, mounted } = useUsageCounter();
  const { t } = useI18n();
  const base = 1284532; // starting number so it never looks empty
  const total = base + count;
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="mt-6 text-center text-sm text-muted-foreground"
    >
      {mounted
        ? t("hero.filesProcessed", { count: total.toLocaleString() })
        : t("hero.filesProcessed", { count: "…" })}
    </motion.p>
  );
}
