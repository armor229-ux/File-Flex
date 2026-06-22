"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * FileFlex logo — animated "File ↔ X" mark + Bebas Neue wordmark.
 *
 * ALWAYS renders LTR regardless of document direction. The brand wordmark
 * "FileFlex" is a static asset — never translated, never reordered.
 *
 * Variants:
 *   - default: red rounded tile with morphing File↔X glyph + "File" (currentColor) + "Flex" (red)
 *   - compact: just the red tile with morphing glyph (favicons)
 *   - mono:    monochrome (currentColor) tile outline + morphing glyph + wordmark
 *
 * Animation: cross-fade + scale/rotate morph between a "file" glyph and the
 * letter "X". Loop ~3.5s (hold 1400ms + 350ms transition per side). On hover
 * the loop speeds up (hold 600ms + 250ms transition). Honors
 * prefers-reduced-motion: renders the static File glyph only (no morph).
 * The animation never causes layout shift — the tile bounding box, alignment,
 * and spacing relative to the wordmark are identical to the static mark.
 */

/* ------------------------------------------------------------------ */
/* GLYPHS — File ↔ X morph (designed in a 36-unit tile, centered 18,18) */
/* ------------------------------------------------------------------ */
function Glyphs({
  tile,
  color,
  phase,
  transMs,
  animate: doAnimate,
}: {
  tile: number;
  color: string;
  phase: "file" | "x";
  transMs: number;
  animate: boolean;
}) {
  const k = tile / 36;
  const transition = { duration: transMs / 1000, ease: "easeInOut" as const };
  const origin = { originX: `${18 * k}px`, originY: `${18 * k}px` };

  // File: opacity 1→0, scale 1→0.85, rotate 0→-8deg
  const fileTarget =
    phase === "file"
      ? { opacity: 1, scale: 1, rotate: 0 }
      : { opacity: 0, scale: 0.85, rotate: -8 };
  // X: opacity 0→1, scale 0.9→1, rotate 8→0deg
  const xTarget =
    phase === "x"
      ? { opacity: 1, scale: 1, rotate: 0 }
      : { opacity: 0, scale: 0.9, rotate: 8 };

  // File glyph: page outline with a small folded corner (~60% of tile)
  const fileOutline = `M${10 * k} ${8 * k} L${19 * k} ${8 * k} L${27 * k} ${16 * k} L${27 * k} ${29 * k} L${10 * k} ${29 * k} Z`;
  const fileFold = `M${19 * k} ${8 * k} L${19 * k} ${16 * k} L${27 * k} ${16 * k}`;
  const fileSW = 2.2 * k;
  // X glyph: thick rounded "X" of two strokes (~60% of tile)
  const xSW = 5 * k;

  const renderFile = (
    <g>
      <path d={fileOutline} fill="none" stroke={color} strokeWidth={fileSW} strokeLinejoin="round" strokeLinecap="round" />
      <path d={fileFold} fill="none" stroke={color} strokeWidth={fileSW} strokeLinejoin="round" strokeLinecap="round" />
    </g>
  );
  const renderX = (
    <g>
      <line x1={10 * k} y1={10 * k} x2={26 * k} y2={26 * k} stroke={color} strokeWidth={xSW} strokeLinecap="round" />
      <line x1={26 * k} y1={10 * k} x2={10 * k} y2={26 * k} stroke={color} strokeWidth={xSW} strokeLinecap="round" />
    </g>
  );

  // prefers-reduced-motion / animated=false: static File glyph only
  if (!doAnimate) {
    return renderFile;
  }

  return (
    <>
      <motion.g animate={fileTarget} transition={transition} style={origin}>
        {renderFile}
      </motion.g>
      <motion.g animate={xTarget} transition={transition} style={origin}>
        {renderX}
      </motion.g>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* LOGO                                                                */
/* ------------------------------------------------------------------ */
export function Logo({
  size,
  variant = "default",
  animated = true,
  className,
}: {
  size?: number;
  variant?: "default" | "compact" | "mono";
  animated?: boolean;
  className?: string;
}) {
  const fontStack =
    "'Bebas Neue', var(--font-bebas), 'Oswald', 'Arial Narrow', sans-serif";
  const prefersReduced = useReducedMotion();
  const shouldAnimate = animated && !prefersReduced;

  const [phase, setPhase] = useState<"file" | "x">("file");
  const [hovered, setHovered] = useState(false);
  const holdMs = hovered ? 600 : 1400;
  const transMs = hovered ? 250 : 350;

  useEffect(() => {
    if (!shouldAnimate) return;
    const id = setTimeout(() => {
      setPhase((p) => (p === "file" ? "x" : "file"));
    }, holdMs + transMs);
    return () => clearTimeout(id);
  }, [phase, holdMs, transMs, shouldAnimate]);

  const hoverProps = shouldAnimate
    ? {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
      }
    : {};

  /* ---------- compact: red tile + morphing glyph ---------- */
  if (variant === "compact") {
    const s = size ?? 32;
    return (
      <span
        dir="ltr"
        lang="en"
        className={cn("logo-lock inline-flex", className)}
        style={{ direction: "ltr", unicodeBidi: "isolate" }}
        {...hoverProps}
      >
        <svg
          viewBox="0 0 48 48"
          role="img"
          aria-label="FileFlex"
          height={s}
          width={s}
        >
          <title>FileFlex</title>
          <rect width="48" height="48" rx="10" fill="#E50914" />
          <Glyphs tile={48} color="#ffffff" phase={phase} transMs={transMs} animate={shouldAnimate} />
        </svg>
      </span>
    );
  }

  /* ---------- mono: monochrome (currentColor) tile outline + morphing glyph + wordmark ---------- */
  if (variant === "mono") {
    const h = size ?? 28;
    return (
      <span
        dir="ltr"
        lang="en"
        className={cn("logo-lock inline-flex", className)}
        style={{ direction: "ltr", unicodeBidi: "isolate" }}
        {...hoverProps}
      >
        <svg
          viewBox="0 0 244 36"
          role="img"
          aria-label="FileFlex"
          height={h}
          width={h * (244 / 36)}
        >
          <title>FileFlex</title>
          {/* monochrome tile outline */}
          <rect x="0" y="0" width="36" height="36" rx="8" fill="none" stroke="currentColor" strokeWidth="2" />
          <Glyphs tile={36} color="currentColor" phase={phase} transMs={transMs} animate={shouldAnimate} />
          {/* wordmark in currentColor (monochrome) */}
          <text
            x="44"
            y="30"
            fontFamily={fontStack}
            fontSize="34"
            fill="currentColor"
            letterSpacing="1"
          >
            FileFlex
          </text>
        </svg>
      </span>
    );
  }

  /* ---------- default: red tile + morphing glyph + wordmark ---------- */
  const h = size ?? 28;
  return (
    <span
      dir="ltr"
      lang="en"
      className={cn("logo-lock inline-flex", className)}
      style={{ direction: "ltr", unicodeBidi: "isolate" }}
      {...hoverProps}
    >
      <svg
        viewBox="0 0 210 36"
        role="img"
        aria-label="FileFlex"
        height={h}
        width={h * (210 / 36)}
      >
        <title>FileFlex</title>
        {/* red icon tile */}
        <rect x="0" y="0" width="36" height="36" rx="8" fill="#E50914" />
        <Glyphs tile={36} color="#ffffff" phase={phase} transMs={transMs} animate={shouldAnimate} />
        {/* "File" in currentColor (adapts to theme) */}
        <text
          x="44"
          y="29"
          fontFamily={fontStack}
          fontSize="30"
          fill="currentColor"
          letterSpacing="1"
        >
          File
        </text>
        {/* "Flex" in brand red */}
        <text
          x="95"
          y="29"
          fontFamily={fontStack}
          fontSize="30"
          fill="#E50914"
          letterSpacing="1"
        >
          Flex
        </text>
      </svg>
    </span>
  );
}

/** Square app mark — red tile with morphing glyph. For tight UI spots. */
export function LogoMark({ size, className }: { size?: number; className?: string }) {
  return <Logo variant="compact" size={size ?? 32} className={className} />;
}
