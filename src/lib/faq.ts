"use client";

import { useI18n } from "@/lib/i18n";

export interface FaqItem {
  question: string;
  answer: string;
}

/** Returns FAQ items translated via i18n. Must be called inside a client component. */
export function useFaqs(): FaqItem[] {
  const { t } = useI18n();
  return [
    { question: t("faq.q1"), answer: t("faq.a1") },
    { question: t("faq.q2"), answer: t("faq.a2") },
    { question: t("faq.q3"), answer: t("faq.a3") },
    { question: t("faq.q4"), answer: t("faq.a4") },
    { question: t("faq.q5"), answer: t("faq.a5") },
    { question: t("faq.q6"), answer: t("faq.a6") },
    { question: t("faq.q7"), answer: t("faq.a7") },
  ];
}
