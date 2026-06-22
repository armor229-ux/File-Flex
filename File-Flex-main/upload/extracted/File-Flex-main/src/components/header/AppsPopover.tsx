"use client";

import * as React from "react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  LayoutGrid,
  Globe,
  Monitor,
  Smartphone,
  HelpCircle,
  Mail,
  type LucideIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useHoverIntent } from "./useHoverIntent";
import { LanguageRow } from "@/components/nav";

/**
 * AppsPopover — the 9-dot "Apps & more" button in the header.
 *
 * Behavior:
 *   - Hover opens after 120ms (disabled on touch devices).
 *   - Hover bridge keeps it open while the cursor travels trigger → panel.
 *   - Close after 200ms grace when leaving both trigger and panel.
 *   - Click toggles (keyboard + touch).
 *   - Esc closes; focus returns to trigger (Radix default).
 *   - prefers-reduced-motion: instant open/close, no transition.
 *
 * Content: Products column (FileFlex Web / Desktop [SOON] / Mobile [SOON]) +
 * Help column (Help Center / Contact / Language row — the existing LanguageRow
 * component with its submenu is reused unchanged).
 */
interface AppsItem {
  label: string;
  hint: string;
  href: string;
  icon: string;
  disabled?: boolean;
}

const productsItems: AppsItem[] = [
  { label: "nav.fileflexWeb", hint: "nav.fileflexWebHint", href: "/", icon: "web" },
  { label: "nav.fileflexDesktop", hint: "nav.comingSoon", href: "#", icon: "desktop", disabled: true },
  { label: "nav.fileflexMobile", hint: "nav.comingSoon", href: "#", icon: "mobile", disabled: true },
];

const appsIconMap: Record<string, LucideIcon> = {
  web: Globe,
  desktop: Monitor,
  mobile: Smartphone,
};

export function AppsPopover() {
  const { t } = useI18n();
  const [langOpen, setLangOpen] = React.useState(false);

  // Touch-device detection — on touch, never auto-open on hover (tap to toggle).
  const [isTouch, setIsTouch] = React.useState(false);
  // prefers-reduced-motion detection
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setIsTouch(window.matchMedia("(hover: none)").matches);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const {
    open,
    setOpen,
    onTriggerEnter,
    onTriggerLeave,
    onContentEnter,
    onContentLeave,
  } = useHoverIntent({ openDelay: 120, closeDelay: 200, reduced });

  // When the apps popover closes, also close the language submenu.
  React.useEffect(() => {
    if (!open && langOpen) setLangOpen(false);
  }, [open, langOpen]);

  const triggerRef = React.useRef<HTMLButtonElement | null>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          ref={triggerRef}
          variant="ghost"
          size="icon"
          aria-label={t("nav.appsMore")}
          aria-expanded={open}
          aria-haspopup="menu"
          className="rounded-lg hover:bg-accent"
          onMouseEnter={() => { if (!isTouch) onTriggerEnter(); }}
          onMouseLeave={() => { if (!isTouch) onTriggerLeave(); }}
          onFocus={() => setOpen(true)}
          onClick={(e) => {
            // Prevent Radix's internal trigger handler from also firing —
            // otherwise the two toggles cancel out and click appears broken.
            e.preventDefault();
            setOpen((v) => !v);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setOpen(true);
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
            }
          }}
        >
          <LayoutGrid className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className={
          "relative z-[100] w-[360px] max-w-[92vw] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-[0_16px_40px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.04)] backdrop-blur-[8px]" +
          (reduced
            ? ""
            : " data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2")
        }
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseEnter={onContentEnter}
        onMouseLeave={onContentLeave}
      >
        {/* Invisible hover bridge — spans the sideOffset gap (8px) so the
            cursor can travel from the trigger into the panel without tripping
            the close timer. Styled via .apps-popover-bridge in globals.css. */}
        <div aria-hidden="true" className="apps-popover-bridge" />

        <div className="grid grid-cols-2 gap-4" role="menu">
          {/* Products column */}
          <div>
            <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("nav.products")}
            </p>
            <div className="flex flex-col">
              {productsItems.map((item) => {
                const Icon = appsIconMap[item.icon];
                return item.disabled ? (
                  <span
                    key={item.label}
                    role="menuitem"
                    aria-disabled="true"
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-2 py-2 opacity-60"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 text-sm font-semibold">
                        <bdi>{t(item.label)}</bdi>
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                          {t("common.soon")}
                        </span>
                      </span>
                      <span className="truncate text-xs text-muted-foreground">{t(item.hint)}</span>
                    </span>
                  </span>
                ) : (
                  <Link
                    key={item.label}
                    href={item.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                      <Icon className="size-4 text-primary" />
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold"><bdi>{t(item.label)}</bdi></span>
                      <span className="truncate text-xs text-muted-foreground">{t(item.hint)}</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Help column */}
          <div>
            <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {t("nav.help")}
            </p>
            <div className="flex flex-col">
              <Link
                href="/help"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                  <HelpCircle className="size-4 text-primary" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold">{t("nav.helpCenter")}</span>
                  <span className="truncate text-xs text-muted-foreground">{t("nav.helpCenterHint")}</span>
                </span>
              </Link>
              <Link
                href="/contact"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                  <Mail className="size-4 text-primary" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm font-semibold">{t("nav.contact")}</span>
                  <span className="truncate text-xs text-muted-foreground">{t("nav.contactHint")}</span>
                </span>
              </Link>

              {/* Language row — reuses the existing LanguageRow component
                  (with its submenu) unchanged from nav.tsx. */}
              <LanguageRow
                langOpen={langOpen}
                setLangOpen={setLangOpen}
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
