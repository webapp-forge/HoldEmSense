import { Card } from "./deck";

const RANK_VALUES: Record<string, number> = {
  "2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,
  "9":9,"T":10,"J":11,"Q":12,"K":13,"A":14,
};

function rankVal(card: Card): number {
  return RANK_VALUES[card.rank];
}

function encodeScore(category: number, ...ranks: number[]): number {
  let s = category * 15 ** 5;
  for (let i = 0; i < ranks.length; i++) {
    s += ranks[i] * 15 ** (4 - i);
  }
  return s;
}

function straightHigh(ranks: number[]): number {
  if (ranks[0] - ranks[4] === 4 && new Set(ranks).size === 5) return ranks[0];
  if (ranks[0] === 14 && ranks[1] === 5 && ranks[2] === 4 && ranks[3] === 3 && ranks[4] === 2) return 5;
  return 0;
}

function evaluate5(cards: Card[]): number {
  const ranks = cards.map(rankVal).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);
  const isFlush = suits.every(s => s === suits[0]);
  const straight = straightHigh(ranks);

  if (isFlush && straight) return encodeScore(8, straight);

  const counts: Record<number, number> = {};
  for (const r of ranks) counts[r] = (counts[r] || 0) + 1;
  const groups = Object.entries(counts)
    .map(([r, c]) => ({ r: Number(r), c }))
    .sort((a, b) => b.c - a.c || b.r - a.r);

  const [g0, g1] = groups;
  const kickers = groups.filter(g => g.c === 1).map(g => g.r);

  if (g0.c === 4) return encodeScore(7, g0.r, g1.r);
  if (g0.c === 3 && g1?.c === 2) return encodeScore(6, g0.r, g1.r);
  if (isFlush) return encodeScore(5, ...ranks);
  if (straight) return encodeScore(4, straight);
  if (g0.c === 3) return encodeScore(3, g0.r, ...kickers);
  if (g0.c === 2 && g1?.c === 2) return encodeScore(2, g0.r, g1.r, ...kickers);
  if (g0.c === 2) return encodeScore(1, g0.r, ...kickers);
  return encodeScore(0, ...ranks);
}

function combinations<T>(arr: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (arr.length < k) return [];
  const [first, ...rest] = arr;
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ];
}

export function bestHandScore(cards: Card[]): number {
  if (cards.length === 5) return evaluate5(cards);
  return Math.max(...combinations(cards, 5).map(evaluate5));
}
