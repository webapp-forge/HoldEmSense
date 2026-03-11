export type Locale = "en" | "de";

export type LocaleString = {
  en: string;
  de: string;
};

export type ContentBlock =
  | { type: "paragraph"; text: LocaleString }
  | { type: "heading"; level: 2 | 3; text: LocaleString }
  | { type: "list"; items: LocaleString[] }
  | { type: "example"; label: LocaleString; text: LocaleString }
  | { type: "tip"; text: LocaleString };

export type GlossaryTerm = {
  slug: string;
  category: string;
  title: LocaleString;
  summary: LocaleString;
  blocks: ContentBlock[];
  relatedSlugs?: string[];
};

export type GlossarySection = "poker" | "app";

export type GlossaryCategory = {
  slug: string;
  section: GlossarySection;
  title: LocaleString;
  description: LocaleString;
  terms: GlossaryTerm[];
};
