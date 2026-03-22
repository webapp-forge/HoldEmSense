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
  /** ID of the skill card that must be passed on Beginner to unlock this one */
  precondition?: string;
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
  // ── Preflop Range Selection — Level 1 entry point ─────────────────────────
  {
    id: "preflop-ranges",
    labelKey: "preflopRanges",
    href: "/train/ranges/preflop",
    progressModule: "preflop-ranges",
    minRole: "guest",
    tags: { street: "preflop", level: 1 },
  },
  // ── Equity: Hand vs Hand ────────────────────────────────────────────────
  {
    id: "hand-vs-hand",
    labelKey: "handVsHand",
    href: "/train/equity/hand-vs-hand",
    progressModule: "hand-vs-hand",
    minRole: "guest",
    precondition: "preflop-ranges",
    tags: { street: "preflop", level: 2 },
  },
  // ── Equity: Street by Street ──────────────────────────────────────────────
  {
    id: "equity-preflop",
    labelKey: "equityPreflop",
    href: "/train/equity/hand-vs-range",
    progressModule: "hand-vs-range",
    minRole: "guest",
    precondition: "hand-vs-hand",
    tags: { street: "preflop", level: 2 },
  },
  {
    id: "equity-flop",
    labelKey: "flopEquity",
    href: "/train/equity/hand-vs-range-flop",
    progressModule: "hand-vs-range-flop",
    minRole: "guest",
    precondition: "equity-preflop",
    tags: { street: "flop", level: 2 },
  },
  {
    id: "equity-turn",
    labelKey: "turnEquity",
    href: "/train/equity/hand-vs-range-turn",
    progressModule: "hand-vs-range-turn",
    minRole: "registered",
    precondition: "equity-flop",
    tags: { street: "turn", level: 2 },
  },
  {
    id: "equity-river",
    labelKey: "riverEquity",
    href: "/train/equity/hand-vs-range-river",
    progressModule: "hand-vs-range-river",
    minRole: "registered",
    precondition: "equity-turn",
    tags: { street: "river", level: 2 },
  },
  // ── Pot Odds ──────────────────────────────────────────────────────────────
  {
    id: "pot-odds",
    labelKey: "potOdds",
    href: "/train/equity/pot-odds",
    progressModule: "pot-odds",
    minRole: "guest",
    precondition: "equity-river",
    tags: { street: "general", level: 2 },
  },
  {
    id: "pot-odds-combined",
    labelKey: "potOddsCombined",
    href: "/train/equity/hand-vs-range-pot-odds",
    progressModule: "combined-pot-odds",
    minRole: "registered",
    precondition: "pot-odds",
    tags: { street: "general", level: 2 },
  },
  // ── Coming Soon ───────────────────────────────────────────────────────────
  {
    id: "cbet-basics",
    labelKey: "cbetBasics",
    minRole: "guest",
    tags: { street: "flop", level: 3 },
  },
  {
    id: "opponent-types",
    labelKey: "opponentTypes",
    minRole: "guest",
    tags: { street: "general", level: 3 },
  },
];

/** Map handModule (used by EquityTraining) → progressModule (used by SKILL_CARDS) */
const HAND_MODULE_TO_PROGRESS: Record<string, string> = {
  "preflop-ranges": "preflop-ranges",
  "hand-vs-hand": "hand-vs-hand",
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

/** Find skill cards that depend on the given card (i.e., cards that have it as precondition) */
export function getDependentCards(cardId: string): SkillCard[] {
  return SKILL_CARDS.filter((c) => c.precondition === cardId);
}

/** Classic skeleton key SVG path (vertical, with bow ring + teeth) */
export const KEY_PATH =
  "M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11 10h2v11h-2zM13 14.5h3v2h-3zM13 18h2.5v2h-2.5z";

/** Color used for key icons — matches the street's text color */
export const KEY_COLOR: Record<Street, string> = {
  preflop: "text-blue-400",
  flop:    "text-lime-400",
  turn:    "text-yellow-400",
  river:   "text-orange-400",
  general: "text-slate-300",
};
