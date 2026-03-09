export const RANKS = ["2","3","4","5","6","7","8","9","T","J","Q","K","A"];
export const SUITS = ["♠","♥","♦","♣"];

export type Card = {
  rank: string;
  suit: string;
};

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function drawCards(count: number, exclude: Card[] = []): Card[] {
  const excluded = new Set(exclude.map(c => `${c.rank}${c.suit}`));
  const deck = createDeck().filter(c => !excluded.has(`${c.rank}${c.suit}`));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck.slice(0, count);
}
