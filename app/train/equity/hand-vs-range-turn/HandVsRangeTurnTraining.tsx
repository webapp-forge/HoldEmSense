"use client";

import { useEffect, useState } from "react";
import { getOrCreateHand, submitGuess, getUnlockedDifficulties, getHandProgress } from "../../../../lib/actions/training";
import { useTranslations } from "next-intl";
import CardComponent from "../../../../components/Card";
import TrainPageLayout from "../../../../components/train/TrainPageLayout";
import RangeMatrix from "../../../../components/train/RangeMatrix";
import DifficultySelector from "../../../../components/train/DifficultySelector";

const MODULE = "turn";

const CLASS_STEPS: Record<number, number> = { 1: 20, 2: 10, 3: 5, 4: 2 };

function getEquityClasses(difficulty: number): string[] {
  const step = CLASS_STEPS[difficulty] ?? 10;
  return Array.from({ length: 100 / step }, (_, i) => `${i * step}–${(i + 1) * step}%`);
}

function getCorrectIndex(equity: number, difficulty: number): number {
  const step = CLASS_STEPS[difficulty] ?? 10;
  const count = 100 / step;
  return Math.min(Math.floor((equity * 100) / step), count - 1);
}

type HandState = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  flopCards: { rank: string; suit: string }[];
  turnCard: { rank: string; suit: string } | null;
  villainRange: number;
  difficulty: number;
};

type Role = "guest" | "registered" | "premium";

export default function HandVsRangeTurnTraining({ role }: { role: Role }) {
  const t = useTranslations("train");
  const td = useTranslations("difficulty");
  const [difficulty, setDifficulty] = useState(1);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<number[]>([1]);
  const [hand, setHand] = useState<HandState | null>(null);
  const [guessed, setGuessed] = useState<number | null>(null);
  const [actualEquity, setActualEquity] = useState<number | null>(null);
  const [pointsScored, setPointsScored] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ count: number; total: number } | null>(null);
  const [newUnlock, setNewUnlock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    getUnlockedDifficulties(MODULE).then(setUnlockedDifficulties);
    startNewHand(1);
  }, []);

  const progressDifficulty = hand?.difficulty ?? difficulty;
  useEffect(() => {
    getHandProgress(progressDifficulty, MODULE).then(setProgress);
  }, [progressDifficulty]);

  async function startNewHand(diff?: number) {
    const d = diff ?? difficulty;
    setLoading(true);
    setGuessed(null);
    setActualEquity(null);
    setPointsScored(null);
    setNewUnlock(null);
    setSliderValue(0);
    const result = await getOrCreateHand(d, MODULE);
    setHand({
      ...result,
      flopCards: result.flopCards ?? [],
      turnCard: result.turnCard ?? null,
      difficulty: d,
    });
    setLoading(false);
  }

  async function handleGuess(classIndex: number) {
    if (guessed !== null || !hand || calculating) return;
    setGuessed(classIndex);
    setCalculating(true);
    const result = await submitGuess(hand.handId, classIndex);
    setActualEquity(result.equity);
    setPointsScored(result.pointsScored);
    setProgress(result.progress);
    setCalculating(false);

    if (result.unlockedDifficulty) {
      const newDiff = result.unlockedDifficulty;
      setNewUnlock(newDiff);
      setUnlockedDifficulties((prev) => [...prev, newDiff].sort());
    }
  }

  const equityClasses = getEquityClasses(difficulty);
  const useSlider = difficulty >= 3;

  if (loading || !hand) return <div className="text-gray-400">{t("dealing")}</div>;

  return (
    <TrainPageLayout
      info={<RangeMatrix villainRange={hand.villainRange} heroCards={hand.heroCards} />}
      explanation={<p>Estimate your hand&apos;s equity on the turn. With one card to come, equity becomes more defined.</p>}
    >
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-xl font-bold">Turn: Hand vs Range</h2>
        <p className="text-gray-400 mt-1">
          Villain range: Top <span className="text-white font-semibold">{hand.villainRange}%</span>
        </p>
      </div>

      {/* Difficulty selector */}
      <DifficultySelector
        difficulty={difficulty}
        unlockedDifficulties={unlockedDifficulties}
        role={role}
        onChange={(level) => {
          setDifficulty(level);
          setNewUnlock(null);
          startNewHand(level);
        }}
      />

      {/* Progress */}
      {progress !== null && (
        <div className="text-sm text-gray-400">
          {progress.count < 100 ? (
            <>
              <div className="flex justify-between mb-1">
                <span>{t("buildingWindow", { count: progress.count })}</span>
                <span>{progress.total} pts</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-gray-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${(progress.count / 100) * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t("handsToActivate", { count: 100 - progress.count })}
              </p>
            </>
          ) : (
            <>
              <div className="flex justify-between mb-1">
                <span>{t("last100")}</span>
                <span className={progress.total >= 250 ? "text-lime-400 font-medium" : ""}>
                  {progress.total}/300 pts
                </span>
              </div>
              <div className="relative w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-lime-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (progress.total / 300) * 100)}%` }}
                />
                {!unlockedDifficulties.includes(difficulty + 1) && difficulty < 4 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 bg-white opacity-40 rounded-full"
                    style={{ left: `${(250 / 300) * 100}%` }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {difficulty >= 4 || unlockedDifficulties.includes(difficulty + 1)
                  ? null
                  : progress.total >= 250
                  ? t("readyToUnlock", { name: td(String(difficulty + 1)) })
                  : t("ptsNeeded", { pts: 250 - progress.total, name: td(String(difficulty + 1)) })
                }
              </p>
            </>
          )}
        </div>
      )}

      {/* Flop + Turn */}
      <div style={{ display: "flex", alignItems: "flex-end" }}>
        <div>
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Flop</p>
          <div className="flex gap-2">
            {hand.flopCards.map((card, i) => (
              <CardComponent key={i} rank={card.rank} suit={card.suit} />
            ))}
          </div>
        </div>
        {hand.turnCard && (
          <div style={{ marginLeft: "2rem" }}>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Turn</p>
            <CardComponent rank={hand.turnCard.rank} suit={hand.turnCard.suit} />
          </div>
        )}
      </div>

      {/* Hero cards */}
      <div>
        <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Your hand</p>
        <div className="flex gap-2">
          {hand.heroCards.map((card, i) => (
            <CardComponent key={i} rank={card.rank} suit={card.suit} />
          ))}
        </div>
      </div>

      {/* Equity guess */}
      <div>
        <p className="text-sm text-gray-400 mb-3">{t("whatIsYourEquity")}</p>
        {useSlider ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={0}
                max={equityClasses.length - 1}
                step={1}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                disabled={guessed !== null}
                className="flex-1 accent-lime-500"
              />
              <span className="text-white font-medium w-20 text-right">
                {equityClasses[sliderValue]}
              </span>
            </div>
            {guessed === null && !calculating && (
              <button
                onClick={() => handleGuess(sliderValue)}
                className="self-start px-4 py-2 bg-lime-600 hover:bg-lime-500 rounded text-sm font-medium"
              >
                {t("submit")}
              </button>
            )}
            {guessed !== null && !calculating && actualEquity !== null && (
              <div className="flex gap-2 flex-wrap text-sm">
                <span className={`px-3 py-1 rounded font-medium ${guessed === getCorrectIndex(actualEquity, difficulty) ? "bg-lime-600" : "bg-red-700"}`}>
                  Your guess: {equityClasses[guessed]}
                </span>
                {guessed !== getCorrectIndex(actualEquity, difficulty) && (
                  <span className="px-3 py-1 rounded font-medium bg-lime-600">
                    Correct: {equityClasses[getCorrectIndex(actualEquity, difficulty)]}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {equityClasses.map((label, i) => {
              const correctIdx = actualEquity !== null ? getCorrectIndex(actualEquity, difficulty) : null;
              const isGuessed = guessed === i;
              const isCorrect = correctIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => handleGuess(i)}
                  disabled={guessed !== null || calculating}
                  className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                    guessed === null || calculating
                      ? "bg-gray-700 hover:bg-gray-600"
                      : isCorrect
                      ? "bg-lime-600"
                      : isGuessed
                      ? "bg-red-700"
                      : "bg-gray-800 opacity-50"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result */}
      {calculating && <div className="text-gray-400 text-sm">{t("calculating")}</div>}

      {pointsScored !== null && !calculating && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4 flex-wrap">
            {pointsScored === 3 && <span className="text-lime-400 font-bold text-lg">{t("perfect")}</span>}
            {pointsScored === 1 && <span className="text-yellow-400 font-bold text-lg">{t("close")}</span>}
            {pointsScored === 0 && <span className="text-red-400 font-bold text-lg">{t("miss")}</span>}
            <span className="text-gray-400 text-sm">
              {t("actualEquity")}: <span className="text-white font-medium">{(actualEquity! * 100).toFixed(1)}%</span>
            </span>
          </div>

          {newUnlock && (
            <div className="bg-lime-900 border border-lime-600 rounded p-3 text-lime-300 text-sm">
              {t("unlocked")}: <strong>{td(String(newUnlock))}</strong>!
            </div>
          )}

          <button
            onClick={() => startNewHand()}
            className="self-start px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
          >
            {t("nextHand")}
          </button>
        </div>
      )}
    </div>
    </TrainPageLayout>
  );
}
