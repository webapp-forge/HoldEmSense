"use client";

import { useLocale } from "next-intl";
import { setLocale } from "../lib/actions/locale";

export default function LanguageSwitcher() {
  const locale = useLocale();

  return (
    <div className="flex items-center gap-1 text-sm">
      <button
        onClick={() => setLocale("en")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "en" ? "text-lime-400 font-medium" : "text-gray-400 hover:text-white"
        }`}
      >
        EN
      </button>
      <span className="text-gray-600">|</span>
      <button
        onClick={() => setLocale("de")}
        className={`px-1.5 py-0.5 rounded transition-colors ${
          locale === "de" ? "text-lime-400 font-medium" : "text-gray-400 hover:text-white"
        }`}
      >
        DE
      </button>
    </div>
  );
}
