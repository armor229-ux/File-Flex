"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export interface ConsentFlags {
  necessary: true; // always on
  analytics: boolean;
  ads: boolean;
}

export type ConsentChoice = "accepted" | "declined" | null;

export interface ConsentState extends ConsentFlags {
  /** null = not yet decided, "accepted" | "declined" once the user has chosen */
  choice: ConsentChoice;
  /** true only after the visitor has made (or loaded) an explicit choice */
  hasDecided: boolean;
  setAll: (accept: boolean) => void;
  setFlags: (flags: Partial<Pick<ConsentFlags, "analytics" | "ads">>) => void;
}

const STORAGE_KEY = "fileflex-consent-v1";

const ConsentContext = createContext<ConsentState | null>(null);

interface StoredConsent {
  decided: boolean;
  analytics: boolean;
  ads: boolean;
}

function readStored(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredConsent>;
    return {
      decided: !!parsed.decided,
      analytics: !!parsed.analytics,
      ads: !!parsed.ads,
    };
  } catch {
    return null;
  }
}

function persist(c: StoredConsent) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

interface InternalState {
  decided: boolean;
  analytics: boolean;
  ads: boolean;
  hydrated: boolean;
}

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<InternalState>({
    decided: false,
    analytics: false,
    ads: false,
    hydrated: false,
  });

  // Hydrate from localStorage on mount. setState here is intentional and safe.
  useEffect(() => {
    const stored = readStored();
    // hydrating client-only consent from localStorage
    setState({
      decided: stored?.decided ?? false,
      analytics: stored?.analytics ?? false,
      ads: stored?.ads ?? false,
      hydrated: true,
    });
  }, []);

  const setAll = useCallback((accept: boolean) => {
    const next: StoredConsent = { decided: true, analytics: accept, ads: accept };
    persist(next);
    setState((s) => ({ ...s, decided: true, analytics: accept, ads: accept }));
    window.dispatchEvent(new CustomEvent("fileflex:consent", { detail: next }));
  }, []);

  const setFlags = useCallback(
    (partial: Partial<Pick<ConsentFlags, "analytics" | "ads">>) => {
      setState((s) => {
        const next: StoredConsent = {
          decided: true,
          analytics: partial.analytics ?? s.analytics,
          ads: partial.ads ?? s.ads,
        };
        persist(next);
        window.dispatchEvent(new CustomEvent("fileflex:consent", { detail: next }));
        return { ...s, decided: true, ...partial };
      });
    },
    []
  );

  const { decided, analytics, ads, hydrated } = state;
  const choice: ConsentChoice = !hydrated
    ? null
    : !decided
    ? null
    : analytics || ads
    ? "accepted"
    : "declined";

  const value = useMemo<ConsentState>(
    () => ({
      necessary: true,
      analytics,
      ads,
      choice,
      hasDecided: hydrated && decided,
      setAll,
      setFlags,
    }),
    [analytics, ads, hydrated, decided, choice, setAll, setFlags]
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    return {
      necessary: true,
      analytics: false,
      ads: false,
      choice: null as ConsentChoice,
      hasDecided: false,
      setAll: () => {},
      setFlags: () => {},
    } satisfies ConsentState;
  }
  return ctx;
}
