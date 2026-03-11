import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCategory, getTerm, getAllTerms } from "@/lib/glossary";
import GlossaryContent from "@/components/glossary/GlossaryContent";
import type { Locale } from "@/lib/glossary/types";

function t(str: { en: string; de: string }, locale: Locale) {
  return locale === "de" ? str.de : str.en;
}

type Props = { params: Promise<{ category: string; slug: string }> };

export async function generateStaticParams() {
  return getAllTerms().map((term) => ({
    category: term.category,
    slug: term.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const term = getTerm(category, slug);
  if (!term) return {};
  return {
    title: `${term.title.en} — Guide — HoldEmSense`,
    description: term.summary.en,
  };
}

export default async function TermPage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  const locale = (await getLocale()) as Locale;
  const term = getTerm(categorySlug, slug);
  const cat = getCategory(categorySlug);
  if (!term || !cat) notFound();

  const allTerms = getAllTerms();
  const relatedTerms = term.relatedSlugs
    ?.map((s) => {
      const [rCat, rSlug] = s.split("/");
      return allTerms.find((t) => t.category === rCat && t.slug === rSlug);
    })
    .filter(Boolean);

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <nav className="text-sm text-gray-500 mb-6 flex flex-wrap gap-1 items-center">
        <Link href="/glossary" className="hover:text-lime-400">
          {locale === "de" ? "Leitfaden" : "Guide"}
        </Link>
        <span className="mx-1">/</span>
        <Link href={`/glossary/${cat.slug}`} className="hover:text-lime-400">
          {t(cat.title, locale)}
        </Link>
        <span className="mx-1">/</span>
        <span className="text-gray-300">{t(term.title, locale)}</span>
      </nav>

      <h1 className="text-3xl font-bold text-white mb-3">{t(term.title, locale)}</h1>
      <p className="text-gray-400 mb-8 text-base leading-relaxed">{t(term.summary, locale)}</p>

      <GlossaryContent blocks={term.blocks} locale={locale} />

      {relatedTerms && relatedTerms.length > 0 && (
        <div className="mt-10 pt-6 border-t border-gray-800">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">
            {locale === "de" ? "Verwandte Begriffe" : "Related terms"}
          </h3>
          <div className="flex flex-wrap gap-2">
            {relatedTerms.map(
              (rt) =>
                rt && (
                  <Link
                    key={rt.slug}
                    href={`/glossary/${rt.category}/${rt.slug}`}
                    className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300 transition-colors"
                  >
                    {t(rt.title, locale)}
                  </Link>
                )
            )}
          </div>
        </div>
      )}
    </main>
  );
}
