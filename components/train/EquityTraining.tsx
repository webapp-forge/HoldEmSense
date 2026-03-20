"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AchievementToast from "@/components/AchievementToast";
import { AchievementKey } from "@/lib/achievementConfig";
import {
  getOrCreateHand,
  submitGuess,
  getUnlockedDifficulties,
  getHandProgress,
  getCorrectAnswer,
} from "../../lib/actions/training";
import { useTranslations } from "next-intl";
import CardComponent from "../Card";
import TrainPageLayout from "./TrainPageLayout";
import RangeMatrix from "./RangeMatrix";
import DifficultySelector from "./DifficultySelector";
import GlossaryLink from "../glossary/GlossaryLink";
import MatrixTip from "./MatrixTip";
import EquityGuessPanel, { getCorrectIndex } from "./EquityGuessPanel";
import { getSkillCardByModule, getDependentCards, TEXT_COLOR, KEY_COLOR } from "./skillCardConfig";
import KeyFoundToast from "../KeyFoundToast";
import { detectThumbRules, type ThumbRule } from "../../lib/thumbRules";
import HeroHand from "./HeroHand";

type Role = "guest" | "registered" | "premium";

type HandState = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  flopCards?: { rank: string; suit: string }[];
  turnCard?: { rank: string; suit: string } | null;
  riverCard?: { rank: string; suit: string } | null;
  villainRange: number;
  villainCards?: { rank: string; suit: string }[];
  difficulty: number;
};


function ThumbRulePanel({
  heroCards,
  villainCards,
  revealed,
}: {
  heroCards: { rank: string; suit: string }[];
  villainCards: { rank: string; suit: string }[];
  revealed: boolean;
}) {
  const t = useTranslations("thumbRules");
  if (!revealed) return null;
  const rules = detectThumbRules(heroCards, villainCards);
  if (rules.length === 0) {
    return <p className="text-gray-500 text-sm italic">{t("noRule")}</p>;
  }
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500 uppercase tracking-wider">{t("title")}</p>
      {rules.map((rule) => (
        <div key={rule.key} className="bg-gray-800 border border-gray-700 rounded p-3 text-sm flex justify-between items-center">
          <span className="text-gray-200">{t(rule.key as Parameters<typeof t>[0])}</span>
          <span className="text-white font-semibold ml-3">{rule.approxEquity}</span>
        </div>
      ))}
    </div>
  );
}

function ModuleExplanation({ handModule }: { handModule: string }) {
  const t = useTranslations("moduleExplanation");

  const glossary = {
    equity: (chunks: React.ReactNode) => <GlossaryLink slug="equity/what-is-equity">{chunks}</GlossaryLink>,
    range: (chunks: React.ReactNode) => <GlossaryLink slug="ranges/what-is-a-range">{chunks}</GlossaryLink>,
    topX: (chunks: React.ReactNode) => <GlossaryLink slug="ranges/top-x-percent">{chunks}</GlossaryLink>,
    eqRange: (chunks: React.ReactNode) => <GlossaryLink slug="equity/equity-vs-range">{chunks}</GlossaryLink>,
  };

  switch (handModule) {
    case "hand-vs-hand":
      return (
        <div className="space-y-2">
          <p>{t.rich("handVsHand1", glossary)}</p>
          <p>{t.rich("handVsHand2", glossary)}</p>
          <p>{t.rich("handVsHand3", glossary)}</p>
          <p>{t.rich("handVsHand4", glossary)}</p>
        </div>
      );
    case "preflop":
      return (
        <div className="space-y-2">
          <p>{t.rich("preflop1", glossary)}</p>
          <p>{t.rich("preflop2", glossary)}</p>
          <MatrixTip />
        </div>
      );
    case "flop":
      return (
        <div className="space-y-2">
          <p>{t.rich("flop1", glossary)}</p>
          <p>{t.rich("flop2", glossary)}</p>
          <MatrixTip />
        </div>
      );
    case "turn":
      return (
        <div className="space-y-2">
          <p>{t.rich("turn1", glossary)}</p>
          <p>{t.rich("turn2", glossary)}</p>
          <MatrixTip />
        </div>
      );
    case "river":
      return (
        <div className="space-y-2">
          <p>{t.rich("river1", glossary)}</p>
          <p>{t.rich("river2", glossary)}</p>
          <MatrixTip />
        </div>
      );
    default:
      return null;
  }
}

export default function EquityTraining({
  handModule,
  role,
  isAdmin,
  fourColor = false,
}: {
  handModule: string;
  role: Role;
  isAdmin: boolean;
  fourColor?: boolean;
}) {
  const t = useTranslations("train");
  const tc = useTranslations("skillCards");
  const td = useTranslations("difficulty");
  const router = useRouter();
  const skillCard = getSkillCardByModule(handModule);
  const [difficulty, setDifficulty] = useState(1);
  const [unlockedDifficulties, setUnlockedDifficulties] = useState<number[]>([1]);
  const [hand, setHand] = useState<HandState | null>(null);
  const [guessed, setGuessed] = useState<number | null>(null);
  const [actualEquity, setActualEquity] = useState<number | null>(null);
  const [pointsScored, setPointsScored] = useState<number | null>(null);
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
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  useEffect(() => {
    getUnlockedDifficulties(handModule).then((unlocked) => {
      setUnlockedDifficulties(unlocked);
      const highest = unlocked[unlocked.length - 1];
      setDifficulty(highest);
      startNewHand(highest);
    });
  }, []);

  const progressDifficulty = hand?.difficulty ?? difficulty;
  useEffect(() => {
    getHandProgress(progressDifficulty, handModule).then(async (p) => {
      setProgress(p);
      if (p.count >= p.windowSize && p.total >= p.unlockThreshold) {
        getUnlockedDifficulties(handModule).then(setUnlockedDifficulties);
      }
    });
  }, [progressDifficulty]);

  async function startNewHand(diff?: number) {
    const d = diff ?? difficulty;
    setLoading(true);
    setLoadError(false);
    setGuessed(null);
    setActualEquity(null);
    setPointsScored(null);
    setNewUnlock(null);
    setSliderValue(0);
    try {
      const result = await getOrCreateHand(d, handModule);
      setHand({ ...result, difficulty: d });
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleGuess(classIndex: number) {
    if (guessed !== null || !hand || calculating) return;
    setGuessed(classIndex);
    setCalculating(true);
    const result = await submitGuess(hand.handId, classIndex);
    setActualEquity(result.equity);
    setPointsScored(result.pointsScored);
    setProgress(result.progress);
    if (result.newAchievements?.length) setAchievementQueue((q) => [...q, ...result.newAchievements as AchievementKey[]]);
    setCalculating(false);

    const refreshed = await getUnlockedDifficulties(handModule);
    const newlyUnlocked = refreshed.find((d) => !unlockedDifficulties.includes(d));
    if (newlyUnlocked) setNewUnlock(newlyUnlocked);
    if (newlyUnlocked === 2 && skillCard) {
      const dependents = getDependentCards(skillCard.id);
      if (dependents.length > 0) {
        const dep = dependents[0];
        setKeyFound({
          label: tc(dep.labelKey as Parameters<typeof tc>[0]),
          color: KEY_COLOR[dep.tags.street],
        });
      }
    }
    setUnlockedDifficulties(refreshed);
    router.refresh();
  }

  if (loading || (!hand && !loadError)) return (
    <>
      <AchievementToast queue={achievementQueue} onDismiss={(key) => setAchievementQueue((q) => q.filter((k) => k !== key))} />
      <div className="text-gray-400">{t("dealing")}</div>
    </>
  );

  if (loadError) return (
    <>
      <AchievementToast queue={achievementQueue} onDismiss={(key) => setAchievementQueue((q) => q.filter((k) => k !== key))} />
      <div className="text-red-400">{t("noHandsAvailable")}</div>
    </>
  );

  if (!hand) return null;

  const isHandVsHand = handModule === "hand-vs-hand";

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
        isHandVsHand
          ? <ThumbRulePanel
              heroCards={hand.heroCards}
              villainCards={hand.villainCards!}
              revealed={pointsScored !== null && !calculating}
            />
          : <RangeMatrix villainRange={hand.villainRange!} heroCards={hand.heroCards} />
      }
      explanation={<ModuleExplanation handModule={handModule} />}
    >
      <div className="flex flex-col items-center gap-6 max-w-2xl w-full">
        <div className="text-center">
          <h2 className={`text-xl font-bold ${skillCard ? TEXT_COLOR[skillCard.tags.street] : ""}`}>
            {skillCard ? tc(skillCard.labelKey as Parameters<typeof tc>[0]) : handModule}
          </h2>
          {!isHandVsHand && (
            <p className="text-gray-400 mt-1">
              Villain range: Top <span className="text-white font-semibold">{hand.villainRange}%</span>
            </p>
          )}
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

        {/* Community cards (flop/turn/river modules) */}
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

        {/* Villain cards (hand-vs-hand module) */}
        {isHandVsHand && hand.villainCards && (
          <div className="flex flex-col items-center">
            <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{t("villainHand")}</p>
            <div className="flex gap-2">
              {hand.villainCards.map((card, i) => (
                <CardComponent key={i} rank={card.rank} suit={card.suit} fourColor={fourColor} />
              ))}
            </div>
          </div>
        )}

        <HeroHand cards={hand.heroCards} fourColor={fourColor} />

        <EquityGuessPanel
          difficulty={difficulty}
          guessed={guessed}
          calculating={calculating}
          actualEquity={actualEquity}
          onGuess={handleGuess}
          sliderValue={sliderValue}
          onSliderChange={setSliderValue}
          prompt={t("whatIsYourEquity")}
          onAdminGuess={isAdmin ? async () => {
            const idx = await getCorrectAnswer(hand.handId);
            handleGuess(idx);
          } : undefined}
        />

        {calculating && <div className="text-gray-400 text-sm">{t("calculating")}</div>}

        {pointsScored !== null && !calculating && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {pointsScored === 3 && <span className="text-lime-400 font-bold text-lg">{t("perfect")}</span>}
              {pointsScored === 1 && <span className="text-yellow-400 font-bold text-lg">{t("close")}</span>}
              {pointsScored === 0 && <span className="text-red-400 font-bold text-lg">{t("miss")}</span>}
              <span className="text-gray-400 text-sm">
                {t("actualEquity")}:{" "}
                <span className="text-white font-medium">{(actualEquity! * 100).toFixed(1)}%</span>
              </span>
            </div>

            {isHandVsHand && hand.villainCards && (
              <div className="lg:hidden">
                <ThumbRulePanel
                  heroCards={hand.heroCards}
                  villainCards={hand.villainCards}
                  revealed
                />
              </div>
            )}

            {newUnlock && (
              <div className="bg-lime-900 border border-lime-600 rounded p-3 text-lime-300 text-sm">
                {t("unlocked")}: <strong>{td(String(newUnlock))}</strong>!
              </div>
            )}

            <button
              onClick={() => startNewHand()}
              className="self-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
            >
              {t("nextHand")}
            </button>
          </div>
        )}
      </div>
    </TrainPageLayout>
    </>
  );
}
