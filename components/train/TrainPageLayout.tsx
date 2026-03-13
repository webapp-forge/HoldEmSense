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
    <div className="flex gap-6 items-start">
      {/* Left: interactive */}
      <div className="flex-none max-w-2xl w-full">
        {children}

        {/* Mobile buttons — visible below lg (matrix) / xl (matrix only on xl) */}
        {(info || explanation) && (
          <div className="flex gap-2 mt-6 lg:hidden">
            {info && (
              <button
                onClick={() => setMobileOverlay("matrix")}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
              >
                {t("showMatrix")}
              </button>
            )}
            {explanation && (
              <button
                onClick={() => setMobileOverlay("info")}
                className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
              >
                {t("showInfo")}
              </button>
            )}
          </div>
        )}
        {/* Show matrix button between lg and xl (explanation is visible, matrix still hidden) */}
        {info && (
          <div className="hidden lg:flex xl:hidden mt-6">
            <button
              onClick={() => setMobileOverlay("matrix")}
              className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
            >
              {t("showMatrix")}
            </button>
          </div>
        )}
      </div>

      {/* Middle: module info */}
      <div className="hidden xl:block flex-1 min-w-0">
        {info}
      </div>

      {/* Right: explanation (collapsible) */}
      {explanation && (
        <div className="hidden lg:flex flex-none items-start">
          {/* Toggle tab */}
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center justify-center w-5 self-stretch bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white rounded-l transition-colors"
            title={open ? "Hide" : "Show"}
          >
            <span style={{ writingMode: "vertical-rl", fontSize: "0.65rem" }}>
              {open ? "▶" : "◀"}
            </span>
          </button>

          {/* Panel content */}
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

      {/* Mobile overlays */}
      {mobileOverlay && (
        <div
          className="fixed inset-0 bg-black/70 z-50 flex items-end"
          onClick={() => setMobileOverlay(null)}
        >
          <div
            className="w-full bg-gray-900 rounded-t-xl p-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-white">
                {mobileOverlay === "matrix" ? t("showMatrix") : t("showInfo")}
              </span>
              <button
                onClick={() => setMobileOverlay(null)}
                className="text-gray-400 hover:text-white text-xl leading-none px-1"
              >
                ✕
              </button>
            </div>
            {mobileOverlay === "matrix" ? info : explanation}
          </div>
        </div>
      )}
    </div>
  );
}
