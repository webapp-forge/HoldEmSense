"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import PokerChip from "@/components/PokerChip";
import { ACHIEVEMENT_CONFIG, AchievementKey } from "@/lib/achievementConfig";

function playAchievementSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
    // AudioContext not available (e.g. SSR or blocked)
  }
}

type Props = {
  queue: AchievementKey[];
  onDismiss: (key: AchievementKey) => void;
};

export default function AchievementToast({ queue, onDismiss }: Props) {
  const t = useTranslations("achievements");
  const [visible, setVisible] = useState(false);

  const current = queue[0] ?? null;

  useEffect(() => {
    if (!current) return;
    setVisible(true);
    playAchievementSound();
    const fadeOut = setTimeout(() => setVisible(false), 10500);
    const remove = setTimeout(() => onDismiss(current), 11000);
    return () => {
      clearTimeout(fadeOut);
      clearTimeout(remove);
    };
  }, [current]);

  if (!current) return null;

  const cfg = ACHIEVEMENT_CONFIG[current];

  return (
    <div
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-64">
        <PokerChip color={cfg.color as any} value={cfg.value} size={56} />
        <div>
          <div className="text-xs text-lime-400 font-semibold uppercase tracking-wider mb-0.5">
            {t("unlocked")}
          </div>
          <div className="text-sm text-white leading-snug max-w-48">
            {t(current)}
          </div>
        </div>
      </div>
    </div>
  );
}
