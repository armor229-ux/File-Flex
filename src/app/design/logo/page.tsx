import type { Metadata } from "next";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Logo Preview",
  description: "FileFlex logo design preview — default, compact, and mono variants.",
  robots: { index: false, follow: false },
};

export default function LogoPreviewPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1
        className="text-4xl font-bold tracking-tight sm:text-5xl"
        style={{ fontFamily: "var(--font-bebas), 'Bebas Neue', sans-serif", letterSpacing: "0.02em" }}
      >
        Logo Preview
      </h1>
      <p className="mt-2 text-muted-foreground">
        FileFlex “Stacked Sheets” mark. Reload the page to replay the one-shot animation.
      </p>

      {/* Light surface */}
      <section className="mt-10 rounded-2xl border border-border bg-white p-8">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Light surface
        </h2>
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <Logo size={40} />
            <span className="text-xs text-neutral-400">default · 40px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo size={32} />
            <span className="text-xs text-neutral-400">default · 32px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo variant="compact" size={48} />
            <span className="text-xs text-neutral-400">compact · 48px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo variant="compact" size={32} />
            <span className="text-xs text-neutral-400">compact · 32px</span>
          </div>
          <div className="flex flex-col items-center gap-2 text-neutral-900">
            <Logo variant="mono" size={28} />
            <span className="text-xs text-neutral-400">mono · 28px</span>
          </div>
        </div>
      </section>

      {/* Dark surface */}
      <section className="mt-6 rounded-2xl bg-neutral-950 p-8">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Dark surface
        </h2>
        <div className="flex flex-wrap items-center gap-10 text-white">
          <div className="flex flex-col items-center gap-2">
            <Logo size={40} />
            <span className="text-xs text-neutral-500">default · 40px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo variant="compact" size={48} />
            <span className="text-xs text-neutral-500">compact · 48px</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo variant="mono" size={28} />
            <span className="text-xs text-neutral-500">mono · 28px</span>
          </div>
        </div>
      </section>

      {/* Animated vs not */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-8">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Animated vs static
        </h2>
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <Logo size={36} animated />
            <span className="text-xs text-muted-foreground">animated</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Logo size={36} animated={false} />
            <span className="text-xs text-muted-foreground">static</span>
          </div>
        </div>
      </section>
    </div>
  );
}
