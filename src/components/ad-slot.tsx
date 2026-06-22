"use client";

import { useEffect, useRef, useState } from "react";
import { adsConfig, pushAd, type AdSlotKey } from "@/lib/ads";
import { useConsent } from "@/lib/consent";
import { cn } from "@/lib/utils";

/**
 * Reusable AdSense slot. Lazy-loads via IntersectionObserver and only injects
 * the AdSense script + ins element after the visitor has accepted cookies.
 *
 * While disabled (no consent, or adsConfig.enabled === false) it renders a
 * labelled placeholder so page layout stays stable.
 */
export function AdSlot({
  slot,
  className,
  format = "auto",
  label = "Advertisement",
}: {
  slot: AdSlotKey;
  className?: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  label?: string;
}) {
  const { ads } = useConsent();
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  const canShow = ads && adsConfig.enabled;

  // Lazy-load: observe the container and flip inView when near viewport.
  useEffect(() => {
    if (!canShow) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [canShow]);

  // Once in view + consent, ensure the AdSense loader script exists, then push.
  // pushAd queues into window.adsbygoogle which AdSense drains on load.
  useEffect(() => {
    if (!canShow || !inView) return;
    const id = "adsbygoogle-js";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.async = true;
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsConfig.client}`;
      s.crossOrigin = "anonymous";
      document.head.appendChild(s);
    }
    pushAd();
  }, [canShow, inView]);

  const showAd = canShow && inView;

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex min-h-[90px] items-center justify-center overflow-hidden rounded-2xl border border-dashed bg-muted/30 p-2",
        className
      )}
      aria-label="Advertisement region"
    >
      {showAd ? (
        <ins
          className="adsbygoogle block w-full"
          style={{ display: "block" }}
          data-ad-client={adsConfig.client}
          data-ad-slot={adsConfig.slots[slot]}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex w-full items-center justify-center py-4 text-center">
          <span className="text-xs uppercase tracking-widest text-muted-foreground/70">
            {label} · {adsConfig.enabled ? "ad space" : "ad space (preview)"}
          </span>
        </div>
      )}
    </div>
  );
}
