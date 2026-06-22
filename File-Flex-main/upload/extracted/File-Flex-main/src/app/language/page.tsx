import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { LanguagePicker } from "./LanguagePicker";

export const metadata: Metadata = {
  title: "Language",
  description: `Choose your preferred language for ${siteConfig.name}. Supports English, العربية, Français, Español and Italiano.`,
  alternates: { canonical: "/language" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: `Language — ${siteConfig.name}`,
  description: `Choose your preferred language for ${siteConfig.name}.`,
  url: `${siteConfig.url}/language`,
  isPartOf: {
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  },
};

export default function LanguagePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Language
      </h1>
      <p className="mt-2 text-muted-foreground">
        Choose your preferred language. Your choice is saved in your browser and applies the
        next time you visit.
      </p>

      <LanguagePicker />
    </div>
  );
}
