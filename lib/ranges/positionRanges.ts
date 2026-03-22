export type Position = "UTG" | "MP" | "CO" | "BTN" | "SB";

export const POSITIONS: Position[] = ["UTG", "MP", "CO", "BTN", "SB"];

// Standard TAG opening ranges for 6-max (percentage of all starting hands)
export const POSITION_OPEN_PERCENT: Record<Position, number> = {
  UTG: 15,
  MP: 20,
  CO: 28,
  BTN: 40,
  SB: 35,
};
