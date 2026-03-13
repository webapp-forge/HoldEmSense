/**
 * Generates pre-computed preflop hands with high-accuracy Monte Carlo simulation.
 * Run with: npx tsx scripts/generate-preflop-hands.ts
 *
 * Takes ~30-60 minutes depending on hardware. Progress is logged every 10 hands.
 */

import { PrismaClient } from "@prisma/client";
import { calculateEquity } from "../lib/equity";
import { HAND_RANKINGS } from "../lib/range";

const prisma = new PrismaClient();

const TOTAL = 2000;
const SIMS = 100_000;
const VILLAIN_RANGES = [10, 15, 20, 25, 30, 40, 50];
const SUITS = ["♠", "♥", "♦", "♣"];

function comboCount(hand: string): number {
  if (hand.length === 2) return 6;
  if (hand.endsWith("s")) return 4;
  return 12;
}

// Draw a random hero hand type proportional to natural combo frequency
function drawRandomHandType(): string {
  const total = HAND_RANKINGS.reduce((s, h) => s + comboCount(h), 0);
  let r = Math.random() * total;
  for (const h of HAND_RANKINGS) {
    r -= comboCount(h);
    if (r <= 0) return h;
  }
  return HAND_RANKINGS[HAND_RANKINGS.length - 1];
}

function generateCards(handType: string): { rank: string; suit: string }[] {
  if (handType.length === 2) {
    const rank = handType[0];
    const shuffled = [...SUITS].sort(() => Math.random() - 0.5);
    return [{ rank, suit: shuffled[0] }, { rank, suit: shuffled[1] }];
  }
  const r1 = handType[0], r2 = handType[1];
  if (handType.endsWith("s")) {
    const suit = SUITS[Math.floor(Math.random() * 4)];
    return [{ rank: r1, suit }, { rank: r2, suit }];
  }
  const s1 = Math.floor(Math.random() * 4);
  let s2: number;
  do { s2 = Math.floor(Math.random() * 4); } while (s2 === s1);
  return [{ rank: r1, suit: SUITS[s1] }, { rank: r2, suit: SUITS[s2] }];
}


async function main() {
  console.log(`Generating ${TOTAL} preflop hands with ${SIMS.toLocaleString()} simulations each...`);
  const startTime = Date.now();

  for (let i = 0; i < TOTAL; i++) {
    const handType = drawRandomHandType();
    const heroCards = generateCards(handType);
    const villainRange = VILLAIN_RANGES[Math.floor(Math.random() * VILLAIN_RANGES.length)];
    const equity = calculateEquity(heroCards, villainRange, [], SIMS);

    await prisma.preGeneratedHand.create({
      data: {
        module: "hand-vs-range",
        heroHandType: handType,
        heroCard1Rank: heroCards[0].rank,
        heroCard1Suit: heroCards[0].suit,
        heroCard2Rank: heroCards[1].rank,
        heroCard2Suit: heroCards[1].suit,
        villainRange,
        equity,
        iterations: SIMS,
      },
    });

    if ((i + 1) % 10 === 0) {
      const elapsed = (Date.now() - startTime) / 1000;
      const perHand = elapsed / (i + 1);
      const remaining = Math.round(perHand * (TOTAL - i - 1));
      console.log(`${i + 1}/${TOTAL} — ${Math.round(perHand * 10) / 10}s/hand — ~${Math.round(remaining / 60)}min remaining`);
    }
  }

  const total = Math.round((Date.now() - startTime) / 1000);
  console.log(`Done! ${TOTAL} hands generated in ${Math.round(total / 60)}min ${total % 60}s.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
