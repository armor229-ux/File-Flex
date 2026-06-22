"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, Menu, ChevronDown, ArrowRight, Languages, ChevronRight, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Logo } from "@/components/Logo";
import { AppsMenu } from "@/components/header/AppsMenu";
import { ThemeToggle } from "@/components/theme-toggle";
import { tools, categoryOrder, categoryLabels } from "@/lib/tools";
import {
  convertPdfMenu,
  allToolsMenu,
  appsMenu,
  type MegaMenuColumn,
} from "@/lib/mega-menu";
import { useToast } from "@/hooks/use-toast";
import { useI18n, BUNDLED_LOCALES } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type MenuKey = "convert" | "allTools";

export function Nav() {
  const [sheetOpen, setSheetOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
      <SharedMegaNav onMobileOpen={() => setSheetOpen(true)} />
      <MobileSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </header>
  );
}

/* ================================================================== */
/* SHARED MEGA MENU NAV                                               */
/* ================================================================== */
function SharedMegaNav({ onMobileOpen }: { onMobileOpen: () => void }) {
  const [activeMenu, setActiveMenu] = React.useState<MenuKey | null>(null);
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const openTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const navRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLDivElement>(null);
  // Counter-based hover tracking: increments on every mouseenter (trigger or
  // panel), decrements on every mouseleave. Close is scheduled ONLY when the
  // counter reaches 0 — i.e. the cursor is over NEITHER the trigger nor the
  // panel. This is more robust than cancelClose-before-scheduleClose because
  // there is no timer to orphan: multiple rapid enter/leave events just move
  // the counter, and the close timer is only ever set when hoverCount===0.
  const hoverCount = React.useRef(0);

  const cancelOpen = () => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  };
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleTriggerEnter = (key: MenuKey) => {
    hoverCount.current++;
    cancelClose();
    if (activeMenu === key) return;
    if (activeMenu !== null) {
      // Panel already open — swap content instantly (no close/reopen)
      setActiveMenu(key);
    } else if (reduceMotion) {
      // Reduced motion: open instantly, no delay
      setActiveMenu(key);
    } else {
      // Panel closed — schedule open with 120ms delay
      cancelOpen();
      openTimer.current = setTimeout(() => setActiveMenu(key), 120);
    }
  };

  const handleTriggerLeave = () => {
    hoverCount.current = Math.max(0, hoverCount.current - 1);
    if (hoverCount.current > 0) return;
    cancelOpen();
    cancelClose();
    if (reduceMotion) {
      setActiveMenu(null);
      return;
    }
    // 350ms grace prevents the panel from closing while the cursor travels
    // toward items (trigger → bridge → panel). The counter reaching 0 means
    // the cursor left BOTH the trigger and the panel; the grace period
    // covers the transit time through the hover bridge.
    closeTimer.current = setTimeout(() => setActiveMenu(null), 350);
  };

  const handlePanelEnter = () => {
    hoverCount.current++;
    cancelClose();
  };

  const handlePanelLeave = () => {
    hoverCount.current = Math.max(0, hoverCount.current - 1);
    if (hoverCount.current > 0) return;
    cancelClose();
    if (reduceMotion) {
      setActiveMenu(null);
      return;
    }
    closeTimer.current = setTimeout(() => setActiveMenu(null), 350);
  };

  // Click-to-toggle (mouse + touch). For the AllTools trigger this lets touch
  // users tap to open; for mouse users it toggles. The hover handlers continue
  // to work alongside this — if the cursor is on the trigger, hoverCount>0
  // keeps the panel open even after a click-toggle-close would fire.
  const handleTriggerClick = (key: MenuKey) => {
    cancelOpen();
    cancelClose();
    setActiveMenu((prev) => (prev === key ? null : key));
  };

  React.useEffect(
    () => () => {
      cancelOpen();
      cancelClose();
    },
    []
  );

  // Close the mega panel on ANY client-side route change. This is the
  // definitive guarantee that clicking an item closes the panel even if the
  // item's onClick races with Next.js client-side navigation, a programmatic
  // router.push, or a browser back/forward. Covers the "click navigates but
  // the dropdown stays open" symptom. (The item's onClick={onClose} already
  // closes immediately on click; this effect catches everything else.)
  const pathname = usePathname();
  React.useEffect(() => {
    // Clear any pending timers directly (refs) to avoid stale-closure /
    // exhaustive-deps churn — `cancelOpen`/`cancelClose` are recreated each
    // render and would otherwise need to be deps.
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    hoverCount.current = 0;
    setActiveMenu(null);
  }, [pathname]);

  // Track the trigger button for the currently-active menu so Escape can
  // return focus to it (a11y: keyboard users get their focus back).
  const convertTriggerRef = React.useRef<HTMLButtonElement>(null);
  const allToolsTriggerRef = React.useRef<HTMLButtonElement>(null);

  // Esc closes the panel from anywhere (not just the AllTools search input)
  // and returns focus to the active trigger. The shared-panel design otherwise
  // only binds Esc inside the search input's onKeyDown, leaving the Convert
  // panel with no Esc handling — this window listener closes that gap.
  React.useEffect(() => {
    if (activeMenu === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (openTimer.current) {
          clearTimeout(openTimer.current);
          openTimer.current = null;
        }
        if (closeTimer.current) {
          clearTimeout(closeTimer.current);
          closeTimer.current = null;
        }
        hoverCount.current = 0;
        setActiveMenu(null);
        const ref =
          activeMenu === "convert"
            ? convertTriggerRef.current
            : activeMenu === "allTools"
            ? allToolsTriggerRef.current
            : null;
        ref?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeMenu]);

  // Lock page scroll while the All PDF Tools popover is open. The Convert
  // menu is short and doesn't need a scroll lock; only the AllTools grid
  // (44 items across 4 columns) overflows and must scroll internally.
  // Restores the exact previous body styles on close/unmount — no leftover
  // overflow lock and no jump to top. Compensates the scrollbar width with
  // paddingRight so the page doesn't shift when the lock toggles.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (activeMenu !== "allTools") return;
    const body = document.body;
    const html = document.documentElement;
    const prevOverflow = body.style.overflow;
    const prevPaddingRight = body.style.paddingRight;
    const prevScrollBehavior = html.style.scrollBehavior;
    const sw = window.innerWidth - html.clientWidth;
    body.style.overflow = "hidden";
    if (sw > 0) body.style.paddingRight = sw + "px";
    html.style.scrollBehavior = "auto";
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPaddingRight;
      html.style.scrollBehavior = prevScrollBehavior;
    };
  }, [activeMenu]);

  const columns: MegaMenuColumn[] = activeMenu === "convert" ? convertPdfMenu : allToolsMenu;
  const showSearch = activeMenu === "allTools";

  return (
    <>
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-8 px-4 sm:px-6">
        {/* LEFT — logo (always LTR, never flips in RTL) */}
        <Link
          href="/"
          className="logo-lock flex shrink-0 items-center gap-2 rounded-lg focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="FileFlex home"
          dir="ltr"
        >
          <Logo className="h-7 w-auto" size={28} />
        </Link>

        {/* CENTER — horizontal nav (desktop) */}
        <nav
          ref={navRef}
          className="hidden items-center justify-center gap-1 lg:flex"
          aria-label="Main navigation"
          onMouseLeave={handleTriggerLeave}
        >
          <NavLink href="/tools/pdf-merge">{t("nav.mergePdf")}</NavLink>
          <NavLink href="/tools/pdf-split">{t("nav.splitPdf")}</NavLink>
          <NavLink href="/tools/pdf-compress">{t("nav.compressPdf")}</NavLink>
          <MegaTrigger
            label={t("nav.convertPdf")}
            isActive={activeMenu === "convert"}
            onEnter={() => handleTriggerEnter("convert")}
            onLeave={handleTriggerLeave}
            triggerRef={convertTriggerRef}
          />
          <MegaTrigger
            label={t("nav.allPdfTools")}
            isActive={activeMenu === "allTools"}
            onEnter={() => handleTriggerEnter("allTools")}
            onLeave={handleTriggerLeave}
            onClick={() => handleTriggerClick("allTools")}
            triggerRef={allToolsTriggerRef}
          />
          <NavLink href="/blog">Blog</NavLink>
        </nav>

        {/* RIGHT — theme toggle + 9-dot Apps popover (desktop), hamburger (mobile) */}
        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-3 lg:flex">
            <ThemeToggle />
            <span className="h-6 w-px bg-border dark:bg-transparent" aria-hidden />
            <AppsMenu />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileOpen}
            aria-label="Open menu"
            className="lg:hidden"
          >
            <Menu className="size-5" />
          </Button>
        </div>
      </div>

      {/* Shared mega panel + hover bridge */}
      <AnimatePresence>
        {activeMenu !== null && (
          <motion.div
            ref={panelRef}
            className="absolute inset-x-0 top-[4.25rem] z-40 px-4"
            initial={reduceMotion ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={reduceMotion ? { duration: 0 } : { duration: 0.16, ease: "easeOut" }}
            onMouseEnter={handlePanelEnter}
            onMouseLeave={handlePanelLeave}
            role="menu"
          >
            {/* Hover bridge — FIRST child of the panel. Positioned just above
                the panel's top edge (top:-12px) so it spans the gap between
                the nav bar (h-16) and the panel (top:4.25rem). The cursor can
                travel trigger → bridge → panel without the counter dropping to
                0, so no close timer is ever scheduled during transit. */}
            <div
              className="menu-bridge"
              onMouseEnter={handlePanelEnter}
              onMouseLeave={handlePanelLeave}
              aria-hidden
            />
            <div className="mx-auto max-w-5xl">
              <MegaPanel
                columns={columns}
                showSearch={showSearch}
                onClose={() => {
                  cancelClose();
                  hoverCount.current = 0;
                  setActiveMenu(null);
                }}
                key={activeMenu}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="nav-item relative rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wider text-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <span className="absolute inset-x-3 -bottom-px h-0.5 origin-left scale-x-0 rounded-full bg-primary transition-transform duration-200 hover:scale-x-100" />
    </Link>
  );
}

function MegaTrigger({
  label,
  isActive,
  onEnter,
  onLeave,
  onClick,
  triggerRef,
}: {
  label: string;
  isActive: boolean;
  onEnter: () => void;
  onLeave: () => void;
  onClick?: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement>;
}) {
  return (
    <button
      type="button"
      ref={triggerRef}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onFocus={onEnter}
      onBlur={onLeave}
      onClick={onClick}
      className={cn(
        "nav-item flex items-center gap-1 rounded-md px-3 py-2 text-sm font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isActive ? "text-foreground" : "text-foreground/80 hover:text-foreground"
      )}
      aria-expanded={isActive}
      aria-haspopup="true"
    >
      {label}
      <ChevronDown
        className={cn(
          "size-3.5 transition-transform duration-200",
          isActive && "rotate-180"
        )}
      />
    </button>
  );
}

/* ================================================================== */
/* LANGUAGE ROW — 5 languages, Radix Popover, opaque, no auto-translate */
/* (Exported so the header's AppsPopover component can reuse it.)        */
/* ================================================================== */
export function LanguageRow({
  langOpen,
  setLangOpen,
}: {
  langOpen: boolean;
  setLangOpen: (v: boolean) => void;
}) {
  const { locale, setLocale, t } = useI18n();
  const [langs, setLangs] = React.useState<{ code: string; english: string; native: string; dir: string }[] | null>(null);

  React.useEffect(() => {
    import("@/lib/languages").then((m) => setLangs(m.languages));
  }, []);

  const currentNative = React.useMemo(() => {
    if (!langs) return "English";
    return langs.find((l) => l.code === locale)?.native ?? "English";
  }, [langs, locale]);

  const selectLang = (code: string, native: string) => {
    setLocale(code);
    setLangOpen(false);
  };

  return (
    <Popover open={langOpen} onOpenChange={setLangOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
          aria-haspopup="listbox"
          aria-expanded={langOpen}
          role="menuitem"
          onMouseEnter={() => setLangOpen(true)}
          onClick={() => setLangOpen(!langOpen)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLangOpen(!langOpen); }
            if (e.key === "Escape") { e.preventDefault(); setLangOpen(false); }
          }}
        >
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10"><Languages className="size-4 text-primary" /></span>
          <span className="flex min-w-0 flex-1 items-center justify-between">
            <span className="flex min-w-0 flex-col">
              <span className="text-sm font-semibold">{t("nav.language")}</span>
              <span className="truncate text-xs text-muted-foreground">{currentNative}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        collisionPadding={16}
        className="z-[100] w-[260px] rounded-2xl border border-border p-3 shadow-[0_16px_40px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.04)] backdrop-blur-[8px]"
        style={{ backgroundColor: "var(--popover)" }}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === "Escape") { e.preventDefault(); setLangOpen(false); }
        }}
      >
        <div role="listbox" aria-label={t("nav.selectLanguage")}>
          {(langs ?? []).map((l) => (
            <button
              key={l.code}
              type="button"
              role="option"
              aria-selected={l.code === locale}
              className="grid w-full grid-cols-[28px_1fr_auto] items-center gap-3 rounded-lg px-2 py-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
              onClick={() => selectLang(l.code, l.native)}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded bg-primary/10 text-[10px] font-bold uppercase text-primary">{l.code}</span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{l.native}</span>
                <span className="truncate text-xs text-muted-foreground">{l.english}</span>
              </span>
              {l.code === locale && <Check className="size-4 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* ================================================================== */
/* MEGA PANEL CONTENT                                                 */
/* ================================================================== */
function MegaPanel({
  columns,
  showSearch,
  onClose,
}: {
  columns: MegaMenuColumn[];
  showSearch: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState("");
  // Keyboard-navigation index into the flat list of non-disabled items.
  // -1 means nothing is highlighted (focus stays on the search input).
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const itemRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);
  // Scroll container ref — used only when showSearch (All PDF Tools popover).
  const scrollRef = React.useRef<HTMLDivElement>(null);
  // Panel root ref — the visible popover card. Wheel/touch listeners are
  // attached HERE (not on the scroll container) so events over the search
  // bar, footer, padding, and scrollbar are all intercepted and redirected
  // to the inner scroller. This guarantees the page NEVER scrolls while the
  // popover is open, regardless of where the cursor is over the panel.
  const panelRootRef = React.useRef<HTMLDivElement>(null);

  const filteredColumns = React.useMemo(() => {
    if (!showSearch || !query.trim()) return columns;
    const q = query.trim().toLowerCase();
    return columns
      .map((col) => ({
        ...col,
        items: col.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q)
        ),
      }))
      .filter((col) => col.items.length > 0);
  }, [columns, query, showSearch]);

  // Build a flat list of navigable (non-disabled) items + assign each item a
  // global index so arrow-key navigation works across columns.
  const { indexedColumns, flatCount } = React.useMemo(() => {
    let counter = 0;
    const indexed = filteredColumns.map((col) => ({
      ...col,
      items: col.items.map((item) => ({
        ...item,
        _idx: item.disabled ? -1 : counter++,
      })),
    }));
    return { indexedColumns: indexed, flatCount: counter };
  }, [filteredColumns]);

  // Reset the active highlight whenever the filter result set changes.
  React.useEffect(() => {
    setActiveIndex(-1);
    itemRefs.current = [];
  }, [query]);

  // Panel-level wheel/touch interception (the core of "popover scrolls
  // internally, page doesn't"). Listeners are attached to the PANEL ROOT
  // (not the scroll container) so wheel events over the search bar, footer,
  // padding, and scrollbar are ALL caught. Every wheel event is preventDefault'd
  // and the delta is redirected to the inner scroll container — the page can
  // never scroll while the popover is open. Non-passive (passive:false) is
  // required for preventDefault to take effect.
  React.useEffect(() => {
    if (!showSearch) return;
    const panel = panelRootRef.current;
    const scroller = scrollRef.current;
    if (!panel || !scroller) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scroller.scrollTop += e.deltaY;
      scroller.scrollLeft += e.deltaX;
    };
    let lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      const currentY = e.touches[0]?.clientY ?? 0;
      const delta = lastTouchY - currentY; // >0 = scrolling down
      lastTouchY = currentY;
      e.preventDefault();
      scroller.scrollTop += delta;
    };

    panel.addEventListener("wheel", onWheel, { passive: false });
    panel.addEventListener("touchstart", onTouchStart, { passive: false });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      panel.removeEventListener("wheel", onWheel);
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
    };
  }, [showSearch]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (flatCount === 0 ? -1 : Math.min(i + 1, flatCount - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (flatCount === 0 ? -1 : Math.max(i - 1, 0)));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const idx = activeIndex;
      if (idx >= 0 && idx < (itemRefs.current.length)) {
        itemRefs.current[idx]?.click();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (query) {
        setQuery("");
      } else {
        onClose();
      }
    }
  };

  // Extracted so the same grid renders inside the scroll container (AllTools)
  // or directly (Convert) without duplicating the MegaLink map.
  const grid = (
    <motion.div
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="grid gap-x-8 gap-y-2"
      style={{
        gridTemplateColumns: `repeat(${Math.min(filteredColumns.length, 4)}, minmax(200px, 1fr))`,
      }}
      id="mega-tools-list"
      role="listbox"
    >
      {indexedColumns.map((col) => (
        <div key={col.title}>
          <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {col.title}
          </p>
          <div className="flex flex-col">
            {col.items.map((item) => {
              const Icon = item.icon;
              return (
                <MegaLink
                  key={item.label}
                  href={item.href}
                  disabled={item.disabled}
                  onClose={onClose}
                  isActive={!item.disabled && item._idx === activeIndex}
                  itemRef={
                    item.disabled
                      ? undefined
                      : (el) => {
                          if (item._idx >= 0) itemRefs.current[item._idx] = el;
                        }
                  }
                  ariaId={item.disabled ? undefined : `mega-item-${item._idx}`}
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10">
                    <Icon className="size-4 text-primary" />
                  </span>
                  <span className="flex min-w-0 flex-col">
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      {item.label}
                      {item.disabled && (
                        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </MegaLink>
              );
            })}
          </div>
        </div>
      ))}
    </motion.div>
  );

  const noResults =
    filteredColumns.length === 0 ? (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No tools match “{query}”.
      </p>
    ) : null;

  return (
    <div
      ref={panelRootRef}
      className="max-w-[min(1100px,92vw)] overflow-hidden rounded-2xl border border-border bg-popover p-0 shadow-[0_16px_40px_rgba(0,0,0,0.10),0_2px_4px_rgba(0,0,0,0.04)]"
      style={{ backgroundColor: "var(--popover)" }}
    >
      {showSearch ? (
        // Scroll container — the actual scroller for the All PDF Tools popover.
        // max-h caps the height so the grid scrolls internally instead of the
        // page. overscroll-contain + the non-passive wheel/touch listeners
        // (attached to panelRootRef via the effect above) prevent scroll
        // leakage to the page. role=region + aria-label + tabIndex=0 make it
        // keyboard-accessible.
        <div
          ref={scrollRef}
          className="menu-scroll overscroll-contain max-h-[min(78vh,720px)] overflow-y-auto p-5"
          role="region"
          aria-label="All PDF Tools"
          tabIndex={0}
        >
          {/* Sticky search — pinned to the top of the scroll area so the
              filter input is always reachable while scrolling. */}
          <div className="sticky top-0 z-10 -mx-5 mb-4 border-b bg-popover/95 px-5 pb-3 pt-1 backdrop-blur">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Search className="size-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Filter tools…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                aria-label="Filter tools"
                role="combobox"
                aria-expanded={flatCount > 0}
                aria-controls="mega-tools-list"
                aria-activedescendant={activeIndex >= 0 ? `mega-item-${activeIndex}` : undefined}
              />
            </div>
          </div>
          {grid}
          {noResults}
        </div>
      ) : (
        // Convert menu — short content, no scroll container (unchanged layout).
        <div className="p-6">
          {grid}
          {noResults}
        </div>
      )}
      {/* Sticky footer — always visible at the bottom of the panel, outside
          the scroll container so it never scrolls away. */}
      <div className="sticky bottom-0 border-t border-border bg-popover/95 px-5 py-3 text-right backdrop-blur">
        <Link
          href="/tools"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          Browse all {tools.length} tools <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </div>
  );
}

function MegaLink({
  href,
  disabled,
  onClose,
  children,
  isActive,
  itemRef,
  ariaId,
}: {
  href: string;
  disabled?: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isActive?: boolean;
  itemRef?: (el: HTMLAnchorElement | null) => void;
  ariaId?: string;
}) {
  if (disabled) {
    return (
      <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-2 py-2 opacity-60">
        {children}
      </span>
    );
  }
  return (
    <Link
      ref={itemRef}
      href={href}
      onClick={onClose}
      id={ariaId}
      role="option"
      aria-selected={isActive}
      className={cn(
        "flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
        isActive && "bg-accent ring-1 ring-ring"
      )}
    >
      {children}
    </Link>
  );
}

/* ================================================================== */
/* MOBILE SHEET                                                       */
/* ================================================================== */
function MobileSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[340px] overflow-y-auto p-0">
        <SheetHeader className="px-5 pt-5">
          <SheetTitle className="text-left logo-lock" dir="ltr">
            <Logo className="h-7 w-auto" size={28} />
          </SheetTitle>
        </SheetHeader>
        <div className="px-3 pb-10 pt-3">
          {/* Search */}
          <MobileSearch onClose={() => onOpenChange(false)} />

          <Accordion type="multiple" className="w-full">
            {/* Convert PDF section */}
            <AccordionItem value="convert">
              <AccordionTrigger className="text-sm font-semibold uppercase tracking-wide">
                Convert PDF
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-0.5 pb-2">
                  {convertPdfMenu.flatMap((col) => col.items).map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className="flex min-h-[44px] items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-accent"
                      >
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                          <Icon className="size-4 text-primary" />
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="font-medium">{item.label}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* All tools by category */}
            {categoryOrder.map((cat) => (
              <AccordionItem key={cat} value={cat}>
                <AccordionTrigger className="text-sm font-semibold uppercase tracking-wide">
                  {categoryLabels[cat]}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="flex flex-col gap-0.5 pb-2">
                    {tools
                      .filter((t) => t.category === cat)
                      .map((t) => {
                        const Icon = t.icon;
                        return (
                          <Link
                            key={t.slug}
                            href={`/tools/${t.slug}`}
                            onClick={() => onOpenChange(false)}
                            className="flex min-h-[44px] items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-accent"
                          >
                            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10">
                              <Icon className="size-4 text-primary" />
                            </span>
                            <span className="flex min-w-0 flex-col">
                              <span className="font-medium">{t.name}</span>
                              <span className="truncate text-xs text-muted-foreground">
                                {t.short}
                              </span>
                            </span>
                          </Link>
                        );
                      })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Bottom: theme + more */}
          <div className="mt-4 border-t pt-4">
            <div className="mb-3 flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              More
            </p>
            <div className="flex flex-col">
              <Link href="/blog" onClick={() => onOpenChange(false)} className="min-h-[44px] rounded-lg px-2 py-2 text-sm hover:bg-accent">
                Blog
              </Link>
              <Link href="/help" onClick={() => onOpenChange(false)} className="min-h-[44px] rounded-lg px-2 py-2 text-sm hover:bg-accent">
                Help Center
              </Link>
              <Link href="/contact" onClick={() => onOpenChange(false)} className="min-h-[44px] rounded-lg px-2 py-2 text-sm hover:bg-accent">
                Contact
              </Link>
              <Link href="/status" onClick={() => onOpenChange(false)} className="min-h-[44px] rounded-lg px-2 py-2 text-sm hover:bg-accent">
                Status
              </Link>
              <Link href="/solutions/students" onClick={() => onOpenChange(false)} className="min-h-[44px] rounded-lg px-2 py-2 text-sm hover:bg-accent">
                For Students
              </Link>
              <Link href="/solutions/teams" onClick={() => onOpenChange(false)} className="min-h-[44px] rounded-lg px-2 py-2 text-sm hover:bg-accent">
                For Teams
              </Link>
              <Link href="/solutions/developers" onClick={() => onOpenChange(false)} className="min-h-[44px] rounded-lg px-2 py-2 text-sm hover:bg-accent">
                For Developers
              </Link>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Mobile search — filters all tools and navigates on click. */
function MobileSearch({ onClose }: { onClose: () => void }) {
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    if (!q.trim()) return [];
    const query = q.trim().toLowerCase();
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.short.toLowerCase().includes(query) ||
        t.keywords.some((k) => k.includes(query))
    );
  }, [q]);

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
        <Search className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-label="Search tools"
        />
      </div>
      {filtered.length > 0 && (
        <div className="mt-2 max-h-60 overflow-y-auto scrollbar-thin">
          {filtered.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                onClick={onClose}
                className="flex min-h-[44px] items-center gap-3 rounded-lg px-2 py-2 text-sm hover:bg-accent"
              >
                <Icon className="size-4 text-primary" />
                <span className="font-medium">{t.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
