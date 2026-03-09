export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: 36, text: "text-lg" },
    md: { icon: 48, text: "text-2xl" },
    lg: { icon: 72, text: "text-4xl" },
  };
  const s = sizes[size];

  return (
    <div className="flex items-center gap-2">
      <svg width={s.icon} height={s.icon} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Card background */}
        <rect x="2" y="2" width="28" height="28" rx="4" fill="#1f2937" stroke="#4d7c0f" strokeWidth="1.5"/>
        {/* Spade */}
        <path d="M16 5 C16 5 7 11 7 17 C7 21 10.5 22.5 13.5 21 C13 23 11.5 24 10 24.5 L22 24.5 C20.5 24 19 23 18.5 21 C21.5 22.5 25 21 25 17 C25 11 16 5 16 5Z" fill="#84cc16"/>
        {/* Question mark */}
        <text x="16" y="20" textAnchor="middle" fontSize="16" fill="#1f2937" fontWeight="bold">?</text>
      </svg>
      <div className="flex flex-col w-fit">
        <span className={`${s.text} font-bold tracking-tight whitespace-nowrap`}>
          <span className="text-white">Hold'em</span>
          <span className="text-lime-400">Sense</span>
        </span>
        <span className="text-gray-400 uppercase text-[0.6em] mt-0.5 block tracking-[0.22em]">
          train your intuition
        </span>
      </div>
    </div>
  );
}
