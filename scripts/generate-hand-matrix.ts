/**
 * Generates a pre-computed equity matrix for all 169 starting hand types.
 * Each hand type's equity is measured against a completely random villain hand
 * (villainRangePercent = 100 → uniform draw from remaining deck combos).
 *
 * Run with: npx tsx scripts/generate-hand-matrix.ts
 *
 * Takes ~5–10 minutes. Re-run whenever equity.ts, evaluator.ts or range.ts changes.
 */

import { PrismaClient } from "@prisma/client";
import { calculateEquity } from "../lib/equity";
import { HAND_RANKINGS } from "../lib/range";

const prisma = new PrismaClient();

const SIMS = 20_000; // per suit-combo; pairs=6×, suited=4×, offsuit=12× → 120k–240k total per type
const SUITS = ["♠", "♥", "♦", "♣"];

/** All distinct suit-combos for a hand type (pairs=6, suited=4, offsuit=12). */
function allCombos(handType: string): { rank: string; suit: string }[][] {
  const result: { rank: string; suit: string }[][] = [];
  if (handType.length === 2) {
    const rank = handType[0];
    for (let i = 0; i < SUITS.length; i++)
      for (let j = i + 1; j < SUITS.length; j++)
        result.push([{ rank, suit: SUITS[i] }, { rank, suit: SUITS[j] }]);
  } else if (handType.endsWith("s")) {
    const r1 = handType[0], r2 = handType[1];
    for (const suit of SUITS)
      result.push([{ rank: r1, suit }, { rank: r2, suit }]);
  } else {
    const r1 = handType[0], r2 = handType[1];
    for (const s1 of SUITS)
      for (const s2 of SUITS)
        if (s1 !== s2) result.push([{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }]);
  }
  return result;
}

async function main() {
  const total = HAND_RANKINGS.length;
  console.log(`Generating equity matrix for ${total} hand types — ${SIMS.toLocaleString()} sims × all suit combos each...`);
  const startTime = Date.now();

  for (let i = 0; i < total; i++) {
    const handType = HAND_RANKINGS[i];
    const combos = allCombos(handType);

    // Average equity over all suit-combos — cancels out blocker asymmetries
    let totalEquity = 0;
    for (const heroCards of combos) {
      totalEquity += calculateEquity(heroCards, 100, [], SIMS);
    }
    const equity = totalEquity / combos.length;
    const iterations = SIMS * combos.length;

    await prisma.handEquityMatrix.upsert({
      where: { handType },
      update: { equity, iterations },
      create: { handType, equity, iterations },
    });

    if ((i + 1) % 10 === 0 || i + 1 === total) {
      const elapsed = (Date.now() - startTime) / 1000;
      const perHand = elapsed / (i + 1);
      const remaining = Math.round(perHand * (total - i - 1));
      console.log(
        `${i + 1}/${total} — ${handType.padEnd(4)} equity=${(equity * 100).toFixed(1)}% — ~${Math.round(remaining / 60)}min ${remaining % 60}s remaining`
      );
    }
  }

  const total_s = Math.round((Date.now() - startTime) / 1000);
  console.log(`Done! Matrix complete in ${Math.round(total_s / 60)}min ${total_s % 60}s.`);

  // Re-read sorted order and print new HAND_RANKINGS for copy-paste into lib/range.ts
  const sorted = await prisma.handEquityMatrix.findMany({ orderBy: { equity: "desc" } });
  const lines: string[] = [];
  for (let i = 0; i < sorted.length; i += 10) {
    lines.push("  " + sorted.slice(i, i + 10).map((r) => JSON.stringify(r.handType)).join(","));
  }
  console.log("\n// Paste into lib/range.ts — HAND_RANKINGS:");
  console.log("export const HAND_RANKINGS: string[] = [");
  console.log(lines.join(",\n") + ",");
  console.log("];");

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
