"use client";

import { useState } from "react";

type Props = {
  children: React.ReactNode;
  info?: React.ReactNode;
  explanation?: React.ReactNode;
};

export default function TrainPageLayout({ children, info, explanation }: Props) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex gap-6 items-start">
      {/* Left: interactive */}
      <div className="flex-none max-w-2xl w-full">
        {children}
      </div>

      {/* Middle: module info */}
      {info && (
        <div className="hidden xl:block flex-1 min-w-0">
          {info}
        </div>
      )}

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
    </div>
  );
}
