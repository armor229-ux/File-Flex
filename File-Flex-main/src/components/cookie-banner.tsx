"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie, X, ShieldCheck, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/consent";

export function CookieBanner() {
  const { choice, setAll, hasDecided } = useConsent();
  const [dismissed, setDismissed] = useState(false);

  // `choice` is null until the consent provider hydrates from localStorage, so
  // the banner naturally only appears client-side after hydration — no SSR flash
  // and no setState-in-effect needed.
  const visible = !dismissed && choice === null;
  // Once a choice exists we never reshow (unless storage cleared).
  if (hasDecided && choice !== null) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-0 z-[60] px-3 pb-3 sm:px-4 sm:pb-4"
          role="dialog"
          aria-live="polite"
          aria-label="Cookie consent"
        >
          <div className="mx-auto max-w-5xl rounded-2xl border bg-card/95 p-4 shadow-2xl backdrop-blur sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-start gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <Cookie className="size-5" />
                </div>
                <div className="text-sm">
                  <p className="font-semibold leading-tight">We value your privacy</p>
                  <p className="mt-1 text-muted-foreground">
                    FileFlex processes every file locally in your browser — nothing is
                    uploaded. We use cookies only for ads (Google AdSense) and basic
                    analytics, which require your consent.{" "}
                    <Link href="/cookies" className="font-medium text-primary underline-offset-4 hover:underline">
                      Cookie settings
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAll(false);
                    window.dispatchEvent(
                      new CustomEvent("fileflex:consent-updated")
                    );
                  }}
                  className="rounded-full"
                >
                  <X className="size-4" /> Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setAll(true);
                    window.dispatchEvent(
                      new CustomEvent("fileflex:consent-updated")
                    );
                  }}
                  className="rounded-full"
                >
                  <Check className="size-4" /> Accept all
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConsentBadge() {
  const { choice } = useConsent();
  if (choice === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
        <ShieldCheck className="size-3.5" /> Ads enabled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <ShieldCheck className="size-3.5" /> Ads disabled
    </span>
  );
}
