import type { Metadata } from "next";
import { CookiesSettings } from "@/components/cookies-settings";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "Cookie Settings",
  description: `Manage your cookie and consent preferences on ${siteConfig.name}.`,
  alternates: { canonical: "/cookies" },
};

export default function CookiesPage() {
  return <CookiesSettings />;
}
