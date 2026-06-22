"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  LayoutGrid,
  Globe,
  Monitor,
  Smartphone,
  HelpCircle,
  Mail,
  Languages,
  Info,
  Shield,
  FileText,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useHoverIntent } from "@/lib/useHoverIntent";

/**
 * AppsMenu — the 9-dot "Apps" button in the header.
 *
 * Uses the shared `useHoverIntent` hook so the popover stays open while the
 * cursor travels from the trigger into the panel (via the `.menu-bridge`
 * hover bridge rendered as the first child of the content) and while focus is
 * inside the content.
 *
 * Close-on-navigate robustness (the "popover stays open after I click an item"
 * bug) is handled by THREE independent layers:
 *   1. Each menu item's `onClick` calls `setOpen(false)` BEFORE the Link
 *      performs the client-side navigation.
 *   2. A `usePathname()` effect closes the popover whenever the route changes
 *      — this catches programmatic navigations too.
 *   3. A document-level `click` guard closes the popover when a click bubbles
 *      to the document and lands outside any open popover content.
 *
 * Content: three equal-width columns — Products / Help / Resources — with real
 * dividers between them (logical `border-s` / `ps-6` so RTL works).
 */
interface BaseItem {
  label: string;
  hint?: string;
  icon: LucideIcon;
  href?: string;
  disabled?: boolean;
}

export function AppsMenu() {
  const { t, locale } = useI18n();
  const { open, setOpen, bind, contentBind } = useHoverIntent();
  const pathname = usePathname();

  // Layer 2 — close on ANY client-side route change. `usePathname` updates on
  // Link clicks AND programmatic navigations (router.push / redirects). This
  // is the definitive fix for the popover lingering open after navigation.
  useEffect(() => {
    setOpen(false);
  }, [pathname, setOpen]);

  // Layer 3 — outside-click guard. While open, any click that bubbles to the
  // document and lands OUTSIDE every open popover content closes the menu.
  // (Radix already dismisses on outside pointer interaction, but this is an
  // explicit, self-contained safety net per spec.) We query by `data-slot`
  // rather than a ref because shadcn's PopoverContent is not a forwardRef
  // component on React 18, so a ref would not reach the underlying DOM node.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      const contents = document.querySelectorAll(
        '[data-slot="popover-content"]'
      );
      if (contents.length === 0) return;
      for (const c of contents) {
        if (c.contains(target)) return; // inside a popover → ignore
      }
      setOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [open, setOpen]);

  // PRODUCTS column — Web is live, Desktop/Mobile are "SOON".
  const products: BaseItem[] = [
    { label: t("nav.fileflexWeb"), hint: t("nav.fileflexWebHint"), icon: Globe, href: "/" },
    { label: t("nav.fileflexDesktop"), hint: t("nav.comingSoon"), icon: Monitor, disabled: true },
    { label: t("nav.fileflexMobile"), hint: t("nav.comingSoon"), icon: Smartphone, disabled: true },
  ];

  // HELP column — Language row's hint shows the current locale's native name.
  const help: BaseItem[] = [
    { label: t("nav.helpCenter"), hint: t("nav.helpCenterHint"), icon: HelpCircle, href: "/help" },
    { label: t("nav.contact"), hint: t("nav.contactHint"), icon: Mail, href: "/contact" },
    { label: t("nav.language"), hint: localeDisplayName(locale), icon: Languages, href: "/language" },
  ];

  // RESOURCES column — static legal/about links.
  const resources: BaseItem[] = [
    { label: "About", icon: Info, href: "/about" },
    { label: "Privacy Policy", icon: Shield, href: "/privacy" },
    { label: "Terms of Service", icon: FileText, href: "/terms" },
  ];

  // Layer 1 — close BEFORE the Link navigates. Called from each item's onClick.
  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.appsMore")}
          aria-haspopup="menu"
          aria-expanded={open}
          className="inline-flex size-9 items-center justify-center rounded-md text-foreground/80 outline-none transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...bind}
        >
          <LayoutGrid className="size-5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        collisionPadding={16}
        className="relative z-[100] w-[min(720px,92vw)] rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-xl"
        {...contentBind}
        // Prevent Radix from returning focus to the trigger when the popover
        // closes. Without this, the hook's `bind.onFocus` fires on that
        // returned focus and unconditionally re-opens the popover (the
        // "popover reopens after I click an item" bug). Mirrors the existing
        // `onOpenAutoFocus: preventDefault` in `contentBind`. Focus stays on
        // the clicked item (which then navigates) or, for Escape while the
        // trigger is focused, simply remains on the trigger.
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Hover bridge — MUST be the first child. Invisible strip spanning the
            sideOffset gap (10px) so the cursor can travel trigger → panel
            without tripping the close timer. Styled via .menu-bridge in
            globals.css. Must capture pointer events (no pointer-events:none). */}
        <div aria-hidden="true" className="menu-bridge" />

        <div
          role="menu"
          aria-label={t("nav.appsMore")}
          className="grid grid-cols-1 gap-6 md:grid-cols-3 [&>*+*]:md:border-s [&>*+*]:md:border-border [&>*+*]:md:ps-6"
        >
          {/* PRODUCTS */}
          <section>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("nav.products")}
            </h4>
            <ul className="flex flex-col gap-1">
              {products.map((it) => (
                <li key={`p-${it.label}`} role="none">
                  <AppsRow item={it} t={t} close={close} />
                </li>
              ))}
            </ul>
          </section>

          {/* HELP */}
          <section>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("nav.help")}
            </h4>
            <ul className="flex flex-col gap-1">
              {help.map((it) => (
                <li key={`h-${it.label}`} role="none">
                  <AppsRow item={it} t={t} close={close} />
                </li>
              ))}
            </ul>
          </section>

          {/* RESOURCES */}
          <section>
            <h4 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Resources
            </h4>
            <ul className="flex flex-col gap-1">
              {resources.map((it) => (
                <li key={`r-${it.label}`} role="none">
                  <AppsRow item={it} t={t} close={close} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* Row renderer                                                        */
/* ------------------------------------------------------------------ */

type TFunc = (key: string) => string;

function AppsRow({
  item,
  t,
  close,
}: {
  item: BaseItem;
  t: TFunc;
  close: () => void;
}) {
  const Icon = item.icon;
  const iconBox = (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
      <Icon size={18} />
    </span>
  );

  // Disabled ("SOON") row — no link, no onClick, dimmed + badge.
  if (item.disabled) {
    return (
      <div
        role="menuitem"
        aria-disabled="true"
        className="flex cursor-not-allowed items-center gap-3 whitespace-nowrap rounded-lg px-2 py-2 opacity-60 outline-none"
      >
        {iconBox}
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="flex items-center gap-1.5">
            <span className="max-w-[220px] truncate text-sm font-medium">
              {item.label}
            </span>
            <span className="ms-auto inline-flex shrink-0 items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/70">
              {t("common.soon")}
            </span>
          </span>
          {item.hint && (
            <span className="max-w-[220px] truncate text-xs text-muted-foreground">
              {item.hint}
            </span>
          )}
        </span>
      </div>
    );
  }

  // Active link row — onClick closes BEFORE the Link navigates (Layer 1).
  if (item.href) {
    return (
      <Link
        href={item.href}
        role="menuitem"
        onClick={close}
        className="flex items-center gap-3 whitespace-nowrap rounded-lg px-2 py-2 outline-none transition-colors hover:bg-muted/60 focus:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {iconBox}
        <span className="flex min-w-0 flex-1 flex-col leading-tight">
          <span className="max-w-[220px] truncate text-sm font-medium">
            {item.label}
          </span>
          {item.hint && (
            <span className="max-w-[220px] truncate text-xs text-muted-foreground">
              {item.hint}
            </span>
          )}
        </span>
      </Link>
    );
  }

  // Fallback (non-link, non-disabled) — should not happen with current data.
  return (
    <div
      role="menuitem"
      className="flex items-center gap-3 whitespace-nowrap rounded-lg px-2 py-2 outline-none"
    >
      {iconBox}
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="max-w-[220px] truncate text-sm font-medium">
          {item.label}
        </span>
      </span>
    </div>
  );
}

/**
 * Map a locale code to its OWN native name (e.g. fr → "Français"). This is a
 * static display helper, not an i18n lookup — the locale's native name is the
 * same in every UI language. In `en` this returns "English", matching the
 * spec's Language meta.
 */
function localeDisplayName(locale: string): string {
  const map: Record<string, string> = {
    en: "English",
    ar: "العربية",
    fr: "Français",
    es: "Español",
    it: "Italiano",
  };
  return map[locale] ?? "English";
}
