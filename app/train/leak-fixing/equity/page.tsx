"use client";

import { useEffect, useState } from "react";
import { getNextRepetitionHand, submitRepetitionGuess } from "../../../../lib/actions/training";
import { useTranslations } from "next-intl";
import CardComponent from "../../../../components/Card";
import TrainPageLayout from "../../../../components/train/TrainPageLayout";
import RangeMatrix from "../../../../components/train/RangeMatrix";

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

const MODULE_LABEL: Record<string, string> = {
  preflop: "Hand vs Range",
  flop: "Flop: Hand vs Range",
  turn: "Turn: Hand vs Range",
  river: "River: Hand vs Range",
};

type HandState = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  flopCards?: { rank: string; suit: string }[];
  turnCard?: { rank: string; suit: string };
  riverCard?: { rank: string; suit: string };
  villainRange: number;
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

export default function EquityLeaksPage() {
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
    setResult({ equity: res.equity, pointsScored: res.pointsScored, correct: res.correct, prevStage: hand.stage, newStage: res.newStage });
    setCalculating(false);
  }

  if (loading) return <div className="text-gray-400">{t("dealing")}</div>;

  if (empty) {
    return (
      <TrainPageLayout info={null} explanation={null}>
        <div className="flex flex-col gap-4 max-w-2xl">
          <h2 className="text-xl font-bold">Equity Leaks</h2>
          <p className="text-gray-400">{tl("noLeaks")}</p>
        </div>
      </TrainPageLayout>
    );
  }

  if (!hand) return null;

  const equityClasses = getEquityClasses(hand.difficulty);
  const useSlider = hand.difficulty >= 3;

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

  return (
    <TrainPageLayout
      info={<RangeMatrix villainRange={hand.villainRange} heroCards={hand.heroCards} />}
      explanation={null}
    >
      <div className="flex flex-col gap-6 max-w-2xl">
        <div>
          <h2 className="text-xl font-bold">Equity Leaks</h2>
          <p className="text-gray-500 text-sm mt-0.5">{MODULE_LABEL[hand.module] ?? hand.module}</p>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
            <span>Villain range: Top <span className="text-white font-semibold">{hand.villainRange}%</span></span>
            <span className="text-gray-600">|</span>
            <span>{td(String(hand.difficulty))}</span>
            <span className="text-gray-600">|</span>
            <span className="text-amber-400">{tl("stage", { stage: hand.stage })}</span>
          </div>
        </div>

        {/* Flop */}
        {hand.flopCards && (
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Flop</p>
            <div className="flex gap-2">
              {hand.flopCards.map((card, i) => (
                <CardComponent key={i} rank={card.rank} suit={card.suit} />
              ))}
            </div>
          </div>
        )}

        {/* Turn */}
        {hand.turnCard && (
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Turn</p>
            <div className="flex gap-2">
              <CardComponent rank={hand.turnCard.rank} suit={hand.turnCard.suit} />
            </div>
          </div>
        )}

        {/* River */}
        {hand.riverCard && (
          <div>
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">River</p>
            <div className="flex gap-2">
              <CardComponent rank={hand.riverCard.rank} suit={hand.riverCard.suit} />
            </div>
          </div>
        )}

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
              {guessed !== null && !calculating && result && (
                <div className="flex gap-2 flex-wrap text-sm">
                  <span className={`px-3 py-1 rounded font-medium ${guessed === getCorrectIndex(result.equity, hand.difficulty) ? "bg-lime-600" : "bg-red-700"}`}>
                    Your guess: {equityClasses[guessed]}
                  </span>
                  {guessed !== getCorrectIndex(result.equity, hand.difficulty) && (
                    <span className="px-3 py-1 rounded font-medium bg-lime-600">
                      Correct: {equityClasses[getCorrectIndex(result.equity, hand.difficulty)]}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equityClasses.map((label, i) => {
                const correctIdx = result ? getCorrectIndex(result.equity, hand.difficulty) : null;
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

        {result && !calculating && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {result.pointsScored === 3 && <span className="text-lime-400 font-bold text-lg">{t("perfect")}</span>}
              {result.pointsScored === 1 && <span className="text-yellow-400 font-bold text-lg">{t("close")}</span>}
              {result.pointsScored === 0 && <span className="text-red-400 font-bold text-lg">{t("miss")}</span>}
              <span className="text-gray-400 text-sm">
                {t("actualEquity")}: <span className="text-white font-medium">{(result.equity * 100).toFixed(1)}%</span>
              </span>
            </div>

            <div className={`text-sm px-3 py-2 rounded ${result.newStage === 4 ? "bg-lime-900 border border-lime-600 text-lime-300" : result.correct ? "bg-gray-800 text-gray-300" : "bg-gray-800 text-gray-400"}`}>
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
