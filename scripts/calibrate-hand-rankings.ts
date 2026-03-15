/**
 * Calibrates HAND_RANKINGS by computing heads-up equity vs. a random hand
 * for each of the 169 starting hand types. Outputs a corrected HAND_RANKINGS
 * array to stdout — paste the result into lib/range.ts.
 *
 * Run with: npx tsx scripts/calibrate-hand-rankings.ts
 *
 * Takes ~5-10 minutes. Progress is logged every 10 hand types.
 */

import { calculateEquity } from "../lib/equity";
import { HAND_RANKINGS } from "../lib/range";

// Simulations per dealt hand. Higher = more accurate ranking, slower runtime.
const SIMS = 5_000;
const SUITS = ["♠", "♥", "♦", "♣"];

// Returns all distinct suit combinations for the given hand type.
// Pairs: C(4,2)=6, Suited: 4, Offsuit: 4×3=12
function allDeals(handType: string): { rank: string; suit: string }[][] {
  const results: { rank: string; suit: string }[][] = [];
  if (handType.length === 2) {
    const rank = handType[0];
    for (let i = 0; i < SUITS.length; i++)
      for (let j = i + 1; j < SUITS.length; j++)
        results.push([{ rank, suit: SUITS[i] }, { rank, suit: SUITS[j] }]);
  } else if (handType.endsWith("s")) {
    const r1 = handType[0], r2 = handType[1];
    for (const suit of SUITS)
      results.push([{ rank: r1, suit }, { rank: r2, suit }]);
  } else {
    const r1 = handType[0], r2 = handType[1];
    for (const s1 of SUITS)
      for (const s2 of SUITS)
        if (s1 !== s2) results.push([{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }]);
  }
  return results;
}

function main() {
  console.log(`Calibrating equity for ${HAND_RANKINGS.length} hand types`);
  console.log(`${SIMS.toLocaleString()} simulations × all suit combos per type\n`);
  const startTime = Date.now();

  const equities: { hand: string; equity: number }[] = [];

  for (let i = 0; i < HAND_RANKINGS.length; i++) {
    const handType = HAND_RANKINGS[i];
    const deals = allDeals(handType);
    let total = 0;
    for (const heroCards of deals) {
      total += calculateEquity(heroCards, 100, [], SIMS);
    }
    const avg = total / deals.length;
    equities.push({ hand: handType, equity: avg });

    if ((i + 1) % 10 === 0 || i + 1 === HAND_RANKINGS.length) {
      const elapsed = (Date.now() - startTime) / 1000;
      const perType = elapsed / (i + 1);
      const remaining = Math.round(perType * (HAND_RANKINGS.length - i - 1));
      console.log(
        `${(i + 1).toString().padStart(3)}/${HAND_RANKINGS.length} — ${handType.padEnd(4)} — ${(avg * 100).toFixed(2)}% — ~${remaining}s remaining`
      );
    }
  }

  equities.sort((a, b) => b.equity - a.equity);

  console.log("\n\n// Paste this into lib/range.ts:\n");
  console.log("export const HAND_RANKINGS: string[] = [");

  const chunks: string[] = [];
  let row: string[] = [];
  for (const { hand } of equities) {
    row.push(`"${hand}"`);
    if (row.length === 10) {
      chunks.push("  " + row.join(","));
      row = [];
    }
  }
  if (row.length > 0) chunks.push("  " + row.join(","));
  console.log(chunks.join(",\n") + ",");
  console.log("];");

  const total = Math.round((Date.now() - startTime) / 1000);
  console.log(`\nDone in ${Math.floor(total / 60)}min ${total % 60}s`);
}

main();
