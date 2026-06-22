/**
 * Google AdSense configuration.
 *
 * HOW TO SET YOUR ADSENSE IDS:
 * 1. Get your AdSense account approved and create ad units.
 * 2. Set `enabled` to `true`.
 * 3. Paste your publisher client id (looks like `ca-pub-1234567890123456`).
 * 4. Paste each slot id (the numeric data-ad-slot) into the matching key below.
 * 5. Deploy. Ads only render after the visitor accepts the cookie consent banner
 *    (see components/consent-provider.tsx + components/ad-slot.tsx).
 *
 * While `enabled` is false (or consent is declined) the <AdSlot /> component
 * renders a labelled placeholder box so layouts stay stable in development.
 */
export const adsConfig = {
  enabled: false,
  client: "ca-pub-XXXXXXXXXXXXXXXX",
  slots: {
    homeTop: "1111111111",
    homeMid: "2222222222",
    toolTop: "3333333333",
    toolBottom: "4444444444",
    toolSidebar: "5555555555",
  },
} as const;

export type AdSlotKey = keyof typeof adsConfig.slots;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** Push an ad unit to AdSense. Safe to call multiple times. */
export function pushAd() {
  if (typeof window === "undefined") return;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch {
    /* AdSense not loaded yet — ignore. */
  }
}
