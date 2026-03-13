"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { getHallOfFameMonth, getHallOfFameAllTime, LeaderboardEntry, ChipData } from "@/lib/actions/hallOfFame";
import PokerChip from "@/components/PokerChip";

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

const STACK_SIZE = 5;

const POPUP_CHIP = 36;
const POPUP_STEP = 16; // visible px per chip in popup stack


function buildStacks(chips: ChipData[]): ChipData[][] {
  const stacks: ChipData[][] = [];
  for (let i = 0; i < chips.length; i += STACK_SIZE) {
    stacks.push(chips.slice(i, i + STACK_SIZE));
  }
  return stacks;
}

function Stack({ stack, chipSize, step }: { stack: ChipData[]; chipSize: number; step: number }) {
  const height = chipSize + (stack.length - 1) * step;
  return (
    <div className="relative shrink-0" style={{ height, width: chipSize }}>
      {stack.map((chip, ci) => (
        <div key={ci} className="absolute" style={{ top: ci * step, zIndex: stack.length - ci }}>
          <PokerChip color={chip.color as any} value={chip.value as any} size={chipSize} />
        </div>
      ))}
    </div>
  );
}

function ChipStack({ chips, isOpen, onMouseEnter, onMouseLeave }: {
  chips: ChipData[];
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  if (chips.length === 0) return <div className="w-16" />;

  const stacks = buildStacks(chips);
  const totalValue = chips.reduce((sum, c) => sum + c.value, 0);

  return (
    <div className="relative w-16 text-right" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
      <span className="text-sm text-gray-300 font-medium cursor-default">{totalValue}</span>

      {/* Popup: full-size vertical stacks */}
      <div className={`absolute bottom-full right-0 mb-2 gap-2 bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl z-50 ${isOpen ? "flex" : "hidden"}`}>
        {stacks.map((stack, si) => (
          <Stack key={si} stack={stack} chipSize={POPUP_CHIP} step={POPUP_STEP} />
        ))}
      </div>
    </div>
  );
}

export default function HallOfFameBoard({ initialView, initialEntries, currentMonth, currentUsername }: Props) {
  const t = useTranslations("hallOfFame");
  const [view, setView] = useState<View>(initialView);
  const [entries, setEntries] = useState<LeaderboardEntry[]>(initialEntries);
  const [loading, setLoading] = useState(false);
  const [chipPopupRank, setChipPopupRank] = useState<number | null>(null);

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

  const emptyLabel = view === "month" ? t("emptyMonth") : t("emptyAllTime");

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
          <span className="text-amber-400">🏆</span>
          {t("title")}
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
          {t("allTime")}
        </button>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-gray-400">{t("loading")}</div>
      ) : entries.length === 0 ? (
        <div className="text-gray-500">{emptyLabel}</div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_5rem] gap-3 px-3 py-1 text-xs text-gray-500 uppercase tracking-wider">
            <span>#</span>
            <span>{t("colPlayer")}</span>
            <span className="text-right">{t("colChips")}</span>
            <span className="text-right">{t("colHands")}</span>
            <span className="text-right">{t("colScore")}</span>
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
                className={`grid grid-cols-[2.5rem_1fr_4rem_4rem_5rem] gap-3 items-center px-3 rounded ${
                  isTop3 ? "py-3" : "py-2.5"
                } ${rowClass}`}
              >
                <span className={`font-bold text-center flex items-center justify-center gap-1 ${isTop3 ? "text-lg" : "text-sm text-gray-500"}`}>
                  <span>{entry.rank}</span>
                  {crown && <span>{crown}</span>}
                </span>
                <span
                  className={`font-medium ${isTop3 ? "text-base" : "text-sm"} ${isCurrentUser ? "text-lime-300" : "text-white"} ${entry.chips.length > 0 ? "cursor-default" : ""}`}
                  onMouseEnter={() => entry.chips.length > 0 && setChipPopupRank(entry.rank)}
                  onMouseLeave={() => setChipPopupRank(null)}
                >
                  {entry.username}
                  {isCurrentUser && <span className="ml-2 text-xs text-lime-500">({t("you")})</span>}
                </span>
                <ChipStack
                  chips={entry.chips}
                  isOpen={chipPopupRank === entry.rank}
                  onMouseEnter={() => setChipPopupRank(entry.rank)}
                  onMouseLeave={() => setChipPopupRank(null)}
                />
                <span className="text-sm text-gray-400 text-right">{entry.handsPlayed}</span>
                <span className={`font-semibold text-right ${isTop3 ? "text-base text-white" : "text-sm text-gray-200"}`}>
                  {entry.score}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Footnote */}
      <p className="text-xs text-gray-600 mt-1">
        {t("footnote")}
      </p>
    </div>
  );
}
