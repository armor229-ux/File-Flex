/**
 * next-sitemap config.
 *
 * FileFlex uses Next.js first-class metadata routes (app/sitemap.ts and
 * app/robots.ts) for sitemap.xml and robots.txt generation — they're type-safe
 * and require zero extra dependencies. This file is provided for projects that
 * prefer the `next-sitemap` PostBuild flow instead.
 *
 * To use next-sitemap instead:
 *   1. `npm install next-sitemap`
 *   2. Add to package.json scripts: "postbuild": "next-sitemap"
 *   3. Delete app/sitemap.ts and app/robots.ts
 *   4. Run `npm run build` (the postbuild hook generates public/sitemap.xml
 *      and public/robots.txt).
 *
 * Docs: https://github.com/iamvishnusankar/next-sitemap
 */

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://file-flex-psi.vercel.app";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 7000,
  robotsTxtOptions: {
    policies: [{ userAgent: "*", allow: "/" }],
    additionalSitemaps: [`${siteUrl}/sitemap.xml`],
  },
};
