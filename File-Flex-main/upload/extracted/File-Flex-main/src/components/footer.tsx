"use client";

import Link from "next/link";
import { ShieldCheck, Heart } from "lucide-react";
import { Logo } from "@/components/Logo";
import { tools, categoryOrder } from "@/lib/tools";
import { siteConfig } from "@/lib/site";
import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();

  const moreItems = [
    { label: t("nav.fileflexWeb"), href: "/", disabled: false },
    { label: t("nav.fileflexDesktop"), href: "#", disabled: true },
    { label: t("nav.fileflexMobile"), href: "#", disabled: true },
    { label: t("footer.helpCenter"), href: "/help", disabled: false },
    { label: t("footer.contact"), href: "/contact", disabled: false },
    { label: t("footer.forStudents"), href: "/solutions/students", disabled: false },
    { label: t("footer.forTeams"), href: "/solutions/teams", disabled: false },
    { label: t("footer.forDevelopers"), href: "/solutions/developers", disabled: false },
    { label: t("footer.status"), href: "/status", disabled: false },
  ];

  return (
    <footer className="mt-auto border-t border-border/60 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div className="logo-lock" dir="ltr">
            <Logo className="h-7 w-auto" />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {t("common.tagline")} {t("footer.clientSide")}.
            </p>
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
              <ShieldCheck className="size-3.5" /> {t("footer.clientSide")}
            </p>
          </div>

          {categoryOrder.map((cat) => (
            <div key={cat}>
              <h3 className="text-sm font-semibold">{t(`categories.${cat}`)}</h3>
              <ul className="mt-3 space-y-2">
                {tools
                  .filter((tl) => tl.category === cat)
                  .slice(0, 6)
                  .map((tl) => (
                    <li key={tl.slug}>
                      <Link
                        href={`/tools/${tl.slug}`}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {t(`tools.${tl.slug}.name`)}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {/* "More" column */}
          <div>
            <h3 className="text-sm font-semibold">{t("footer.more")}</h3>
            <ul className="mt-3 space-y-2">
              {moreItems.map((item, idx) => (
                <li key={idx}>
                  {item.disabled ? (
                    <span className="flex items-center gap-1.5 text-sm text-muted-foreground/50">
                      <bdi>{item.label}</bdi>
                      <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide">
                        {t("common.soon")}
                      </span>
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      <bdi>{item.label}</bdi>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted-foreground">
            {t("footer.rights", { year: new Date().getFullYear() })}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground">{t("footer.privacy")}</Link>
              <Link href="/terms" className="hover:text-foreground">{t("footer.terms")}</Link>
              <Link href="/cookies" className="hover:text-foreground">{t("footer.cookies")}</Link>
              <Link href="/contact" className="hover:text-foreground">{t("footer.contact")}</Link>
              <span className="inline-flex items-center gap-1">
                {t("footer.builtWith")}
              </span>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

/** Sticky bottom CTA bar on mobile only. */
export function MobileCtaBar() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-3 py-2 backdrop-blur md:hidden">
      <div className="flex items-center gap-2">
        <Link
          href="/tools"
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-center text-sm font-medium"
        >
          All tools
        </Link>
        <Link
          href="/tools/pdf-merge"
          className="flex-1 rounded-xl bg-primary px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
        >
          PDF Merge
        </Link>
      </div>
    </div>
  );
}
