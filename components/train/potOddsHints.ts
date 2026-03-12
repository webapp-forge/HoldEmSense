// Shared memo hints for Pot Odds — framed as "your call as % of total pot"
export const POT_ODDS_MEMO_HINTS: { maxFraction: number; label: string }[] = [
  { maxFraction: 0.27, label: "Quarter-Pot — dein Call = 16,7% des Endpots" },
  { maxFraction: 0.37, label: "Drittel-Pot — dein Call = 20,0% des Endpots" },
  { maxFraction: 0.60, label: "Half-Pot — dein Call = 1/4 des Endpots (25,0%)" },
  { maxFraction: 0.85, label: "Zwei-Drittel-Pot — dein Call = 28,6% des Endpots" },
  { maxFraction: 1.15, label: "Pot-Bet — dein Call = 1/3 des Endpots (33,3%)" },
  { maxFraction: 1.65, label: "1,5x Pot — dein Call = 37,5% des Endpots" },
  { maxFraction: 2.50, label: "2x Pot — dein Call = 2/5 des Endpots (40,0%)" },
];

export function getMemoHint(potSize: number, betSize: number): string | null {
  const fraction = betSize / potSize;
  return POT_ODDS_MEMO_HINTS.find((h) => fraction <= h.maxFraction)?.label ?? null;
}
