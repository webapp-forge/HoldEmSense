type Position = "UTG" | "MP" | "CO" | "BTN" | "SB" | "BB";

// Seats arranged around a horizontal pill/stadium shape
// ViewBox is 320x200 for a landscape pill
const SEAT_POSITIONS: Record<Position, { x: number; y: number }> = {
  BTN: { x: 275, y: 55 },
  SB:  { x: 275, y: 145 },
  BB:  { x: 160, y: 160 },
  UTG: { x: 45, y: 145 },
  MP:  { x: 45, y: 55 },
  CO:  { x: 160, y: 40 },
};

const ALL_POSITIONS: Position[] = ["UTG", "MP", "CO", "BTN", "SB", "BB"];

export default function PokerTable6max({ heroPosition }: { heroPosition: string }) {
  // Stadium/pill shape: two semicircles connected by straight lines
  // Left arc center: (80, 100), right arc center: (240, 100), radius: 60
  const tablePath = "M 80 40 L 240 40 A 60 60 0 0 1 240 160 L 80 160 A 60 60 0 0 1 80 40 Z";

  return (
    <div className="w-[400px] mx-auto">
      <svg viewBox="0 0 320 200" xmlns="http://www.w3.org/2000/svg">
        {/* Table outline — pill shape */}
        <path
          d={tablePath}
          fill="none"
          stroke="#4b5563"
          strokeWidth="2"
        />

        {/* Dealer button */}
        <circle cx="248" cy="68" r="6" fill="#374151" stroke="#6b7280" strokeWidth="0.8" />
        <text x="248" y="70" textAnchor="middle" fontSize="7" fill="#9ca3af" fontWeight="bold">D</text>

        {/* Seats */}
        {ALL_POSITIONS.map((pos) => {
          const { x, y } = SEAT_POSITIONS[pos];
          const isHero = pos === heroPosition;
          const isBB = pos === "BB";

          return (
            <g key={pos}>
              <circle
                cx={x}
                cy={y}
                r="16"
                fill={isHero ? "#1d4ed8" : "#1f2937"}
                stroke={isHero ? "#3b82f6" : "#4b5563"}
                strokeWidth={isHero ? "2" : "1"}
              />
              <text
                x={x}
                y={y + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="11"
                fontWeight={isHero ? "bold" : "normal"}
                fill={isHero ? "#ffffff" : isBB ? "#6b7280" : "#9ca3af"}
                fontFamily="sans-serif"
              >
                {pos}
              </text>
              {(pos === "SB" || pos === "BB") && (
                <text
                  x={x}
                  y={y + 28}
                  textAnchor="middle"
                  fontSize="8"
                  fill="#6b7280"
                  fontFamily="sans-serif"
                >
                  {pos === "SB" ? "0.5 BB" : "1 BB"}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
