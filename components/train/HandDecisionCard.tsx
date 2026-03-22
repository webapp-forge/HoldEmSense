"use client";

import Card from "../Card";
import { useTranslations } from "next-intl";

type Props = {
  handType: string;
  cards: [{ rank: string; suit: string }, { rank: string; suit: string }];
  selected: boolean;
  revealed: boolean;
  isCorrectPlay: boolean;
  fourColor: boolean;
  onToggle: () => void;
};

export default function HandDecisionCard({
  handType,
  cards,
  selected,
  revealed,
  isCorrectPlay,
  fourColor,
  onToggle,
}: Props) {
  const t = useTranslations("rangeTraining");

  const userCorrect = revealed && selected === isCorrectPlay;

  let borderClass = "border-gray-700";
  if (revealed) {
    borderClass = userCorrect ? "border-lime-500" : "border-red-500";
  } else if (selected) {
    borderClass = "border-lime-400";
  }

  let bgClass = "bg-gray-900";
  if (revealed) {
    bgClass = userCorrect ? "bg-lime-900/20" : "bg-red-900/20";
  } else if (selected) {
    bgClass = "bg-gray-800";
  }

  return (
    <button
      type="button"
      onClick={revealed ? undefined : onToggle}
      disabled={revealed}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${borderClass} ${bgClass} ${
        revealed ? "cursor-default" : "cursor-pointer hover:border-lime-300"
      }`}
    >
      {/* Cards */}
      <div className="flex gap-1">
        <Card rank={cards[0].rank} suit={cards[0].suit} fourColor={fourColor} size="lg" />
        <Card rank={cards[1].rank} suit={cards[1].suit} fourColor={fourColor} size="lg" />
      </div>

      {/* Hand type label */}
      <span className="text-xs text-gray-400 font-mono">{handType}</span>

      {/* Play/Fold indicator */}
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded ${
          revealed
            ? isCorrectPlay
              ? "bg-lime-800 text-lime-300"
              : "bg-gray-700 text-gray-400"
            : selected
            ? "bg-lime-600 text-white"
            : "bg-gray-700 text-gray-400"
        }`}
      >
        {revealed
          ? isCorrectPlay
            ? t("shouldPlay")
            : t("shouldFold")
          : selected
          ? t("play")
          : t("fold")}
      </span>

      {/* Correct/Wrong badge after reveal */}
      {revealed && (
        <div
          className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            userCorrect ? "bg-lime-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {userCorrect ? "✓" : "✗"}
        </div>
      )}
    </button>
  );
}
