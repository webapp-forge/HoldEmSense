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

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<Size, { card: string; text: string }> = {
  sm: { card: "w-10 h-14", text: "text-2xl" },
  md: { card: "w-10 h-14", text: "text-2xl" },
  lg: { card: "w-14 h-20", text: "text-3xl" },
  xl: { card: "w-[4.5rem] h-[6.25rem]", text: "text-4xl" },
};

export default function Card({ rank, suit, fourColor = false, size = "md" }: CardProps & { size?: Size }) {
  const suitColor = fourColor ? suitColor4 : suitColor2;
  const s = SIZE_CLASSES[size];
  return (
    <div className={`${s.card} bg-gray-100 rounded-md flex flex-col items-center justify-center shadow-md`}>
      <span className={`${s.text} font-bold leading-none ${suitColor[suit]}`}>
        {rank}
      </span>
      <span className={`${s.text} leading-none ${suitColor[suit]}`}>
        {suit}
      </span>
    </div>
  );
}
