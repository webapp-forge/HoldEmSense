import { Card, RANKS, SUITS } from "./deck";
import { bestHandScore } from "./evaluator";
import { getRangeForPercent } from "./range";

function buildDeck(excludedCards: Card[]): Card[] {
  const excluded = new Set(excludedCards.map(c => c.rank + c.suit));
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      if (!excluded.has(rank + suit)) {
        deck.push({ rank, suit });
      }
    }
  }
  return deck;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build all possible villain combos from the range, excluding used cards.
// Iterates over hand types directly — avoids the biased consecutive-pair scan.
function buildValidVillainCombos(range: string[], usedCards: Card[]): [Card, Card][] {
  const used = new Set(usedCards.map(c => c.rank + c.suit));
  const combos: [Card, Card][] = [];

  for (const hand of range) {
    if (hand.length === 2) {
      // Pair: C(4,2) = 6 suit combos
      const rank = hand[0];
      for (let si = 0; si < SUITS.length; si++) {
        for (let sj = si + 1; sj < SUITS.length; sj++) {
          const c1 = rank + SUITS[si];
          const c2 = rank + SUITS[sj];
          if (!used.has(c1) && !used.has(c2))
            combos.push([{ rank, suit: SUITS[si] }, { rank, suit: SUITS[sj] }]);
        }
      }
    } else if (hand.endsWith("s")) {
      // Suited: 4 suit combos
      const r1 = hand[0], r2 = hand[1];
      for (const suit of SUITS) {
        if (!used.has(r1 + suit) && !used.has(r2 + suit))
          combos.push([{ rank: r1, suit }, { rank: r2, suit }]);
      }
    } else {
      // Offsuit: 4×3 = 12 suit combos
      const r1 = hand[0], r2 = hand[1];
      for (const s1 of SUITS) {
        for (const s2 of SUITS) {
          if (s1 !== s2 && !used.has(r1 + s1) && !used.has(r2 + s2))
            combos.push([{ rank: r1, suit: s1 }, { rank: r2, suit: s2 }]);
        }
      }
    }
  }
  return combos;
}

export function calculateEquity(
  heroCards: Card[],
  villainRangePercent: number,
  boardCards: Card[] = [],
  simulations = 1000
): number {
  const range = getRangeForPercent(villainRangePercent);
  const communityNeeded = 5 - boardCards.length;

  // Pre-compute valid villain combos once — same for all simulations
  const validCombos = buildValidVillainCombos(range, [...heroCards, ...boardCards]);
  if (validCombos.length === 0) return 0;

  let wins = 0;

  for (let i = 0; i < simulations; i++) {
    // Uniform random villain hand
    const villainCards = validCombos[Math.floor(Math.random() * validCombos.length)];

    // Shuffle the remaining deck for community cards
    const community = [
      ...boardCards,
      ...shuffle(buildDeck([...heroCards, ...boardCards, ...villainCards])).slice(0, communityNeeded),
    ];

    const heroScore = bestHandScore([...heroCards, ...community]);
    const villainScore = bestHandScore([...villainCards, ...community]);

    if (heroScore > villainScore) wins += 1;
    else if (heroScore === villainScore) wins += 0.5;
  }

  return wins / simulations;
}
