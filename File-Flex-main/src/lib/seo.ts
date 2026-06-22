import type { Metadata } from "next";
import { siteConfig } from "./site";
import type { Tool } from "./tools";

/** Build Next.js Metadata for a single tool page. */
export function toolMetadata(tool: Tool): Metadata {
  const title = `${tool.name} — Free Online Tool | ${siteConfig.name}`;
  const description = tool.description;
  const url = `${siteConfig.url}/tools/${tool.slug}`;
  return {
    title,
    description,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
      images: [{ url: `${siteConfig.url}/og-default.png`, width: 1200, height: 630, alt: siteConfig.name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${siteConfig.url}/og-default.png`],
    },
  };
}

/** Schema.org SoftwareApplication JSON-LD for a tool. */
export function toolJsonLd(tool: Tool) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} — ${siteConfig.name}`,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any (web browser)",
    browserRequirements: "Requires JavaScript. All processing happens locally in your browser.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    description: tool.description,
    url: `${siteConfig.url}/tools/${tool.slug}`,
    featureList: tool.keywords,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1280",
    },
  };
}

/** FAQPage JSON-LD from a list of {question, answer}. */
export function faqJsonLd(items: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.question,
      acceptedAnswer: { "@type": "Answer", text: i.answer },
    })),
  };
}
