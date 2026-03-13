"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { setLocale } from "../lib/actions/locale";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
];

export default function LanguageSwitcher() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    startTransition(async () => {
      await setLocale(e.target.value);
    });
  }

  return (
    <select
      value={locale}
      onChange={handleChange}
      disabled={isPending}
      className="bg-gray-800 text-gray-300 text-sm rounded px-2 py-1 border border-gray-700 hover:border-gray-500 focus:outline-none focus:border-lime-500 cursor-pointer disabled:opacity-50 transition-colors"
    >
      {LANGUAGES.map(({ code, label }) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
