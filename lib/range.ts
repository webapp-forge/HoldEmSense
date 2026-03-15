import { Card } from "./deck";

// Alle 169 Starthand-Typen, sortiert von stark nach schwach.
// s = suited, o = offsuit, Paare = 2 gleiche Buchstaben.
// Reihenfolge basierend auf Equilab-Referenz-Ranges (5%–95% in 5%-Schritten).
// 20 Bänder: jedes Band enthält die Hände, die Equilab bei diesem %-Schritt neu aufnimmt.
// Innerhalb jedes Bandes nach bisheriger HU-Equity-Simulation sortiert.
export const HAND_RANKINGS: string[] = [
  "AA","KK","QQ","JJ","TT","99","88","AKs","AQs","AJs",
  "AKo","KQs","77","AQo","ATs","AJo","A9s","KJs","KTs","KQo",
  "QJs","QTs","ATo","A8s","A7s","K9s","KJo","KTo","QJo","JTs",
  "66","A9o","A5s","A6s","A4s","K8s","Q9s","QTo","J9s","JTo",
  "T9s","A8o","A7o","A3s","K9o","A2s","K7s","K6s","Q8s","J8s",
  "T8s","55","A5o","K5s","Q9o","Q7s","J9o","98s","T9o","A6o",
  "A4o","K8o","K4s","K3s","Q6s","Q5s","J7s","T7s","97s","87s",
  "44","A3o","K7o","Q8o","K2s","Q4s","J8o","T8o","A2o","K6o",
  "J6s","T6s","96s","86s","76s","98o","33","K5o","Q7o","Q3s",
  "J5s","Q2s","J4s","J7o","T7o","65s","K4o","J3s","Q6o","T5s",
  "97o","95s","87o","85s","75s","22","K3o","K2o","Q5o","J2s",
  "T4s","T3s","64s","54s","Q4o","J6o","T2s","94s","86o","84s",
  "76o","74s","Q3o","J5o","T6o","96o","93s","63s","53s","43s",
  "Q2o","J4o","92s","85o","83s","75o","73s","65o","52s","J3o",
  "T5o","95o","82s","54o","62s","J2o","T4o","T3o","74o","72s",
  "64o","42s","32s","T2o","94o","93o","84o","53o","92o","83o",
  "73o","63o","43o","52o","82o","72o","62o","42o","32o",
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
