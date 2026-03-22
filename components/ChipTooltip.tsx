import PokerChip from "./PokerChip";

type Props = {
  label: string;
  color: string;
  value: 1 | 5 | 10 | 25 | 50 | 100 | 500 | 1000;
  size: number;
};

export default function ChipTooltip({ label, color, value, size }: Props) {
  return (
    <div className="relative group/chip">
      <PokerChip color={color as any} value={value} size={size} />
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-gray-200 text-xs font-medium whitespace-nowrap shadow-lg opacity-0 group-hover/chip:opacity-100 pointer-events-none transition-opacity duration-150 z-20">
        {label}
        <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-[6px] border-x-transparent border-t-[6px] border-t-gray-700" />
      </div>
    </div>
  );
}
