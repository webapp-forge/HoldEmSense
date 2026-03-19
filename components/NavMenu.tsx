"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getOpenLeakCount } from "@/lib/actions/training";
import { useEffect } from "react";

type Props = {
  username?: string | null;
  logoutAction: () => Promise<void>;
  streak?: number;
  trainedToday?: boolean;
  isPremium?: boolean;
  leakCount?: number;
};

export default function NavMenu({
  username,
  logoutAction,
  streak = 0,
  trainedToday = false,
  isPremium = false,
  leakCount: initialLeakCount = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [leakCount, setLeakCount] = useState(initialLeakCount);
  const t = useTranslations("nav");
  const pathname = usePathname();

  useEffect(() => {
    if (!isPremium) return;
    const refresh = () => getOpenLeakCount().then(setLeakCount);
    window.addEventListener("leak-processed", refresh);
    return () => window.removeEventListener("leak-processed", refresh);
  }, [isPremium]);

  return (
    <>
      {/* Desktop: user controls only — nav links are in Header */}
      <div className="hidden md:flex items-center gap-5">
        {username ? (
          <>
            <Link href="/account" className="text-gray-400 hover:text-white text-sm flex items-center gap-2">
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
            </Link>
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
            <Link href="/train" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-700">{t("train")}</Link>
            <Link href="/glossary" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-700">{t("glossary")}</Link>
            <Link href="/hall-of-fame" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm hover:bg-gray-700">{t("hallOfFame")}</Link>

            {isPremium && (
              <>
                <div className="border-t border-gray-700 my-1" />
                <Link
                  href="/train/leak-fixing/equity"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-700"
                >
                  {t("leakTraining")}
                  {leakCount > 0 && (
                    <span className="min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                      {leakCount}
                    </span>
                  )}
                </Link>
              </>
            )}

            {!username && (
              <>
                <div className="border-t border-gray-700 my-1" />
                <div className="px-4 py-2">
                  <LanguageSwitcher />
                </div>
              </>
            )}
            <div className="border-t border-gray-700 my-1" />
            {username ? (
              <>
                <Link href="/account" onClick={() => setOpen(false)} className="block px-4 py-2 text-sm text-gray-400 hover:text-white flex items-center gap-2">
                  <span className={`relative inline-flex items-end justify-center w-7 h-8 transition-all duration-700 ${trainedToday ? "" : "grayscale"}`}>
                    <span className="text-3xl leading-none absolute top-0">🔥</span>
                    {streak > 0 && (
                      <span className={`relative z-10 font-black text-[9px] leading-none mb-1 ${trainedToday ? "text-white drop-shadow" : "text-black"}`}>{streak}</span>
                    )}
                  </span>
                  {username}
                </Link>
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
