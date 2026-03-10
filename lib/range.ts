import { Card } from "./deck";

// Alle 169 Starthand-Typen, sortiert von stark nach schwach
// s = suited, o = offsuit, p = pair
// Sorted by win% at a 10-player table (Wikipedia / Sklansky, ranks 1–169)
export const HAND_RANKINGS: string[] = [
  "AA","KK","QQ","AKs","JJ","AQs","KQs","AJs","KJs","TT",
  "AKo","ATs","QJs","KTs","QTs","JTs","99","AQo","A9s","KQo",
  "88","K9s","T9s","A8s","Q9s","J9s","AJo","A5s","77","A7s",
  "KJo","A4s","A3s","A6s","QJo","66","K8s","T8s","A2s","98s",
  "J8s","ATo","Q8s","K7s","KTo","55","JTo","87s","QTo","44",
  "22","33","K6s","97s","K5s","76s","T7s","K4s","K2s","K3s",
  "Q7s","86s","65s","J7s","54s","Q6s","75s","96s","Q5s","64s",
  "Q4s","Q3s","T9o","T6s","Q2s","A9o","53s","85s","J6s","J9o",
  "K9o","J5s","Q9o","43s","74s","J4s","J3s","95s","J2s","63s",
  "A8o","52s","T5s","84s","T4s","T3s","42s","T2s","98o","T8o",
  "A5o","A7o","73s","A4o","32s","94s","93s","J8o","A3o","62s",
  "92s","K8o","A6o","87o","Q8o","83s","A2o","82s","97o","72s",
  "76o","K7o","65o","T7o","K6o","86o","54o","K5o","J7o","75o",
  "Q7o","K4o","K3o","96o","K2o","64o","Q6o","53o","85o","T6o",
  "Q5o","43o","Q4o","Q3o","74o","Q2o","J6o","63o","J5o","95o",
  "52o","J4o","J3o","42o","J2o","84o","T5o","T4o","32o","T3o",
  "73o","T2o","62o","94o","93o","92o","83o","82o","72o",
];

// Wie viele Kombos hat ein Handtyp?
function comboCount(hand: string): number {
  if (hand.length === 2) return 6;        // Pair: 6 Kombos
  if (hand.endsWith("s")) return 4;       // Suited: 4 Kombos
  return 12;                              // Offsuit: 12 Kombos
}

// Gesamtzahl aller möglichen Kombos (= 1326)
const TOTAL_COMBOS = HAND_RANKINGS.reduce((sum, h) => sum + comboCount(h), 0);

// Gibt alle Handtypen zurück die zu "Top X%" gehören
export function getRangeForPercent(percent: number): string[] {
  const target = Math.round((percent / 100) * TOTAL_COMBOS);
  const range: string[] = [];
  let count = 0;
  for (const hand of HAND_RANKINGS) {
    if (count >= target) break;
    range.push(hand);
    count += comboCount(hand);
  }
  return range;
}

// Prüft ob eine konkrete Hand (z.B. As Kh) in einer Range liegt
export function isHandInRange(card1: Card, card2: Card, range: string[]): boolean {
  const ranks = "23456789TJQKA";
  const r1 = card1.rank;
  const r2 = card2.rank;
  const suited = card1.suit === card2.suit;
  const isPair = r1 === r2;

  const high = ranks.indexOf(r1) >= ranks.indexOf(r2) ? r1 : r2;
  const low = ranks.indexOf(r1) >= ranks.indexOf(r2) ? r2 : r1;

  let key: string;
  if (isPair) key = r1 + r2;
  else if (suited) key = high + low + "s";
  else key = high + low + "o";

  return range.includes(key);
}
