import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Tag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { siteConfig } from "@/lib/site";
import { blogPosts, formatBlogDate } from "@/lib/blog-posts";

export const metadata: Metadata = {
  title: "Blog - FileFlex",
  description:
    "Guides, tutorials and tips from the FileFlex team on PDF tools, image compression, password security and privacy-first file workflows.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: `Blog - ${siteConfig.name}`,
    description:
      "Guides, tutorials and tips from the FileFlex team on PDF tools, image compression, password security and privacy-first file workflows.",
    url: `${siteConfig.url}/blog`,
    siteName: siteConfig.name,
    type: "website",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: siteConfig.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `Blog - ${siteConfig.name}`,
    description:
      "Guides, tutorials and tips from the FileFlex team on PDF tools, image compression, password security and privacy-first file workflows.",
    images: ["/og-default.png"],
  },
};

export default function BlogIndexPage() {
  // Show newest first
  const posts = [...blogPosts].sort((a, b) => b.date.localeCompare(a.date));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${siteConfig.name} Blog`,
    description:
      "Guides, tutorials and tips from the FileFlex team on PDF tools, image compression, password security and privacy-first file workflows.",
    url: `${siteConfig.url}/blog`,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    blogPost: posts.map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.excerpt,
      datePublished: p.date,
      dateModified: p.date,
      author: { "@type": "Organization", name: p.author },
      url: `${siteConfig.url}/blog/${p.slug}`,
      keywords: p.tags.join(", "),
      articleSection: p.category,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Page header — matches the editorial style of /about and /contact */}
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-primary">
          The FileFlex Blog
        </p>
        <h1
          className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Guides, tips &amp; tutorials
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Practical, no-nonsense articles about PDF tools, image compression,
          password security and doing more with your files — without
          surrendering your privacy.
        </p>
      </header>

      {/* Articles grid — responsive 1/2/3 columns, matches the solutions-page grid */}
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Card
            key={post.slug}
            className="group flex flex-col gap-0 overflow-hidden rounded-2xl p-0 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <Link
              href={`/blog/${post.slug}`}
              className="flex flex-1 flex-col"
              aria-label={`Read: ${post.title}`}
            >
              {/* Color block header — echoes the primary brand color without an external image asset */}
              <div className="relative flex h-32 items-end bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5 p-4">
                <Badge
                  variant="secondary"
                  className="bg-background/85 backdrop-blur-sm"
                >
                  {post.category}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h2 className="line-clamp-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                  {post.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>

                {/* Meta row */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="size-3.5" />
                    {formatBlogDate(post.date)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="size-3.5" />
                    {post.readTime}
                  </span>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                    >
                      <Tag className="size-2.5" />
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Read-more footer */}
                <div className="mt-5 flex items-center gap-1 text-sm font-medium text-primary">
                  Read article
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>

      {/* CTA footer */}
      <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-border bg-card p-8 text-center">
        <h2 className="text-xl font-semibold">Every tool here is 100% client-side</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {siteConfig.name} runs entirely in your browser. No uploads, no
          signup, no watermarks — just instant, private file tools.
        </p>
        <Link
          href="/tools"
          className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Browse all tools <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}
