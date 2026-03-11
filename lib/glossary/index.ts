import equity from "./terms/equity";
import potOdds from "./terms/pot-odds";
import ranges from "./terms/ranges";
import app from "./terms/app";
import type { GlossaryCategory, GlossaryTerm } from "./types";

export const categories: GlossaryCategory[] = [equity, potOdds, ranges, app];

export function getCategory(slug: string): GlossaryCategory | undefined {
  return categories.find((c) => c.slug === slug);
}

export function getTerm(categorySlug: string, termSlug: string): GlossaryTerm | undefined {
  return getCategory(categorySlug)?.terms.find((t) => t.slug === termSlug);
}

export function getTermByFullSlug(fullSlug: string): GlossaryTerm | undefined {
  const [cat, slug] = fullSlug.split("/");
  return getTerm(cat, slug);
}

export function getAllTerms(): GlossaryTerm[] {
  return categories.flatMap((c) => c.terms);
}
