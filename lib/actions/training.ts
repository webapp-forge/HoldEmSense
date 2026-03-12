"use server";

import { prisma } from "../prisma";
import { drawCards } from "../deck";
import { calculateEquity } from "../equity";
import { auth } from "../auth";
import { drawHeroCards, getProfileForModule } from "../heroProfiles";
import { cookies } from "next/headers";
import { getAppConfig } from "../config";

const CLASS_COUNTS: Record<number, number> = { 1: 5, 2: 10, 3: 20, 4: 50 };

const PROGRESS_MODULE: Record<string, string> = {
  preflop: "hand-vs-range",
  flop: "hand-vs-range-flop",
  turn: "hand-vs-range-turn",
  river: "hand-vs-range-river",
  "pot-odds": "pot-odds",
};

function scoreGuess(guessIndex: number, actualEquity: number, difficulty: number): number {
  const classCount = CLASS_COUNTS[difficulty] ?? 10;
  const correctIndex = Math.min(Math.floor(actualEquity * classCount), classCount - 1);
  const diff = Math.abs(guessIndex - correctIndex);
  if (diff === 0) return 3;
  if (diff === 1) return 1;
  return 0;
}

async function checkAndUnlock(userId: string, difficulty: number, handModule: string): Promise<number | null> {
  if (difficulty >= 4) return null;

  // Difficulty 3 (Advanced) and 4 (Expert) are premium-only
  if (difficulty >= 2) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
    if (!user?.isPremium) return null;
  }

  const { progressWindowSize, unlockThreshold } = await getAppConfig();

  const hands = await prisma.trainingHand.findMany({
    where: { userId, difficulty, module: handModule, pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: progressWindowSize,
    select: { pointsScored: true },
  });

  if (hands.length < progressWindowSize) return null;

  const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
  if (total < unlockThreshold) return null;

  const progressModule = PROGRESS_MODULE[handModule] ?? handModule;
  const nextDifficulty = difficulty + 1;
  try {
    await prisma.userProgress.create({
      data: { userId, module: progressModule, difficulty: nextDifficulty },
    });
  } catch {
    // Already unlocked — that's fine, still return so client can sync state
  }
  return nextDifficulty;
}

type HandResult = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  villainRange: number;
  flopCards: { rank: string; suit: string }[] | undefined;
  turnCard: { rank: string; suit: string } | undefined;
  riverCard: { rank: string; suit: string } | undefined;
  potSize?: number;
  betSize?: number;
};

export async function getOrCreateHand(difficulty: number, handModule: string): Promise<HandResult> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  if (!userId && !guestId) throw new Error("No identity");

  const where = userId
    ? { userId, difficulty, module: handModule, pointsScored: null }
    : { guestId, difficulty, module: handModule, pointsScored: null };

  const existing = await prisma.trainingHand.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const flopCards = existing.flopCard1Rank
      ? [
          { rank: existing.flopCard1Rank, suit: existing.flopCard1Suit! },
          { rank: existing.flopCard2Rank!, suit: existing.flopCard2Suit! },
          { rank: existing.flopCard3Rank!, suit: existing.flopCard3Suit! },
        ]
      : undefined;
    const turnCard = existing.turnCardRank
      ? { rank: existing.turnCardRank, suit: existing.turnCardSuit! }
      : undefined;
    const riverCard = existing.riverCardRank
      ? { rank: existing.riverCardRank, suit: existing.riverCardSuit! }
      : undefined;
    return {
      handId: existing.id,
      heroCards: [
        { rank: existing.heroCard1Rank!, suit: existing.heroCard1Suit! },
        { rank: existing.heroCard2Rank!, suit: existing.heroCard2Suit! },
      ],
      villainRange: existing.villainRange!,
      flopCards,
      turnCard,
      riverCard,
    };
  }

  const heroCards = drawHeroCards(getProfileForModule(handModule));
  const hasFlopModules = ["flop", "turn", "river"];
  const flopCards = hasFlopModules.includes(handModule) ? drawCards(3, heroCards) : undefined;
  const turnCard = ["turn", "river"].includes(handModule)
    ? drawCards(1, [...heroCards, ...(flopCards ?? [])])[0]
    : undefined;
  const riverCard = handModule === "river"
    ? drawCards(1, [...heroCards, ...(flopCards ?? []), ...(turnCard ? [turnCard] : [])])[0]
    : undefined;
  const villainRange = [10, 15, 20, 25, 30, 40, 50][Math.floor(Math.random() * 7)];

  const hand = await prisma.trainingHand.create({
    data: {
      userId: userId ?? undefined,
      ...(guestId && { guestId } as any),
      module: handModule,
      heroCard1Rank: heroCards[0].rank,
      heroCard1Suit: heroCards[0].suit,
      heroCard2Rank: heroCards[1].rank,
      heroCard2Suit: heroCards[1].suit,
      ...(flopCards && {
        flopCard1Rank: flopCards[0].rank,
        flopCard1Suit: flopCards[0].suit,
        flopCard2Rank: flopCards[1].rank,
        flopCard2Suit: flopCards[1].suit,
        flopCard3Rank: flopCards[2].rank,
        flopCard3Suit: flopCards[2].suit,
      }),
      ...(turnCard && {
        turnCardRank: turnCard.rank,
        turnCardSuit: turnCard.suit,
      }),
      ...(riverCard && {
        riverCardRank: riverCard.rank,
        riverCardSuit: riverCard.suit,
      }),
      villainRange,
      difficulty,
    },
  });

  return { handId: hand.id, heroCards, flopCards, turnCard, riverCard, villainRange };
}

export async function submitGuess(handId: string, guess: number) {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  const hand = await prisma.trainingHand.findUnique({ where: { id: handId } });
  if (!hand) throw new Error("Hand not found");

  const isOwner = userId
    ? hand.userId === userId
    : guestId && hand.guestId === guestId;
  if (!isOwner) throw new Error("Unauthorized");

  const heroCards = [
    { rank: hand.heroCard1Rank!, suit: hand.heroCard1Suit! },
    { rank: hand.heroCard2Rank!, suit: hand.heroCard2Suit! },
  ];

  const communityCards = hand.flopCard1Rank
    ? [
        { rank: hand.flopCard1Rank, suit: hand.flopCard1Suit! },
        { rank: hand.flopCard2Rank!, suit: hand.flopCard2Suit! },
        { rank: hand.flopCard3Rank!, suit: hand.flopCard3Suit! },
        ...(hand.turnCardRank ? [{ rank: hand.turnCardRank, suit: hand.turnCardSuit! }] : []),
        ...(hand.riverCardRank ? [{ rank: hand.riverCardRank, suit: hand.riverCardSuit! }] : []),
      ]
    : [];

  const simsByDifficulty: Record<number, number> = { 1: 1000, 2: 2000, 3: 5000, 4: 20000 };
  const simulations = simsByDifficulty[hand.difficulty] ?? 1000;
  const equity = calculateEquity(heroCards, hand.villainRange!, communityCards, simulations);
  const points = scoreGuess(guess, equity, hand.difficulty);

  const { progressWindowSize, unlockThreshold, maxProgressPoints, leakBaseMinutes } = await getAppConfig();
  const stageMs = getStageNextAvailableMS(leakBaseMinutes);

  const repetitionUpdate =
    points < 3
      ? { repetitionStage: 1, repetitionAvailableAt: new Date(Date.now() + stageMs[1]) }
      : {};

  await prisma.trainingHand.update({
    where: { id: handId },
    data: { actualEquity: equity, pointsScored: points, ...repetitionUpdate },
  });

  if (!userId) {
    const guestHands = await prisma.trainingHand.findMany({
      where: { guestId, difficulty: hand.difficulty, module: hand.module, pointsScored: { not: null } },
      orderBy: { createdAt: "desc" },
      take: progressWindowSize,
      select: { pointsScored: true },
    });
    const guestTotal = guestHands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
    return { equity, pointsScored: points, unlockedDifficulty: null, progress: { count: guestHands.length, total: guestTotal, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints } };
  }

  const unlockedDifficulty = await checkAndUnlock(userId, hand.difficulty, hand.module);

  const recentHands = await prisma.trainingHand.findMany({
    where: { userId, difficulty: hand.difficulty, module: hand.module, pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: progressWindowSize,
    select: { pointsScored: true },
  });
  const progressTotal = recentHands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);

  return {
    equity,
    pointsScored: points,
    unlockedDifficulty,
    progress: { count: recentHands.length, total: progressTotal, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints },
  };
}

export async function getUnlockedDifficulties(handModule: string): Promise<number[]> {
  const session = await auth();
  if (!session?.user?.id) return [1];

  const isPremium = !!(session.user as any).isPremium;
  const maxDifficulty = isPremium ? 4 : 2;

  const progressModule = PROGRESS_MODULE[handModule] ?? handModule;
  const progress = await prisma.userProgress.findMany({
    where: { userId: session.user.id, module: progressModule },
    select: { difficulty: true },
  });

  const unlocked = new Set([1, ...progress.map((p) => p.difficulty)]);
  return Array.from(unlocked)
    .filter((d) => d <= maxDifficulty)
    .sort((a, b) => a - b);
}

function getStageNextAvailableMS(leakBaseMinutes: number): Record<number, number> {
  const baseMs = leakBaseMinutes * 60 * 1000;
  return {
    1: baseMs,
    2: baseMs * 24,
    3: baseMs * 24 * 7,
  };
}

export async function getOpenLeakCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;
  return prisma.trainingHand.count({
    where: {
      userId: session.user.id,
      repetitionStage: { in: [1, 2, 3] },
      repetitionAvailableAt: { lte: new Date() },
    },
  });
}

export async function getNextRepetitionHand(): Promise<HandResult & { stage: number; difficulty: number; module: string; potSize?: number; betSize?: number } | null> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const hand = await prisma.trainingHand.findFirst({
    where: {
      userId: session.user.id,
      repetitionStage: { in: [1, 2, 3] },
      repetitionAvailableAt: { lte: new Date() },
    },
    orderBy: { repetitionAvailableAt: "asc" },
  });

  if (!hand) return null;

  // For beginner pot-odds leaks: normalize to the exact preset scenario so displayed
  // pot/bet values always match the button labels (legacy hands may have non-preset values).
  let displayPotSize = hand.potSize ?? undefined;
  let displayBetSize = hand.betSize ?? undefined;
  if (hand.module === "pot-odds" && hand.difficulty === 1 && hand.potSize && hand.betSize) {
    const requiredEquity = hand.betSize / (hand.potSize + 2 * hand.betSize);
    const correctIndex = BEGINNER_POT_ODDS_EQUITIES.reduce((best, eq, i) =>
      Math.abs(eq - requiredEquity) < Math.abs(BEGINNER_POT_ODDS_EQUITIES[best] - requiredEquity) ? i : best, 0
    );
    displayPotSize = BEGINNER_POT_ODDS_PRESETS[correctIndex].potSize;
    displayBetSize = BEGINNER_POT_ODDS_PRESETS[correctIndex].betSize;
  }

  const flopCards = hand.flopCard1Rank
    ? [
        { rank: hand.flopCard1Rank, suit: hand.flopCard1Suit! },
        { rank: hand.flopCard2Rank!, suit: hand.flopCard2Suit! },
        { rank: hand.flopCard3Rank!, suit: hand.flopCard3Suit! },
      ]
    : undefined;
  const turnCard = hand.turnCardRank ? { rank: hand.turnCardRank, suit: hand.turnCardSuit! } : undefined;
  const riverCard = hand.riverCardRank ? { rank: hand.riverCardRank, suit: hand.riverCardSuit! } : undefined;

  return {
    handId: hand.id,
    heroCards: hand.heroCard1Rank
      ? [
          { rank: hand.heroCard1Rank, suit: hand.heroCard1Suit! },
          { rank: hand.heroCard2Rank!, suit: hand.heroCard2Suit! },
        ]
      : [],
    villainRange: hand.villainRange ?? 0,
    flopCards,
    turnCard,
    riverCard,
    potSize: displayPotSize,
    betSize: displayBetSize,
    stage: hand.repetitionStage!,
    difficulty: hand.difficulty,
    module: hand.module,
  };
}

export async function submitRepetitionGuess(handId: string, guess: number) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const hand = await prisma.trainingHand.findUnique({ where: { id: handId } });
  if (!hand) throw new Error("Hand not found");
  if (hand.userId !== session.user.id) throw new Error("Unauthorized");
  if (!hand.repetitionStage || hand.repetitionStage < 1 || hand.repetitionStage > 3)
    throw new Error("Hand not in repetition");

  const stage = hand.repetitionStage;
  const equity = hand.actualEquity!;
  const points = (hand.module === "pot-odds" && hand.difficulty === 1)
    ? scorePotOddsBeginnerGuess(guess, equity)
    : scoreGuess(guess, equity, hand.difficulty);
  const correct = points === 3; // Only a perfect hit advances the stage

  const { leakBaseMinutes } = await getAppConfig();
  const stageMs = getStageNextAvailableMS(leakBaseMinutes);

  let newStage: number;
  let newAvailableAt: Date | null;

  if (correct) {
    newStage = stage + 1; // 2, 3, or 4 (done)
    newAvailableAt = newStage <= 3 ? new Date(Date.now() + stageMs[newStage]) : null;
  } else {
    newStage = Math.max(stage - 1, 1);
    newAvailableAt = new Date(Date.now() + stageMs[newStage]);
  }

  await prisma.trainingHand.update({
    where: { id: handId },
    data: { repetitionStage: newStage, repetitionAvailableAt: newAvailableAt },
  });

  // For beginner pot-odds, return the preset equity so the displayed value matches the button label
  const displayEquity = (hand.module === "pot-odds" && hand.difficulty === 1)
    ? BEGINNER_POT_ODDS_EQUITIES[BEGINNER_POT_ODDS_EQUITIES.reduce((best, eq, i) =>
        Math.abs(eq - equity) < Math.abs(BEGINNER_POT_ODDS_EQUITIES[best] - equity) ? i : best, 0)]
    : equity;

  return { equity: displayEquity, pointsScored: points, correct, newStage };
}

export async function getRepetitionCount(): Promise<number> {
  const session = await auth();
  if (!session?.user?.id) return 0;

  return prisma.trainingHand.count({
    where: {
      userId: session.user.id,
      repetitionStage: { in: [1, 2, 3] },
      repetitionAvailableAt: { lte: new Date() },
    },
  });
}

export async function getHandProgress(difficulty: number, handModule: string): Promise<{ count: number; total: number; windowSize: number; unlockThreshold: number; maxPoints: number }> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  const { progressWindowSize, unlockThreshold, maxProgressPoints } = await getAppConfig();

  if (!userId && !guestId) return { count: 0, total: 0, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints };

  const where = userId
    ? { userId, difficulty, module: handModule, pointsScored: { not: null } }
    : { guestId, difficulty, module: handModule, pointsScored: { not: null } };

  const hands = await prisma.trainingHand.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: progressWindowSize,
    select: { pointsScored: true },
  });

  const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);

  // If logged in and threshold already met, apply unlock in case config changed since last play
  if (userId && hands.length >= progressWindowSize && total >= unlockThreshold) {
    await checkAndUnlock(userId, difficulty, handModule);
  }

  return { count: hands.length, total, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints };
}

// Canonical bet sizes for Beginner: always exact standard fractions, clean numbers
const BEGINNER_POT_ODDS_PRESETS: { potSize: number; betSize: number }[] = [
  { potSize: 100, betSize: 25 },  // quarter-pot  ≈ 16.7%
  { potSize:  90, betSize: 30 },  // third-pot    = 20%
  { potSize: 100, betSize: 50 },  // half-pot     = 25%
  { potSize:  90, betSize: 60 },  // two-thirds   ≈ 28.6%
  { potSize: 100, betSize: 100 }, // pot-bet      ≈ 33.3%
  { potSize: 100, betSize: 150 }, // 1.5x pot     = 37.5%
  { potSize: 100, betSize: 200 }, // 2x pot       = 40%
];

// Pre-computed equities for the 7 beginner presets (index matches preset index)
const BEGINNER_POT_ODDS_EQUITIES = BEGINNER_POT_ODDS_PRESETS.map(
  ({ potSize, betSize }) => betSize / (potSize + 2 * betSize)
);

function scorePotOddsBeginnerGuess(guessIndex: number, requiredEquity: number): number {
  const correctIndex = BEGINNER_POT_ODDS_EQUITIES.reduce((best, eq, i) =>
    Math.abs(eq - requiredEquity) < Math.abs(BEGINNER_POT_ODDS_EQUITIES[best] - requiredEquity) ? i : best, 0
  );
  const diff = Math.abs(guessIndex - correctIndex);
  if (diff === 0) return 3;
  if (diff === 1) return 1;
  return 0;
}

function generatePotOddsScenario(difficulty: number): { potSize: number; betSize: number } {
  if (difficulty === 1) {
    return BEGINNER_POT_ODDS_PRESETS[Math.floor(Math.random() * BEGINNER_POT_ODDS_PRESETS.length)];
  }
  if (difficulty === 2) {
    const pots = [40, 50, 60, 70, 80, 90, 100, 120];
    const fractions = [0.25, 0.33, 0.5, 0.67, 0.75, 1.0, 1.5, 2.0];
    const pot = pots[Math.floor(Math.random() * pots.length)];
    const fraction = fractions[Math.floor(Math.random() * fractions.length)];
    return { potSize: pot, betSize: Math.round((pot * fraction) / 5) * 5 || 5 };
  }
  // Advanced/Expert: random amounts, no rounding
  const pot = Math.floor(Math.random() * 140) + 20;
  const fraction = 0.1 + Math.random() * 2.4; // 10% to 250% of pot
  return { potSize: pot, betSize: Math.max(1, Math.round(pot * fraction)) };
}

export async function getOrCreatePotOddsHand(difficulty: number): Promise<{ handId: string; potSize: number; betSize: number }> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);
  if (!userId && !guestId) throw new Error("No identity");

  const where = userId
    ? { userId, difficulty, module: "pot-odds", pointsScored: null }
    : { guestId, difficulty, module: "pot-odds", pointsScored: null };

  const existing = await prisma.trainingHand.findFirst({
    where,
    orderBy: { createdAt: "desc" },
  });

  if (existing?.potSize && existing?.betSize) {
    return { handId: existing.id, potSize: existing.potSize, betSize: existing.betSize };
  }

  const { potSize, betSize } = generatePotOddsScenario(difficulty);

  const hand = await prisma.trainingHand.create({
    data: {
      userId: userId ?? undefined,
      ...(guestId && { guestId } as any),
      module: "pot-odds",
      difficulty,
      potSize,
      betSize,
    },
  });

  return { handId: hand.id, potSize, betSize };
}

export async function submitPotOddsGuess(handId: string, guessIndex: number): Promise<{
  requiredEquity: number;
  pointsScored: number;
  unlockedDifficulty: number | null;
  progress: { count: number; total: number; windowSize: number; unlockThreshold: number; maxPoints: number };
}> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  const hand = await prisma.trainingHand.findUnique({ where: { id: handId } });
  if (!hand?.potSize || !hand?.betSize) throw new Error("Hand not found");

  const isOwner = userId ? hand.userId === userId : guestId && hand.guestId === guestId;
  if (!isOwner) throw new Error("Unauthorized");

  const requiredEquity = hand.betSize / (hand.potSize + 2 * hand.betSize);
  const points = hand.difficulty === 1
    ? scorePotOddsBeginnerGuess(guessIndex, requiredEquity)
    : scoreGuess(guessIndex, requiredEquity, hand.difficulty);

  const { progressWindowSize, unlockThreshold, maxProgressPoints, leakBaseMinutes } = await getAppConfig();
  const stageMs = getStageNextAvailableMS(leakBaseMinutes);

  const repetitionUpdate =
    userId && points < 3
      ? { repetitionStage: 1, repetitionAvailableAt: new Date(Date.now() + stageMs[1]) }
      : {};

  await prisma.trainingHand.update({
    where: { id: handId },
    data: { actualEquity: requiredEquity, pointsScored: points, ...repetitionUpdate },
  });

  if (!userId) {
    const guestHands = await prisma.trainingHand.findMany({
      where: { guestId, difficulty: hand.difficulty, module: "pot-odds", pointsScored: { not: null } },
      orderBy: { createdAt: "desc" },
      take: progressWindowSize,
      select: { pointsScored: true },
    });
    const guestTotal = guestHands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
    return { requiredEquity, pointsScored: points, unlockedDifficulty: null, progress: { count: guestHands.length, total: guestTotal, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints } };
  }

  const unlockedDifficulty = await checkAndUnlock(userId, hand.difficulty, "pot-odds");

  const recentHands = await prisma.trainingHand.findMany({
    where: { userId, difficulty: hand.difficulty, module: "pot-odds", pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: progressWindowSize,
    select: { pointsScored: true },
  });
  const progressTotal = recentHands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);

  return { requiredEquity, pointsScored: points, unlockedDifficulty, progress: { count: recentHands.length, total: progressTotal, windowSize: progressWindowSize, unlockThreshold, maxPoints: maxProgressPoints } };
}

export async function getCorrectAnswer(handId: string): Promise<number> {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) throw new Error("Unauthorized");

  const hand = await prisma.trainingHand.findUnique({ where: { id: handId } });
  if (!hand) throw new Error("Hand not found");

  const classCount = CLASS_COUNTS[hand.difficulty] ?? 10;

  if (hand.potSize && hand.betSize) {
    const equity = hand.betSize / (hand.potSize + 2 * hand.betSize);
    return Math.min(Math.floor(equity * classCount), classCount - 1);
  }

  const heroCards = [
    { rank: hand.heroCard1Rank!, suit: hand.heroCard1Suit! },
    { rank: hand.heroCard2Rank!, suit: hand.heroCard2Suit! },
  ];
  const communityCards = hand.flopCard1Rank
    ? [
        { rank: hand.flopCard1Rank, suit: hand.flopCard1Suit! },
        { rank: hand.flopCard2Rank!, suit: hand.flopCard2Suit! },
        { rank: hand.flopCard3Rank!, suit: hand.flopCard3Suit! },
        ...(hand.turnCardRank ? [{ rank: hand.turnCardRank, suit: hand.turnCardSuit! }] : []),
        ...(hand.riverCardRank ? [{ rank: hand.riverCardRank, suit: hand.riverCardSuit! }] : []),
      ]
    : [];
  const simsByDifficulty: Record<number, number> = { 1: 1000, 2: 2000, 3: 5000, 4: 20000 };
  const simulations = simsByDifficulty[hand.difficulty] ?? 1000;
  const equity = calculateEquity(heroCards, hand.villainRange!, communityCards, simulations);
  return Math.min(Math.floor(equity * classCount), classCount - 1);
}
