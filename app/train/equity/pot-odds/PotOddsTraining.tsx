"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreatePotOddsHand, submitPotOddsGuess, getUnlockedDifficulties, getHandProgress } from "../../../../lib/actions/training";
import { useTranslations } from "next-intl";
import TrainPageLayout from "../../../../components/train/TrainPageLayout";
import DifficultySelector from "../../../../components/train/DifficultySelector";
import GlossaryLink from "../../../../components/glossary/GlossaryLink";
import { getMemoHint } from "../../../../components/train/potOddsHints";

type Role = "guest" | "registered" | "premium";

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

// Beginner Pot Odds: 7 fixed canonical scenarios (must match server-side BEGINNER_POT_ODDS_PRESETS)
const BEGINNER_PRESET_LABELS = [
  "16,7%",
  "20,0%",
  "25,0%",
  "28,6%",
  "33,3%",
  "37,5%",
  "40,0%",
];

const BEGINNER_PRESET_EQUITIES = [
  25 / 150,   // ≈ 16.67%
  30 / 150,   // = 20%
  50 / 200,   // = 25%
  60 / 210,   // ≈ 28.57%
  100 / 300,  // ≈ 33.33%
  150 / 400,  // = 37.5%
  200 / 500,  // = 40%
];

function getBeginnerCorrectIndex(requiredEquity: number): number {
  return BEGINNER_PRESET_EQUITIES.reduce((best, eq, i) =>
    Math.abs(eq - requiredEquity) < Math.abs(BEGINNER_PRESET_EQUITIES[best] - requiredEquity) ? i : best, 0
  );
}


type HandState = { handId: string; potSize: number; betSize: number; difficulty: number };

export default function PotOddsTraining({ role, isAdmin }: { role: Role; isAdmin: boolean }) {
  const t = useTranslations("train");
  const td = useTranslations("difficulty");
  const router = useRouter();
  const [difficulty, setDifficulty] = useState(1);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<number[]>([1]);
  const [hand, setHand] = useState<HandState | null>(null);
  const [guessed, setGuessed] = useState<number | null>(null);
  const [requiredEquity, setRequiredEquity] = useState<number | null>(null);
  const [pointsScored, setPointsScored] = useState<number | null>(null);
  const [progress, setProgress] = useState<{ count: number; total: number; windowSize: number; unlockThreshold: number; maxPoints: number } | null>(null);
  const [newUnlock, setNewUnlock] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    getUnlockedDifficulties("pot-odds").then((unlocked) => {
      setUnlockedDifficulties(unlocked);
      const highest = unlocked[unlocked.length - 1];
      setDifficulty(highest);
      startNewHand(highest);
    });
  }, []);

  const progressDifficulty = hand?.difficulty ?? difficulty;
  useEffect(() => {
    getHandProgress(progressDifficulty, "pot-odds").then(async (p) => {
      setProgress(p);
      if (p.count >= p.windowSize && p.total >= p.unlockThreshold) {
        getUnlockedDifficulties("pot-odds").then(setUnlockedDifficulties);
      }
    });
  }, [progressDifficulty]);

  async function startNewHand(diff?: number) {
    const d = diff ?? difficulty;
    setLoading(true);
    setGuessed(null);
    setRequiredEquity(null);
    setPointsScored(null);
    setNewUnlock(null);
    setSliderValue(0);
    const result = await getOrCreatePotOddsHand(d);
    setHand({ ...result, difficulty: d });
    setLoading(false);
  }

  async function handleGuess(classIndex: number) {
    if (guessed !== null || !hand || calculating) return;
    setGuessed(classIndex);
    setCalculating(true);
    const result = await submitPotOddsGuess(hand.handId, classIndex);
    setRequiredEquity(result.requiredEquity);
    setPointsScored(result.pointsScored);
    setProgress(result.progress);
    setCalculating(false);

    const refreshed = await getUnlockedDifficulties("pot-odds");
    const newlyUnlocked = refreshed.find((d) => !unlockedDifficulties.includes(d));
    if (newlyUnlocked) setNewUnlock(newlyUnlocked);
    setUnlockedDifficulties(refreshed);
    router.refresh();
  }

  const equityClasses = getEquityClasses(difficulty);
  const useSlider = difficulty >= 3;

  if (loading || !hand) return <div className="text-gray-400">{t("dealing")}</div>;

  return (
    <TrainPageLayout
      explanation={
        <div className="space-y-2">
          <p>
            Du siehst Pot-Größe und Bet-Größe eines Villains. Schätze, wie viel{" "}
            <GlossaryLink slug="equity/what-is-equity">Equity</GlossaryLink> du mindestens
            brauchst, damit ein Call langfristig profitabel ist.
          </p>
          <p>
            Die Formel:{" "}
            <span className="text-white font-mono">Dein Call ÷ (Pot inkl. Bet + Call)</span>.
            Du siehst beide Zahlen direkt im Szenario — einfach dividieren. Ziel ist ein
            Gespür für die Standardwerte — kein exaktes Rechnen am Tisch.
          </p>
          <p>
            Präge dir die Werte für die typischen Bet-Größen gut ein. Wenn du weißt, dass ein
            Pot-Bet immer 33,3% erfordert und ein Half-Pot immer 25%, kannst du später bei
            krummen Bets schnell eine gute Näherung bilden — ohne zu rechnen.
          </p>
        </div>
      }
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold">Pot Odds</h2>
          <p className="text-gray-400 mt-1 text-sm">Wie viel Equity brauchst du zum Callen?</p>
        </div>

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

        {/* Progress bar */}
        {progress !== null && (
          <div className="text-sm text-gray-400">
            {progress.count < progress.windowSize ? (
              <>
                <div className="flex justify-between mb-1">
                  <span>{t("buildingWindow", { count: progress.count, window: progress.windowSize })}</span>
                  <span>{progress.total} pts</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gray-500 h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${(progress.count / progress.windowSize) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t("handsToActivate", { count: progress.windowSize - progress.count })}
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-between mb-1">
                  <span>{t("last100", { window: progress.windowSize })}</span>
                  <span className={progress.total >= progress.unlockThreshold ? "text-lime-400 font-medium" : ""}>
                    {progress.total}/{progress.maxPoints} pts
                  </span>
                </div>
                <div className="relative w-full bg-gray-700 rounded-full h-1.5">
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
                    ? t("readyToUnlock", { name: td(String(difficulty + 1)) })
                    : t("ptsNeeded", { pts: progress.unlockThreshold - progress.total, name: td(String(difficulty + 1)) })}
                </p>
              </>
            )}
          </div>
        )}

        {/* Scenario */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg px-5 py-4 flex flex-col gap-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Pot (inkl. Bet)</span>
            <span className="text-white font-semibold">{hand.potSize + hand.betSize} BB</span>
          </div>
          <div className="flex justify-between border-t border-gray-700 mt-2 pt-2">
            <span className="text-gray-400">Dein Call</span>
            <span className="text-white font-semibold">{hand.betSize} BB</span>
          </div>
        </div>

        {/* Cheat button (admin only) */}
        {isAdmin && guessed === null && !calculating && (
          <button
            onClick={() => {
              const eq = hand.betSize / (hand.potSize + 2 * hand.betSize);
              handleGuess(difficulty === 1 ? getBeginnerCorrectIndex(eq) : getCorrectIndex(eq, difficulty));
            }}
            className="self-start px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded text-xs font-medium text-red-200"
          >
            Guess Right
          </button>
        )}

        {/* Guess buttons / slider */}
        <div>
          <p className="text-sm text-gray-400 mb-3">Wie viel Equity brauchst du mindestens?</p>
          {difficulty === 1 ? (
            <div className="flex flex-wrap gap-2">
              {BEGINNER_PRESET_LABELS.map((label, i) => {
                const correctIdx = requiredEquity !== null ? getBeginnerCorrectIndex(requiredEquity) : null;
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
          ) : useSlider ? (
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
              {guessed !== null && !calculating && requiredEquity !== null && (
                <div className="flex gap-2 flex-wrap text-sm">
                  <span className={`px-3 py-1 rounded font-medium ${guessed === getCorrectIndex(requiredEquity, difficulty) ? "bg-lime-600" : "bg-red-700"}`}>
                    Deine Schätzung: {equityClasses[guessed]}
                  </span>
                  {guessed !== getCorrectIndex(requiredEquity, difficulty) && (
                    <span className="px-3 py-1 rounded font-medium bg-lime-600">
                      Richtig: {equityClasses[getCorrectIndex(requiredEquity, difficulty)]}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equityClasses.map((label, i) => {
                const correctIdx = requiredEquity !== null ? getCorrectIndex(requiredEquity, difficulty) : null;
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

        {calculating && <div className="text-gray-400 text-sm">{t("calculating")}</div>}

        {pointsScored !== null && !calculating && requiredEquity !== null && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {pointsScored === 3 && <span className="text-lime-400 font-bold text-lg">{t("perfect")}</span>}
              {pointsScored === 1 && <span className="text-yellow-400 font-bold text-lg">{t("close")}</span>}
              {pointsScored === 0 && <span className="text-red-400 font-bold text-lg">{t("miss")}</span>}
              <span className="text-gray-400 text-sm">
                Benötigte Equity:{" "}
                <span className="text-white font-medium">{(requiredEquity * 100).toFixed(1)}%</span>
              </span>
            </div>

            {/* Memo hint */}
            {(() => {
              const hint = getMemoHint(hand.potSize, hand.betSize);
              return hint ? (
                <p className="text-xs text-gray-500">{hint}</p>
              ) : null;
            })()}

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
