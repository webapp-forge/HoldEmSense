import type { Role } from "./trainNavConfig";

export type Branch =
  | "core"
  | "flop"
  | "turn"
  | "river"
  | "preflop"
  | "exploit"
  | "tournament"
  | "cash";

export type SkillNodeConfig = {
  id: string;
  /** 2–4 char abbreviation shown inside the circle */
  short: string;
  /** Key within the "skillTree" i18n namespace */
  labelKey: string;
  branch: Branch;
  /** Undefined = coming soon (no training module yet) */
  href?: string;
  /** Key in getSkillTreeProgress() result — undefined if no progress is tracked */
  progressModule?: string;
  minRole: Role;
  prerequisites: string[];
  /** 0–100 percentage of container width/height */
  position: { x: number; y: number };
};

export type SkillEdge = {
  from: string;
  to: string;
  dashed?: boolean;
};

export const SKILL_NODES: SkillNodeConfig[] = [
  // ── Core cluster (centre) ──────────────────────────────────────────────────
  {
    id: "equity-preflop",
    short: "EQ",
    labelKey: "equityPreflop",
    branch: "core",
    href: "/train/equity/hand-vs-range",
    progressModule: "hand-vs-range",
    minRole: "guest",
    prerequisites: [],
    position: { x: 50, y: 43 },
  },
  {
    id: "pot-odds",
    short: "POT",
    labelKey: "potOdds",
    branch: "core",
    href: "/train/equity/pot-odds",
    progressModule: "pot-odds",
    minRole: "guest",
    prerequisites: [],
    position: { x: 34, y: 59 },
  },
  {
    id: "pot-odds-combined",
    short: "EQ+",
    labelKey: "potOddsCombined",
    branch: "core",
    href: "/train/equity/hand-vs-range-pot-odds",
    progressModule: "combined-pot-odds",
    minRole: "registered",
    prerequisites: ["equity-preflop", "pot-odds"],
    position: { x: 66, y: 59 },
  },

  // ── Street chain (radiates upper-left) ────────────────────────────────────
  {
    id: "flop-equity",
    short: "FLP",
    labelKey: "flopEquity",
    branch: "flop",
    href: "/train/equity/hand-vs-range-flop",
    progressModule: "hand-vs-range-flop",
    minRole: "guest",
    prerequisites: ["equity-preflop"],
    position: { x: 28, y: 23 },
  },
  {
    id: "turn-equity",
    short: "TRN",
    labelKey: "turnEquity",
    branch: "turn",
    href: "/train/equity/hand-vs-range-turn",
    progressModule: "hand-vs-range-turn",
    minRole: "registered",
    prerequisites: ["flop-equity"],
    position: { x: 11, y: 42 },
  },
  {
    id: "river-equity",
    short: "RVR",
    labelKey: "riverEquity",
    branch: "river",
    href: "/train/equity/hand-vs-range-river",
    progressModule: "hand-vs-range-river",
    minRole: "registered",
    prerequisites: ["turn-equity"],
    position: { x: 18, y: 66 },
  },

  // ── Special: Leak Training (bottom centre, PRO) ───────────────────────────
  {
    id: "leak-training",
    short: "LEAK",
    labelKey: "leakTraining",
    branch: "core",
    href: "/train/leak-fixing/equity",
    minRole: "premium",
    prerequisites: [],
    position: { x: 50, y: 82 },
  },

  // ── Coming-soon stubs (outer ring) ────────────────────────────────────────
  {
    id: "preflop-ranges",
    short: "PF",
    labelKey: "preflopRanges",
    branch: "preflop",
    minRole: "guest",
    prerequisites: [],
    position: { x: 50, y: 11 },
  },
  {
    id: "exploit-types",
    short: "EXP",
    labelKey: "opponentTypes",
    branch: "exploit",
    minRole: "guest",
    prerequisites: [],
    position: { x: 77, y: 27 },
  },
  {
    id: "cash-game",
    short: "CASH",
    labelKey: "cashGame",
    branch: "cash",
    minRole: "guest",
    prerequisites: [],
    position: { x: 84, y: 50 },
  },
  {
    id: "tournament",
    short: "MTT",
    labelKey: "tournament",
    branch: "tournament",
    minRole: "guest",
    prerequisites: [],
    position: { x: 76, y: 73 },
  },
];

export const SKILL_EDGES: SkillEdge[] = [
  // Active connections
  { from: "equity-preflop", to: "flop-equity" },
  { from: "flop-equity", to: "turn-equity" },
  { from: "turn-equity", to: "river-equity" },
  { from: "equity-preflop", to: "pot-odds-combined" },
  { from: "pot-odds", to: "pot-odds-combined" },
  { from: "pot-odds-combined", to: "leak-training" },
  // Coming-soon hints (dashed)
  { from: "equity-preflop", to: "preflop-ranges", dashed: true },
  { from: "equity-preflop", to: "exploit-types", dashed: true },
  { from: "exploit-types", to: "cash-game", dashed: true },
  { from: "cash-game", to: "tournament", dashed: true },
];
