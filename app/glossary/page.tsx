import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { categories } from "@/lib/glossary";
import type { Locale } from "@/lib/glossary/types";

export const metadata: Metadata = {
  title: "Leitfaden — HoldEmSense",
  description: "Poker concepts explained: equity, pot odds, hand ranges, and how HoldEmSense works.",
};

function t(str: { en: string; de: string }, locale: Locale) {
  return locale === "de" ? str.de : str.en;
}

export default async function GuidePage() {
  const locale = (await getLocale()) as Locale;

  const pokerCats = categories.filter((c) => c.section === "poker");
  const appCats = categories.filter((c) => c.section === "app");

  const sectionLabel = {
    poker: { de: "Poker-Konzepte", en: "Poker Concepts" },
    app: { de: "HoldEmSense", en: "HoldEmSense" },
  };

  function renderSection(cats: typeof categories, section: "poker" | "app") {
    return (
      <div className="mb-12">
        <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-4">
          {locale === "de" ? sectionLabel[section].de : sectionLabel[section].en}
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {cats.map((cat) => (
            <div key={cat.slug} className="bg-gray-900 rounded-lg border border-gray-800 p-5">
              <Link href={`/glossary/${cat.slug}`} className="hover:text-lime-400 transition-colors">
                <h3 className="text-lg font-semibold text-white mb-1">{t(cat.title, locale)}</h3>
              </Link>
              <p className="text-sm text-gray-400 mb-4">{t(cat.description, locale)}</p>
              <ul className="flex flex-col gap-1">
                {cat.terms.map((term) => (
                  <li key={term.slug}>
                    <Link
                      href={`/glossary/${cat.slug}/${term.slug}`}
                      className="text-sm text-gray-300 hover:text-lime-400 transition-colors"
                    >
                      {t(term.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">
        {locale === "de" ? "Leitfaden" : "Guide"}
      </h1>
      <p className="text-gray-400 mb-10">
        {locale === "de"
          ? "Poker-Konzepte und HoldEmSense erklärt."
          : "Poker concepts and HoldEmSense explained."}
      </p>

      {renderSection(pokerCats, "poker")}
      {renderSection(appCats, "app")}
    </main>
  );
}
