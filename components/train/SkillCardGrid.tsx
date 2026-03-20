"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  SKILL_CARDS,
  STRIP_COLOR,
  TEXT_COLOR,
  KEY_COLOR,
  KEY_PATH,
  type Street,
  type SkillCard,
} from "./skillCardConfig";
import type { Role } from "./trainNavConfig";

const ROLE_RANK: Record<Role, number> = { guest: 0, registered: 1, premium: 2 };

function hasAccess(userRole: Role, minRole: Role) {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

/** Check if precondition chain is satisfied (Beginner passed = difficulty >= 2) */
function isPreconditionMet(
  card: SkillCard,
  progress: Record<string, number>
): boolean {
  if (!card.precondition) return true;
  const preCard = SKILL_CARDS.find((c) => c.id === card.precondition);
  if (!preCard?.progressModule) return false;
  return (progress[preCard.progressModule] ?? 0) >= 2;
}

/** Trace back the precondition chain to find the first card the user should work on */
function getNextStep(card: SkillCard, progress: Record<string, number>): SkillCard | null {
  let current: SkillCard | undefined = card;
  while (current?.precondition) {
    const preCard = SKILL_CARDS.find((c) => c.id === current!.precondition);
    if (!preCard) return null;
    if (!preCard.progressModule || (progress[preCard.progressModule] ?? 0) < 2) {
      // This precondition is not yet met — check if it has its own unmet precondition
      current = preCard;
      continue;
    }
    break;
  }
  return current === card ? null : current ?? null;
}

function diffAccessible(role: Role, diff: number): boolean {
  if (role === "premium") return true;
  if (role === "registered") return diff <= 2;
  return diff === 1;
}

const BAR_COLOR: Record<Street, string> = {
  preflop: "bg-blue-400",
  flop: "bg-lime-400",
  turn: "bg-yellow-400",
  river: "bg-orange-400",
  general: "bg-slate-400",
};

function playUnlockSound() {
  try {
    const ctx = new AudioContext();
    const t = ctx.currentTime;

    // Short metallic "click" — noise burst through a bandpass filter
    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3500;
    bp.Q.value = 8;

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.25, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    noise.connect(bp).connect(clickGain).connect(ctx.destination);
    noise.start(t);
    noise.stop(t + 0.08);

    // Subtle low "thunk" for body
    const osc = ctx.createOscillator();
    const thunkGain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
    thunkGain.gain.setValueAtTime(0.15, t);
    thunkGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    osc.connect(thunkGain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch {
    // AudioContext not available
  }
}

type CardProgress = {
  scores: Record<string, Record<number, { count: number; total: number }>>;
  windowSize: number;
  unlockThreshold: number;
  maxPoints: number;
};

function DiffProgressBars({
  progressModule,
  role,
  progress,
  cardProgress,
  street,
}: {
  progressModule: string;
  role: Role;
  progress: Record<string, number>;
  cardProgress: CardProgress;
  street: Street;
}) {
  const { scores, windowSize, unlockThreshold, maxPoints } = cardProgress;
  const moduleScores = scores[progressModule] ?? {};

  return (
    <div className="flex gap-1.5 mt-3">
      {([1, 2, 3, 4] as const).map((diff) => {
        const locked = !diffAccessible(role, diff);
        const score = moduleScores[diff];
        const pct = score
          ? Math.min(100, Math.round((score.total / maxPoints) * 100))
          : 0;
        const everPassed =
          diff < 4
            ? (progress[progressModule] ?? 0) >= diff + 1
            : !!(score && score.count >= windowSize && score.total >= unlockThreshold);
        const isPerfect = !!(
          score &&
          score.count >= windowSize &&
          score.total >= maxPoints
        );

        return (
          <div key={diff} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="relative w-full h-1.5 rounded-full bg-gray-700 overflow-hidden">
              {!locked && pct > 0 && (
                <div
                  className={`absolute inset-y-0 left-0 ${BAR_COLOR[street]}`}
                  style={{ width: `${pct}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-center h-4">
              {locked ? (
                <span className="text-gray-600 text-xs leading-none">—</span>
              ) : isPerfect ? (
                <span className="text-yellow-400 text-sm leading-none">★</span>
              ) : everPassed ? (
                <span className="text-green-400 text-sm leading-none">✓</span>
              ) : pct > 0 ? (
                <span className="text-gray-400 text-[10px] leading-none">{pct}%</span>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Filter chip component
function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
        active
          ? "bg-lime-600 text-white"
          : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

export default function SkillCardGrid({
  role,
  progress,
  completedModules,
  cardProgress,
}: {
  role: Role;
  progress: Record<string, number>;
  completedModules: string[];
  cardProgress: CardProgress;
}) {
  const t = useTranslations("skillCards");

  // Derive available filter options from actual card data (so unused tags never appear)
  const availableStreets = useMemo<Street[]>(
    () => Array.from(new Set(SKILL_CARDS.map((c) => c.tags.street))),
    []
  );
  const availableLevels = useMemo(
    () => Array.from(new Set(SKILL_CARDS.map((c) => c.tags.level))).sort(),
    []
  );

  const [streetFilters, setStreetFilters] = useState<Set<Street>>(new Set());
  const [levelFilters, setLevelFilters] = useState<Set<number>>(new Set());
  const [hidePassed, setHidePassed] = useState(false);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());

  function handleKeyClick(e: React.MouseEvent, cardId: string) {
    e.preventDefault();
    e.stopPropagation();
    playUnlockSound();
    setDismissedKeys((prev) => {
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  }

  function toggleStreet(street: Street) {
    setStreetFilters((prev) => {
      const next = new Set(prev);
      next.has(street) ? next.delete(street) : next.add(street);
      return next;
    });
  }

  function toggleLevel(level: number) {
    setLevelFilters((prev) => {
      const next = new Set(prev);
      next.has(level) ? next.delete(level) : next.add(level);
      return next;
    });
  }

  const filtered = SKILL_CARDS.filter((card) => {
    // Within group: OR — empty set means "show all"
    if (streetFilters.size > 0 && !streetFilters.has(card.tags.street)) return false;
    if (levelFilters.size > 0 && !levelFilters.has(card.tags.level)) return false;
    // Between groups: AND (implicit — both conditions must pass)
    if (hidePassed && card.progressModule && completedModules.includes(card.progressModule)) return false;
    return true;
  });

  const showLevelFilter = availableLevels.length > 1;

  return (
    <div className="space-y-5">
      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2">
        {/* Street filter — multi-select OR within group */}
        <div className="flex flex-wrap gap-1.5">
          <FilterChip
            label={t("filter.all" as Parameters<typeof t>[0])}
            active={streetFilters.size === 0}
            onClick={() => setStreetFilters(new Set())}
          />
          {availableStreets.map((street) => (
            <FilterChip
              key={street}
              label={t(`filter.${street}` as Parameters<typeof t>[0])}
              active={streetFilters.has(street)}
              onClick={() => toggleStreet(street)}
            />
          ))}
        </div>

        {/* Level filter — multi-select OR within group, only shown when multiple levels exist */}
        {showLevelFilter && (
          <div className="flex flex-wrap gap-1.5">
            <FilterChip
              label={t("filter.all" as Parameters<typeof t>[0])}
              active={levelFilters.size === 0}
              onClick={() => setLevelFilters(new Set())}
            />
            {availableLevels.map((level) => (
              <FilterChip
                key={level}
                label={`Level ${level}`}
                active={levelFilters.has(level)}
                onClick={() => toggleLevel(level)}
              />
            ))}
          </div>
        )}

        {/* Hide-passed toggle — only shown if user has completed at least one module */}
        {completedModules.length > 0 && (
          <FilterChip
            label={t("filter.hidePassed" as Parameters<typeof t>[0])}
            active={hidePassed}
            onClick={() => setHidePassed(!hidePassed)}
          />
        )}
      </div>

      {/* ── Card grid ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map((card) => {
          const roleAccess = hasAccess(role, card.minRole);
          const preconditionMet = isPreconditionMet(card, progress);
          const isLocked = !preconditionMet;
          const accessible = roleAccess && preconditionMet;
          const isComingSoon = !card.href;

          // Build tooltip for locked cards
          let lockTooltip = "";
          if (isLocked && !isComingSoon) {
            const nextStep = getNextStep(card, progress);
            if (nextStep) {
              lockTooltip = t("lockTooltip" as Parameters<typeof t>[0], {
                module: t(nextStep.labelKey as Parameters<typeof t>[0]),
              });
            }
          }

          // Card is "newly unlockable" — precondition met but Beginner not yet passed
          const isNewlyUnlockable =
            accessible &&
            !isComingSoon &&
            !!card.precondition &&
            !!card.progressModule &&
            (progress[card.progressModule] ?? 0) < 2;

          const showKeyLock = isNewlyUnlockable && !dismissedKeys.has(card.id);

          const dimmed = isComingSoon || !accessible;
          const stripClass = dimmed
            ? "bg-gray-700"
            : STRIP_COLOR[card.tags.street][card.tags.level];
          const textClass = dimmed
            ? "text-gray-500"
            : TEXT_COLOR[card.tags.street];

          const cardEl = (
            <div
              className={`rounded-xl bg-gray-900 border transition-all duration-150 relative ${
                isComingSoon
                  ? "border-gray-800 opacity-40"
                  : accessible
                  ? "border-gray-800 hover:border-gray-600 hover:-translate-y-0.5"
                  : "border-gray-800"
              }`}
            >
              {/* Lock icon on the left edge — tooltip appears on lock hover only */}
              {isLocked && !isComingSoon && (
                <div className="absolute left-0 inset-y-0 flex items-center pl-3 z-10">
                  <div className="relative group/lock cursor-help">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="text-gray-400 drop-shadow">
                      <path d="M18 10V7a6 6 0 0 0-12 0v3H4v14h16V10h-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4-9H8V7a4 4 0 0 1 8 0v3z" />
                    </svg>
                    {lockTooltip && (
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 text-xs font-medium whitespace-nowrap shadow-lg opacity-0 group-hover/lock:opacity-100 pointer-events-none transition-opacity duration-150 z-20">
                        {lockTooltip}
                        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-700" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Key + lock overlay for newly unlockable cards */}
              {showKeyLock && (
                <div className="absolute left-0 inset-y-0 flex items-center pl-2 z-10">
                  <button
                    onClick={(e) => handleKeyClick(e, card.id)}
                    className="relative w-10 h-10 flex items-center justify-center cursor-pointer"
                    aria-label="Unlock"
                  >
                    {/* Dimmed lock background */}
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" className="text-gray-500/40">
                      <path d="M18 10V7a6 6 0 0 0-12 0v3H4v14h16V10h-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4-9H8V7a4 4 0 0 1 8 0v3z" />
                    </svg>
                    {/* Pulsing key on top */}
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd"
                      className={`${KEY_COLOR[card.tags.street]} drop-shadow-lg absolute inset-0 m-auto animate-pulse`}>
                      <path d={KEY_PATH} />
                    </svg>
                  </button>
                </div>
              )}

              {/* Coloured top strip */}
              <div className={`h-1.5 rounded-t-xl ${stripClass}`} />

              {/* Card body */}
              <div className={`p-4 flex flex-col justify-between min-h-[88px] ${isLocked && !isComingSoon ? "pl-11 opacity-50" : showKeyLock ? "pl-11" : ""}`}>
                <p className={`font-semibold text-sm leading-snug ${textClass}`}>
                  {t(card.labelKey as Parameters<typeof t>[0])}
                </p>

                {/* Bottom: progress bars OR lock/coming-soon/role badge */}
                {accessible && card.progressModule && !isComingSoon ? (
                  <DiffProgressBars
                    progressModule={card.progressModule}
                    role={role}
                    progress={progress}
                    cardProgress={cardProgress}
                    street={card.tags.street}
                  />
                ) : (
                  <div className="flex items-center mt-3">
                    {isComingSoon && (
                      <span className="text-[10px] text-gray-600 font-medium">
                        {t("comingSoon" as Parameters<typeof t>[0])}
                      </span>
                    )}
                    {!roleAccess && !isComingSoon && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          card.minRole === "premium"
                            ? "bg-amber-700 text-amber-100"
                            : "bg-lime-700 text-lime-100"
                        }`}
                      >
                        {card.minRole === "premium" ? "PRO" : "REG"}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );

          return accessible && card.href ? (
            <Link key={card.id} href={card.href} className="block">
              {cardEl}
            </Link>
          ) : (
            <div key={card.id}>{cardEl}</div>
          );
        })}
      </div>
    </div>
  );
}
