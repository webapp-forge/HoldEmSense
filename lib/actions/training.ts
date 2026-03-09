"use server";

import { prisma } from "../prisma";
import { drawCards } from "../deck";
import { calculateEquity } from "../equity";
import { auth } from "../auth";
import { drawHeroCards, getProfileForModule } from "../heroProfiles";

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

export async function getOrCreateHand(difficulty: number = 1, handModule: string = "preflop") {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const existing = await prisma.trainingHand.findFirst({
    where: { userId: session.user.id, difficulty, module: handModule, pointsScored: null },
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
      userId: session.user.id,
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
  if (!session?.user?.id) throw new Error("Not authenticated");

  const hand = await prisma.trainingHand.findUnique({ where: { id: handId } });
  if (!hand) throw new Error("Hand not found");
  if (hand.userId !== session.user.id) throw new Error("Unauthorized");

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

  await prisma.trainingHand.update({
    where: { id: handId },
    data: { actualEquity: equity, pointsScored: points },
  });

  const unlockedDifficulty = await checkAndUnlock(session.user.id, hand.difficulty, hand.module);

  const recentHands = await prisma.trainingHand.findMany({
    where: { userId: session.user.id, difficulty: hand.difficulty, module: hand.module, pointsScored: { not: null } },
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

export async function getUnlockedDifficulties(handModule: string = "preflop"): Promise<number[]> {
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

export async function getHandProgress(difficulty: number, handModule: string = "preflop"): Promise<{ count: number; total: number }> {
  const session = await auth();
  if (!session?.user?.id) return { count: 0, total: 0 };

  const hands = await prisma.trainingHand.findMany({
    where: { userId: session.user.id, difficulty, module: handModule, pointsScored: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { pointsScored: true },
  });

  const total = hands.reduce((sum, h) => sum + (h.pointsScored ?? 0), 0);
  return { count: hands.length, total };
}
