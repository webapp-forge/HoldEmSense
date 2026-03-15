import { HAND_RANKINGS } from "../lib/range";

const RANKS = "23456789TJQKA";
const rankIdx = Object.fromEntries(RANKS.split("").map((r, i) => [r, i]));

function parseRange(rangeStr: string): Set<string> {
  const result = new Set<string>();
  for (const part of rangeStr.split(",").map(s => s.trim()).filter(Boolean)) {
    const isPlus = part.endsWith("+");
    const token = isPlus ? part.slice(0, -1) : part;

    if (token.length === 2 && token[0] === token[1]) {
      // Pair: "88" or "88+"
      const idx = rankIdx[token[0]];
      if (isPlus) for (let i = idx; i < RANKS.length; i++) result.add(RANKS[i] + RANKS[i]);
      else result.add(token[0] + token[0]);
    } else if (token.endsWith("s")) {
      const high = token[0], low = token[1];
      const hi = rankIdx[high], lo = rankIdx[low];
      if (isPlus) for (let i = lo; i < hi; i++) result.add(high + RANKS[i] + "s");
      else result.add(high + low + "s");
    } else if (token.endsWith("o")) {
      const high = token[0], low = token[1];
      const hi = rankIdx[high], lo = rankIdx[low];
      if (isPlus) for (let i = lo; i < hi; i++) result.add(high + RANKS[i] + "o");
      else result.add(high + low + "o");
    }
  }
  return result;
}

// Equilab ranges at each 5% checkpoint
const CHECKPOINTS: [number, string][] = [
  [5,  "88+, AJs+, KQs, AKo"],
  [10, "77+, A9s+, KTs+, QTs+, AJo+, KQo"],
  [15, "77+, A7s+, K9s+, QTs+, JTs, ATo+, KTo+, QJo"],
  [20, "66+, A4s+, K8s+, Q9s+, J9s+, T9s, A9o+, KTo+, QTo+, JTo"],
  [25, "66+, A2s+, K6s+, Q8s+, J8s+, T8s+, A7o+, K9o+, QTo+, JTo"],
  [30, "55+, A2s+, K5s+, Q7s+, J8s+, T8s+, 98s, A7o+, A5o, K9o+, Q9o+, J9o+, T9o"],
  [35, "55+, A2s+, K3s+, Q5s+, J7s+, T7s+, 97s+, 87s, A4o+, K8o+, Q9o+, J9o+, T9o"],
  [40, "44+, A2s+, K2s+, Q4s+, J7s+, T7s+, 97s+, 87s, A3o+, K7o+, Q8o+, J8o+, T8o+"],
  [45, "44+, A2s+, K2s+, Q4s+, J6s+, T6s+, 96s+, 86s+, 76s, A2o+, K6o+, Q8o+, J8o+, T8o+, 98o"],
  [50, "33+, A2s+, K2s+, Q2s+, J4s+, T6s+, 96s+, 86s+, 76s, 65s, A2o+, K5o+, Q7o+, J7o+, T7o+, 98o"],
  [55, "33+, A2s+, K2s+, Q2s+, J3s+, T5s+, 95s+, 85s+, 75s+, 65s, A2o+, K4o+, Q6o+, J7o+, T7o+, 97o+, 87o"],
  [60, "22+, A2s+, K2s+, Q2s+, J2s+, T3s+, 95s+, 85s+, 75s+, 64s+, 54s, A2o+, K2o+, Q5o+, J7o+, T7o+, 97o+, 87o"],
  [65, "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 94s+, 84s+, 74s+, 64s+, 54s, A2o+, K2o+, Q4o+, J6o+, T7o+, 97o+, 86o+, 76o"],
  [70, "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 93s+, 84s+, 74s+, 63s+, 53s+, 43s, A2o+, K2o+, Q3o+, J5o+, T6o+, 96o+, 86o+, 76o"],
  [75, "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 83s+, 73s+, 63s+, 52s+, 43s, A2o+, K2o+, Q2o+, J4o+, T6o+, 96o+, 85o+, 75o+, 65o"],
  [80, "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 73s+, 62s+, 52s+, 43s, A2o+, K2o+, Q2o+, J3o+, T5o+, 95o+, 85o+, 75o+, 65o, 54o"],
  [85, "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s+, 32s, A2o+, K2o+, Q2o+, J2o+, T3o+, 95o+, 85o+, 74o+, 64o+, 54o"],
  [90, "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s+, 32s, A2o+, K2o+, Q2o+, J2o+, T2o+, 93o+, 84o+, 74o+, 64o+, 53o+"],
  [95, "22+, A2s+, K2s+, Q2s+, J2s+, T2s+, 92s+, 82s+, 72s+, 62s+, 52s+, 42s+, 32s, A2o+, K2o+, Q2o+, J2o+, T2o+, 92o+, 83o+, 73o+, 63o+, 52o+, 43o"],
];

// Parse all ranges and compute bands
const parsedRanges = CHECKPOINTS.map(([pct, str]) => ({ pct, hands: parseRange(str) }));
const currentPosMap = new Map(HAND_RANKINGS.map((h, i) => [h, i]));

const bands: string[][] = [];
let prevSet = new Set<string>();

for (const { hands } of parsedRanges) {
  const band = [...hands].filter(h => !prevSet.has(h));
  // Sort within band by current HAND_RANKINGS position (lower = stronger equity)
  band.sort((a, b) => (currentPosMap.get(a) ?? 999) - (currentPosMap.get(b) ?? 999));
  bands.push(band);
  prevSet = hands;
}

// Bottom band: hands not covered by any range (bottom ~5%)
const bottomBand = HAND_RANKINGS.filter(h => !prevSet.has(h));
bottomBand.sort((a, b) => (currentPosMap.get(a) ?? 999) - (currentPosMap.get(b) ?? 999));
bands.push(bottomBand);

const newRankings = bands.flat();

// Sanity check
if (newRankings.length !== 169) {
  process.stderr.write(`ERROR: got ${newRankings.length} hands, expected 169\n`);
  process.exit(1);
}

// Output
process.stdout.write("export const HAND_RANKINGS: string[] = [\n");
for (let i = 0; i < newRankings.length; i += 10) {
  const slice = newRankings.slice(i, i + 10).map(h => `"${h}"`).join(",");
  process.stdout.write(`  ${slice},\n`);
}
process.stdout.write("];\n");

// Show band sizes and combo counts
function combos(h: string) { return h.length === 2 ? 6 : h.endsWith("s") ? 4 : 12; }
let cumCombos = 0;
for (let i = 0; i < bands.length; i++) {
  const bc = bands[i].reduce((s, h) => s + combos(h), 0);
  cumCombos += bc;
  const label = i < CHECKPOINTS.length ? `top-${CHECKPOINTS[i][0]}%` : "bottom";
  process.stderr.write(`Band ${i+1} (${label}): ${bands[i].length} hands, ${bc} combos, cumulative ${cumCombos} (${(cumCombos/1326*100).toFixed(1)}%)\n`);
}
