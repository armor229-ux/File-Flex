import type { Metadata } from "next";
import { ShieldCheck, Zap, Gift, UserX, Heart, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About",
  description: `The story, mission and values behind ${siteConfig.name} — a free suite of private, in-browser file tools where your files never leave your browser.`,
  alternates: { canonical: "/about" },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: `About ${siteConfig.name}`,
  description: `The story, mission and values behind ${siteConfig.name}.`,
  url: `${siteConfig.url}/about`,
  isPartOf: {
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  },
  mainEntity: {
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    slogan: siteConfig.tagline,
    description: siteConfig.description,
    foundingDate: "2025",
  },
};

const values = [
  {
    icon: ShieldCheck,
    title: "Privacy by default",
    body: "Every tool runs entirely in your browser. Your files are never uploaded to a server, never stored, and never seen by anyone but you.",
  },
  {
    icon: Zap,
    title: "Fast & local",
    body: "Processing happens on your own device with native browser APIs. No queues, no waiting for a remote server — just instant results.",
  },
  {
    icon: Gift,
    title: "Free forever",
    body: "Every tool is free with no signup, no watermarks, and no artificial limits. Optional, declinable ads keep the lights on.",
  },
  {
    icon: UserX,
    title: "No account needed",
    body: "Open a tool and use it. We don't ask for an email, we don't track your files, and we don't build a profile on you.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <h1
        className="text-3xl font-bold tracking-tight sm:text-4xl"
        style={{ fontFamily: "var(--font-display)" }}
      >
        About {siteConfig.name}
      </h1>
      <p className="mt-3 text-muted-foreground">
        {siteConfig.name} is a free suite of private, in-browser file tools. Convert,
        compress, protect and clean PDFs, images and documents — right in your browser,
        with no uploads and no signup.
      </p>

      {/* Story */}
      <Card className="mt-8 gap-0 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Our story</h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_strong]:text-foreground">
          <p>
            {siteConfig.name} started with a simple frustration: most &quot;free&quot; file
            tools online quietly upload your files to a server you can&apos;t see. That means
            your documents, photos and spreadsheets leave your device and sit on someone
            else&apos;s computer — often with no clear idea of how long they&apos;re kept or
            who can read them.
          </p>
          <p>
            We thought there was a better way. Modern browsers can do remarkable things
            entirely on-device: merge and compress PDFs, convert images, parse spreadsheets,
            generate QR codes and more — all without a single byte leaving your computer.
            So we built {siteConfig.name} to prove it.
          </p>
          <p>
            <strong>Your files never leave your browser.</strong> There is no cloud storage,
            no server-side processing, and no account. What you open in a tool stays on your
            device until you close the tab.
          </p>
        </div>
      </Card>

      {/* Mission */}
      <Card className="mt-6 gap-0 rounded-2xl border-primary/20 bg-primary/5 p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <Heart className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Our mission</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              To give everyone, everywhere, a full toolbox for working with files — one that
              respects their time, their privacy, and their wallet. We believe useful software
              doesn&apos;t need to spy on you to be sustainable, and that the best place to
              process a file is right where it already lives: on your device.
            </p>
          </div>
        </div>
      </Card>

      {/* Values */}
      <h2 className="mt-10 text-lg font-semibold">What we stand for</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {values.map((v) => {
          const Icon = v.icon;
          return (
            <Card key={v.title} className="gap-0 rounded-2xl p-5 shadow-sm">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
            </Card>
          );
        })}
      </div>

      {/* Privacy promise */}
      <Card className="mt-8 gap-0 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <Lock className="size-5" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">The privacy promise</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              When a tool says it works in your browser, that&apos;s not marketing — it&apos;s
              the architecture. Files are read into your browser&apos;s memory, processed
              locally with JavaScript, and discarded when you leave. The only things that ever
              touch a network are the page itself and, if you consent, privacy-friendly
              analytics and ads. Read the details in our{" "}
              <a href="/privacy" className="text-primary underline-offset-4 hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </Card>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        Built with care for people who care about their files. — The {siteConfig.name} team
      </p>
    </div>
  );
}
