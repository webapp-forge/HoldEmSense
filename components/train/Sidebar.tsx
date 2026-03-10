"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const equityLinks = [
  { key: "handVsRange", href: "/train/equity/hand-vs-range" },
  { key: "flopHandVsRange", href: "/train/equity/hand-vs-range-flop" },
  { key: "turnHandVsRange", href: "/train/equity/hand-vs-range-turn" },
  { key: "riverHandVsRange", href: "/train/equity/hand-vs-range-river" },
  { key: "handVsRangePotOdds", href: "/train/equity/hand-vs-range-pot-odds" },
];

const leakLinks = [
  { key: "equityLeaks", href: "/train/leak-fixing/equity" },
];

export default function TrainSidebar() {
  const pathname = usePathname();
  const t = useTranslations("sidebar");

  return (
    <aside className="hidden md:block bg-gray-900 text-white md:w-64 md:min-h-screen">
      <nav className="flex flex-row md:flex-col gap-1 p-3 md:p-4 overflow-x-auto">
        <span className="hidden md:block text-xs text-gray-400 uppercase tracking-wider mb-2">
          {t("equityTraining")}
        </span>
        {equityLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap px-3 py-2 rounded text-sm ${
              pathname === link.href
                ? "bg-lime-600 text-white font-semibold"
                : "hover:bg-gray-700"
            }`}
          >
            {t(link.key as Parameters<typeof t>[0])}
          </a>
        ))}
        <span className="hidden md:block text-xs text-gray-400 uppercase tracking-wider mb-2 mt-6">
          {t("weaknessTraining")}
        </span>
        {leakLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap px-3 py-2 rounded text-sm ${
              pathname === link.href
                ? "bg-lime-600 text-white font-semibold"
                : "hover:bg-gray-700"
            }`}
          >
            {t(link.key as Parameters<typeof t>[0])}
          </a>
        ))}
      </nav>
    </aside>
  );
}
