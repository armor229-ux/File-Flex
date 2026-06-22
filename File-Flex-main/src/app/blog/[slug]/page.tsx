import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, User } from "lucide-react";
import { marked } from "marked";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";
import {
  blogPosts,
  getPostBySlug,
  allBlogSlugs,
  formatBlogDate,
} from "@/lib/blog-posts";

// Configure marked once: GitHub-flavored line breaks, no extra HTML sanitization
// needed (the markdown source is our own static data file — no user input).
marked.setOptions({
  gfm: true,
  breaks: false,
});

export function generateStaticParams() {
  return allBlogSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  const url = `${siteConfig.url}/blog/${post.slug}`;
  const title = `${post.title} | ${siteConfig.name} Blog`;

  return {
    title,
    description: post.excerpt,
    keywords: post.tags,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description: post.excerpt,
      url,
      siteName: siteConfig.name,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: "/og-default.png", width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt,
      images: ["/og-default.png"],
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Render markdown to HTML on the server. The content is our own static
  // string from src/lib/blog-posts.ts, so dangerouslySetInnerHTML is safe
  // here (no untrusted input).
  const html = marked.parse(post.content) as string;

  // JSON-LD for rich results in search engines.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteConfig.url}/blog/${post.slug}`,
    },
    url: `${siteConfig.url}/blog/${post.slug}`,
    keywords: post.tags.join(", "),
    articleSection: post.category,
  };

  // Suggest the next article (next in the array, wrapping around).
  const idx = blogPosts.findIndex((p) => p.slug === post.slug);
  const next = blogPosts[(idx + 1) % blogPosts.length];

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Blog
      </Link>

      {/* Article header */}
      <header className="mt-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Tag className="size-3" />
            {post.category}
          </span>
        </div>
        <h1
          className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{post.excerpt}</p>

        {/* Byline */}
        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-y border-border/60 py-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <User className="size-4" />
            <span className="font-medium text-foreground">{post.author}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="size-4" />
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-4" />
            {post.readTime}
          </span>
        </div>
      </header>

      {/* Article body — rendered markdown with prose-style typography.
          Tailwind arbitrary-variant selectors scope styling to elements
          inside this container, matching the LegalLayout pattern. */}
      <div
        className="mt-8 [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:decoration-2 [&_blockquote]:border-l-2 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono [&_h1]:hidden [&_h2]:mt-10 [&_h2]:scroll-mt-20 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h4]:mt-4 [&_h4]:font-semibold [&_h4]:text-foreground [&_hr]:my-8 [&_hr]:border-border [&_img]:mx-auto [&_img]:my-6 [&_img]:rounded-xl [&_li]:ml-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 space-y-4 text-base leading-relaxed text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {/* Tags footer */}
      <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border/60 pt-6">
        <span className="text-sm font-medium text-foreground">Tags:</span>
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground"
          >
            <Tag className="size-2.5" />
            {tag}
          </span>
        ))}
      </div>

      {/* Inline CTA card */}
      <Card className="mt-10 gap-0 rounded-2xl border-primary/20 bg-primary/5 p-6 shadow-sm">
        <h3 className="text-lg font-semibold">Try it in your browser</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Every {siteConfig.name} tool runs entirely on your device — no
          uploads, no signup, no watermark. Pick a tool and see for yourself.
        </p>
        <Link
          href="/tools"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          Browse all tools <ArrowRight className="size-4" />
        </Link>
      </Card>

      {/* Next-article link */}
      <div className="mt-10 border-t border-border/60 pt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Keep reading
        </p>
        <Link
          href={`/blog/${next.slug}`}
          className="mt-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {next.title}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {next.excerpt}
            </p>
          </div>
          <ArrowRight className="size-5 shrink-0 text-primary" />
        </Link>
      </div>
    </article>
  );
}
