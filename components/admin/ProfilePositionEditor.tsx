"use client";

import React, { useState, useTransition } from "react";
import { saveProfilePosition } from "@/lib/actions/villainProfiles";

const RANKS = ["A", "K", "Q", "J", "T", "9", "8", "7", "6", "5", "4", "3", "2"];
const PRESET_PERCENTS = [5, 8, 10, 12, 15, 20, 25, 30, 40, 50];

function handKey(r1: string, r2: string, ri: number, ci: number): string {
  if (ri === ci) return r1 + r2;
  if (ri < ci) return r1 + r2 + "s";
  return r2 + r1 + "o";
}

function comboCount(hands: string[]): number {
  return hands.reduce((s, h) => {
    if (h.length === 2) return s + 6;
    if (h.endsWith("s")) return s + 4;
    return s + 12;
  }, 0);
}

// Inline top-X% calculation — avoids server-only import issues
function getTopPercent(pct: number, rankings: string[]): string[] {
  const target = Math.round((pct / 100) * 1326);
  let count = 0;
  const result: string[] = [];
  for (const hand of rankings) {
    if (count >= target) break;
    result.push(hand);
    if (hand.length === 2) count += 6;
    else if (hand.endsWith("s")) count += 4;
    else count += 12;
  }
  return result;
}

interface Props {
  profileId: string;
  position: number;
  initialHands: string[];
  handRankings: string[];
}

export function ProfilePositionEditor({
  profileId,
  position,
  initialHands,
  handRankings,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialHands));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggleHand(hand: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(hand)) next.delete(hand);
      else next.add(hand);
      return next;
    });
    setSaved(false);
  }

  function applyPreset(pct: number) {
    setSelected(new Set(getTopPercent(pct, handRankings)));
    setSaved(false);
  }

  function clearAll() {
    setSelected(new Set());
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      await saveProfilePosition(profileId, position, Array.from(selected));
      setSaved(true);
    });
  }

  const hands = Array.from(selected);
  const combos = comboCount(hands);
  const pctOfAll = ((combos / 1326) * 100).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Preset buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 shrink-0">Basis:</span>
        {PRESET_PERCENTS.map((pct) => (
          <button
            key={pct}
            onClick={() => applyPreset(pct)}
            className="px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          >
            Top {pct}%
          </button>
        ))}
        <button
          onClick={clearAll}
          className="px-2 py-0.5 rounded text-xs font-mono bg-gray-800 text-red-500 hover:bg-gray-700 transition-colors ml-2"
        >
          Leeren
        </button>
        <span className="text-xs text-gray-500 ml-auto font-mono">
          {hands.length} Typen · {combos} Combos · {pctOfAll}%
        </span>
      </div>

      {/* Matrix */}
      <div className="overflow-x-auto">
        <div
          className="grid gap-[2px]"
          style={{ gridTemplateColumns: `20px repeat(13, minmax(0, 1fr))` }}
        >
          <div />
          {RANKS.map((r) => (
            <div
              key={r}
              className="text-center text-[9px] text-gray-500 pb-0.5 font-mono"
            >
              {r}
            </div>
          ))}
          {RANKS.map((r1, ri) => (
            <React.Fragment key={r1}>
              <div
                className="flex items-center justify-center text-[9px] text-gray-500 font-mono"
              >
                {r1}
              </div>
              {RANKS.map((r2, ci) => {
                const hand = handKey(r1, r2, ri, ci);
                const isSelected = selected.has(hand);
                return (
                  <button
                    key={`${ri}-${ci}`}
                    onClick={() => toggleHand(hand)}
                    title={hand}
                    className={`rounded-sm text-[9px] font-mono font-bold py-1 leading-tight transition-colors ${
                      isSelected
                        ? "bg-lime-700 text-lime-100 hover:bg-lime-600"
                        : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                    }`}
                  >
                    {hand}
                  </button>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-1.5 bg-lime-700 hover:bg-lime-600 disabled:opacity-50 rounded text-sm text-white transition-colors"
        >
          {isPending ? "Speichern..." : "Position speichern"}
        </button>
        {saved && (
          <span className="text-xs text-lime-400">Gespeichert!</span>
        )}
      </div>
    </div>
  );
}
