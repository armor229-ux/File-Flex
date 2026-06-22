"use client";

import * as React from "react";
import { Check, Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { languages } from "@/lib/languages";

/**
 * LanguagePicker — full-page language selector.
 *
 * Reuses the EXISTING language-switch logic from the header: the `useI18n`
 * hook's `locale` and `setLocale`. No duplicated persistence code —
 * `setLocale` already writes to localStorage + cookie and swaps the message
 * dictionary, exactly as the header's LanguageRow does.
 */
export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  const [pending, setPending] = React.useState<string | null>(null);

  const select = (code: string) => {
    if (code === locale) return;
    setPending(code);
    setLocale(code);
    // Clear the pending state on the next tick so the checkmark updates.
    React.startTransition(() => {
      setPending(null);
    });
  };

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2.5 border-b border-border bg-muted/40 px-5 py-3">
        <Languages className="size-4 text-primary" />
        <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("nav.selectLanguage")}
        </span>
      </div>

      <ul role="listbox" aria-label={t("nav.selectLanguage")} className="divide-y divide-border">
        {languages.map((l) => {
          const isActive = l.code === locale;
          const isPending = pending === l.code;
          return (
            <li key={l.code}>
              <button
                type="button"
                role="option"
                aria-selected={isActive}
                disabled={isPending}
                onClick={() => select(l.code)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/60 focus:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-bold uppercase text-primary">
                  {l.code}
                </span>
                <span className="flex min-w-0 flex-1 flex-col leading-tight">
                  <span className="text-sm font-semibold" dir={l.dir}>
                    {l.native}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{l.english}</span>
                </span>
                {isActive && (
                  <span className="ms-auto flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary">
                    <Check className="size-4" />
                    <span className="hidden sm:inline">Active</span>
                  </span>
                )}
                {isPending && !isActive && (
                  <span className="ms-auto shrink-0 text-xs text-muted-foreground">…</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
