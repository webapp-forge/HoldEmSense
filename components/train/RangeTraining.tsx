"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import AchievementToast from "@/components/AchievementToast";
import { AchievementKey } from "@/lib/achievementConfig";
import DifficultySelector from "./DifficultySelector";
import TrainPageLayout from "./TrainPageLayout";
import HandDecisionCard from "./HandDecisionCard";
import PokerTable6max from "./PokerTable6max";
import KeyFoundToast from "../KeyFoundToast";
import { getSkillCardByModule, getDependentCards, TEXT_COLOR } from "./skillCardConfig";
import type { Role } from "./trainNavConfig";
import {
  getOrCreateRangeRound,
  submitRangeAnswers,
  getUnlockedRangeDifficulties,
  getRangeProgress,
} from "@/lib/actions/rangeTraining";
import { generateCardsForHandType } from "@/lib/ranges/handSelection";
import { POSITION_OPEN_PERCENT } from "@/lib/ranges/positionRanges";

type RoundState = {
  roundId: string;
  position: string;
  handTypes: string[];
  cards: [{ rank: string; suit: string }, { rank: string; suit: string }][];
  difficulty: number;
};

export default function RangeTraining({
  role,
  isAdmin,
  fourColor = false,
}: {
  role: Role;
  isAdmin: boolean;
  fourColor?: boolean;
}) {
  const t = useTranslations("rangeTraining");
  const tt = useTranslations("train");
  const tc = useTranslations("skillCards");
  const td = useTranslations("difficulty");
  const router = useRouter();
  const skillCard = getSkillCardByModule("preflop-ranges");

  const [difficulty, setDifficulty] = useState(1);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<number[]>([1]);
  const [round, setRound] = useState<RoundState | null>(null);
  const [selections, setSelections] = useState<boolean[]>(Array(8).fill(false));
  const [revealed, setRevealed] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState<boolean[]>([]);
  const [pointsScored, setPointsScored] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [calculating, setCalculating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<{
    count: number;
    total: number;
    windowSize: number;
    unlockThreshold: number;
    maxPoints: number;
  } | null>(null);
  const [newUnlock, setNewUnlock] = useState<number | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<AchievementKey[]>([]);
  const [keyFound, setKeyFound] = useState<{ label: string; color: string } | null>(null);
  const [progressDifficulty, setProgressDifficulty] = useState(1);

  useEffect(() => {
    getUnlockedRangeDifficulties().then((unlocked) => {
      setUnlockedDifficulties(unlocked);
      const highest = unlocked[unlocked.length - 1];
      setDifficulty(highest);
      startNewRound(highest);
    });
  }, []);

  useEffect(() => {
    getRangeProgress(progressDifficulty).then(setProgress);
  }, [progressDifficulty]);

  async function startNewRound(diff: number) {
    setLoading(true);
    setRevealed(false);
    setSelections(Array(8).fill(false));
    setPointsScored(null);
    setCorrectAnswers([]);
    setCorrectCount(0);

    const data = await getOrCreateRangeRound(diff);
    if (data) {
      const cards = data.handTypes.map((ht) => generateCardsForHandType(ht));
      setRound({ ...data, cards });
      setProgressDifficulty(diff);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!round || calculating) return;
    setCalculating(true);

    const result = await submitRangeAnswers(round.roundId, selections);
    if (!result) {
      setCalculating(false);
      return;
    }

    setCorrectAnswers(result.correctAnswers);
    setPointsScored(result.pointsScored);
    setCorrectCount(result.correctCount);
    setRevealed(true);
    setProgress(result.progress);

    if (result.newAchievements?.length) {
      setAchievementQueue((q) => [...q, ...(result.newAchievements as AchievementKey[])]);
    }

    const refreshed = await getUnlockedRangeDifficulties();
    const newlyUnlocked = refreshed.find((d) => !unlockedDifficulties.includes(d));
    if (newlyUnlocked) setNewUnlock(newlyUnlocked);
    if (newlyUnlocked === 2 && skillCard) {
      const dependents = getDependentCards(skillCard.id);
      if (dependents.length > 0) {
        const dep = dependents[0];
        setKeyFound({
          label: tc(dep.labelKey as Parameters<typeof tc>[0]),
          color: TEXT_COLOR[dep.tags.street],
        });
      }
    }
    setUnlockedDifficulties(refreshed);

    setCalculating(false);
    router.refresh();
  }

  if (loading) {
    return (
      <>
        <AchievementToast queue={achievementQueue} onDismiss={(key) => setAchievementQueue((q) => q.filter((k) => k !== key))} />
        <div className="text-gray-400 text-center py-10">{t("dealing")}</div>
      </>
    );
  }

  if (!round) {
    return <div className="text-red-400 text-center py-10">{t("error")}</div>;
  }

  const positionPercent = POSITION_OPEN_PERCENT[round.position as keyof typeof POSITION_OPEN_PERCENT];

  return (
    <>
      <AchievementToast
        queue={achievementQueue}
        onDismiss={(key) => setAchievementQueue((q) => q.filter((k) => k !== key))}
      />
      <KeyFoundToast
        moduleLabel={keyFound?.label ?? null}
        streetColor={keyFound?.color}
        onDismiss={() => setKeyFound(null)}
      />
      <TrainPageLayout
        info={
          <div className="space-y-4">
            <PokerTable6max heroPosition={round.position} />
            <div className="text-center">
              <p className="text-lg font-bold">{t(`position${round.position}` as any)}</p>
              {revealed && (
                <p className="text-sm text-gray-400 mt-1">
                  {t("openingRange", { percent: positionPercent })}
                </p>
              )}
            </div>
          </div>
        }
        explanation={
          <div className="space-y-2 text-sm text-gray-400">
            <p>{t("explanation1")}</p>
            <p>{t("explanation2")}</p>
            <p>{t("explanation3")}</p>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-6 max-w-3xl w-full">
          {/* Title */}
          <div className="text-center">
            <h2 className={`text-xl font-bold ${skillCard ? TEXT_COLOR[skillCard.tags.street] : ""}`}>
              {skillCard ? tc(skillCard.labelKey as Parameters<typeof tc>[0]) : "Preflop Ranges"}
            </h2>
            <p className="text-gray-400 mt-1">
              {t(`position${round.position}` as any)}
            </p>
          </div>

          {/* Difficulty Selector */}
          <DifficultySelector
            difficulty={difficulty}
            unlockedDifficulties={unlockedDifficulties}
            role={role}
            onChange={(level) => {
              setDifficulty(level);
              setNewUnlock(null);
              startNewRound(level);
            }}
          />

          {/* Progress Bar */}
          {progress !== null && (
            <div className="text-sm text-gray-400 w-full max-w-xl">
              {progress.count < progress.windowSize ? (
                <>
                  <div className="flex justify-between mb-1">
                    <span>{tt("buildingWindow", { count: progress.count, window: progress.windowSize })}</span>
                    <span>{progress.total} pts</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gray-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(progress.count / progress.windowSize) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between mb-1">
                    <span>{tt("last100", { window: progress.windowSize })}</span>
                    <span className={progress.total >= progress.unlockThreshold ? "text-lime-400 font-medium" : ""}>
                      {progress.total}/{progress.maxPoints} pts
                    </span>
                  </div>
                  <div className="relative w-full bg-gray-800 rounded-full h-1.5">
                    <div
                      className="bg-lime-600 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (progress.total / progress.maxPoints) * 100)}%` }}
                    />
                    {!unlockedDifficulties.includes(difficulty + 1) && difficulty < 4 && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white opacity-40 rounded-full"
                        style={{ left: `${(progress.unlockThreshold / progress.maxPoints) * 100}%` }}
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {difficulty >= 4 || unlockedDifficulties.includes(difficulty + 1)
                      ? null
                      : progress.total >= progress.unlockThreshold
                      ? tt("readyToUnlock", { name: td(String(difficulty + 1) as any) })
                      : tt("ptsNeeded", { pts: progress.unlockThreshold - progress.total, name: td(String(difficulty + 1) as any) })}
                  </p>
                </>
              )}
            </div>
          )}

          {/* Instruction */}
          <p className="text-sm text-gray-400">{t("selectHands")}</p>

          {/* 5 Hand Cards */}
          <div className="flex flex-wrap justify-center gap-3">
            {round.handTypes.map((ht, i) => (
              <HandDecisionCard
                key={`${round.roundId}-${i}`}
                handType={ht}
                cards={round.cards[i]}
                selected={selections[i]}
                revealed={revealed}
                isCorrectPlay={revealed ? correctAnswers[i] : false}
                fourColor={fourColor}
                onToggle={() => {
                  if (!revealed) {
                    const next = [...selections];
                    next[i] = !next[i];
                    setSelections(next);
                  }
                }}
              />
            ))}
          </div>

          {/* Submit / Score / Next */}
          {!revealed ? (
            <button
              onClick={handleSubmit}
              disabled={calculating}
              className="bg-lime-600 hover:bg-lime-500 text-white font-semibold py-3 px-8 rounded-lg text-lg disabled:opacity-50 transition-colors"
            >
              {calculating ? t("evaluating") : t("submit")}
            </button>
          ) : (
            <div className="flex flex-col items-center gap-4">
              {/* Score display */}
              <div className={`text-lg font-bold ${pointsScored === 3 ? "text-lime-400" : pointsScored === 1 ? "text-yellow-400" : "text-red-400"}`}>
                {correctCount}/8 — +{pointsScored} pts
              </div>

              <button
                onClick={() => startNewRound(difficulty)}
                className="bg-lime-600 hover:bg-lime-500 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors"
              >
                {t("nextRound")}
              </button>
            </div>
          )}

          {/* Unlock notification */}
          {newUnlock && (
            <div className="bg-lime-900 border border-lime-600 rounded p-3 text-lime-300 text-sm">
              {tt("unlocked")}: <strong>{td(String(newUnlock) as any)}</strong>!
            </div>
          )}
        </div>
      </TrainPageLayout>
    </>
  );
}
