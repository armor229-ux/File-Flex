// Cinematic hero E2E verification (Playwright, headless Chromium).
// Covers A–K as specified. Outputs a JSON report + screenshots.

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = "http://localhost:3000/";
const OUT = "/home/z/my-project/tool-results/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const report = { desktop: {}, mobile: {}, reduced: {}, raw: {} };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clipConsole(msg) {
  const t = msg.type();
  const txt = msg.text();
  return { type: t, text: txt };
}

async function attachConsole(page, label) {
  const logs = [];
  page.on("console", (m) => logs.push(clipConsole(m)));
  page.on("pageerror", (e) => logs.push({ type: "pageerror", text: String(e) }));
  return logs;
}

// ---------------------------------------------------------------------------
// DESKTOP — A,B,C,D,E,F,G,I,J
// ---------------------------------------------------------------------------
async function runDesktop() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: null, // system default (no reduce)
  });
  const page = await ctx.newPage();
  const consoleLogs = await attachConsole(page, "desktop");

  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(600);

  // --- A) Page renders, no crash ----------------------------------------
  const html = await page.content();
  const hasNextErrorOverlay =
    (await page.locator("nextjs-portal, nextjs__container_errors_").count()) > 0;
  const blank = html.length < 1500 || (await page.locator("body").innerText()).trim().length < 50;
  report.desktop.A = {
    status: !blank && !hasNextErrorOverlay && errors.length === 0 ? "PASS" : "FAIL",
    note: `bodyLen=${(await page.locator("body").innerText()).length}, errors=${
      errors.length
    }, overlay=${hasNextErrorOverlay}`,
    errors,
  };

  // --- B) Hero background renders ---------------------------------------
  const heroSection = page.locator("section").first();
  const heroBg = await page.evaluate(() => {
    const sec = document.querySelector("section");
    if (!sec) return null;
    const cs = getComputedStyle(sec);
    const rect = sec.getBoundingClientRect();
    // inspect children of section that are -z-10 backgrounds
    const layers = Array.from(sec.children).map((c) => {
      const s = getComputedStyle(c);
      return {
        cls: c.className,
        bg: s.background,
        bgImage: s.backgroundImage,
        bgSize: s.backgroundSize,
        bgPos: s.backgroundPosition,
        opacity: s.opacity,
        display: s.display,
        zIndex: s.zIndex,
        filter: s.filter,
      };
    });
    return {
      secBg: cs.backgroundColor,
      secBgImage: cs.backgroundImage,
      rect: { w: rect.width, h: rect.height, top: rect.top },
      // pixel at top-center
      topCenterPx: (function () {
        const r = sec.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + 30);
        return el ? el.className : "no-element";
      })(),
      layers,
    };
  });
  const grainExists = (await page.locator(".hero-grain").count()) > 0;
  const shimmerOnH1 = (await page.locator("h1.hero-text-shimmer").count()) > 0;
  const heroScreenshot = path.join(OUT, "B-desktop-hero.png");
  await heroSection.screenshot({ path: heroScreenshot });

  report.desktop.B = {
    status:
      grainExists && shimmerOnH1 && heroBg.secBg !== "rgba(0, 0, 0, 0)"
        ? "PASS"
        : "FAIL",
    note: `grain=${grainExists}, shimmerOnH1=${shimmerOnH1}, secBg=${heroBg.secBg}, layers=${
      heroBg.layers.length
    }, topCenterBg=${heroBg.layers[0]?.bgImage?.slice(0, 80)}`,
    layers: heroBg.layers.length,
    screenshot: heroScreenshot,
  };

  // --- C) Headline copy + period glow -----------------------------------
  const h1Data = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return null;
    const txt = h1.innerText;
    const cs = getComputedStyle(h1);
    const redSpans = h1.querySelectorAll("span.text-red-500");
    return {
      text: txt,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      color: cs.color,
      redSpanCount: redSpans.length,
      redSpanTexts: Array.from(redSpans).map((s) => s.textContent),
    };
  });
  report.desktop.C = {
    status:
      h1Data.text.replace(/\s+/g, " ").trim() === "EVERY FILE. EVERY FORMAT. FREE." &&
      h1Data.redSpanCount === 3
        ? "PASS"
        : "FAIL",
    note: `text="${h1Data.text}", redSpans=${h1Data.redSpanCount}, fontSize=${h1Data.fontSize}`,
    fontSize: h1Data.fontSize,
    redSpans: h1Data.redSpanCount,
  };

  // --- D) Word-by-word entrance animation -------------------------------
  // Reload, then sample the H1 child spans' opacity at 0/200/500/800 ms.
  await page.reload({ waitUntil: "domcontentloaded" });
  const samples = [];
  // Sample loop starts immediately.
  for (const ms of [0, 200, 500, 800, 1200]) {
    if (ms > 0) await sleep(ms - (samples.length ? samples[samples.length - 1].t : 0));
    const data = await page.evaluate(() => {
      const h1 = document.querySelector("h1");
      if (!h1) return null;
      const spans = Array.from(h1.querySelectorAll("span"));
      // top-level word spans are direct motion.span children of h1
      const wordSpans = Array.from(h1.children);
      return wordSpans.map((s) => {
        const cs = getComputedStyle(s);
        return {
          text: s.textContent?.replace(/\u00A0/g, " "),
          opacity: parseFloat(cs.opacity),
          transform: cs.transform,
          filter: cs.filter,
        };
      });
    });
    samples.push({ t: ms, words: data });
  }
  // Determine if stagger happened: at t=0 some words should have opacity<0.5,
  // and over time all should reach ~1.
  const firstSample = samples[0]?.words || [];
  const lastSample = samples[samples.length - 1]?.words || [];
  const initialOpacities = firstSample.map((w) => w.opacity);
  const finalOpacities = lastSample.map((w) => w.opacity);
  const anyStartLow = initialOpacities.some((o) => o < 0.5);
  const allEndVisible = finalOpacities.every((o) => o >= 0.95);
  report.desktop.D = {
    status: anyStartLow && allEndVisible ? "PASS" : allEndVisible ? "PARTIAL" : "FAIL",
    note: `initialOpacities=[${initialOpacities.join(
      ","
    )}] -> final=[${finalOpacities.join(",")}]`,
    samples: samples.map((s) => ({
      t: s.t,
      opacities: s.words.map((w) => w.opacity),
    })),
  };

  // --- E) Trust pill + subhead + CTA ------------------------------------
  const pillData = await page.evaluate(() => {
    const sec = document.querySelector("section");
    // Trust pill: first motion.div with rounded-full border
    const pill = sec?.querySelector(".rounded-full.border");
    if (!pill) return null;
    const cs = getComputedStyle(pill);
    const hasSparkles = !!pill.querySelector("svg.lucide-sparkles, svg");
    const txt = pill.textContent || "";
    return {
      text: txt.trim(),
      borderRadius: cs.borderRadius,
      border: cs.border,
      hasSvg: !!pill.querySelector("svg"),
    };
  });
  const subhead = await page.locator("section p").first().innerText().catch(() => "");
  const ctaData = await page.evaluate(() => {
    const link = document.querySelector('section a[href="/tools"]');
    if (!link) return null;
    const cs = getComputedStyle(link);
    return {
      text: (link.textContent || "").trim(),
      href: link.getAttribute("href"),
      bg: cs.backgroundColor,
      borderRadius: cs.borderRadius,
      hasArrow: !!link.querySelector("svg"),
    };
  });
  const haloData = await page.evaluate(() => {
    // find span sibling behind the CTA link — has blur-2xl and radial-gradient
    const link = document.querySelector('section a[href="/tools"]');
    if (!link) return null;
    const wrapper = link.parentElement;
    const halo = wrapper?.querySelector("span[aria-hidden]");
    if (!halo) return null;
    const cs = getComputedStyle(halo);
    return {
      bg: cs.backgroundImage?.slice(0, 100),
      filter: cs.filter,
      opacity: cs.opacity,
    };
  });
  const pillOk =
    pillData &&
    /free tools/i.test(pillData.text) &&
    pillData.hasSvg &&
    parseFloat(pillData.borderRadius) > 20;
  const subOk = /Convert, compress, protect, and clean any file/i.test(subhead);
  const ctaOk =
    ctaData &&
    ctaData.text === "Browse All Tools" &&
    ctaData.href === "/tools" &&
    /239, 6, 6|229, 9, 20|red/i.test(ctaData.bg) &&
    parseFloat(ctaData.borderRadius) > 20 &&
    ctaData.hasArrow;
  const haloOk = haloData && /rgba\(229, ?9, ?20|rgba\(229,9,20/.test(haloData.bg || "");
  report.desktop.E = {
    status: pillOk && subOk && ctaOk && haloOk ? "PASS" : "FAIL",
    note: `pill=${pillOk}("${pillData?.text?.slice(0, 40)}"), sub=${subOk}, cta=${ctaOk}(${ctaData?.bg}), halo=${haloOk}`,
    pill: pillData,
    cta: ctaData,
    halo: haloData,
  };

  // --- F) Count-up stats ------------------------------------------------
  // Reload, scroll stats into view, sample number text over time.
  await page.reload({ waitUntil: "domcontentloaded" });
  await sleep(400);
  // The stats <p> is the last <motion.p> in the hero. Locate by text pattern.
  const statsEl = page.locator("section p").filter({ hasText: /files processed/i }).first();
  await statsEl.scrollIntoViewIfNeeded();
  const statSamples = [];
  const t0 = Date.now();
  // Sample quickly
  for (let i = 0; i < 12; i++) {
    const txt = (await statsEl.innerText().catch(() => "")) || "";
    const m = txt.match(/([\d.,\s]+)/);
    statSamples.push({ t: Date.now() - t0, txt: txt.trim(), num: m ? m[1] : null });
    await sleep(150);
  }
  const finalTxt = statSamples[statSamples.length - 1]?.txt || "";
  const hasComma = /1,284,5\d\d/.test(finalTxt) || /1,284,/.test(finalTxt);
  const increased = statSamples.some((s, i) => {
    if (i === 0) return false;
    const prev = parseInt((statSamples[i - 1].num || "0").replace(/[^\d]/g, ""), 10) || 0;
    const cur = parseInt((s.num || "0").replace(/[^\d]/g, ""), 10) || 0;
    return cur > prev;
  });
  report.desktop.F = {
    status: increased && hasComma ? "PASS" : hasComma ? "PARTIAL" : "FAIL",
    note: `increased=${increased}, comma=${hasComma}, final="${finalTxt.slice(0, 80)}"`,
    samples: statSamples.map((s) => ({ t: s.t, txt: s.txt.slice(0, 80) })),
  };

  // --- G) Decorative lasers + divider -----------------------------------
  const decor = await page.evaluate(() => {
    const sec = document.querySelector("section");
    const ariaHiddenSpans = Array.from(sec?.querySelectorAll("span[aria-hidden]") || []);
    // Side lasers: have w-px, h-[35vh], opacity 0.06
    const sideLasers = ariaHiddenSpans.filter((s) => {
      const cs = getComputedStyle(s);
      return parseFloat(cs.width) <= 2 && cs.display !== "none";
    });
    // Horizontal divider: w-280px, h-px
    const dividers = Array.from(sec?.querySelectorAll("div[aria-hidden]") || []).filter(
      (d) => {
        const cs = getComputedStyle(d);
        return parseFloat(cs.height) <= 2 && cs.display !== "none";
      }
    );
    return {
      sideLasers: sideLasers.map((s) => {
        const cs = getComputedStyle(s);
        return { opacity: cs.opacity, width: cs.width, height: cs.height };
      }),
      dividers: dividers.map((d) => {
        const cs = getComputedStyle(d);
        return { width: cs.width, height: cs.height, bg: cs.backgroundImage.slice(0, 60) };
      }),
      allAriaHiddenCount: ariaHiddenSpans.length,
    };
  });
  const lasersOk =
    decor.sideLasers.length === 2 &&
    decor.sideLasers.every((l) => Math.abs(parseFloat(l.opacity) - 0.06) < 0.01);
  const dividerOk = decor.dividers.length >= 1;
  report.desktop.G = {
    status: lasersOk && dividerOk ? "PASS" : "FAIL",
    note: `sideLasers=${decor.sideLasers.length} (opacities=${decor.sideLasers
      .map((l) => l.opacity)
      .join(",")}), dividers=${decor.dividers.length}`,
    detail: decor,
  };

  // --- I) No layout shift (CLS) -----------------------------------------
  // Reload twice, measure CLS via PerformanceObserver.
  const clsVal = await page.evaluate(async () => {
    return new Promise((resolve) => {
      let cls = 0;
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cls += entry.value || 0;
          }
        });
        po.observe({ type: "layout-shift", buffered: true });
      } catch (e) {
        return resolve({ cls: null, err: String(e) });
      }
      setTimeout(() => resolve({ cls }), 2500);
    });
  });
  // Also check min-height reserved
  const minHeight = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    if (!h1) return null;
    const cs = getComputedStyle(h1);
    return { minHeight: cs.minHeight, height: cs.height };
  });
  report.desktop.I = {
    status: (clsVal.cls ?? 0) < 0.1 && parseFloat(minHeight.height) > 200 ? "PASS" : "FAIL",
    note: `CLS=${clsVal.cls}, h1 minHeight=${minHeight.minHeight}, h1 height=${minHeight.height}`,
    cls: clsVal.cls,
    h1Height: minHeight.height,
  };

  // --- J) Other sections intact -----------------------------------------
  const sections = await page.evaluate(() => {
    const body = document.body.innerText;
    const header = document.querySelector("header");
    const footer = document.querySelector("footer");
    const faq = document.querySelector("section")?.parentElement?.querySelector(
      "section:nth-of-type(n+3)"
    );
    // featured tools: count cards with /tools/ links inside section
    const toolLinks = document.querySelectorAll('a[href^="/tools/"]');
    return {
      hasHeader: !!header,
      hasFooter: !!footer,
      headerText: header ? header.innerText.slice(0, 200) : "",
      footerText: footer ? footer.innerText.slice(0, 100) : "",
      toolLinkCount: toolLinks.length,
      hasAllToolsText: /All Tools/i.test(body),
      hasFaqText: /Frequently Asked|FAQ/i.test(body),
      hasPrivate: /Private/i.test(body),
      hasFast: /Fast/i.test(body),
      hasFree: /Free/i.test(body),
      hasNoSignup: /No Signup|No signup|No sign-up/i.test(body),
    };
  });
  // Hover "Convert PDF" — confirm dropdown panel appears (verifies nav.tsx not broken)
  let dropdownOk = false;
  try {
    const convertPdfTrigger = page.locator("header", { hasText: "Convert PDF" }).first();
    await convertPdfTrigger.hover();
    await sleep(400);
    // Check for hover panel appearing (typically a panel with "Merge PDF"/"Split PDF" text appearing in a popover outside the trigger itself)
    dropdownOk = await page.evaluate(() => {
      // Look for elements that contain tool names typical of the dropdown
      const allText = document.body.innerText;
      // These are common Convert PDF submenu items; check if visible after hover
      const mergeVisible = Array.from(document.querySelectorAll("a, button, div")).some(
        (el) => {
          const r = el.getBoundingClientRect();
          return (
            r.top > 0 &&
            r.top < 800 &&
            /Merge PDF/.test(el.textContent || "") &&
            el.offsetParent !== null
          );
        }
      );
      return mergeVisible;
    });
  } catch (e) {
    dropdownOk = false;
  }
  report.desktop.J = {
    status:
      sections.hasHeader &&
      sections.hasFooter &&
      sections.toolLinkCount >= 8 &&
      sections.hasAllToolsText &&
      sections.hasFaqText &&
      sections.hasPrivate &&
      sections.hasFree
        ? "PASS"
        : "FAIL",
    note: `header=${sections.hasHeader}, footer=${sections.hasFooter}, toolLinks=${sections.toolLinkCount}, allTools=${sections.hasAllToolsText}, faq=${sections.hasFaqText}, whyStrip=[${sections.hasPrivate},${sections.hasFast},${sections.hasFree},${sections.hasNoSignup}], dropdown=${dropdownOk}`,
    dropdown: dropdownOk,
    sections,
  };

  // Console errors / hydration warnings
  report.desktop.console = consoleLogs.map((l) => ({ type: l.type, text: l.text?.slice(0, 200) }));
  report.desktop.consoleErrors = consoleLogs.filter(
    (l) => l.type === "error" || l.type === "pageerror"
  );
  report.desktop.hydrationWarnings = consoleLogs.filter((l) =>
    /hydrat/i.test(l.text || "")
  );

  await ctx.close();
  await browser.close();
}

// ---------------------------------------------------------------------------
// MOBILE — K (375px)
// ---------------------------------------------------------------------------
async function runMobile() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 800 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(600);

  const mobileData = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    const cs = h1 ? getComputedStyle(h1) : null;
    const sec = document.querySelector("section");
    // Side lasers at mobile should be display:none (md:block hides them)
    const ariaHiddenSpans = Array.from(sec?.querySelectorAll("span[aria-hidden]") || []);
    const sideLasersVisible = ariaHiddenSpans.filter((s) => {
      const cs = getComputedStyle(s);
      const w = parseFloat(cs.width);
      return cs.display !== "none" && w <= 2;
    });
    // Divider should be hidden
    const dividers = Array.from(sec?.querySelectorAll("div[aria-hidden]") || []).filter(
      (d) => {
        const cs = getComputedStyle(d);
        return cs.display !== "none" && parseFloat(cs.height) <= 2;
      }
    );
    // Featured-tools grid
    const featuredGrid = sec?.querySelector(".grid.grid-cols-2");
    const gridCs = featuredGrid ? getComputedStyle(featuredGrid) : null;
    // Horizontal overflow check
    const sw = document.documentElement.scrollWidth;
    const cw = document.documentElement.clientWidth;
    return {
      h1FontSize: cs?.fontSize,
      h1Text: h1?.innerText,
      sideLasersVisible: sideLasersVisible.length,
      dividersVisible: dividers.length,
      gridCols: gridCs?.gridTemplateColumns,
      scrollWidth: sw,
      clientWidth: cw,
      overflow: sw > cw + 2,
    };
  });
  await page.screenshot({ path: path.join(OUT, "K-mobile-full.png"), fullPage: false });
  await page.locator("section").first().screenshot({ path: path.join(OUT, "K-mobile-hero.png") });

  report.mobile.K = {
    status:
      !mobileData.overflow &&
      mobileData.sideLasersVisible === 0 &&
      mobileData.dividersVisible === 0
        ? "PASS"
        : "FAIL",
    note: `overflow=${mobileData.overflow}, sideLasers=${mobileData.sideLasersVisible}, dividers=${mobileData.dividersVisible}, gridCols="${mobileData.gridCols}", h1fs=${mobileData.h1FontSize}`,
    data: mobileData,
  };

  await ctx.close();
  await browser.close();
}

// ---------------------------------------------------------------------------
// REDUCED MOTION — H
// ---------------------------------------------------------------------------
async function runReduced() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "networkidle" });
  await sleep(300);

  // t=0 opacity of word spans
  const t0Words = await page.evaluate(() => {
    const h1 = document.querySelector("h1");
    return Array.from(h1?.children || []).map((s) => getComputedStyle(s).opacity);
  });
  // Shimmer animation: check if running
  const shimmerRunning = await page.evaluate(() => {
    const h1 = document.querySelector("h1.hero-text-shimmer");
    if (!h1) return null;
    const cs = getComputedStyle(h1);
    return { animationName: cs.animationName, animationDuration: cs.animationDuration };
  });
  // Grain hidden?
  const grainDisplay = await page.evaluate(() => {
    const g = document.querySelector(".hero-grain");
    return g ? getComputedStyle(g).display : "no-grain-element";
  });
  // Drifting glow blob — under reduced motion it should NOT be rendered.
  // The drifting glow is the 3rd background layer. Check for element with animation: hero-drift.
  const driftBlob = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll("section [aria-hidden]"));
    return all
      .map((el) => ({
        cls: el.className,
        anim: getComputedStyle(el).animationName,
        bg: getComputedStyle(el).backgroundImage?.slice(0, 60),
      }))
      .filter((e) => e.anim && e.anim !== "none");
  });
  // Stats — should show final value immediately
  await page.locator("section p").filter({ hasText: /files processed/i }).first().scrollIntoViewIfNeeded();
  await sleep(150);
  const statsText = await page
    .locator("section p")
    .filter({ hasText: /files processed/i })
    .first()
    .innerText();

  await page.locator("section").first().screenshot({ path: path.join(OUT, "H-reduced-hero.png") });

  const allVisibleAtT0 = t0Words.every((o) => parseFloat(o) >= 0.95);
  const shimmerOff =
    shimmerRunning &&
    (shimmerRunning.animationName === "none" || shimmerRunning.animationDuration === "0s");
  const grainHidden = grainDisplay === "none";
  const driftAbsent = driftBlob.length === 0;
  const statsFinal = /1,284,5\d\d/.test(statsText);

  report.reduced.H = {
    status:
      allVisibleAtT0 && shimmerOff && grainHidden && driftAbsent && statsFinal
        ? "PASS"
        : "FAIL",
    note: `wordsVisible@t0=${allVisibleAtT0} (${t0Words.join(
      ","
    )}), shimmerOff=${shimmerOff} (${shimmerRunning?.animationName}/${shimmerRunning?.animationDuration}), grainHidden=${grainHidden} (${grainDisplay}), driftAbsent=${driftAbsent} (found=${driftBlob.length}), statsFinal=${statsFinal} ("${statsText.slice(0, 80)}")`,
    driftFound: driftBlob,
  };

  await ctx.close();
  await browser.close();
}

// ---------------------------------------------------------------------------
(async () => {
  try {
    await runDesktop();
  } catch (e) {
    report.desktop.ERROR = String(e) + "\n" + e.stack;
  }
  try {
    await runMobile();
  } catch (e) {
    report.mobile.ERROR = String(e) + "\n" + e.stack;
  }
  try {
    await runReduced();
  } catch (e) {
    report.reduced.ERROR = String(e) + "\n" + e.stack;
  }
  fs.writeFileSync(
    "/home/z/my-project/tool-results/hero-verify-report.json",
    JSON.stringify(report, null, 2)
  );
  console.log("=== REPORT ===");
  console.log(JSON.stringify(report, null, 2));
})();
