import { Card } from "./deck";

// Alle 169 Starthand-Typen, sortiert von stark nach schwach
// s = suited, o = offsuit, p = pair
export const HAND_RANKINGS: string[] = [
  "AA","KK","QQ","JJ","TT","99","88","AKs","77","AQs","AJs","KQs","AKo",
  "ATs","66","AQo","KJs","55","A9s","KTs","QJs","AJo","44","A8s","KQo",
  "KJo","QTs","A7s","K9s","JTs","ATo","33","A6s","A5s","K8s","QJo","A4s","Q9s",
  "K7s","A3s","JTo","22","K6s","A2s","K5s","KTo","QTo","J9s","K4s","Q8s","K3s",
  "T9s","K2s","J8s","Q7s","K9o","T8s","Q6s","J9o","Q5s","97s","J7s","Q4s",
  "T9o","Q3s","96s","J6s","Q2s","T7s","K8o","J5s","86s","Q9o","J4s","T6s",
  "75s","J3s","95s","K7o","J2s","T5s","64s","T4s","K6o","85s","T3s","53s",
  "74s","T2s","K5o","J8o","Q8o","63s","43s","K4o","54s","98s","93s","T8o","K3o",
  "62s","52s","97o","K2o","J7o","Q7o","76s","87s","42s","32s","A9o","96o",
  "94s","92s","86o","Q6o","A8o","65s","T7o","75o","J6o","A7o","54o","Q5o","64o","A6o",
  "84s","83s","82s","J5o","85o","Q4o","A5o","T6o","53o","A4o","Q3o","74o","J4o","A3o","63o",
  "73s","72s","Q2o","43o","A2o","J3o","T5o","J2o","T4o","52o","T3o","42o","T2o","32o",
  "98o","95o","94o","93o","92o","87o","84o","83o","82o","76o","65o","73o","72o","62o",
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
