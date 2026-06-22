"use client";

import { useCallback, useEffect, useState } from "react";

const KEY = "fileflex-usage-count-v1";

/**
 * Tracks how many file operations the user has completed (client-side only,
 * stored in localStorage). Used by the trust strip on the homepage.
 */
export function useUsageCounter() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // hydrating client-only count from localStorage
      setCount(raw ? parseInt(raw, 10) || 0 : 0);
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  const increment = useCallback((by = 1) => {
    setCount((prev) => {
      const next = prev + by;
      try {
        localStorage.setItem(KEY, String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return { count, increment, mounted };
}

/** Fire a short confetti burst on a successful big task. Respects reduced motion. */
export function celebrate() {
  if (typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#E50914", "#F40612", "#FF4D5A", "#ffffff"],
      scalar: 0.9,
      disableForReducedMotion: true,
      ticks: 120,
    });
  }).catch(() => {
    /* confetti is a nice-to-have; never block on it */
  });
}
