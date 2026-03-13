export type AchievementKey =
  | "group1_first_hand"
  | "group1_beginner"
  | "group1_intermediate"
  | "group1_advanced"
  | "group1_expert"
  | "streak_started"
  | "streak_3"
  | "streak_7"
  | "streak_30"
  | "streak_90"
  | "streak_365"
  | "streak_2y"
  | "streak_5y"
  | "leak_first_trained"
  | "leak_first_fixed"
  | "leak_10_fixed"
  | "leak_100_fixed"
  | "leak_500_fixed"
  | "leak_1000_fixed"
  | "leak_5000_fixed";

export type ChipValue = 1 | 5 | 10 | 25 | 50 | 100 | 500 | 1000;

export const ACHIEVEMENT_CONFIG: Record<
  AchievementKey,
  { color: string; value: ChipValue; labelKey: string }
> = {
  group1_first_hand:    { color: "blue", value: 1,    labelKey: "group1FirstHand" },
  group1_beginner:      { color: "blue", value: 5,    labelKey: "group1Beginner" },
  group1_intermediate:  { color: "blue", value: 10,   labelKey: "group1Intermediate" },
  group1_advanced:      { color: "blue", value: 25,   labelKey: "group1Advanced" },
  group1_expert:        { color: "blue", value: 100,  labelKey: "group1Expert" },
  streak_started:       { color: "fire", value: 1,    labelKey: "streakStarted" },
  streak_3:             { color: "fire", value: 5,    labelKey: "streak3" },
  streak_7:             { color: "fire", value: 10,   labelKey: "streak7" },
  streak_30:            { color: "fire", value: 25,   labelKey: "streak30" },
  streak_90:            { color: "fire", value: 50,   labelKey: "streak90" },
  streak_365:           { color: "fire", value: 100,  labelKey: "streak365" },
  streak_2y:            { color: "fire", value: 500,  labelKey: "streak2y" },
  streak_5y:            { color: "fire", value: 1000, labelKey: "streak5y" },
  leak_first_trained:   { color: "green", value: 1,    labelKey: "leakFirstTrained" },
  leak_first_fixed:     { color: "green", value: 5,    labelKey: "leakFirstFixed" },
  leak_10_fixed:        { color: "green", value: 25,   labelKey: "leak10Fixed" },
  leak_100_fixed:       { color: "green", value: 50,   labelKey: "leak100Fixed" },
  leak_500_fixed:       { color: "green", value: 100,  labelKey: "leak500Fixed" },
  leak_1000_fixed:      { color: "green", value: 500,  labelKey: "leak1000Fixed" },
  leak_5000_fixed:      { color: "green", value: 1000, labelKey: "leak5000Fixed" },
};

export const STREAK_THRESHOLDS: { key: AchievementKey; days: number }[] = [
  { key: "streak_started", days: 1 },
  { key: "streak_3",       days: 3 },
  { key: "streak_7",       days: 7 },
  { key: "streak_30",      days: 30 },
  { key: "streak_90",      days: 90 },
  { key: "streak_365",     days: 365 },
  { key: "streak_2y",      days: 730 },
  { key: "streak_5y",      days: 1825 },
];

// The 4 TrainingHand.module values in Trainingsgruppe 1
export const GROUP1_HAND_MODULES = ["preflop", "flop", "turn", "river"] as const;

// The corresponding UserProgress.module values
export const GROUP1_PROGRESS_MODULES = [
  "hand-vs-range",
  "hand-vs-range-flop",
  "hand-vs-range-turn",
  "hand-vs-range-river",
] as const;
