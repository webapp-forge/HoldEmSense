"use client";

import { getRangeForPercent } from "@/lib/range";

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];

function cellKey(row: number, col: number): string {
  if (row === col) return RANKS[row] + RANKS[row];
  if (row < col) return RANKS[row] + RANKS[col] + "s"; // suited: upper right
  return RANKS[col] + RANKS[row] + "o";                // offsuit: lower left
}

function heroHandKey(cards: { rank: string; suit: string }[]): string | null {
  if (cards.length !== 2) return null;
  const [c1, c2] = cards;
  if (c1.rank === c2.rank) return c1.rank + c2.rank;
  const ranks = "23456789TJQKA";
  const i1 = ranks.indexOf(c1.rank);
  const i2 = ranks.indexOf(c2.rank);
  const high = i1 > i2 ? c1.rank : c2.rank;
  const low  = i1 > i2 ? c2.rank : c1.rank;
  return c1.suit === c2.suit ? high + low + "s" : high + low + "o";
}

type Props = {
  villainRange: number;
  heroCards?: { rank: string; suit: string }[];
};

const CELL = "1.65rem";
const GAP  = "2px";
const FONT = "0.62rem";

export default function RangeMatrix({ villainRange, heroCards }: Props) {
  const rangeSet = new Set(getRangeForPercent(villainRange));
  const heroKey  = heroCards ? heroHandKey(heroCards) : null;

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">
        Villain Range: Top {villainRange}%
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(13, ${CELL})`,
          gap: GAP,
        }}
      >
        {RANKS.flatMap((_, row) =>
          RANKS.map((_, col) => {
            const key      = cellKey(row, col);
            const inRange  = rangeSet.has(key);
            const isHero   = key === heroKey;
            const isPair   = row === col;
            const isSuited = row < col;

            let bg: string;
            if (isHero)       bg = "bg-lime-400";
            else if (inRange) bg = isPair ? "bg-blue-500" : isSuited ? "bg-blue-700" : "bg-blue-900";
            else              bg = "bg-gray-800";

            const textColor = isHero ? "text-gray-900" : inRange ? "text-blue-200" : "text-gray-600";
            return (
              <div
                key={key}
                className={`${bg} ${textColor} rounded-sm flex items-center justify-center`}
                style={{ width: CELL, height: CELL, fontSize: FONT, fontWeight: 600, letterSpacing: "-0.02em" }}
              >
                {key}
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-3 mt-3 flex-wrap">
        <span className="flex items-center gap-1.5 text-gray-400 text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-500" /> Pairs
        </span>
        <span className="flex items-center gap-1.5 text-gray-400 text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-700" /> Suited
        </span>
        <span className="flex items-center gap-1.5 text-gray-400 text-xs">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-900" /> Offsuit
        </span>
        {heroKey && (
          <span className="flex items-center gap-1.5 text-gray-400 text-xs">
            <span className="inline-block w-2.5 h-2.5 rounded-sm bg-lime-400" /> Your hand ({heroKey})
          </span>
        )}
      </div>
    </div>
  );
}
