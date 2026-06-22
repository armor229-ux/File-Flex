/**
 * next-sitemap config.
 *
 * FileFlex uses Next.js first-class metadata routes (app/sitemap.ts and
 * app/robots.ts) for sitemap.xml and robots.txt generation. This postbuild
 * config is an additional, optional sitemap generator that runs after
 * `next build` (see the "postbuild" script in package.json).
 *
 * generateRobotsTxt is false because /robots.txt is served by app/robots.ts.
 */

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://file-flex-psi.vercel.app";

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl,
  generateRobotsTxt: false,
  generateIndexSitemap: false,
  changefreq: "weekly",
  priority: 0.7,
  sitemapSize: 5000,
  exclude: ["/api/*"],
};
