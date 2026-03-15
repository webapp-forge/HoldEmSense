import { auth } from "../../../lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "../../../lib/prisma";
import { HAND_RANKINGS, getRangeForPercent } from "../../../lib/range";
import Link from "next/link";
import React from "react";

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const TOP_OPTIONS = [10, 15, 20, 25, 30, 40, 50, 100];

function handKey(r1: string, r2: string, ri: number, ci: number): string {
  if (ri === ci) return r1 + r2; // pair
  if (ri < ci) return r1 + r2 + "s"; // upper triangle = suited (r1 is higher rank)
  return r2 + r1 + "o"; // lower triangle = offsuit (r2 is higher rank, swap)
}

// Equity → hsl color: 30% = red, 50% = yellow, 70%+ = green
function equityColor(equity: number): string {
  const pct = Math.max(0.25, Math.min(0.75, equity));
  const t = (pct - 0.25) / 0.5; // 0..1
  const hue = Math.round(t * 120); // 0=red, 120=green
  return `hsl(${hue}, 70%, 18%)`;
}

export default async function MatrixPage({
  searchParams,
}: {
  searchParams: Promise<{ top?: string }>;
}) {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) return notFound();

  const { top } = await searchParams;
  const topPct = Number(top ?? 40);

  const [rows, rangeHands] = await Promise.all([
    prisma.handEquityMatrix.findMany(),
    Promise.resolve(getRangeForPercent(topPct)),
  ]);

  const equityMap = new Map(rows.map((r) => [r.handType, r.equity]));
  const rangeSet = new Set(rangeHands);

  const totalRows = rows.length;
  const minEq = Math.min(...rows.map((r) => r.equity));
  const maxEq = Math.max(...rows.map((r) => r.equity));
  const avgEq = rows.reduce((s, r) => s + r.equity, 0) / totalRows;

  return (
    <main className="px-4 py-8 max-w-[900px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Hand Equity Matrix</h1>
          <p className="text-gray-500 text-xs mt-1">
            Equity vs. random villain (100% range, 200k sims) · {totalRows} / 169 hands computed
          </p>
          {totalRows > 0 && (
            <p className="text-gray-500 text-xs">
              Range: {(minEq * 100).toFixed(1)}% – {(maxEq * 100).toFixed(1)}% · Avg: {(avgEq * 100).toFixed(1)}%
            </p>
          )}
        </div>
        <Link href="/supervillain" className="text-xs text-gray-500 hover:text-gray-300">
          ← Supervillain HQ
        </Link>
      </div>

      {/* Top-X selector */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TOP_OPTIONS.map((pct) => (
          <Link
            key={pct}
            href={`?top=${pct}`}
            className={`px-3 py-1 rounded text-sm font-mono ${
              topPct === pct
                ? "bg-lime-700 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            Top {pct}%
          </Link>
        ))}
        <span className="text-xs text-gray-600 self-center ml-2">
          {rangeHands.length} hand types · {rangeHands.reduce((s, h) => {
            if (h.length === 2) return s + 6;
            if (h.endsWith("s")) return s + 4;
            return s + 12;
          }, 0)} combos
        </span>
      </div>

      {totalRows === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center text-gray-500">
          Noch keine Daten. Script ausführen:{" "}
          <code className="text-lime-400">npx tsx scripts/generate-hand-matrix.ts</code>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Column headers */}
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: `24px repeat(13, minmax(0, 1fr))` }}>
            <div />
            {RANKS.map((r) => (
              <div key={r} className="text-center text-xs text-gray-500 pb-1 font-mono">{r}</div>
            ))}

            {RANKS.map((r1, ri) => (
              <React.Fragment key={r1}>
                {/* Row header */}
                <div className="flex items-center justify-center text-xs text-gray-500 font-mono">{r1}</div>

                {RANKS.map((r2, ci) => {
                  const hand = handKey(r1, r2, ri, ci);
                  const equity = equityMap.get(hand);
                  const inRange = rangeSet.has(hand);
                  const bg = equity != null ? equityColor(equity) : "#111";

                  return (
                    <div
                      key={`${ri}-${ci}`}
                      title={`${hand}: ${equity != null ? (equity * 100).toFixed(2) + "%" : "n/a"}`}
                      style={{ backgroundColor: bg }}
                      className={`rounded-sm p-[2px] text-center transition-all ${
                        inRange
                          ? "ring-1 ring-lime-400 ring-inset"
                          : ""
                      }`}
                    >
                      <div className={`text-[9px] font-bold leading-tight font-mono ${inRange ? "text-lime-300" : "text-gray-400"}`}>
                        {hand}
                      </div>
                      {equity != null ? (
                        <div className={`text-[8px] leading-tight ${inRange ? "text-lime-200" : "text-gray-500"}`}>
                          {(equity * 100).toFixed(1)}%
                        </div>
                      ) : (
                        <div className="text-[8px] text-gray-700">—</div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 flex gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm ring-1 ring-lime-400 bg-[hsl(80,70%,18%)]" />
          <span>In Top {topPct}% range</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-[hsl(0,70%,18%)]" />
          <span>Low equity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-sm bg-[hsl(120,70%,18%)]" />
          <span>High equity</span>
        </div>
        <div className="ml-auto font-mono">Upper-right = suited · lower-left = offsuit · diagonal = pairs</div>
      </div>
    </main>
  );
}
