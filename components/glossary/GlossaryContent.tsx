import type { ContentBlock, Locale } from "@/lib/glossary/types";

function t(str: { en: string; de: string }, locale: Locale) {
  return locale === "de" ? str.de : str.en;
}

export default function GlossaryContent({
  blocks,
  locale,
}: {
  blocks: ContentBlock[];
  locale: Locale;
}) {
  return (
    <div className="flex flex-col gap-4 text-sm text-gray-300 leading-relaxed">
      {blocks.map((block, i) => {
        if (block.type === "paragraph") {
          return <p key={i}>{t(block.text, locale)}</p>;
        }
        if (block.type === "heading") {
          const Tag = block.level === 2 ? "h2" : "h3";
          return (
            <Tag key={i} className="text-white font-semibold text-base mt-2">
              {t(block.text, locale)}
            </Tag>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc list-inside flex flex-col gap-1">
              {block.items.map((item, j) => (
                <li key={j}>{t(item, locale)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "example") {
          return (
            <div key={i} className="bg-gray-800 border border-gray-700 rounded p-3 flex flex-col gap-1">
              <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                {t(block.label, locale)}
              </span>
              <p>{t(block.text, locale)}</p>
            </div>
          );
        }
        if (block.type === "tip") {
          return (
            <div key={i} className="border-l-2 border-lime-600 pl-3 text-gray-400 italic">
              {t(block.text, locale)}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
}
