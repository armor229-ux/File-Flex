// Targeted re-verification of B, D, E with corrected probes.
import { chromium } from "playwright";

const BASE = "http://localhost:3000/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(800);

  // --- B corrected: inspect the layered background divs, not the section ---
  const bg = await page.evaluate(() => {
    const sec = document.querySelector("section");
    const layers = Array.from(sec?.children || []).map((c) => {
      const cs = getComputedStyle(c);
      const r = c.getBoundingClientRect();
      return {
        cls: (c.className || "").slice(0, 80),
        bgImage: (cs.backgroundImage || "").slice(0, 140),
        filter: cs.filter,
        display: cs.display,
        w: r.width,
        h: r.height,
      };
    });
    // Also sample an actual pixel from the rendered hero via a canvas snapshot
    // is overkill; instead probe computed color of the deepest element behind H1.
    const h1 = document.querySelector("h1");
    // Walk up until we find a non-transparent bg
    let el = h1;
    let found = null;
    while (el && el !== document.body) {
      const cs = getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage !== "none") {
        found = { tag: el.tagName, cls: el.className, bg: cs.backgroundImage.slice(0, 140) };
        break;
      }
      el = el.parentElement;
    }
    return { layers, behindH1: found };
  });
  console.log("B corrected:", JSON.stringify(bg, null, 2));

  // --- E corrected: confirm button is visually red by checking oklch/lightness too ---
  const eData = await page.evaluate(() => {
    const link = document.querySelector('section a[href="/tools"]');
    const cs = getComputedStyle(link);
    return {
      text: link.textContent.trim(),
      href: link.getAttribute("href"),
      bg: cs.backgroundColor,
      bgImage: cs.backgroundImage,
      borderRadius: cs.borderRadius,
      hasArrow: !!link.querySelector("svg"),
      boxShadow: cs.boxShadow.slice(0, 80),
    };
  });
  console.log("E corrected:", JSON.stringify(eData, null, 2));

  // --- D corrected: reload, wait for H1 to mount + animation to be active, then sample ---
  await page.reload({ waitUntil: "load" });
  // wait for the H1 to be present AND at least one word span to have a style attribute
  await page.waitForSelector("h1 > span", { timeout: 5000 });
  // give framer-motion a tick to apply the initial styles
  await sleep(50);

  const samples = [];
  const t0 = Date.now();
  for (let i = 0; i <= 12; i++) {
    const t = Date.now() - t0;
    const data = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      return Array.from(h1?.children || []).map((s) => {
        const cs = getComputedStyle(s);
        return { opacity: parseFloat(cs.opacity), y: cs.transform };
      });
    });
    samples.push({ t, opacities: data.map((d) => d.opacity) });
    await sleep(100);
  }
  console.log("D corrected samples:");
  for (const s of samples) console.log(`  t=${s.t}ms  opacities=[${s.opacities.join(", ")}]`);

  await ctx.close();
  await browser.close();
}
main();
