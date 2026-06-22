"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useHoverIntent — minimal hover-intent controller for a popover that should
 * open on hover with a small delay, keep open while the cursor travels between
 * the trigger and the content (via a hover bridge), and close after a grace
 * period when the cursor leaves both.
 *
 * Returns controlled `open` state plus mouse handlers to spread on the trigger
 * and the content. Timers are cleaned up on unmount.
 */
export function useHoverIntent({
  openDelay = 120,
  closeDelay = 200,
  reduced = false,
}: { openDelay?: number; closeDelay?: number; reduced?: boolean } = {}) {
  const [open, setOpen] = useState(false);
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const clearAll = useCallback(() => {
    clearOpen();
    clearClose();
  }, [clearOpen, clearClose]);

  const onTriggerEnter = useCallback(() => {
    clearClose();
    if (open) return;
    // prefers-reduced-motion: open instantly (no hover delay)
    if (reduced) {
      setOpen(true);
      return;
    }
    openTimer.current = setTimeout(() => setOpen(true), openDelay);
  }, [clearClose, open, reduced, openDelay]);

  const onTriggerLeave = useCallback(() => {
    clearOpen();
    if (reduced) {
      setOpen(false);
      return;
    }
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [clearOpen, reduced, closeDelay]);

  const onContentEnter = useCallback(() => {
    clearClose();
  }, [clearClose]);

  const onContentLeave = useCallback(() => {
    clearOpen();
    if (reduced) {
      setOpen(false);
      return;
    }
    closeTimer.current = setTimeout(() => setOpen(false), closeDelay);
  }, [clearOpen, reduced, closeDelay]);

  // Clean up timers on unmount
  useEffect(() => clearAll, [clearAll]);

  return {
    open,
    setOpen,
    onTriggerEnter,
    onTriggerLeave,
    onContentEnter,
    onContentLeave,
    clearAll,
  };
}
