import { getRangeForPercent } from "./range";

export type HeroProfile = "random" | "realistic" | "tightish";

// Fixed per module — not user-configurable
const MODULE_PROFILES: Record<string, HeroProfile> = {
  preflop: "realistic",
  flop: "realistic",
  turn: "realistic",
  river: "realistic",
};

export function getProfileForModule(handModule: string): HeroProfile {
  return MODULE_PROFILES[handModule] ?? "random";
}

const PROFILE_BUCKETS: Record<HeroProfile, { min: number; max: number; weight: number }[]> = {
  random: [
    { min: 0, max: 100, weight: 1 },
  ],
  realistic: [
    { min: 0,  max: 10, weight: 25 },
    { min: 10, max: 20, weight: 25 },
    { min: 20, max: 30, weight: 25 },
    { min: 30, max: 50, weight: 15 },
    { min: 50, max: 80, weight: 10 },
  ],
  tightish: [
    { min: 0,  max: 10, weight: 40 },
    { min: 10, max: 20, weight: 35 },
    { min: 20, max: 30, weight: 25 },
  ],
};

const SUITS_LIST = ["♠", "♥", "♦", "♣"];

function comboCount(hand: string): number {
  if (hand.length === 2) return 6;
  if (hand.endsWith("s")) return 4;
  return 12;
}

function generateCardsForHandType(handType: string): { rank: string; suit: string }[] {
  if (handType.length === 2) {
    const rank = handType[0];
    const suits = [...SUITS_LIST];
    for (let i = suits.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [suits[i], suits[j]] = [suits[j], suits[i]];
    }
    return [{ rank, suit: suits[0] }, { rank, suit: suits[1] }];
  }
  const rank1 = handType[0];
  const rank2 = handType[1];
  if (handType.endsWith("s")) {
    const suit = SUITS_LIST[Math.floor(Math.random() * 4)];
    return [{ rank: rank1, suit }, { rank: rank2, suit }];
  }
  const suit1Idx = Math.floor(Math.random() * 4);
  let suit2Idx: number;
  do { suit2Idx = Math.floor(Math.random() * 4); } while (suit2Idx === suit1Idx);
  return [
    { rank: rank1, suit: SUITS_LIST[suit1Idx] },
    { rank: rank2, suit: SUITS_LIST[suit2Idx] },
  ];
}

export function drawHeroCards(profile: HeroProfile): { rank: string; suit: string }[] {
  const buckets = PROFILE_BUCKETS[profile];
  const totalWeight = buckets.reduce((s, b) => s + b.weight, 0);

  let rand = Math.random() * totalWeight;
  let bucket = buckets[buckets.length - 1];
  for (const b of buckets) {
    rand -= b.weight;
    if (rand <= 0) { bucket = b; break; }
  }

  const topMax = getRangeForPercent(bucket.max);
  const topMinSet = new Set(bucket.min > 0 ? getRangeForPercent(bucket.min) : []);
  const bucketHands = topMax.filter(h => !topMinSet.has(h));

  const totalCombos = bucketHands.reduce((s, h) => s + comboCount(h), 0);
  let r = Math.random() * totalCombos;
  let handType = bucketHands[bucketHands.length - 1];
  for (const h of bucketHands) {
    r -= comboCount(h);
    if (r <= 0) { handType = h; break; }
  }

  return generateCardsForHandType(handType);
}
