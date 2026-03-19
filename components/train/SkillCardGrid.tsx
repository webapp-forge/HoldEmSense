"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
  SKILL_CARDS,
  STRIP_COLOR,
  TEXT_COLOR,
  type Street,
  type SkillCard,
} from "./skillCardConfig";
import type { Role } from "./trainNavConfig";

const ROLE_RANK: Record<Role, number> = { guest: 0, registered: 1, premium: 2 };

function hasAccess(userRole: Role, minRole: Role) {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
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
          const accessible = hasAccess(role, card.minRole);
          const isComingSoon = !card.href;
          const stripClass =
            isComingSoon || !accessible
              ? "bg-gray-700"
              : STRIP_COLOR[card.tags.street][card.tags.level];
          const textClass =
            isComingSoon || !accessible
              ? "text-gray-500"
              : TEXT_COLOR[card.tags.street];

          const cardEl = (
            <div
              className={`rounded-xl bg-gray-900 border overflow-hidden transition-all duration-150 ${
                isComingSoon
                  ? "border-gray-800 opacity-40"
                  : accessible
                  ? "border-gray-800 hover:border-gray-600 hover:-translate-y-0.5"
                  : "border-gray-800 opacity-50"
              }`}
            >
              {/* Coloured top strip */}
              <div className={`h-1.5 ${stripClass}`} />

              {/* Card body */}
              <div className="p-4 flex flex-col justify-between min-h-[88px]">
                <p className={`font-semibold text-sm leading-snug ${textClass}`}>
                  {t(card.labelKey as Parameters<typeof t>[0])}
                </p>

                {/* Bottom: progress bars OR lock/coming-soon badge */}
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
                    {!accessible && !isComingSoon && (
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
