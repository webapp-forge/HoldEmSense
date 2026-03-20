import type { Role } from "./trainNavConfig";

export type Street = "preflop" | "flop" | "turn" | "river" | "general";
export type CardLevel = 1 | 2 | 3 | 4;

export type SkillCard = {
  id: string;
  /** Key within the "skillCards" i18n namespace */
  labelKey: string;
  /** undefined = coming soon */
  href?: string;
  /** Key in getSkillTreeProgress() result */
  progressModule?: string;
  minRole: Role;
  tags: {
    street: Street;
    /** Topic-level difficulty: 1 = Basics, 4 = High Level */
    level: CardLevel;
    // future: game?: "cash" | "mtt" | "stt"
    // future: tableSize?: "hu" | "6max" | "9max"
  };
};

// Strip color: gets darker with higher level (level 1 = brightest)
export const STRIP_COLOR: Record<Street, Record<CardLevel, string>> = {
  preflop: { 1: "bg-blue-400",   2: "bg-blue-500",   3: "bg-blue-600",   4: "bg-blue-700"   },
  flop:    { 1: "bg-lime-400",   2: "bg-lime-500",   3: "bg-lime-600",   4: "bg-lime-700"   },
  turn:    { 1: "bg-yellow-400", 2: "bg-yellow-500", 3: "bg-yellow-600", 4: "bg-yellow-700" },
  river:   { 1: "bg-orange-400", 2: "bg-orange-500", 3: "bg-orange-600", 4: "bg-orange-700" },
  general: { 1: "bg-slate-400",  2: "bg-slate-500",  3: "bg-slate-600",  4: "bg-slate-700"  },
};

// Text color: always the bright variant — readable on dark card background
export const TEXT_COLOR: Record<Street, string> = {
  preflop: "text-blue-400",
  flop:    "text-lime-400",
  turn:    "text-yellow-400",
  river:   "text-orange-400",
  general: "text-slate-300",
};

export const SKILL_CARDS: SkillCard[] = [
  // ── Equity: Street by Street ──────────────────────────────────────────────
  {
    id: "equity-preflop",
    labelKey: "equityPreflop",
    href: "/train/equity/hand-vs-range",
    progressModule: "hand-vs-range",
    minRole: "guest",
    tags: { street: "preflop", level: 1 },
  },
  {
    id: "equity-flop",
    labelKey: "flopEquity",
    href: "/train/equity/hand-vs-range-flop",
    progressModule: "hand-vs-range-flop",
    minRole: "guest",
    tags: { street: "flop", level: 1 },
  },
  {
    id: "equity-turn",
    labelKey: "turnEquity",
    href: "/train/equity/hand-vs-range-turn",
    progressModule: "hand-vs-range-turn",
    minRole: "registered",
    tags: { street: "turn", level: 1 },
  },
  {
    id: "equity-river",
    labelKey: "riverEquity",
    href: "/train/equity/hand-vs-range-river",
    progressModule: "hand-vs-range-river",
    minRole: "registered",
    tags: { street: "river", level: 1 },
  },
  // ── Pot Odds ──────────────────────────────────────────────────────────────
  {
    id: "pot-odds",
    labelKey: "potOdds",
    href: "/train/equity/pot-odds",
    progressModule: "pot-odds",
    minRole: "guest",
    tags: { street: "general", level: 1 },
  },
  {
    id: "pot-odds-combined",
    labelKey: "potOddsCombined",
    href: "/train/equity/hand-vs-range-pot-odds",
    progressModule: "combined-pot-odds",
    minRole: "registered",
    tags: { street: "general", level: 1 },
  },
  // ── Coming Soon ───────────────────────────────────────────────────────────
  {
    id: "preflop-ranges",
    labelKey: "preflopRanges",
    minRole: "guest",
    tags: { street: "preflop", level: 2 },
  },
  {
    id: "cbet-basics",
    labelKey: "cbetBasics",
    minRole: "guest",
    tags: { street: "flop", level: 2 },
  },
  {
    id: "opponent-types",
    labelKey: "opponentTypes",
    minRole: "guest",
    tags: { street: "general", level: 2 },
  },
];

/** Map handModule (used by EquityTraining) → progressModule (used by SKILL_CARDS) */
const HAND_MODULE_TO_PROGRESS: Record<string, string> = {
  preflop: "hand-vs-range",
  flop: "hand-vs-range-flop",
  turn: "hand-vs-range-turn",
  river: "hand-vs-range-river",
};

/** Look up the SkillCard for a given handModule or progressModule */
export function getSkillCardByModule(module: string): SkillCard | undefined {
  const progressModule = HAND_MODULE_TO_PROGRESS[module] ?? module;
  return SKILL_CARDS.find((c) => c.progressModule === progressModule);
}
