import { HAND_RANKINGS, getRangeForPercent } from "../range";
import { POSITIONS, POSITION_OPEN_PERCENT, Position } from "./positionRanges";
import { SUITS, Card } from "../deck";

/**
 * Generate concrete cards for a hand type like "AKs", "77", "T9o".
 * Returns two Card objects with random but valid suits.
 */
export function generateCardsForHandType(handType: string): [Card, Card] {
  const rank1 = handType[0];
  const rank2 = handType[1] ?? handType[0];
  const isPair = rank1 === rank2;
  const isSuited = handType.endsWith("s");

  const shuffledSuits = [...SUITS].sort(() => Math.random() - 0.5);

  if (isPair) {
    return [
      { rank: rank1, suit: shuffledSuits[0] },
      { rank: rank2, suit: shuffledSuits[1] },
    ];
  }

  if (isSuited) {
    const suit = shuffledSuits[0];
    return [
      { rank: rank1, suit },
      { rank: rank2, suit },
    ];
  }

  // Offsuit
  return [
    { rank: rank1, suit: shuffledSuits[0] },
    { rank: rank2, suit: shuffledSuits[1] },
  ];
}

const HAND_COUNT = 8;

// Hybrid difficulty: controls which pool hands are drawn from
// D1: all 169 hands (random) — mostly obvious decisions
// D2: Top 80% of HAND_RANKINGS (strongest 135 hands) — fewer trash hands
// D3: Top 60% (~101 hands) — more borderline
// D4: only hands ±10 positions from the range border — pure edge cases
const DIFFICULTY_POOL: Record<number, { mode: "top" | "border"; value: number }> = {
  1: { mode: "top", value: 169 },
  2: { mode: "top", value: 135 },
  3: { mode: "top", value: 101 },
  4: { mode: "border", value: 10 },
};

/**
 * Generate a range training round: position + 8 hands with difficulty-aware selection.
 */
export function generateRangeRound(difficulty: number): {
  position: Position;
  handTypes: string[];
  correctAnswers: boolean[];
  cards: [Card, Card][];
} {
  const position = POSITIONS[Math.floor(Math.random() * POSITIONS.length)];
  const openPercent = POSITION_OPEN_PERCENT[position];
  const openRange = new Set(getRangeForPercent(openPercent));

  const borderIndex = openRange.size;
  const poolConfig = DIFFICULTY_POOL[difficulty] ?? DIFFICULTY_POOL[1];

  // Build the candidate pool based on difficulty
  let candidates: { hand: string; inRange: boolean }[];

  if (poolConfig.mode === "border") {
    // D4: only hands near the border
    candidates = HAND_RANKINGS
      .map((hand, i) => ({ hand, inRange: openRange.has(hand), dist: Math.abs(i - borderIndex) }))
      .filter((h) => h.dist <= poolConfig.value)
      .map(({ hand, inRange }) => ({ hand, inRange }));
  } else {
    // D1-D3: take the top N hands from HAND_RANKINGS
    candidates = HAND_RANKINGS
      .slice(0, poolConfig.value)
      .map((hand) => ({ hand, inRange: openRange.has(hand) }));
  }

  shuffle(candidates);

  // Select 8 hands, ensuring at least 2 plays and 2 folds
  const plays = candidates.filter((h) => h.inRange);
  const folds = candidates.filter((h) => !h.inRange);

  const selected: { hand: string; inRange: boolean }[] = [];

  // Guarantee minimum 2 plays and 2 folds
  shuffle(plays);
  shuffle(folds);
  selected.push(...plays.slice(0, 2));
  selected.push(...folds.slice(0, 2));

  // Fill remaining 4 from shuffled full pool (excluding already selected)
  const usedHands = new Set(selected.map((s) => s.hand));
  const remaining = candidates.filter((h) => !usedHands.has(h.hand));
  shuffle(remaining);
  selected.push(...remaining.slice(0, HAND_COUNT - selected.length));

  // Fallback if pool was too small
  if (selected.length < HAND_COUNT) {
    const allUnused = HAND_RANKINGS
      .map((hand) => ({ hand, inRange: openRange.has(hand) }))
      .filter((h) => !selected.some((s) => s.hand === h.hand));
    shuffle(allUnused);
    selected.push(...allUnused.slice(0, HAND_COUNT - selected.length));
  }

  shuffle(selected);

  const handTypes = selected.map((s) => s.hand);
  const correctAnswers = selected.map((s) => s.inRange);
  const cards = handTypes.map((ht) => generateCardsForHandType(ht));

  return { position, handTypes, correctAnswers, cards };
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
