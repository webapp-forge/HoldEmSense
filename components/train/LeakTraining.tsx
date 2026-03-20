"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getNextRepetitionHand,
  submitRepetitionGuess,
  submitRepetitionCombinedEquity,
  submitRepetitionCombinedDecision,
  getCorrectAnswer,
} from "../../lib/actions/training";
import { useTranslations } from "next-intl";
import AchievementToast from "@/components/AchievementToast";
import { AchievementKey } from "@/lib/achievementConfig";
import CardComponent from "../Card";
import TrainPageLayout from "./TrainPageLayout";
import RangeMatrix from "./RangeMatrix";
import EquityGuessPanel from "./EquityGuessPanel";
import { getMemoHint } from "./potOddsHints";
import { getSkillCardByModule, TEXT_COLOR } from "./skillCardConfig";
import HeroHand from "./HeroHand";

// Beginner Pot Odds presets — must match BEGINNER_POT_ODDS_PRESETS in training.ts
const BEGINNER_PRESET_LABELS = ["16,7%", "20,0%", "25,0%", "28,6%", "33,3%", "37,5%", "40,0%"];
const BEGINNER_PRESET_EQUITIES = [25/150, 30/150, 50/200, 60/210, 100/300, 150/400, 200/500];

type HandState = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  flopCards?: { rank: string; suit: string }[];
  turnCard?: { rank: string; suit: string };
  riverCard?: { rank: string; suit: string };
  villainRange: number;
  potSize?: number;
  betSize?: number;
  difficulty: number;
  stage: number;
  module: string;
};

type Result = {
  equity: number;
  pointsScored: number;
  correct: boolean;
  prevStage: number;
  newStage: number;
  // Combined only:
  decisionPoints?: number;
  isBreakeven?: boolean;
};

type CombinedEquityResult = {
  equity: number;
  equityPoints: number;
  requiredEquity: number;
  potSize: number;
  betSize: number;
};

export default function LeakTraining({ fourColor = false, isAdmin = false }: { fourColor?: boolean; isAdmin?: boolean }) {
  const t = useTranslations("train");
  const tc = useTranslations("combinedPotOdds");
  const tl = useTranslations("leakFixing");
  const tsc = useTranslations("skillCards");
  const router = useRouter();
  const td = useTranslations("difficulty");

  const [hand, setHand] = useState<HandState | null>(null);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guessed, setGuessed] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [achievementQueue, setAchievementQueue] = useState<AchievementKey[]>([]);
  // Combined only:
  const [combinedEquityResult, setCombinedEquityResult] = useState<CombinedEquityResult | null>(null);
  const [callDecision, setCallDecision] = useState<"call" | "fold" | null>(null);
  const [submittingDecision, setSubmittingDecision] = useState(false);

  useEffect(() => {
    loadNextHand();
  }, []);

  async function loadNextHand() {
    setLoading(true);
    setGuessed(null);
    setResult(null);
    setSliderValue(0);
    setCombinedEquityResult(null);
    setCallDecision(null);
    const next = await getNextRepetitionHand();
    if (!next) {
      setHand(null);
      setEmpty(true);
    } else {
      setHand({
        handId: next.handId,
        heroCards: next.heroCards,
        flopCards: next.flopCards,
        turnCard: next.turnCard,
        riverCard: next.riverCard,
        villainRange: next.villainRange,
        potSize: next.potSize,
        betSize: next.betSize,
        difficulty: next.difficulty,
        stage: next.stage,
        module: next.module,
      });
      setEmpty(false);
    }
    setLoading(false);
  }

  async function handleGuess(classIndex: number) {
    if (guessed !== null || !hand || calculating) return;
    setGuessed(classIndex);
    setCalculating(true);

    if (hand.module === "combined-pot-odds") {
      const res = await submitRepetitionCombinedEquity(hand.handId, classIndex);
      setCombinedEquityResult(res);
      // Don't set result yet — wait for call/fold decision
    } else {
      const res = await submitRepetitionGuess(hand.handId, classIndex);
      setResult({
        equity: res.equity,
        pointsScored: res.pointsScored,
        correct: res.correct,
        prevStage: hand.stage,
        newStage: res.newStage,
      });
      if (res.newAchievements?.length) setAchievementQueue((q) => [...q, ...res.newAchievements as AchievementKey[]]);
      router.refresh();
      window.dispatchEvent(new Event("leak-processed"));
    }

    setCalculating(false);
  }

  async function handleCombinedDecision(decision: "call" | "fold") {
    if (!hand || !combinedEquityResult || callDecision !== null || submittingDecision) return;
    setCallDecision(decision);
    setSubmittingDecision(true);
    const res = await submitRepetitionCombinedDecision(hand.handId, decision === "call");
    setResult({
      equity: combinedEquityResult.equity,
      pointsScored: res.totalPoints,
      correct: res.correct,
      prevStage: hand.stage,
      newStage: res.newStage,
      decisionPoints: res.decisionPoints,
      isBreakeven: res.isBreakeven,
    });
    if (res.newAchievements?.length) setAchievementQueue((q) => [...q, ...res.newAchievements as AchievementKey[]]);
    router.refresh();
    window.dispatchEvent(new Event("leak-processed"));
    setSubmittingDecision(false);
  }

  const toast = <AchievementToast queue={achievementQueue} onDismiss={(key) => setAchievementQueue((q) => q.filter((k) => k !== key))} />;

  if (loading) return <>{toast}<div className="text-gray-400">{t("dealing")}</div></>;

  if (empty) {
    return (
      <>
        {toast}
        <TrainPageLayout info={null} explanation={null}>
          <div className="flex flex-col items-center gap-4 max-w-2xl w-full">
            <h2 className="text-xl font-bold">{tl("title")}</h2>
            <p className="text-gray-400">{tl("noLeaks")}</p>
          </div>
        </TrainPageLayout>
      </>
    );
  }

  if (!hand) return null;

  const isPotOdds = hand.module === "pot-odds";
  const isCombined = hand.module === "combined-pot-odds";

  function stageMessage(res: Result): string {
    if (res.newStage === 4) return tl("fixed");
    if (res.correct) return tl("advanced", { stage: res.newStage });
    if (res.newStage < res.prevStage) return tl("droppedTo", { stage: res.newStage });
    return tl("stayedAt", { stage: res.newStage });
  }

  function nextAvailableMessage(res: Result): string {
    if (res.newStage === 4) return "";
    if (res.newStage === 1) return tl("retryIn1h");
    if (res.newStage === 2) return tl("nextIn24h");
    return tl("nextIn7d");
  }

  // For non-combined: actual equity shown after guess; for combined: shown after submitRepetitionCombinedEquity
  const displayEquity = isCombined ? (combinedEquityResult?.equity ?? null) : (result?.equity ?? null);

  return (
    <>
    {toast}
    <TrainPageLayout
      info={isPotOdds ? null : <RangeMatrix villainRange={hand.villainRange} heroCards={hand.heroCards} />}
      explanation={null}
    >
      <div className="flex flex-col items-center gap-6 max-w-2xl w-full">
        <div className="text-center">
          {(() => {
            const sc = getSkillCardByModule(hand.module);
            return <h2 className={`text-xl font-bold ${sc ? TEXT_COLOR[sc.tags.street] : ""}`}>
              {sc ? tsc(sc.labelKey as Parameters<typeof tsc>[0]) : hand.module}
            </h2>;
          })()}
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            {(isCombined || !isPotOdds) && (
              <>
                <span>Villain range: Top <span className="text-white font-semibold">{hand.villainRange}%</span></span>
                <span className="text-gray-600">|</span>
              </>
            )}
            <span>{td(String(hand.difficulty))}</span>
            <span className="text-gray-600">|</span>
            <span className="text-amber-400">{tl("stage", { stage: hand.stage })}</span>
          </div>
        </div>

        {/* Pot odds scenario */}
        {isPotOdds && hand.potSize && hand.betSize && (
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
        )}

        {/* Community cards */}
        {(isCombined || !isPotOdds) && hand.flopCards && (
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

        {(isCombined || !isPotOdds) && (
          <HeroHand cards={hand.heroCards} fourColor={fourColor} />
        )}

        {/* Step 1 label for combined */}
        {isCombined && guessed === null && !calculating && (
          <p className="text-xs text-gray-500 -mt-3">{tc("step1")}</p>
        )}

        <EquityGuessPanel
          difficulty={hand.difficulty}
          guessed={guessed}
          calculating={calculating}
          actualEquity={displayEquity}
          onGuess={handleGuess}
          sliderValue={sliderValue}
          onSliderChange={setSliderValue}
          prompt={isPotOdds ? tc("requiredEquity") + "?" : t("whatIsYourEquity")}
          presetLabels={isPotOdds && hand.difficulty === 1 ? BEGINNER_PRESET_LABELS : undefined}
          presetEquities={isPotOdds && hand.difficulty === 1 ? BEGINNER_PRESET_EQUITIES : undefined}
          onAdminGuess={isAdmin ? async () => {
            const idx = await getCorrectAnswer(hand.handId);
            handleGuess(idx);
          } : undefined}
        />

        {calculating && <div className="text-gray-400 text-sm">{t("calculating")}</div>}

        {/* Combined Step 1 result + Step 2 */}
        {isCombined && combinedEquityResult !== null && !calculating && (
          <>
            <div className="flex items-center gap-4 flex-wrap">
              {combinedEquityResult.equityPoints === 2 && <span className="text-lime-400 font-bold text-lg">{tc("equityExact")}</span>}
              {combinedEquityResult.equityPoints === 1 && <span className="text-yellow-400 font-bold text-lg">{tc("equityClose")}</span>}
              {combinedEquityResult.equityPoints === 0 && <span className="text-red-400 font-bold text-lg">{tc("equityMiss")}</span>}
              <span className="text-gray-400 text-sm">
                {t("actualEquity")}:{" "}
                <span className="text-white font-medium">{(combinedEquityResult.equity * 100).toFixed(1)}%</span>
              </span>
            </div>

            <div className="border-t border-gray-700 pt-4 flex flex-col gap-4">
              <p className="text-xs text-gray-500 uppercase tracking-wider">{tc("step2")}</p>

              <div className="bg-gray-900 border border-gray-700 rounded-lg px-5 py-4 flex flex-col gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">{tc("potInclBet")}</span>
                  <span className="text-white font-semibold">{combinedEquityResult.potSize + combinedEquityResult.betSize} BB</span>
                </div>
                <div className="flex justify-between border-t border-gray-700 mt-2 pt-2">
                  <span className="text-gray-400">{tc("yourCall")}</span>
                  <span className="text-white font-semibold">{combinedEquityResult.betSize} BB</span>
                </div>
              </div>

              {callDecision === null && result === null ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleCombinedDecision("call")}
                    className="px-6 py-2 bg-gray-700 hover:bg-lime-700 rounded text-sm font-medium transition-colors"
                  >
                    {tc("call")}
                  </button>
                  <button
                    onClick={() => handleCombinedDecision("fold")}
                    className="px-6 py-2 bg-gray-700 hover:bg-red-800 rounded text-sm font-medium transition-colors"
                  >
                    {tc("fold")}
                  </button>
                </div>
              ) : submittingDecision ? (
                <div className="text-gray-400 text-sm">{t("calculating")}</div>
              ) : result !== null && (
                <div className="flex flex-col gap-1">
                  {result.isBreakeven
                    ? <span className="text-yellow-400 font-medium text-sm">{tc("breakevenZone")}</span>
                    : result.decisionPoints === 1
                    ? <span className="text-lime-400 font-medium text-sm">{tc("decisionCorrect")}</span>
                    : <span className="text-red-400 font-medium text-sm">{tc("decisionWrong")}</span>}
                  <span className="text-gray-400 text-sm">
                    {tc("requiredEquity")}:{" "}
                    <span className="text-white font-medium">{(combinedEquityResult.requiredEquity * 100).toFixed(1)}%</span>
                  </span>
                  {(() => { const hint = getMemoHint(combinedEquityResult.potSize, combinedEquityResult.betSize); return hint ? <p className="text-xs text-gray-500">{hint}</p> : null; })()}
                </div>
              )}
            </div>
          </>
        )}

        {/* Non-combined result */}
        {!isCombined && result && !calculating && (
          <div className="flex items-center gap-4 flex-wrap">
            {result.pointsScored === 3 && <span className="text-lime-400 font-bold text-lg">{t("perfect")}</span>}
            {result.pointsScored === 1 && <span className="text-yellow-400 font-bold text-lg">{t("close")}</span>}
            {result.pointsScored === 0 && <span className="text-red-400 font-bold text-lg">{t("miss")}</span>}
            <span className="text-gray-400 text-sm">
              {isPotOdds ? tc("requiredEquity") : t("actualEquity")}:{" "}
              <span className="text-white font-medium">{(result.equity * 100).toFixed(1)}%</span>
            </span>
            {isPotOdds && hand.potSize && hand.betSize && (() => {
              const hint = getMemoHint(hand.potSize, hand.betSize);
              return hint ? <p className="text-xs text-gray-500 w-full">{hint}</p> : null;
            })()}
          </div>
        )}

        {/* Stage feedback + next button — shown after result for all modules */}
        {result !== null && !submittingDecision && (
          <div className="flex flex-col gap-3">
            <div className={`text-sm px-3 py-2 rounded ${
              result.newStage === 4
                ? "bg-lime-900 border border-lime-600 text-lime-300"
                : result.correct
                ? "bg-gray-800 text-gray-300"
                : "bg-gray-800 text-gray-400"
            }`}>
              {stageMessage(result)}
              {nextAvailableMessage(result) && (
                <span className="ml-2 text-gray-500">{nextAvailableMessage(result)}</span>
              )}
            </div>
            <button
              onClick={loadNextHand}
              className="self-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
            >
              {tl("nextHand")}
            </button>
          </div>
        )}
      </div>
    </TrainPageLayout>
    </>
  );
}
