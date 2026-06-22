export interface Language {
  code: string;
  english: string;
  native: string;
  dir: "ltr" | "rtl";
}

/** The ONLY supported languages. No auto-translate, no Beta. */
export const languages: Language[] = [
  { code: "en", english: "English", native: "English", dir: "ltr" },
  { code: "ar", english: "Arabic", native: "العربية", dir: "rtl" },
  { code: "fr", english: "French", native: "Français", dir: "ltr" },
  { code: "es", english: "Spanish", native: "Español", dir: "ltr" },
  { code: "it", english: "Italian", native: "Italiano", dir: "ltr" },
];

export const DEFAULT_LOCALE = "en";

export function getLanguage(code: string): Language {
  return languages.find((l) => l.code === code) ?? languages[0];
}
