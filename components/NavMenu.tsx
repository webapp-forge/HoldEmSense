"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const trainLinks = [
  { label: "Hand vs Range", href: "/train/equity/hand-vs-range" },
  { label: "Flop: Hand vs Range", href: "/train/equity/hand-vs-range-flop" },
  { label: "Turn: Hand vs Range", href: "/train/equity/hand-vs-range-turn" },
  { label: "River: Hand vs Range", href: "/train/equity/hand-vs-range-river" },
  { label: "Hand vs Range + Pot Odds", href: "/train/equity/hand-vs-range-pot-odds" },
];

type Props = {
  username?: string | null;
  logoutAction: () => Promise<void>;
  streak?: number;
  trainedToday?: boolean;
};

export default function NavMenu({ username, logoutAction, streak = 0, trainedToday = false }: Props) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("nav");

  return (
    <>
      {/* Desktop: user controls only — nav links are in Header */}
      <div className="hidden md:flex items-center gap-5">
        {username ? (
          <>
            <span className="text-gray-400 text-sm flex items-center gap-2">
              <span
                title={streak === 0 ? t("streakStart") : trainedToday ? t("streakDays", { days: streak }) : t("streakKeep")}
                className={`relative inline-flex items-end justify-center w-7 h-9 transition-all duration-700 ${trainedToday ? "" : "grayscale"}`}
              >
                <span className="text-3xl leading-none absolute top-0">🔥</span>
                {streak > 0 && (
                  <span className={`relative z-10 font-black text-base leading-none mb-3 ${trainedToday ? "text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.9),0_0_6px_rgba(0,0,0,0.7)]" : "text-black"}`}>{streak}</span>
                )}
              </span>
              {username}
            </span>
            <form action={logoutAction}>
              <button type="submit" className="hover:text-lime-400 text-sm">{t("logout")}</button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:text-lime-400 text-sm">{t("login")}</Link>
            <Link href="/register" className="hover:text-lime-400 bg-lime-600 px-3 py-1 rounded text-sm">{t("register")}</Link>
          </>
        )}
      </div>

      {/* Mobile burger */}
      <div className="relative md:hidden">
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col justify-center gap-1.5 w-8 h-8 p-1"
          aria-label="Menu"
        >
          <span className={`block h-0.5 bg-white transition-all duration-200 ${open ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`block h-0.5 bg-white transition-all duration-200 ${open ? "opacity-0" : ""}`} />
          <span className={`block h-0.5 bg-white transition-all duration-200 ${open ? "-rotate-45 -translate-y-2" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-10 bg-gray-800 border border-gray-700 rounded-lg shadow-xl w-56 py-2 z-50">
            <Link href="/glossary" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-700">{t("glossary")}</Link>
            <Link href="/hall-of-fame" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-700">{t("hallOfFame")}</Link>
            <div className="border-t border-gray-700 my-1" />
            <span className="block px-4 py-1 text-xs text-gray-400 uppercase tracking-wider">Equity Training</span>
            {trainLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2 text-sm hover:bg-gray-700"
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-700 my-1" />
            <div className="px-4 py-2">
              <LanguageSwitcher />
            </div>
            <div className="border-t border-gray-700 my-1" />
            {username ? (
              <>
                <span className="block px-4 py-2 text-sm text-gray-400 flex items-center gap-2">
                  <span className={`relative inline-flex items-end justify-center w-7 h-8 transition-all duration-700 ${trainedToday ? "" : "grayscale"}`}>
                    <span className="text-3xl leading-none absolute top-0">🔥</span>
                    {streak > 0 && (
                      <span className={`relative z-10 font-black text-[9px] leading-none mb-1 ${trainedToday ? "text-white drop-shadow" : "text-black"}`}>{streak}</span>
                    )}
                  </span>
                  {username}
                </span>
                <form action={logoutAction}>
                  <button type="submit" className="w-full text-left px-4 py-2 text-sm hover:bg-gray-700">
                    {t("logout")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-700">{t("login")}</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-700 text-lime-400">{t("register")}</Link>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}
