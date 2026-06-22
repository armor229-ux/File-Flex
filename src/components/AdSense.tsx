"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { ADSENSE_CLIENT } from "@/lib/ads";

const CONSENT_KEY = "fileflex-consent-v1";

/**
 * Read the visitor's stored cookie consent and report whether the Advertising
 * category has been explicitly accepted.
 *
 * The stored shape (written by `src/lib/consent.tsx`) is:
 *   { decided: boolean; analytics: boolean; ads: boolean }
 * `ads === true` is the signal that AdSense is permitted to load.
 */
function adsConsentGranted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as {
      decided?: unknown;
      analytics?: unknown;
      ads?: unknown;
    };
    return parsed.ads === true;
  } catch {
    return false;
  }
}

/**
 * Mounts the Google AdSense loader script, but ONLY after the visitor has
 * accepted the "Advertising" cookie category. Renders no visible UI.
 *
 * Consent is observed two ways so the script reacts to in-session changes:
 *  1. On mount — covers returning visitors who already accepted.
 *  2. Via window events:
 *     - `"fileflex:consent-updated"` — dispatched by the cookie banner.
 *     - `"fileflex:consent"` — dispatched by the consent provider for every
 *       change (banner + cookies settings page), so the script also loads when
 *       the user enables ads from `/cookies`.
 *
 * `shouldLoad` only ever flips `false -> true`, so the `<Script>` is mounted at
 * most once per page session (next/script also de-duplicates by `src`), giving
 * a double guard against double injection.
 */
export function AdSense() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (adsConsentGranted()) {
      setShouldLoad(true);
      return;
    }

    const handleConsentChange = () => {
      if (adsConsentGranted()) setShouldLoad(true);
    };

    window.addEventListener("fileflex:consent-updated", handleConsentChange);
    window.addEventListener("fileflex:consent", handleConsentChange);
    return () => {
      window.removeEventListener("fileflex:consent-updated", handleConsentChange);
      window.removeEventListener("fileflex:consent", handleConsentChange);
    };
  }, []);

  if (!shouldLoad) return null;

  return (
    <Script
      async
      strategy="afterInteractive"
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
    />
  );
}
