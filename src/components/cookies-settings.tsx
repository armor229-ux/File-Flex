"use client";

import { ShieldCheck, BarChart3, Megaphone, Check } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useConsent } from "@/lib/consent";
import { siteConfig } from "@/lib/site";

export function CookiesSettings() {
  const { analytics, ads, setAll, setFlags } = useConsent();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl" style={{ fontFamily: "var(--font-display)" }}>
        Cookie settings
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {siteConfig.name} processes every file locally and does not require cookies to work.
        Cookies are only used, with your consent, for analytics and advertising. Adjust your
        preferences below — they are saved in your browser only.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => setAll(true)} className="rounded-full">
          <Check className="size-4" /> Accept all
        </Button>
        <Button onClick={() => setAll(false)} variant="outline" className="rounded-full">
          Decline all
        </Button>
      </div>

      <div className="mt-6 space-y-3">
        <CookieRow
          icon={<ShieldCheck className="size-5 text-emerald-500" />}
          title="Necessary"
          description="Stores your cookie consent and theme preference. Required for the site to function — always on."
          checked
          disabled
        />
        <CookieRow
          icon={<BarChart3 className="size-5 text-sky-500" />}
          title="Analytics"
          description="Privacy-friendly, aggregated statistics about which tools are used. Helps us improve the site."
          checked={analytics}
          onCheckedChange={(v) => setFlags({ analytics: v })}
        />
        <CookieRow
          icon={<Megaphone className="size-5 text-amber-500" />}
          title="Advertising (Google AdSense)"
          description="Serves ads that keep the site free. Google and partners may use cookies to measure and personalise ads."
          checked={ads}
          onCheckedChange={(v) => setFlags({ ads: v })}
        />
      </div>

      <Card className="mt-8 gap-0 p-5">
        <h2 className="text-base font-semibold">About the cookies we use</h2>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong className="text-foreground">fileflex-consent-v1</strong> (localStorage) —
            stores your consent preferences. First-party, never sent anywhere.
          </li>
          <li>
            <strong className="text-foreground">__gads, __gpi</strong> (Google AdSense) — set
            only if advertising is enabled, to serve and measure ads.
          </li>
          <li>
            <strong className="text-foreground">theme</strong> (localStorage) — remembers
            light/dark mode.
          </li>
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          You can clear all site data at any time from your browser settings.
        </p>
      </Card>
    </div>
  );
}

function CookieRow({
  icon,
  title,
  description,
  checked,
  disabled,
  onCheckedChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange?: (v: boolean) => void;
}) {
  return (
    <Card className="flex items-start gap-4 p-5">
      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{title}</p>
          {disabled && (
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              Always on
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} aria-label={title} />
    </Card>
  );
}
