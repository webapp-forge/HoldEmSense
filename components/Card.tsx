type CardProps = {
  rank: string;
  suit: string;
  fourColor?: boolean;
};

const suitColor2: Record<string, string> = {
  "♠": "text-gray-900",
  "♣": "text-gray-900",
  "♥": "text-red-600",
  "♦": "text-red-600",
};

const suitColor4: Record<string, string> = {
  "♠": "text-gray-900",
  "♣": "text-green-600",
  "♥": "text-red-600",
  "♦": "text-blue-600",
};

export default function Card({ rank, suit, fourColor = false }: CardProps) {
  const suitColor = fourColor ? suitColor4 : suitColor2;
  return (
    <div className="w-10 h-14 bg-gray-100 rounded-md flex flex-col items-center justify-center shadow-md">
      <span className={`text-2xl font-bold leading-none ${suitColor[suit]}`}>
        {rank}
      </span>
      <span className={`text-2xl leading-none ${suitColor[suit]}`}>
        {suit}
      </span>
    </div>
  );
}
