type ChipColor = {
  outer: string;
  middle: string;
  stripe: string;
  text: string;
};

const COLOR_THEMES: Record<string, ChipColor> = {
  blue: {
    outer: "#1e40af",
    middle: "#1d4ed8",
    stripe: "#93c5fd",
    text: "#ffffff",
  },
  green: {
    outer: "#166534",
    middle: "#16a34a",
    stripe: "#86efac",
    text: "#ffffff",
  },
  red: {
    outer: "#991b1b",
    middle: "#dc2626",
    stripe: "#fca5a5",
    text: "#ffffff",
  },
  gold: {
    outer: "#92400e",
    middle: "#d97706",
    stripe: "#fde68a",
    text: "#1c1917",
  },
  fire: {
    outer: "#b91c1c",
    middle: "#ea580c",
    stripe: "#fde047",
    text: "#ffffff",
  },
  purple: {
    outer: "#6b21a8",
    middle: "#9333ea",
    stripe: "#d8b4fe",
    text: "#ffffff",
  },
};

type Props = {
  color?: keyof typeof COLOR_THEMES;
  value?: 1 | 5 | 10 | 25 | 50 | 100 | 500 | 1000;
  size?: number;
};

export default function PokerChip({ color = "blue", value = 5, size = 120 }: Props) {
  const theme = COLOR_THEMES[color];
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 2;

  const stripeCount = 12; // 6 light + 6 chip-color, alternating
  const stripeAngle = (2 * Math.PI) / stripeCount;
  const stripeR = r * 0.88;
  // Width matches arc spacing for equal-size appearance
  const stripeWidth = 2 * stripeR * Math.sin(Math.PI / stripeCount) * 0.92;
  const stripeHeight = r * 0.22;

  const r4 = (n: number) => Math.round(n * 1e4) / 1e4;

  const stripes = Array.from({ length: stripeCount }, (_, i) => {
    const angle = i * stripeAngle - Math.PI / 2;
    const x = r4(cx + stripeR * Math.cos(angle));
    const y = r4(cy + stripeR * Math.sin(angle));
    const deg = r4((angle * 180) / Math.PI + 90);
    return { x, y, deg, colored: i % 2 === 0 };
  });

  const digits = String(value).length;
  const fontSize = size * (digits <= 3 ? 0.26 : 0.23);
  const filterId = `shadow-${color}-${value}-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>

      <circle cx={cx} cy={cy} r={r} fill={theme.outer} filter={`url(#${filterId})`} />

      {stripes.map((s, i) => (
        <rect
          key={i}
          x={s.x - stripeWidth / 2}
          y={s.y - stripeHeight / 2}
          width={stripeWidth}
          height={stripeHeight}
          fill={s.colored ? theme.stripe : theme.outer}
          transform={`rotate(${s.deg}, ${s.x}, ${s.y})`}
          rx={stripeWidth * 0.2}
        />
      ))}

      <circle
        cx={cx}
        cy={cy}
        r={r * 0.72}
        fill={theme.outer}
        stroke={theme.stripe}
        strokeWidth={r * 0.04}
      />

      <circle cx={cx} cy={cy} r={r * 0.58} fill={theme.middle} />

      {/* Spade watermark */}
      <text
        x={cx}
        y={cy - r * 0.08}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#000000"
        fontSize={r * 1.45}
        opacity={0.25}
        fontFamily="serif"
      >
        ♠
      </text>

      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={theme.text}
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="var(--font-oswald), sans-serif"
        letterSpacing="-1"
      >
        {value}
      </text>
    </svg>
  );
}
