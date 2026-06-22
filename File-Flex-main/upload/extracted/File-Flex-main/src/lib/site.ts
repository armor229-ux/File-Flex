export const siteConfig = {
  name: "FileFlex",
  tagline: "Every file. Every format. Free.",
  description:
    "FileFlex is a free suite of private, in-browser file tools. Convert, compress, protect and clean any file — PDFs, images and documents. 100% client-side, no uploads, no signup.",
  url: "https://fileflex.app",
  locale: "en_US",
  themeColor: "#E50914",
  backgroundColor: "#FFFFFF",
  twitter: "@fileflex",
  links: {
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
    contact: "mailto:hello@fileflex.app",
  },
} as const;

export type SiteConfig = typeof siteConfig;
