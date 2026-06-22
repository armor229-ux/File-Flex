"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ShieldCheck, Zap, Gift, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AdSlot } from "@/components/ad-slot";
import { ToolHeader } from "@/components/tool-header";
import { getToolComponent } from "@/components/tools/registry";
import { getTool, tools, categoryLabels } from "@/lib/tools";

export function ToolView({ slug }: { slug: string }) {
  const tool = getTool(slug);
  const ToolComponent = getToolComponent(slug);

  const related = useMemo(
    () => tools.filter((t) => t.category === tool?.category && t.slug !== slug).slice(0, 5),
    [slug, tool?.category]
  );

  if (!tool || !ToolComponent) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-2xl font-bold">Tool not found</h1>
        <p className="mt-2 text-muted-foreground">
          We couldn&apos;t find that tool.
        </p>
        <Link href="/tools" className="mt-4 inline-block text-primary hover:underline">
          Browse all tools →
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        {/* Main column */}
        <div className="min-w-0">
          <ToolHeader tool={tool} />

          {/* Top ad (after H1+intro) */}
          <div className="mt-5">
            <AdSlot slot="toolTop" format="horizontal" />
          </div>

          {/* The tool itself */}
          <div className="mt-5">
            <ToolComponent />
          </div>

          {/* Bottom ad (after result) */}
          <div className="mt-6">
            <AdSlot slot="toolBottom" format="horizontal" />
          </div>

          {/* Trust badges */}
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TrustBadge icon={ShieldCheck} title="Private" text="Files never leave your browser." />
            <TrustBadge icon={Zap} title="Fast" text="Native client-side processing." />
            <TrustBadge icon={Gift} title="Free forever" text="No signup, no watermarks." />
          </div>

          {/* Long description / SEO content */}
          <div className="mt-8 max-w-none text-sm leading-relaxed text-muted-foreground">
            <h2 className="mb-2 text-base font-semibold text-foreground">About {tool.name}</h2>
            <p>{tool.description}</p>
            <p className="mt-3">
              {tool.name} runs entirely in your browser using {categoryLabels[tool.category]}{" "}
              technology. Your files are processed locally and never uploaded to a server — there is
              no cloud, no storage, and no account required.{" "}
              <UserX className="inline size-3.5 align-text-bottom" /> Nothing about your file is sent
              anywhere.
            </p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-5">
            <AdSlot slot="toolSidebar" format="rectangle" className="min-h-[250px]" />

            <Card className="p-4">
              <h3 className="text-sm font-semibold">Related tools</h3>
              <ul className="mt-3 space-y-1">
                {related.map((t) => {
                  const RIcon = t.icon;
                  return (
                    <li key={t.slug}>
                      <Link
                        href={`/tools/${t.slug}`}
                        className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-accent"
                      >
                        <RIcon className="size-4 text-primary" />
                        <span className="truncate">{t.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>

            <Card className="bg-gradient-to-br from-primary/10 to-transparent p-4">
              <h3 className="text-sm font-semibold">Why FileFlex?</h3>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Every tool here is free, private and works offline. No uploads, no signup.
              </p>
              <Link href="/tools" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
                Browse all {tools.length} tools →
              </Link>
            </Card>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TrustBadge({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card/50 p-3">
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
