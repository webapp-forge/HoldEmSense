"use client";

import { useTranslations } from "next-intl";

const CLASS_STEPS: Record<number, number> = { 1: 20, 2: 10, 3: 5, 4: 2 };

export function getEquityClasses(difficulty: number): string[] {
  const step = CLASS_STEPS[difficulty] ?? 10;
  return Array.from({ length: 100 / step }, (_, i) => `${i * step}–${(i + 1) * step}%`);
}

export function getCorrectIndex(equity: number, difficulty: number): number {
  const step = CLASS_STEPS[difficulty] ?? 10;
  const count = 100 / step;
  return Math.min(Math.floor((equity * 100) / step), count - 1);
}

export function getPresetCorrectIndex(actualEquity: number, presetEquities: number[]): number {
  return presetEquities.reduce((best, eq, i) =>
    Math.abs(eq - actualEquity) < Math.abs(presetEquities[best] - actualEquity) ? i : best, 0
  );
}

type Props = {
  difficulty: number;
  guessed: number | null;
  calculating: boolean;
  actualEquity: number | null;
  onGuess: (i: number) => void;
  sliderValue: number;
  onSliderChange: (v: number) => void;
  prompt: string;
  /** When provided, show these fixed buttons instead of class-based buttons/slider */
  presetLabels?: string[];
  presetEquities?: number[];
};

export default function EquityGuessPanel({
  difficulty,
  guessed,
  calculating,
  actualEquity,
  onGuess,
  sliderValue,
  onSliderChange,
  prompt,
  presetLabels,
  presetEquities,
}: Props) {
  const t = useTranslations("train");

  if (presetLabels && presetEquities) {
    const correctIdx = actualEquity !== null ? getPresetCorrectIndex(actualEquity, presetEquities) : null;
    return (
      <div>
        <p className="text-sm text-gray-400 mb-3">{prompt}</p>
        <div className="flex flex-wrap gap-2">
          {presetLabels.map((label, i) => {
            const isGuessed = guessed === i;
            const isCorrect = correctIdx === i;
            return (
              <button
                key={i}
                onClick={() => onGuess(i)}
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
      </div>
    );
  }

  const equityClasses = getEquityClasses(difficulty);
  const useSlider = difficulty >= 3;

  return (
    <div>
      <p className="text-sm text-gray-400 mb-3">{prompt}</p>
      {useSlider ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={equityClasses.length - 1}
              step={1}
              value={sliderValue}
              onChange={(e) => onSliderChange(Number(e.target.value))}
              disabled={guessed !== null}
              className="flex-1 accent-lime-500"
            />
            <span className="text-white font-medium w-20 text-right">
              {equityClasses[sliderValue]}
            </span>
          </div>
          {guessed === null && !calculating && (
            <button
              onClick={() => onGuess(sliderValue)}
              className="self-start px-4 py-2 bg-lime-600 hover:bg-lime-500 rounded text-sm font-medium"
            >
              {t("submit")}
            </button>
          )}
          {guessed !== null && !calculating && actualEquity !== null && (
            <div className="flex gap-2 flex-wrap text-sm">
              <span
                className={`px-3 py-1 rounded font-medium ${
                  guessed === getCorrectIndex(actualEquity, difficulty) ? "bg-lime-600" : "bg-red-700"
                }`}
              >
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
                onClick={() => onGuess(i)}
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
  );
}
