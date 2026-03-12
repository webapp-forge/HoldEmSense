"use client";

import { useEffect, useState } from "react";
import { getNextRepetitionHand, submitRepetitionGuess } from "../../lib/actions/training";
import { useTranslations } from "next-intl";
import CardComponent from "../Card";
import TrainPageLayout from "./TrainPageLayout";
import RangeMatrix from "./RangeMatrix";
import EquityGuessPanel, { getCorrectIndex } from "./EquityGuessPanel";

const MODULE_LABEL: Record<string, string> = {
  preflop: "Hand vs Range",
  flop: "Flop: Hand vs Range",
  turn: "Turn: Hand vs Range",
  river: "River: Hand vs Range",
  "pot-odds": "Pot Odds",
};

// Beginner Pot Odds presets — must match BEGINNER_POT_ODDS_PRESETS in training.ts
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
  25 / 150,
  30 / 150,
  50 / 200,
  60 / 210,
  100 / 300,
  150 / 400,
  200 / 500,
];

const MEMO_HINTS: { maxFraction: number; label: string }[] = [
  { maxFraction: 0.27, label: "Quarter-Pot ≈ 17% benötigt" },
  { maxFraction: 0.37, label: "Drittel-Pot = 20% benötigt" },
  { maxFraction: 0.60, label: "Half-Pot = immer 25% benötigt" },
  { maxFraction: 0.85, label: "Zwei-Drittel-Pot ≈ 29% benötigt" },
  { maxFraction: 1.15, label: "Pot-Bet = immer 33% benötigt" },
  { maxFraction: 1.65, label: "1,5x Pot = 37,5% benötigt" },
  { maxFraction: 2.5, label: "2x Pot = 40% benötigt" },
];

function getMemoHint(potSize: number, betSize: number): string | null {
  const fraction = betSize / potSize;
  return MEMO_HINTS.find((h) => fraction <= h.maxFraction)?.label ?? null;
}

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
};

export default function LeakTraining() {
  const t = useTranslations("train");
  const tl = useTranslations("leakFixing");
  const td = useTranslations("difficulty");

  const [hand, setHand] = useState<HandState | null>(null);
  const [empty, setEmpty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guessed, setGuessed] = useState<number | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    loadNextHand();
  }, []);

  async function loadNextHand() {
    setLoading(true);
    setGuessed(null);
    setResult(null);
    setSliderValue(0);
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
    const res = await submitRepetitionGuess(hand.handId, classIndex);
    setResult({
      equity: res.equity,
      pointsScored: res.pointsScored,
      correct: res.correct,
      prevStage: hand.stage,
      newStage: res.newStage,
    });
    setCalculating(false);
    window.dispatchEvent(new Event("leak-processed"));
  }

  if (loading) return <div className="text-gray-400">{t("dealing")}</div>;

  if (empty) {
    return (
      <TrainPageLayout info={null} explanation={null}>
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2 className="text-xl font-bold">{tl("title")}</h2>
          <p className="text-gray-400">{tl("noLeaks")}</p>
        </div>
      </TrainPageLayout>
    );
  }

  if (!hand) return null;

  const isPotOdds = hand.module === "pot-odds";

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

  const actualEquity = result?.equity ?? null;

  return (
    <TrainPageLayout
      info={isPotOdds ? null : <RangeMatrix villainRange={hand.villainRange} heroCards={hand.heroCards} />}
      explanation={null}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold">{tl("title")}</h2>
          <p className="text-gray-500 text-sm mt-0.5">{MODULE_LABEL[hand.module] ?? hand.module}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            {!isPotOdds && (
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
              <span className="text-gray-400">Pot</span>
              <span className="text-white font-semibold">{hand.potSize} BB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Villain bet</span>
              <span className="text-white font-semibold">{hand.betSize} BB</span>
            </div>
            <div className="flex justify-between border-t border-gray-700 mt-2 pt-2">
              <span className="text-gray-400">Dein Call</span>
              <span className="text-white font-semibold">{hand.betSize} BB</span>
            </div>
          </div>
        )}

        {/* Community cards (equity modules) */}
        {!isPotOdds && hand.flopCards && (
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
              <div style={{ marginLeft: "1.3rem" }}>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Turn</p>
                <CardComponent rank={hand.turnCard.rank} suit={hand.turnCard.suit} />
              </div>
            )}
            {hand.riverCard && (
              <div style={{ marginLeft: "1.3rem" }}>
                <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">River</p>
                <CardComponent rank={hand.riverCard.rank} suit={hand.riverCard.suit} />
              </div>
            )}
          </div>
        )}

        {/* Hero cards (equity modules only) */}
        {!isPotOdds && (
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Your hand</p>
            <div className="flex gap-2">
              {hand.heroCards.map((card, i) => (
                <CardComponent key={i} rank={card.rank} suit={card.suit} />
              ))}
            </div>
          </div>
        )}

        <EquityGuessPanel
          difficulty={hand.difficulty}
          guessed={guessed}
          calculating={calculating}
          actualEquity={actualEquity}
          onGuess={handleGuess}
          sliderValue={sliderValue}
          onSliderChange={setSliderValue}
          prompt={isPotOdds ? "Wie viel Equity brauchst du mindestens?" : t("whatIsYourEquity")}
          presetLabels={isPotOdds && hand.difficulty === 1 ? BEGINNER_PRESET_LABELS : undefined}
          presetEquities={isPotOdds && hand.difficulty === 1 ? BEGINNER_PRESET_EQUITIES : undefined}
        />

        {calculating && <div className="text-gray-400 text-sm">{t("calculating")}</div>}

        {result && !calculating && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {result.pointsScored === 3 && <span className="text-lime-400 font-bold text-lg">{t("perfect")}</span>}
              {result.pointsScored === 1 && <span className="text-yellow-400 font-bold text-lg">{t("close")}</span>}
              {result.pointsScored === 0 && <span className="text-red-400 font-bold text-lg">{t("miss")}</span>}
              <span className="text-gray-400 text-sm">
                {isPotOdds ? "Benötigte Equity" : t("actualEquity")}:{" "}
                <span className="text-white font-medium">{(result.equity * 100).toFixed(1)}%</span>
              </span>
            </div>

            {isPotOdds && hand.potSize && hand.betSize && (() => {
              const hint = getMemoHint(hand.potSize, hand.betSize);
              return hint ? <p className="text-xs text-gray-500">{hint}</p> : null;
            })()}

            <div
              className={`text-sm px-3 py-2 rounded ${
                result.newStage === 4
                  ? "bg-lime-900 border border-lime-600 text-lime-300"
                  : result.correct
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              {stageMessage(result)}
              {nextAvailableMessage(result) && (
                <span className="ml-2 text-gray-500">{nextAvailableMessage(result)}</span>
              )}
            </div>

            <button
              onClick={loadNextHand}
              className="self-start px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
            >
              {tl("nextHand")}
            </button>
          </div>
        )}
      </div>
    </TrainPageLayout>
  );
}
