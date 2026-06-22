"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useHoverIntent — shared hover/click controller for header popovers.
 *
 * Solves the "popover closes while I move the cursor toward an item" bug by
 * tracking hover state across BOTH the trigger and the content with a single
 * pair of timers, and by keeping the panel open while focus is inside it.
 *
 * Usage:
 *   const { open, setOpen, bind, contentBind } = useHoverIntent();
 *   <Popover open={open} onOpenChange={setOpen}>
 *     <PopoverTrigger asChild>
 *       <button {...bind}>…</button>
 *     </PopoverTrigger>
 *     <PopoverContent {...contentBind}>
 *       <div className="menu-bridge" aria-hidden />  // FIRST child
 *       …items…
 *     </PopoverContent>
 *   </Popover>
 *
 * - `bind` goes on the trigger button (mouse + focus + click handlers).
 * - `contentBind` goes on the PopoverContent (mouse + focus-capture handlers).
 * - The `.menu-bridge` element (rendered as the first child of the content)
 *   spans the sideOffset gap so the cursor can travel trigger → panel without
 *   a mouseleave on the trigger closing the panel.
 *
 * Behavior:
 *   - Hover opens after openDelay (120ms); closes closeDelay (300ms) after the
 *     cursor leaves BOTH trigger and content.
 *   - Click toggles (e.preventDefault() stops Radix's internal trigger handler
 *     from competing and cancelling the toggle).
 *   - Focus inside content cancels the close timer.
 *   - Esc / outside click close via Radix's onOpenChange (controlled `open`).
 *   - Touch devices ((hover: none)): hover-open disabled, click only.
 *   - prefers-reduced-motion: instant open/close (no delays).
 *   - Timers cleaned up on unmount.
 */
export function useHoverIntent({
  openDelay = 120,
  closeDelay = 300,
}: { openDelay?: number; closeDelay?: number } = {}) {
  const [open, setOpen] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [reduced, setReduced] = useState(false);

  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Tracks whether the pointer is currently over the trigger / content.
  const overTrigger = useRef(false);
  const overContent = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    setIsTouch(window.matchMedia("(hover: none)").matches);
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const clearOpen = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current);
      openTimer.current = null;
    }
  }, []);

  const clearClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleOpen = useCallback(() => {
    clearClose();
    if (open) return;
    if (reduced) {
      setOpen(true);
      return;
    }
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  }, [clearClose, open, reduced, openDelay]);

  const scheduleClose = useCallback(() => {
    // Only close if the pointer is over NEITHER the trigger nor the content.
    if (overTrigger.current || overContent.current) return;
    clearOpen();
    if (reduced) {
      setOpen(false);
      return;
    }
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [clearOpen, reduced, closeDelay]);

  // Cleanup on unmount.
  useEffect(() => () => {
    clearOpen();
    clearClose();
  }, [clearOpen, clearClose]);

  // --- Trigger handlers -------------------------------------------------
  const bind = {
    onMouseEnter: () => {
      if (isTouch) return;
      overTrigger.current = true;
      scheduleOpen();
    },
    onMouseLeave: () => {
      if (isTouch) return;
      overTrigger.current = false;
      scheduleClose();
    },
    onFocus: () => {
      // Keyboard focus opens immediately (no hover delay) for a11y.
      clearClose();
      setOpen(true);
    },
    onBlur: () => {
      // Focus left the trigger. If it moved INTO the content, the content's
      // onFocusCapture handler will cancel this close. If it went elsewhere,
      // the close timer fires after closeDelay.
      overTrigger.current = false;
      scheduleClose();
    },
    onClick: (e: React.MouseEvent) => {
      // preventDefault stops Radix's internal trigger handler from also
      // firing — otherwise the two toggles cancel out (the "click broken"
      // bug). We control `open` ourselves.
      e.preventDefault();
      clearOpen();
      clearClose();
      setOpen((v) => !v);
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    },
  };

  // --- Content handlers -------------------------------------------------
  const contentBind = {
    onMouseEnter: () => {
      overContent.current = true;
      clearClose();
    },
    onMouseLeave: () => {
      overContent.current = false;
      scheduleClose();
    },
    // Focus captured inside content → cancel any pending close.
    onFocusCapture: () => {
      clearClose();
    },
    onBlurCapture: (e: React.FocusEvent) => {
      // If focus moved to another element still inside the content, keep open.
      const related = e.relatedTarget as Node | null;
      if (related && e.currentTarget.contains(related)) return;
      // Focus left the content entirely.
      if (!overContent.current && !overTrigger.current) {
        scheduleClose();
      }
    },
    // Prevent focus from jumping to the content when the popover opens via
    // hover (keeps focus on the trigger so Tab works naturally).
    onOpenAutoFocus: (e: Event) => {
      e.preventDefault();
    },
  };

  return { open, setOpen, bind, contentBind, isTouch, reduced, clearClose, scheduleClose };
}
