import { Card, RANKS, SUITS } from "./deck";
import { bestHandScore } from "./evaluator";
import { getRangeForPercent, isHandInRange } from "./range";

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

export function calculateEquity(
  heroCards: Card[],
  villainRangePercent: number,
  boardCards: Card[] = [],
  simulations = 1000
): number {
  const range = getRangeForPercent(villainRangePercent);
  const communityNeeded = 5 - boardCards.length;
  let wins = 0;
  let validSims = 0;

  for (let i = 0; i < simulations; i++) {
    const usedCards = [...heroCards, ...boardCards];
    const deck = shuffle(buildDeck(usedCards));

    let villainCards: Card[] | null = null;
    for (let j = 0; j < deck.length - 1; j++) {
      const candidate = [deck[j], deck[j + 1]];
      if (isHandInRange(candidate[0], candidate[1], range)) {
        villainCards = candidate;
        break;
      }
    }

    if (!villainCards) continue;

    const remaining = deck.filter(
      c => !villainCards!.some(v => v.rank === c.rank && v.suit === c.suit)
    );
    const community = [...boardCards, ...remaining.slice(0, communityNeeded)];

    const heroScore = bestHandScore([...heroCards, ...community]);
    const villainScore = bestHandScore([...villainCards, ...community]);

    if (heroScore >= villainScore) wins++;
    validSims++;
  }

  return validSims === 0 ? 0 : wins / validSims;
}
