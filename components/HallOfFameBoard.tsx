"use client";

import { useState } from "react";
import { getHallOfFameMonth, getHallOfFameAllTime, LeaderboardEntry } from "@/lib/actions/hallOfFame";

type View = "month" | "alltime";

type Props = {
  initialView: View;
  initialEntries: LeaderboardEntry[];
  currentMonth: { year: number; month: number; label: string };
  currentUsername?: string | null;
};

const RANK_CROWN: Record<number, string> = {
  1: "👑",
  2: "🥈",
  3: "🥉",
};

const RANK_ROW_CLASS: Record<number, string> = {
  1: "bg-amber-950 border border-amber-700",
  2: "bg-gray-800 border border-gray-600",
  3: "bg-orange-950 border border-orange-800",
};

export default function HallOfFameBoard({ initialView, initialEntries, currentMonth, currentUsername }: Props) {
  const [view, setView] = useState<View>(initialView);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);

  async function switchView(next: View) {
    if (next === view) return;
    setView(next);
    setLoading(true);
    const data = next === "month"
      ? await getHallOfFameMonth(currentMonth.year, currentMonth.month)
      : await getHallOfFameAllTime();
    setEntries(data);
    setLoading(false);
  }

  const emptyLabel = view === "month" ? "No hands played this month yet." : "No hands played yet.";

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <span className="text-amber-400">🏆</span>
          Hall of Fame
        </h1>
      </div>

      {/* View toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => switchView("month")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            view === "month" ? "bg-lime-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          {currentMonth.label}
        </button>
        <button
          onClick={() => switchView("alltime")}
          className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${
            view === "alltime" ? "bg-lime-600 text-white" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
          }`}
        >
          All-Time
        </button>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : entries.length === 0 ? (
        <div className="text-gray-500">{emptyLabel}</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[2.5rem_1fr_auto_auto] gap-3 px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>Player</span>
            <span className="text-right">Hands</span>
            <span className="text-right w-20">Score*</span>
          </div>

          {entries.map((entry) => {
            const isCurrentUser = entry.username === currentUsername;
            const isTop3 = entry.rank <= 3;
            const crown = RANK_CROWN[entry.rank];
            const rowClass = isCurrentUser
              ? "bg-lime-900 border border-lime-700"
              : isTop3
              ? RANK_ROW_CLASS[entry.rank]
              : "bg-gray-900";

            return (
              <div
                key={entry.rank}
                className={`grid grid-cols-[2.5rem_1fr_auto_auto] gap-3 items-center px-3 rounded ${
                  isTop3 ? "py-3" : "py-2.5"
                } ${rowClass}`}
              >
                <span className={`font-bold text-center flex items-center justify-center gap-1 ${isTop3 ? "text-lg" : "text-sm text-gray-500"}`}>
                  <span>{entry.rank}</span>
                  {crown && <span>{crown}</span>}
                </span>
                <span className={`font-medium ${isTop3 ? "text-base" : "text-sm"} ${isCurrentUser ? "text-lime-300" : "text-white"}`}>
                  {entry.username}
                  {isCurrentUser && <span className="ml-2 text-xs text-lime-500">(you)</span>}
                </span>
                <span className="text-sm text-gray-400 text-right">{entry.handsPlayed}</span>
                <span className={`font-semibold text-right w-20 ${isTop3 ? "text-base text-white" : "text-sm text-gray-200"}`}>
                  {entry.score}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footnote */}
      <p className="text-xs text-gray-600 mt-1">
        * Score = hands played &times; difficulty weight &mdash; Beginner ×1, Intermediate ×1.5, Advanced ×2, Pro ×2.5
      </p>
    </div>
  );
}
