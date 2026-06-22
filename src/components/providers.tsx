"use client";

import { ThemeProvider } from "next-themes";
import { ConsentProvider } from "@/lib/consent";
import { I18nProvider } from "@/lib/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <I18nProvider>
        <ConsentProvider>{children}</ConsentProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
