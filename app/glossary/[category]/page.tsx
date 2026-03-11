import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCategory } from "@/lib/glossary";
import type { Locale } from "@/lib/glossary/types";

function t(str: { en: string; de: string }, locale: Locale) {
  return locale === "de" ? str.de : str.en;
}

type Props = { params: Promise<{ category: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: slug } = await params;
  const cat = getCategory(slug);
  if (!cat) return {};
  return {
    title: `${cat.title.en} — Guide — HoldEmSense`,
    description: cat.description.en,
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category: slug } = await params;
  const locale = (await getLocale()) as Locale;
  const cat = getCategory(slug);
  if (!cat) notFound();

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/glossary" className="hover:text-lime-400">
          {locale === "de" ? "Leitfaden" : "Guide"}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-300">{t(cat.title, locale)}</span>
      </nav>

      <h1 className="text-3xl font-bold text-white mb-2">{t(cat.title, locale)}</h1>
      <p className="text-gray-400 mb-10">{t(cat.description, locale)}</p>

      <div className="flex flex-col gap-4">
        {cat.terms.map((term) => (
          <Link
            key={term.slug}
            href={`/glossary/${cat.slug}/${term.slug}`}
            className="block bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-600 transition-colors"
          >
            <h2 className="text-base font-semibold text-white mb-1">{t(term.title, locale)}</h2>
            <p className="text-sm text-gray-400">{t(term.summary, locale)}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
