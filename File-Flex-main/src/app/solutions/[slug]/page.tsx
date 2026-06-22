import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { tools } from "@/lib/tools";
import { siteConfig } from "@/lib/site";

const solutions = {
  students: {
    title: "FileFlex for Students",
    subtitle: "Free tools for homework, research and study — no signup, no uploads.",
    picks: ["pdf-merge", "pdf-split", "pdf-to-jpg", "jpg-to-pdf", "text-to-pdf", "word-to-pdf" as string].filter((s) => tools.some((t) => t.slug === s)),
  },
  teams: {
    title: "FileFlex for Teams",
    subtitle: "Bulk file tools for shared work — compress, merge, rename and convert in batches.",
    picks: ["pdf-merge", "pdf-compress", "image-compress", "file-rename-batch", "zip-create", "excel-to-csv"],
  },
  developers: {
    title: "FileFlex for Developers",
    subtitle: "Hash, base64, regex, JSON↔YAML and more — all in your browser.",
    picks: ["hash-generator", "base64", "url-encode-decode", "regex-tester", "json-to-yaml", "yaml-to-json", "json-to-csv", "csv-to-json"],
  },
} as const;

type SolutionSlug = keyof typeof solutions;

export function generateStaticParams() {
  return Object.keys(solutions).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = solutions[slug as SolutionSlug];
  if (!s) return {};
  return {
    title: s.title,
    description: s.subtitle,
    alternates: { canonical: `/solutions/${slug}` },
  };
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = solutions[slug as SolutionSlug];
  if (!s) notFound();
  const picks = s.picks
    .map((p) => tools.find((t) => t.slug === p))
    .filter((t): t is (typeof tools)[number] => !!t);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl" style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}>
          {s.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{s.subtitle}</p>
        <Button asChild className="mt-8 rounded-full">
          <Link href="/tools">Browse All Tools <ArrowRight className="size-4" /></Link>
        </Button>
      </div>

      <div className="mt-14">
        <h2 className="mb-4 text-xl font-semibold">Recommended tools</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {picks.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.slug}
                href={`/tools/${t.slug}`}
                className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10">
                  <Icon className="size-5 text-primary" />
                </span>
                <div>
                  <p className="font-semibold">{t.name}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.short}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Card className="mt-14 gap-0 p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-semibold">Everything here is 100% client-side</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No file ever leaves {siteConfig.name}. There is no server, no upload and no
              signup — every tool runs entirely in your browser.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
