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
import { getSkillCardByModule, TEXT_COLOR } from "./skillCardConfig";

type Role = "guest" | "registered" | "premium";

type HandState = {
  handId: string;
  heroCards: { rank: string; suit: string }[];
  flopCards?: { rank: string; suit: string }[];
  turnCard?: { rank: string; suit: string } | null;
  riverCard?: { rank: string; suit: string } | null;
  villainRange: number;
  difficulty: number;
};


function ModuleExplanation({ handModule }: { handModule: string }) {
  switch (handModule) {
    case "preflop":
      return (
        <div className="space-y-2">
          <p>
            Du schätzt deine <GlossaryLink slug="equity/what-is-equity">Equity</GlossaryLink> gegen
            die <GlossaryLink slug="ranges/what-is-a-range">Range</GlossaryLink> des Villains —
            ausgedrückt als <GlossaryLink slug="ranges/top-x-percent">Top X%</GlossaryLink> seiner
            möglichen Starthände.
          </p>
          <p>
            Equity unter 50% bedeutet nicht automatisch folden — dafür braucht es die Pot Odds.
            Ziel ist ein Zahlengefühl für{" "}
            <GlossaryLink slug="equity/equity-vs-range">Equity gegen eine Range</GlossaryLink>,
            kein exaktes Rechnen.
          </p>
          <MatrixTip />
        </div>
      );
    case "flop":
      return (
        <div className="space-y-2">
          <p>
            Der Flop verändert die <GlossaryLink slug="equity/what-is-equity">Equity</GlossaryLink>{" "}
            drastisch — Draws, Pair-Outs und Board-Texturen spielen jetzt eine große Rolle.
          </p>
          <p>
            Die <GlossaryLink slug="ranges/top-x-percent">Top X%-Range</GlossaryLink> des Villains
            ist eine Vereinfachung: In echten Spielen würde man sie nach dem Flop anpassen.
            Hier trainierst du trotzdem ein wertvolles Gefühl — wie stark deine Hand gegen eine
            typische Eröffnungsrange liegt.
          </p>
          <MatrixTip />
        </div>
      );
    case "turn":
      return (
        <div className="space-y-2">
          <p>
            Auf dem Turn ist nur noch eine Karte offen — die{" "}
            <GlossaryLink slug="equity/what-is-equity">Equity</GlossaryLink> ist konkreter, aber
            auch volatiler: Ein River-Out kann sie komplett drehen.
          </p>
          <p>
            Die gezeigte <GlossaryLink slug="ranges/what-is-a-range">Range</GlossaryLink> ist die
            Preflop-Eröffnungsrange des Villains. Im echten Spiel wäre sie bis zum Turn schon
            deutlich eingeengt — hier übst du das Grundgefühl, bevor du mit Range-Anpassung
            arbeitest.
          </p>
          <MatrixTip />
        </div>
      );
    case "river":
      return (
        <div className="space-y-2">
          <p>
            Auf dem River gibt es keine weiteren Karten — die{" "}
            <GlossaryLink slug="equity/what-is-equity">Equity</GlossaryLink> ist entweder 0% oder
            100%. Was du hier trainierst, ist die Frage: Wie oft liegt meine Hand vorne gegen eine
            typische Villain-<GlossaryLink slug="ranges/what-is-a-range">Range</GlossaryLink>?
          </p>
          <p>
            Die Preflop-Range ist hier natürlich am weitesten von der Realität entfernt. Trotzdem
            schärft das Training dein Gefühl dafür, wie gut oder schlecht deine Hand
            auf einem bestimmten Board steht.
          </p>
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

  return (
    <>
    <AchievementToast
      queue={achievementQueue}
      onDismiss={(key) => setAchievementQueue((q) => q.filter((k) => k !== key))}
    />
    <TrainPageLayout
      info={<RangeMatrix villainRange={hand.villainRange} heroCards={hand.heroCards} />}
      explanation={<ModuleExplanation handModule={handModule} />}
    >
      <div className="flex flex-col items-center gap-6 max-w-2xl w-full">
        <div className="text-center">
          <h2 className={`text-xl font-bold ${skillCard ? TEXT_COLOR[skillCard.tags.street] : ""}`}>
            {skillCard ? tc(skillCard.labelKey as Parameters<typeof tc>[0]) : handModule}
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

        {/* Hero cards */}
        <div className="flex flex-col items-center">
          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">Your hand</p>
          <div className="flex gap-2">
            {hand.heroCards.map((card, i) => (
              <CardComponent key={i} rank={card.rank} suit={card.suit} fourColor={fourColor} size="lg" />
            ))}
          </div>
        </div>

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
