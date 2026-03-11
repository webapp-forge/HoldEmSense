"use server";

import { prisma } from "../prisma";
import { drawCards } from "../deck";
import { calculateEquity } from "../equity";
import { auth } from "../auth";
import { drawHeroCards, getProfileForModule } from "../heroProfiles";
import { cookies } from "next/headers";

const CLASS_COUNTS: Record<number, number> = { 1: 5, 2: 10, 3: 20, 4: 50 };

const PROGRESS_MODULE: Record<string, string> = {
  preflop: "hand-vs-range",
  flop: "hand-vs-range-flop",
  turn: "hand-vs-range-turn",
  river: "hand-vs-range-river",
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

  const hands = await prisma.trainingHand.findMany({
    where: { userId, difficulty, module: handModule, pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { pointsScored: true },
  });

  if (hands.length < 100) return null;

  const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
  if (total < 250) return null;

  const progressModule = PROGRESS_MODULE[handModule] ?? handModule;
  const nextDifficulty = difficulty + 1;
  try {
    await prisma.userProgress.create({
      data: { userId, module: progressModule, difficulty: nextDifficulty },
    });
    return nextDifficulty;
  } catch {
    return null; // Already unlocked
  }
}

type HandResult = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  villainRange: number;
  flopCards: { rank: string; suit: string }[] | undefined;
  turnCard: { rank: string; suit: string } | undefined;
  riverCard: { rank: string; suit: string } | undefined;
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
        { rank: existing.heroCard1Rank, suit: existing.heroCard1Suit },
        { rank: existing.heroCard2Rank, suit: existing.heroCard2Suit },
      ],
      villainRange: existing.villainRange,
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
    { rank: hand.heroCard1Rank, suit: hand.heroCard1Suit },
    { rank: hand.heroCard2Rank, suit: hand.heroCard2Suit },
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
  const equity = calculateEquity(heroCards, hand.villainRange, communityCards, simulations);
  const points = scoreGuess(guess, equity, hand.difficulty);

  const repetitionUpdate =
    points < 3
      ? { repetitionStage: 1, repetitionAvailableAt: new Date(Date.now() + 60 * 60 * 1000) }
      : {};

  await prisma.trainingHand.update({
    where: { id: handId },
    data: { actualEquity: equity, pointsScored: points, ...repetitionUpdate },
  });

  if (!userId) {
    const guestHands = await prisma.trainingHand.findMany({
      where: { guestId, difficulty: hand.difficulty, module: hand.module, pointsScored: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { pointsScored: true },
    });
    const guestTotal = guestHands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
    return { equity, pointsScored: points, unlockedDifficulty: null, progress: { count: guestHands.length, total: guestTotal } };
  }

  const unlockedDifficulty = await checkAndUnlock(userId, hand.difficulty, hand.module);

  const recentHands = await prisma.trainingHand.findMany({
    where: { userId, difficulty: hand.difficulty, module: hand.module, pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { pointsScored: true },
  });
  const progressTotal = recentHands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);

  return {
    equity,
    pointsScored: points,
    unlockedDifficulty,
    progress: { count: recentHands.length, total: progressTotal },
  };
}

export async function getUnlockedDifficulties(handModule: string): Promise<number[]> {
  const session = await auth();
  if (!session?.user?.id) return [1];

  const progressModule = PROGRESS_MODULE[handModule] ?? handModule;
  const progress = await prisma.userProgress.findMany({
    where: { userId: session.user.id, module: progressModule },
    select: { difficulty: true },
  });

  const unlocked = new Set([1, ...progress.map((p) => p.difficulty)]);
  return Array.from(unlocked).sort((a, b) => a - b);
}

const STAGE_NEXT_AVAILABLE_MS: Record<number, number> = {
  1: 60 * 60 * 1000,           // 1h
  2: 24 * 60 * 60 * 1000,      // 24h
  3: 7 * 24 * 60 * 60 * 1000,  // 7d
};

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

export async function getNextRepetitionHand(): Promise<HandResult & { stage: number; difficulty: number; module: string } | null> {
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
    heroCards: [
      { rank: hand.heroCard1Rank, suit: hand.heroCard1Suit },
      { rank: hand.heroCard2Rank, suit: hand.heroCard2Suit },
    ],
    villainRange: hand.villainRange,
    flopCards,
    turnCard,
    riverCard,
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
  const points = scoreGuess(guess, equity, hand.difficulty);
  const correct = points === 3; // Only a perfect hit advances the stage

  let newStage: number;
  let newAvailableAt: Date | null;

  if (correct) {
    newStage = stage + 1; // 2, 3, or 4 (done)
    newAvailableAt = newStage <= 3 ? new Date(Date.now() + STAGE_NEXT_AVAILABLE_MS[newStage]) : null;
  } else {
    newStage = Math.max(stage - 1, 1);
    newAvailableAt = new Date(Date.now() + STAGE_NEXT_AVAILABLE_MS[newStage]);
  }

  await prisma.trainingHand.update({
    where: { id: handId },
    data: { repetitionStage: newStage, repetitionAvailableAt: newAvailableAt },
  });

  return { equity, pointsScored: points, correct, newStage };
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

export async function getHandProgress(difficulty: number, handModule: string): Promise<{ count: number; total: number }> {
  const session = await auth();
  const userId = session?.user?.id ?? null;
  const guestId = userId ? null : ((await cookies()).get("guestId")?.value ?? null);

  if (!userId && !guestId) return { count: 0, total: 0 };

  const where = userId
    ? { userId, difficulty, module: handModule, pointsScored: { not: null } }
    : { guestId, difficulty, module: handModule, pointsScored: { not: null } };

  const hands = await prisma.trainingHand.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { pointsScored: true },
  });

  const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
  return { count: hands.length, total };
}
