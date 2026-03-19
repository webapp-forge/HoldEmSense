"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  SKILL_NODES,
  SKILL_EDGES,
  type Branch,
  type SkillNodeConfig,
} from "./skillTreeConfig";
import type { Role } from "./trainNavConfig";

const ROLE_RANK: Record<Role, number> = { guest: 0, registered: 1, premium: 2 };

function hasAccess(userRole: Role, minRole: Role) {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

const BRANCH_BORDER: Record<Branch, string> = {
  core: "border-slate-400",
  flop: "border-lime-500",
  turn: "border-yellow-500",
  river: "border-orange-500",
  preflop: "border-blue-400",
  exploit: "border-purple-400",
  tournament: "border-red-400",
  cash: "border-cyan-400",
};

const BRANCH_TEXT: Record<Branch, string> = {
  core: "text-slate-300",
  flop: "text-lime-400",
  turn: "text-yellow-400",
  river: "text-orange-400",
  preflop: "text-blue-400",
  exploit: "text-purple-400",
  tournament: "text-red-400",
  cash: "text-cyan-400",
};

const BRANCH_STROKE: Record<Branch, string> = {
  core: "#94a3b8",
  flop: "#84cc16",
  turn: "#eab308",
  river: "#f97316",
  preflop: "#60a5fa",
  exploit: "#c084fc",
  tournament: "#f87171",
  cash: "#22d3ee",
};

// masteryLevel: 0 = available, 1 = bronze, 2 = silver, 3 = gold
const MASTERY_BADGE_LABEL = ["", "B", "S", "G"];
const MASTERY_BADGE_COLOR = [
  "",
  "bg-amber-700 text-amber-100",
  "bg-slate-400 text-slate-900",
  "bg-yellow-400 text-gray-900",
];
const MASTERY_GLOW = [
  "",
  "shadow-[0_0_10px_2px_rgba(160,100,20,0.5)]",
  "shadow-[0_0_10px_2px_rgba(160,160,160,0.4)]",
  "shadow-[0_0_14px_4px_rgba(230,180,0,0.6)]",
];

function getMastery(node: SkillNodeConfig, progress: Record<string, number>): number {
  if (!node.progressModule) return 0;
  const max = progress[node.progressModule];
  // userProgress stores the NEXT unlocked difficulty, so max=2 means beginner was completed.
  // masteryLevel = max - 1: 2→1(bronze), 3→2(silver), 4→3(gold)
  return max ? max - 1 : 0;
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-gray-600">
      <path d="M18 10V7a6 6 0 0 0-12 0v3H4v14h16V10h-2zm-6 9a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm4-9H8V7a4 4 0 0 1 8 0v3z" />
    </svg>
  );
}

export default function SkillTree({
  role,
  progress,
}: {
  role: Role;
  progress: Record<string, number>;
}) {
  const t = useTranslations("skillTree");
  const nodeMap = new Map(SKILL_NODES.map((n) => [n.id, n]));

  return (
    <>
      {/* ── Desktop: visual tree ────────────────────────────────────────────── */}
      <div className="hidden md:block relative w-full aspect-video bg-gray-950 rounded-xl overflow-hidden">

        {/* SVG connection lines — rendered below nodes */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {SKILL_EDGES.map((edge) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            const stroke = edge.dashed ? "#374151" : BRANCH_STROKE[from.branch];
            return (
              <line
                key={`${edge.from}-${edge.to}`}
                x1={`${from.position.x}%`}
                y1={`${from.position.y}%`}
                x2={`${to.position.x}%`}
                y2={`${to.position.y}%`}
                stroke={stroke}
                strokeWidth={edge.dashed ? "1" : "1.5"}
                strokeDasharray={edge.dashed ? "5 5" : undefined}
                opacity={edge.dashed ? "0.3" : "0.55"}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {SKILL_NODES.map((node) => {
          const accessible = hasAccess(role, node.minRole);
          const isComingSoon = !node.href;
          const isLocked = !isComingSoon && !accessible;
          const mastery = getMastery(node, progress);

          const borderClass =
            isComingSoon || isLocked ? "border-gray-700" : BRANCH_BORDER[node.branch];
          const textClass =
            isComingSoon || isLocked ? "text-gray-600" : BRANCH_TEXT[node.branch];
          const glowClass = !isComingSoon && !isLocked ? MASTERY_GLOW[mastery] : "";
          const nodeSize = isComingSoon ? "w-12 h-12" : "w-16 h-16";
          const label = isComingSoon
            ? t("comingSoon" as Parameters<typeof t>[0])
            : t(node.labelKey as Parameters<typeof t>[0]);

          const circle = (
            <div className="relative">
              <div
                className={`${nodeSize} rounded-full border-2 ${borderClass} bg-gray-900 flex items-center justify-center ${glowClass} transition-all duration-200`}
              >
                {isLocked ? (
                  <LockIcon />
                ) : (
                  <span className={`text-[11px] font-bold tracking-wider ${textClass}`}>
                    {isComingSoon ? "?" : node.short}
                  </span>
                )}
              </div>

              {/* Mastery badge (top-right) */}
              {mastery > 0 && (
                <span
                  className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center ${MASTERY_BADGE_COLOR[mastery]}`}
                >
                  {MASTERY_BADGE_LABEL[mastery]}
                </span>
              )}

              {/* Role lock badge (top-right, when locked) */}
              {isLocked && node.minRole !== "guest" && (
                <span
                  className={`absolute -top-1 -right-1 px-1 py-0.5 rounded text-[9px] font-bold leading-none ${
                    node.minRole === "premium"
                      ? "bg-amber-800 text-amber-200"
                      : "bg-lime-800 text-lime-200"
                  }`}
                >
                  {node.minRole === "premium" ? "PRO" : "REG"}
                </span>
              )}
            </div>
          );

          const inner = (
            <div
              className={`flex flex-col items-center gap-1 ${
                accessible && node.href ? "group cursor-pointer" : ""
              }`}
            >
              <div className={accessible && node.href ? "group-hover:scale-110 transition-transform duration-150" : ""}>
                {circle}
              </div>
              <span
                className={`text-[9px] font-medium text-center leading-tight max-w-[72px] ${
                  isComingSoon || isLocked ? "text-gray-600" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );

          return (
            <div
              key={node.id}
              className={`absolute ${isComingSoon ? "opacity-30" : isLocked ? "opacity-50" : ""}`}
              style={{
                left: `${node.position.x}%`,
                top: `${node.position.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {node.href && accessible ? (
                <Link href={node.href} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </div>
          );
        })}
      </div>

      {/* ── Mobile: flat card list ───────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-2">
        {SKILL_NODES.filter((n) => !!n.href).map((node) => {
          const accessible = hasAccess(role, node.minRole);
          const mastery = getMastery(node, progress);
          const label = t(node.labelKey as Parameters<typeof t>[0]);

          const card = (
            <div
              className={`flex items-center justify-between px-4 py-3 rounded-lg bg-gray-900 border transition-colors ${
                accessible
                  ? `${BRANCH_BORDER[node.branch]} hover:bg-gray-800`
                  : "border-gray-800 opacity-50"
              }`}
            >
              <span
                className={`text-sm font-medium ${
                  accessible ? BRANCH_TEXT[node.branch] : "text-gray-500"
                }`}
              >
                {label}
              </span>
              <div className="flex items-center gap-2">
                {mastery > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${MASTERY_BADGE_COLOR[mastery]}`}
                  >
                    {MASTERY_BADGE_LABEL[mastery]}
                  </span>
                )}
                {!accessible && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      node.minRole === "premium"
                        ? "bg-amber-700 text-amber-100"
                        : "bg-lime-700 text-lime-100"
                    }`}
                  >
                    {node.minRole === "premium" ? "PRO" : "REG"}
                  </span>
                )}
              </div>
            </div>
          );

          return accessible ? (
            <Link key={node.id} href={node.href!}>
              {card}
            </Link>
          ) : (
            <div key={node.id}>{card}</div>
          );
        })}
      </div>
    </>
  );
}
