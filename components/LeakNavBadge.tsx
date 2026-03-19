"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getOpenLeakCount } from "@/lib/actions/training";

function WrenchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

export default function LeakNavBadge({
  initialCount,
  label,
}: {
  initialCount: number;
  label: string;
}) {
  const [count, setCount] = useState(initialCount);
  const pathname = usePathname();
  const isActive = pathname?.startsWith("/train/leak-fixing");

  useEffect(() => {
    const refresh = () => getOpenLeakCount().then(setCount);
    window.addEventListener("leak-processed", refresh);
    return () => window.removeEventListener("leak-processed", refresh);
  }, []);

  return (
    <Link
      href="/train/leak-fixing/equity"
      className={`flex items-center gap-1.5 text-sm transition-colors ${
        isActive ? "text-lime-400" : "hover:text-lime-400"
      }`}
    >
      <WrenchIcon />
      {label}
      {count > 0 && (
        <span className="min-w-[1rem] h-4 px-0.5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
          {count}
        </span>
      )}
    </Link>
  );
}
