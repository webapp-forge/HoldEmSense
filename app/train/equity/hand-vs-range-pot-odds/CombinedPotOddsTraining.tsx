"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AchievementToast from "@/components/AchievementToast";
import { AchievementKey } from "@/lib/achievementConfig";
import {
  getOrCreateCombinedHand,
  submitCombinedGuess,
  submitCombinedDecision,
  getUnlockedDifficulties,
  getHandProgress,
  getCorrectAnswer,
} from "../../../../lib/actions/training";
import { useTranslations } from "next-intl";
import CardComponent from "../../../../components/Card";
import TrainPageLayout from "../../../../components/train/TrainPageLayout";
import RangeMatrix from "../../../../components/train/RangeMatrix";
import DifficultySelector from "../../../../components/train/DifficultySelector";
import EquityGuessPanel from "../../../../components/train/EquityGuessPanel";
import HeroHand from "../../../../components/train/HeroHand";
import GlossaryLink from "../../../../components/glossary/GlossaryLink";
import { getMemoHint } from "../../../../components/train/potOddsHints";
import { getSkillCardByModule, getDependentCards, TEXT_COLOR, KEY_COLOR } from "../../../../components/train/skillCardConfig";
import KeyFoundToast from "../../../../components/KeyFoundToast";

type Role = "guest" | "registered" | "premium";

type HandState = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  flopCards?: { rank: string; suit: string }[];
  turnCard?: { rank: string; suit: string } | null;
  riverCard?: { rank: string; suit: string } | null;
  villainRange: number;
  potSize: number;
  betSize: number;
  difficulty: number;
};

type DecisionResult = {
  totalPoints: number;
  equityPoints: number;
  decisionPoints: number;
  isBreakeven: boolean;
};

export default function CombinedPotOddsTraining({
  role,
  isAdmin,
  fourColor = false,
}: {
  role: Role;
  isAdmin: boolean;
  fourColor?: boolean;
}) {
  const t = useTranslations("train");
  const tc = useTranslations("combinedPotOdds");
  const tsc = useTranslations("skillCards");
  const td = useTranslations("difficulty");
  const skillCard = getSkillCardByModule("combined-pot-odds");
  const router = useRouter();

  const [difficulty, setDifficulty] = useState(1);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<number[]>([1]);
  const [hand, setHand] = useState<HandState | null>(null);

  // Step 1: equity guess
  const [equityGuessed, setEquityGuessed] = useState<number | null>(null);
  const [actualEquity, setActualEquity] = useState<number | null>(null);
  const [requiredEquity, setRequiredEquity] = useState<number | null>(null);
  const [equityPoints, setEquityPoints] = useState<number | null>(null);

  // Step 2: call/fold decision
  const [callDecision, setCallDecision] = useState<"call" | "fold" | null>(null);
  const [decisionResult, setDecisionResult] = useState<DecisionResult | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const [progress, setProgress] = useState<{
    count: number; total: number; windowSize: number; unlockThreshold: number; maxPoints: number;
  } | null>(null);
  const [newUnlock, setNewUnlock] = useState<number | null>(null);
  const [achievementQueue, setAchievementQueue] = useState<AchievementKey[]>([]);
  const [keyFound, setKeyFound] = useState<{ label: string; color: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    getUnlockedDifficulties("combined-pot-odds").then((unlocked) => {
      setUnlockedDifficulties(unlocked);
      const highest = unlocked[unlocked.length - 1];
      setDifficulty(highest);
      startNewHand(highest);
    });
  }, []);

  const progressDifficulty = hand?.difficulty ?? difficulty;
  useEffect(() => {
    getHandProgress(progressDifficulty, "combined-pot-odds").then((p) => {
      setProgress(p);
      if (p.count >= p.windowSize && p.total >= p.unlockThreshold) {
        getUnlockedDifficulties("combined-pot-odds").then(setUnlockedDifficulties);
      }
    });
  }, [progressDifficulty]);

  async function startNewHand(diff?: number) {
    const d = diff ?? difficulty;
    setLoading(true);
    setEquityGuessed(null);
    setActualEquity(null);
    setRequiredEquity(null);
    setEquityPoints(null);
    setCallDecision(null);
    setDecisionResult(null);
    setNewUnlock(null);
    setSliderValue(0);
    const result = await getOrCreateCombinedHand(d);
    setHand({ ...result, difficulty: d });
    setLoading(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEquityGuess(classIndex: number) {
    if (equityGuessed !== null || !hand || calculating) return;
    setEquityGuessed(classIndex);
    setCalculating(true);
    const result = await submitCombinedGuess(hand.handId, classIndex);
    setActualEquity(result.equity);
    setRequiredEquity(result.requiredEquity);
    setEquityPoints(result.equityPoints);
    setCalculating(false);
  }

  async function handleDecision(decision: "call" | "fold") {
    if (!hand || submittingDecision || callDecision !== null) return;
    setCallDecision(decision);
    setSubmittingDecision(true);
    const result = await submitCombinedDecision(hand.handId, decision === "call");
    setDecisionResult({
      totalPoints: result.totalPoints,
      equityPoints: result.equityPoints,
      decisionPoints: result.decisionPoints,
      isBreakeven: result.isBreakeven,
    });
    setProgress(result.progress);
    if (result.newAchievements?.length)
      setAchievementQueue((q) => [...q, ...result.newAchievements as AchievementKey[]]);
    const refreshed = await getUnlockedDifficulties("combined-pot-odds");
    const newlyUnlocked = refreshed.find((d) => !unlockedDifficulties.includes(d));
    if (newlyUnlocked) setNewUnlock(newlyUnlocked);
    if (newlyUnlocked === 2 && skillCard) {
      const dependents = getDependentCards(skillCard.id);
      if (dependents.length > 0) {
        const dep = dependents[0];
        setKeyFound({
          label: tsc(dep.labelKey as Parameters<typeof tsc>[0]),
          color: KEY_COLOR[dep.tags.street],
        });
      }
    }
    setUnlockedDifficulties(refreshed);
    router.refresh();
    setSubmittingDecision(false);
  }

  if (loading || !hand) return <div className="text-gray-400">{t("dealing")}</div>;

  const showDecisionStep = equityGuessed !== null && !calculating && actualEquity !== null && requiredEquity !== null;
  // For display before server result: derive correct decision client-side
  const correctDecision: "call" | "fold" = actualEquity !== null && requiredEquity !== null && actualEquity >= requiredEquity ? "call" : "fold";

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
        info={<RangeMatrix villainRange={hand.villainRange} heroCards={hand.heroCards} />}
        explanation={
          <div className="space-y-2">
            <p>
              Du siehst deine Hand und die Community-Karten. Schätze zuerst deine{" "}
              <GlossaryLink slug="equity/what-is-equity">Equity</GlossaryLink> gegen die{" "}
              <GlossaryLink slug="ranges/what-is-a-range">Range</GlossaryLink> des Villains.
            </p>
            <p>
              Dann siehst du Pot und Bet — und entscheidest: Call oder Fold? Vergleiche deine
              geschätzte Equity mit der benötigten Mindest-Equity.
            </p>
            <p className="text-gray-500 text-xs">
              Raise ist hier keine Option — das Modul trainiert gezielt, nicht zu viel oder zu wenig
              zu folden. Setze einen Call gleich mit „Es ist sinnvoll, in der Hand zu bleiben",
              unabhängig davon ob Call oder Raise die bessere Aktion wäre.
              Implied Odds und Bluffs bleiben hier außen vor.
            </p>
          </div>
        }
      >
        <div className="flex flex-col items-center gap-6 max-w-2xl w-full">
          <div className="text-center">
            <h2 className={`text-xl font-bold ${skillCard ? TEXT_COLOR[skillCard.tags.street] : ""}`}>
              {skillCard ? tsc(skillCard.labelKey as Parameters<typeof tsc>[0]) : tc("title")}
            </h2>
            <p className="text-gray-400 mt-1">
              Villain range: Top <span className="text-white font-semibold">{hand.villainRange}%</span>
            </p>
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
            <div className="text-sm text-gray-400 w-full max-w-md">
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

          {/* Community cards */}
          {hand.flopCards && (
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <div>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Flop</p>
                <div className="flex gap-2">
                  {hand.flopCards.map((card, i) => (
                    <CardComponent key={i} rank={card.rank} suit={card.suit} fourColor={fourColor} />
                  ))}
                </div>
              </div>
              {hand.turnCard && (
                <div style={{ marginLeft: "1.3rem" }}>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Turn</p>
                  <CardComponent rank={hand.turnCard.rank} suit={hand.turnCard.suit} fourColor={fourColor} />
                </div>
              )}
              {hand.riverCard && (
                <div style={{ marginLeft: "1.3rem" }}>
                  <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">River</p>
                  <CardComponent rank={hand.riverCard.rank} suit={hand.riverCard.suit} fourColor={fourColor} />
                </div>
              )}
            </div>
          )}

          <HeroHand cards={hand.heroCards} fourColor={fourColor} />

          {/* Step 1: equity guess */}
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 text-center">{tc("step1")}</p>
            <EquityGuessPanel
              difficulty={difficulty}
              guessed={equityGuessed}
              calculating={calculating}
              actualEquity={actualEquity}
              onGuess={handleEquityGuess}
              sliderValue={sliderValue}
              onSliderChange={setSliderValue}
              prompt={t("whatIsYourEquity")}
              onAdminGuess={isAdmin ? async () => {
                const idx = await getCorrectAnswer(hand.handId);
                handleEquityGuess(idx);
              } : undefined}
            />
          </div>

          {calculating && <div className="text-gray-400 text-sm">{t("calculating")}</div>}

          {/* Step 1 result + Step 2 */}
          {showDecisionStep && (
            <>
              {/* Equity result */}
              <div className="flex items-center gap-4 flex-wrap">
                {equityPoints === 2 && <span className="text-lime-400 font-bold text-lg">{tc("equityExact")}</span>}
                {equityPoints === 1 && <span className="text-yellow-400 font-bold text-lg">{tc("equityClose")}</span>}
                {equityPoints === 0 && <span className="text-red-400 font-bold text-lg">{tc("equityMiss")}</span>}
                <span className="text-gray-400 text-sm">
                  {t("actualEquity")}:{" "}
                  <span className="text-white font-medium">{(actualEquity! * 100).toFixed(1)}%</span>
                </span>
              </div>

              {/* Step 2: pot odds + call/fold */}
              <div className="border-t border-gray-700 pt-4 flex flex-col gap-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider text-center">{tc("step2")}</p>

                <div className="bg-gray-900 border border-gray-700 rounded-lg px-5 py-4 flex flex-col gap-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">{tc("potInclBet")}</span>
                    <span className="text-white font-semibold">{hand.potSize + hand.betSize} BB</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 mt-2 pt-2">
                    <span className="text-gray-400">{tc("yourCall")}</span>
                    <span className="text-white font-semibold">{hand.betSize} BB</span>
                  </div>
                </div>

                {callDecision === null ? (
                  <div className="flex justify-center gap-3">
                    <button
                      onClick={() => handleDecision("call")}
                      className="px-6 py-2 bg-gray-700 hover:bg-lime-700 rounded text-sm font-medium transition-colors"
                    >
                      {tc("call")}
                    </button>
                    <button
                      onClick={() => handleDecision("fold")}
                      className="px-6 py-2 bg-gray-700 hover:bg-red-800 rounded text-sm font-medium transition-colors"
                    >
                      {tc("fold")}
                    </button>
                  </div>
                ) : decisionResult === null ? (
                  <div className="text-gray-400 text-sm">{t("calculating")}</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      {decisionResult.isBreakeven ? (
                        <span className="text-yellow-400 font-medium">{tc("breakevenZone")}</span>
                      ) : decisionResult.decisionPoints === 1 ? (
                        <span className="text-lime-400 font-medium">{tc("decisionCorrect")}</span>
                      ) : (
                        <span className="text-red-400 font-medium">{tc("decisionWrong")}</span>
                      )}
                      <span className="text-gray-400 text-sm">
                        {tc("requiredEquity")}:{" "}
                        <span className="text-white font-medium">{(requiredEquity! * 100).toFixed(1)}%</span>
                      </span>
                    </div>

                    {(() => {
                      const hint = getMemoHint(hand.potSize, hand.betSize);
                      return hint ? <p className="text-xs text-gray-500">{hint}</p> : null;
                    })()}

                    {!decisionResult.isBreakeven && decisionResult.decisionPoints === 0 && (
                      <p className="text-sm text-gray-400">
                        {correctDecision === "call"
                          ? tc("shouldHaveCalledDetail", { equity: (actualEquity! * 100).toFixed(1) })
                          : tc("shouldHaveFoldedDetail", { equity: (actualEquity! * 100).toFixed(1) })}
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      {tc("totalPoints", { pts: decisionResult.totalPoints })}
                    </p>
                  </div>
                )}
              </div>

              {newUnlock && (
                <div className="bg-lime-900 border border-lime-600 rounded p-3 text-lime-300 text-sm">
                  {t("unlocked")}: <strong>{td(String(newUnlock))}</strong>!
                </div>
              )}

              {/* Next hand: only after call/fold decision result received */}
              {decisionResult !== null && (
                <button
                  onClick={() => startNewHand()}
                  className="self-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                >
                  {t("nextHand")}
                </button>
              )}
            </>
          )}
        </div>
      </TrainPageLayout>
    </>
  );
}
