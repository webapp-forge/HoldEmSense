const SEATS = 6;

function getSeatPosition(index: number, total: number) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  const x = 50 + 42 * Math.cos(angle);
  const y = 50 + 38 * Math.sin(angle);
  return { x, y };
}

export default function PokerTable() {
  return (
    <div className="relative w-[600px] h-[400px]">
      {/* Tisch */}
      <div className="absolute inset-0 bg-green-800 rounded-[200px] border-4 border-green-400" />

      {/* Sitze */}
      {Array.from({ length: SEATS }).map((_, i) => {
        const { x, y } = getSeatPosition(i, SEATS);
        const isHero = i === Math.floor(SEATS / 2);
        return (
          <div
            key={i}
            className={`absolute w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold text-white -translate-x-1/2 -translate-y-1/2 ${
              isHero ? "bg-blue-600" : "bg-gray-600"
            }`}
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {isHero ? "Hero" : `V${i}`}
          </div>
        );
      })}
    </div>
  );
}
