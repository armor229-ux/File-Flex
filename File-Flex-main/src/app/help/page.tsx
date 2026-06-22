import type { Metadata } from "next";
import { siteConfig } from "@/lib/site";
import { HelpContent } from "@/components/help-content";

export const metadata: Metadata = {
  title: "Help Center",
  description: `Guides and FAQs for ${siteConfig.name}.`,
  alternates: { canonical: "/help" },
};

export default function HelpPage() {
  return <HelpContent />;
}
