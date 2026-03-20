"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Props = {
  children: React.ReactNode;
  info?: React.ReactNode;
  explanation?: React.ReactNode;
};

export default function TrainPageLayout({ children, info, explanation }: Props) {
  const t = useTranslations("train");
  const [open, setOpen] = useState(true);
  const [mobileOverlay, setMobileOverlay] = useState<"matrix" | "info" | null>(null);

  return (
    <div className="relative md:pt-8">
      {/* Center: interactive — always centered on screen */}
      <div className="max-w-2xl mx-auto flex flex-col items-center">
        {children}

        {/* Overlay buttons:
              matrix button: visible below 1400px (inline above)
              info button:   visible below 1700px (inline above) */}
        {(info || explanation) && (
          <div className="flex gap-4 mt-6 min-[1700px]:hidden">
            {info && (
              <button
                onClick={() => setMobileOverlay("matrix")}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors min-[1400px]:hidden"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                {t("showMatrix")}
              </button>
            )}
            {explanation && (
              <button
                onClick={() => setMobileOverlay("info")}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" /><line x1="12" y1="8" x2="12" y2="8.5" strokeLinecap="round" strokeWidth="2" />
                  <line x1="12" y1="11" x2="12" y2="16" strokeLinecap="round" />
                </svg>
                {t("showInfo")}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Left: matrix — absolutely positioned, doesn't affect centering */}
      <div className="hidden min-[1400px]:block absolute top-0 left-0 md:top-8">
        {info}
      </div>

      {/* Right: explanation — absolutely positioned */}
      {explanation && (
        <div className="hidden min-[1700px]:flex absolute top-0 right-0 md:top-8 items-start">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-5 self-stretch bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-l transition-colors"
            title={open ? "Hide" : "Show"}
          >
            <span style={{ writingMode: "vertical-rl", fontSize: "0.65rem" }}>
              {open ? "▶" : "◀"}
            </span>
          </button>
          <div
            className="overflow-hidden transition-all duration-300"
            style={{ width: open ? "18rem" : "0", opacity: open ? 1 : 0 }}
          >
            <div className="w-72 bg-gray-800 rounded-r-lg p-4 text-sm text-gray-300 leading-relaxed">
              {explanation}
            </div>
          </div>
        </div>
      )}

      {/* Side drawer overlays */}
      {mobileOverlay && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex justify-end"
          onClick={() => setMobileOverlay(null)}
        >
          <div
            className={`relative h-full bg-gray-900 overflow-y-auto flex flex-col ${
              mobileOverlay === "matrix" ? "w-fit max-w-[90vw]" : "w-80 max-w-[90vw]"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 pt-4 pb-3 border-b border-gray-800">
              <span className="font-semibold text-white text-sm">
                {mobileOverlay === "matrix" ? t("showMatrix") : t("showInfo")}
              </span>
              <button
                onClick={() => setMobileOverlay(null)}
                className="text-gray-400 hover:text-white text-xl leading-none pl-4"
              >
                ✕
              </button>
            </div>
            <div className="p-4 text-sm text-gray-300 leading-relaxed">
              {mobileOverlay === "matrix" ? info : explanation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
