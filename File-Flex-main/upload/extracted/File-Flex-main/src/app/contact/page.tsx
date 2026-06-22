import type { Metadata } from "next";
import { Mail, MessageSquare, Github, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with the ${siteConfig.name} team.`,
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
        Contact
      </h1>
      <p className="mt-2 text-muted-foreground">
        Questions, feedback, or a tool you wish {siteConfig.name} had? We&apos;d love to hear from you.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card className="gap-0 p-5">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Mail className="size-5" />
          </div>
          <h2 className="mt-4 font-semibold">Email</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Best for detailed questions or partnership enquiries.
          </p>
          <a href={siteConfig.links.contact} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            hello@fileflex.app
          </a>
        </Card>

        <Card className="gap-0 p-5">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <MessageSquare className="size-5" />
          </div>
          <h2 className="mt-4 font-semibold">Feedback</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us which tool to build next, or report a bug.
          </p>
          <a href={siteConfig.links.contact} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            Send feedback →
          </a>
        </Card>

        <Card className="gap-0 p-5">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <Github className="size-5" />
          </div>
          <h2 className="mt-4 font-semibold">Open source</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {siteConfig.name} is built with open web tech. Suggestions welcome.
          </p>
        </Card>

        <Card className="gap-0 p-5">
          <div className="grid size-10 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
            <ShieldCheck className="size-5" />
          </div>
          <h2 className="mt-4 font-semibold">Privacy first</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Remember: every tool runs in your browser, so we never see your files. For privacy questions see our{" "}
            <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
          </p>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        {siteConfig.name} is a small project — thanks for your patience with replies.
      </p>
    </div>
  );
}
