"use client";

import { useTranslations } from "next-intl";

type Role = "guest" | "registered" | "premium";

const LEVEL_BADGE: Record<number, "REG" | "PRO" | null> = {
  1: null,
  2: "REG",
  3: "PRO",
  4: "PRO",
};

export default function DifficultySelector({
  difficulty,
  unlockedDifficulties,
  role = "guest",
  onChange,
}: {
  difficulty: number;
  unlockedDifficulties: number[];
  role?: Role;
  onChange: (level: number) => void;
}) {
  const td = useTranslations("difficulty");

  return (
    <div className="flex flex-wrap items-center gap-2">
      {[1, 2, 3, 4].map((level) => {
        const isUnlocked = unlockedDifficulties.includes(level);
        const badge = LEVEL_BADGE[level];
        const showBadge =
          !isUnlocked &&
          badge !== null &&
          ((badge === "REG" && role === "guest") ||
            (badge === "PRO" && (role === "guest" || role === "registered")));

        return (
          <button
            key={level}
            onClick={() => {
              if (!isUnlocked || level === difficulty) return;
              onChange(level);
            }}
            title={!isUnlocked ? td("locked") : ""}
            className={`flex items-center justify-center gap-1.5 min-w-[9rem] px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              difficulty === level
                ? "bg-lime-600 text-white"
                : isUnlocked
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            {!isUnlocked && (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 10V7a6 6 0 0 0-12 0v3H4v14h16V10h-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4-9H8V7a4 4 0 0 1 8 0v3z" />
              </svg>
            )}
            {td(String(level) as Parameters<typeof td>[0])}
            {showBadge && (
              <span
                className={`px-1 py-0.5 rounded text-[10px] font-bold ${
                  badge === "PRO"
                    ? "bg-amber-700 text-amber-100"
                    : "bg-lime-700 text-lime-100"
                }`}
              >
                {badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
