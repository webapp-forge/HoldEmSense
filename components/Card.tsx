type CardProps = {
  rank: string;
  suit: string;
};

const suitColor: Record<string, string> = {
  "♠": "text-black",
  "♣": "text-black",
  "♥": "text-red-600",
  "♦": "text-red-600",
};

export default function Card({ rank, suit }: CardProps) {
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
