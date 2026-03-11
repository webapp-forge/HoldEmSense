"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getTermByFullSlug } from "@/lib/glossary";
import GlossaryContent from "./GlossaryContent";
import type { GlossaryTerm, Locale } from "@/lib/glossary/types";

function tl(str: { en: string; de: string }, locale: Locale) {
  return locale === "de" ? str.de : str.en;
}

export default function GlossaryDrawer() {
  const [term, setTerm] = useState<GlossaryTerm | null>(null);
  const locale = useLocale() as Locale;
  const t = useTranslations("glossary");

  useEffect(() => {
    function onOpen(e: Event) {
      const slug = (e as CustomEvent<{ slug: string }>).detail.slug;
      const found = getTermByFullSlug(slug);
      if (found) setTerm(found);
    }
    window.addEventListener("open-glossary", onOpen);
    return () => window.removeEventListener("open-glossary", onOpen);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setTerm(null);
    }
    if (term) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [term]);

  if (!term) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setTerm(null)}
        aria-hidden
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-gray-950 border-l border-gray-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-gray-800">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {t("drawerLabel")}
            </p>
            <h2 className="text-lg font-bold text-white">{tl(term.title, locale)}</h2>
          </div>
          <button
            onClick={() => setTerm(null)}
            className="text-gray-500 hover:text-white mt-1 ml-4 text-xl leading-none"
            aria-label={t("close")}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <p className="text-gray-400 text-sm leading-relaxed">{tl(term.summary, locale)}</p>
          <GlossaryContent blocks={term.blocks} locale={locale} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Link
            href={`/glossary/${term.category}/${term.slug}`}
            onClick={() => setTerm(null)}
            className="text-sm text-lime-400 hover:text-lime-300 transition-colors"
          >
            {t("openArticle")} →
          </Link>
        </div>
      </div>
    </>
  );
}
