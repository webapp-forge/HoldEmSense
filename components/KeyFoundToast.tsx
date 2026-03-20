"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

function playKeySound() {
  try {
    const ctx = new AudioContext();
    const notes = [659.25, 880]; // E5, A5 — short "unlock" jingle
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.start(start);
      osc.stop(start + 0.5);
    });
  } catch {
    // AudioContext not available
  }
}

type Props = {
  moduleLabel: string | null; // null = hidden
  streetColor?: string; // tailwind text color class, e.g. "text-blue-400"
  onDismiss: () => void;
};

export default function KeyFoundToast({ moduleLabel, streetColor = "text-amber-400", onDismiss }: Props) {
  const t = useTranslations("train");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!moduleLabel) return;
    setVisible(true);
    playKeySound();
    const fadeOut = setTimeout(() => setVisible(false), 6000);
    const remove = setTimeout(() => onDismiss(), 6500);
    return () => {
      clearTimeout(fadeOut);
      clearTimeout(remove);
    };
  }, [moduleLabel]);

  if (!moduleLabel) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-gray-800 border border-gray-600 rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-64">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" className={`${streetColor} drop-shadow-lg flex-shrink-0`}>
          <path d="M12 2a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM11 10h2v11h-2zM13 14.5h3v2h-3zM13 18h2.5v2h-2.5z" />
        </svg>
        <div>
          <div className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${streetColor}`}>
            {t("keyFound")}
          </div>
          <div className="text-sm text-white leading-snug max-w-56">
            {t("keyFoundDetail", { module: moduleLabel })}
          </div>
        </div>
      </div>
    </div>
  );
}
