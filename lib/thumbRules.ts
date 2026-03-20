import { RANKS } from "./deck";

export type ThumbRule = {
  key: string;
  approxEquity: string;
};

const RANK_VALUE: Record<string, number> = Object.fromEntries(
  RANKS.map((r, i) => [r, i])
);

function isPair(cards: { rank: string }[]): boolean {
  return cards[0].rank === cards[1].rank;
}

function isSuited(cards: { rank: string; suit: string }[]): boolean {
  return cards[0].suit === cards[1].suit;
}


function ranks(cards: { rank: string }[]): [number, number] {
  const a = RANK_VALUE[cards[0].rank];
  const b = RANK_VALUE[cards[1].rank];
  return a >= b ? [a, b] : [b, a];
}

/**
 * Detects which thumb rules apply to a hero-vs-villain matchup.
 * Returns rules from hero's perspective.
 */
export function detectThumbRules(
  heroCards: { rank: string; suit: string }[],
  villainCards: { rank: string; suit: string }[]
): ThumbRule[] {
  const rules: ThumbRule[] = [];

  const heroPair = isPair(heroCards);
  const villainPair = isPair(villainCards);
  const [heroHi, heroLo] = ranks(heroCards);
  const [villainHi, villainLo] = ranks(villainCards);
  const hasSharedRank = heroHi === villainHi || heroHi === villainLo || heroLo === villainHi || heroLo === villainLo;

  // Pair vs Pair
  if (heroPair && villainPair && heroHi !== villainHi) {
    rules.push({
      key: heroHi > villainHi ? "higherPairVsLowerPair" : "lowerPairVsHigherPair",
      approxEquity: heroHi > villainHi ? "≈ 80%" : "≈ 20%",
    });
  }

  // Overcards vs Pair (Coinflip)
  if (heroPair && !villainPair && villainHi > heroHi && villainLo > heroHi) {
    rules.push({ key: "pairVsOvercards", approxEquity: "≈ 47%" });
  }
  if (!heroPair && villainPair && heroHi > villainHi && heroLo > villainHi) {
    rules.push({ key: "overcardsVsPair", approxEquity: "≈ 53%" });
  }

  // Overpair vs two lower cards (no overcards at all)
  if (heroPair && !villainPair && villainHi < heroHi) {
    rules.push({ key: "overpairVsTwo", approxEquity: "≈ 85%" });
  }
  if (!heroPair && villainPair && heroHi < villainHi) {
    rules.push({ key: "twoVsOverpair", approxEquity: "≈ 15%" });
  }

  // Pair vs one overcard
  if (heroPair && !villainPair) {
    const oneOver = (villainHi > heroHi && villainLo <= heroHi) || (villainLo > heroHi && villainHi <= heroHi);
    if (oneOver) {
      rules.push({ key: "pairVsOneOvercard", approxEquity: "≈ 65%" });
    }
  }
  if (!heroPair && villainPair) {
    const oneOver = (heroHi > villainHi && heroLo <= villainHi) || (heroLo > villainHi && heroHi <= villainHi);
    if (oneOver) {
      rules.push({ key: "oneOvercardVsPair", approxEquity: "≈ 35%" });
    }
  }

  // Overcards vs Undercards — ALL hero cards above ALL villain cards (e.g. AK vs 76)
  if (!heroPair && !villainPair) {
    if (villainLo > heroHi) {
      rules.push({ key: "undercardsVsOvercards", approxEquity: "≈ 35%" });
    }
    if (heroLo > villainHi) {
      rules.push({ key: "overcardsVsUndercards", approxEquity: "≈ 65%" });
    }
  }

  // Interleaved — ranks alternate, no shared ranks (e.g. J5 vs 92: J > 9 > 5 > 2)
  if (!heroPair && !villainPair && !hasSharedRank) {
    if (heroHi > villainHi && heroLo > villainLo && heroLo < villainHi) {
      rules.push({ key: "interleavedHigher", approxEquity: "≈ 60%" });
    }
    if (villainHi > heroHi && villainLo > heroLo && villainLo < heroHi) {
      rules.push({ key: "interleavedLower", approxEquity: "≈ 40%" });
    }
  }

  // Wrapping — one hand's ranks bracket the other's, no shared ranks (e.g. Q2 vs 64)
  if (!heroPair && !villainPair && !hasSharedRank) {
    if (heroHi > villainHi && heroLo < villainLo) {
      rules.push({ key: "wrappingHero", approxEquity: "≈ 55%" });
    }
    if (villainHi > heroHi && villainLo < heroLo) {
      rules.push({ key: "wrappingVillain", approxEquity: "≈ 45%" });
    }
  }

  // Dominated — any shared rank between unpaired hands
  if (!heroPair && !villainPair && hasSharedRank) {
    // Determine the "free" (non-shared) card for each hand
    let heroFree: number, villainFree: number;
    if (heroHi === villainHi) {
      heroFree = heroLo; villainFree = villainLo;
    } else if (heroHi === villainLo) {
      heroFree = heroLo; villainFree = villainHi;
    } else if (heroLo === villainHi) {
      heroFree = heroHi; villainFree = villainLo;
    } else {
      // heroLo === villainLo
      heroFree = heroHi; villainFree = villainHi;
    }
    rules.push({
      key: heroFree > villainFree ? "dominating" : "dominated",
      approxEquity: heroFree > villainFree ? "≈ 70%" : "≈ 30%",
    });
  }

  // Suited bonus — one hand is suited, the other isn't
  const heroSuited = isSuited(heroCards);
  const villainSuited = isSuited(villainCards);
  if (heroSuited && !villainSuited) {
    rules.push({ key: "suitedBonusHero", approxEquity: "≈ +3%" });
  }
  if (!heroSuited && villainSuited) {
    rules.push({ key: "suitedBonusVillain", approxEquity: "≈ −3%" });
  }

  return rules;
}
