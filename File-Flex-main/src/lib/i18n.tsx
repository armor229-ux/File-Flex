"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type LocaleDir = "ltr" | "rtl";

const COOKIE_NAME = "fileflex_locale";
const LS_KEY = "fileflex.locale";

/** The ONLY supported locales — all have bundled dictionaries. */
export const BUNDLED_LOCALES = ["en", "ar", "fr", "es", "it"] as const;
export type BundledLocale = (typeof BUNDLED_LOCALES)[number];

export const RTL_LOCALES = ["ar"];

export function isBundled(locale: string): boolean {
  return (BUNDLED_LOCALES as readonly string[]).includes(locale);
}

export function isRtl(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

type Messages = Record<string, unknown>;

interface I18nContextValue {
  locale: string;
  dir: LocaleDir;
  messages: Messages;
  setLocale: (locale: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolve(messages: Messages, key: string): string | undefined {
  const parts = key.split(".");
  let cur: unknown = messages;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return typeof cur === "string" ? cur : undefined;
}

function interpolate(str: string, params?: Record<string, string | number>): string {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

import enMessages from "../../messages/en.json";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>("en");
  const [messages, setMessages] = useState<Messages>(enMessages as Messages);

  const dir: LocaleDir = isRtl(locale) ? "rtl" : "ltr";

  useEffect(() => {
    const saved = readSavedLocale();
    if (saved && saved !== "en" && isBundled(saved)) {
      applyLocale(saved);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
      document.documentElement.dir = dir;
    }
  }, [locale, dir]);

  const applyLocale = useCallback(async (newLocale: string) => {
    if (newLocale === "en" || !isBundled(newLocale)) {
      setMessages(enMessages as Messages);
      setLocaleState("en");
      return;
    }
    try {
      const mod = await import(`../../messages/${newLocale}.json`);
      setMessages(mod.default as Messages);
      setLocaleState(newLocale);
    } catch {
      setMessages(enMessages as Messages);
      setLocaleState("en");
    }
  }, []);

  const setLocale = useCallback((newLocale: string) => {
    if (!isBundled(newLocale)) return;
    persistLocale(newLocale);
    applyLocale(newLocale);
  }, [applyLocale]);

  const t = useCallback((key: string, params?: Record<string, string | number>) => {
    const val = resolve(messages, key) ?? resolve(enMessages as Messages, key) ?? key;
    return interpolate(val, params);
  }, [messages]);

  const value: I18nContextValue = { locale, dir, messages, setLocale, t };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

function readSavedLocale(): string | null {
  try {
    const fromLs = localStorage.getItem(LS_KEY);
    if (fromLs) return fromLs;
  } catch { /* ignore */ }
  if (typeof document !== "undefined") {
    const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

function persistLocale(locale: string) {
  try { localStorage.setItem(LS_KEY, locale); } catch { /* ignore */ }
  if (typeof document !== "undefined") {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(locale)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  }
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en",
      dir: "ltr" as LocaleDir,
      messages: enMessages as Messages,
      setLocale: () => {},
      t: (key: string, params?: Record<string, string | number>) => {
        const val = resolve(enMessages as Messages, key) ?? key;
        return interpolate(val, params);
      },
    } satisfies I18nContextValue;
  }
  return ctx;
}
