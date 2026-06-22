import type { Metadata } from "next";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Status",
  description: `${siteConfig.name} system status.`,
  alternates: { canonical: "/status" },
};

// FileFlex is 100% client-side, so there is no server to go down. This page
// is intentionally simple and honest.
export default function StatusPage() {
  const lastUpdated = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
          System Status
        </h1>
        <p className="mt-3 text-muted-foreground">Last updated: {lastUpdated}</p>
      </div>

      <Card className="mt-10 gap-0 p-6">
        <div className="flex items-center gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-500/15">
            <CheckCircle2 className="size-6 text-emerald-500" />
          </span>
          <div>
            <p className="font-semibold text-emerald-600 dark:text-emerald-400">
              All systems normal
            </p>
            <p className="text-sm text-muted-foreground">
              {siteConfig.name} runs entirely in your browser. There is no server, so
              there is nothing to go down.
            </p>
          </div>
        </div>
      </Card>

      <div className="mt-6 space-y-2">
        {[
          "PDF Tools",
          "Image Tools",
          "Office Tools",
          "Utilities",
        ].map((svc) => (
          <div
            key={svc}
            className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3"
          >
            <span className="text-sm font-medium">{svc}</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="size-2 rounded-full bg-emerald-500" /> Operational
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
