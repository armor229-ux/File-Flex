import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ToolsExplorer } from "@/components/home/tools-explorer";
import { AdSlot } from "@/components/ad-slot";
import { tools } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "All File Tools — PDF, Image, Office & Utilities",
  description: `Browse all ${tools.length} free, private, in-browser file tools from ${siteConfig.name}. PDF, image, office and utility tools — no uploads, no signup.`,
  alternates: { canonical: "/tools" },
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground">All tools</span>
      </nav>

      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
          All file tools
        </h1>
        <p className="mt-2 text-muted-foreground">
          {`Every ${siteConfig.name} tool in one place. Pick a category, search, or just scroll — all ${tools.length} tools run privately in your browser.`}
        </p>
      </div>

      <div className="mt-6">
        <AdSlot slot="homeTop" format="horizontal" />
      </div>

      <section className="mt-8">
        <ToolsExplorer />
      </section>
    </div>
  );
}
