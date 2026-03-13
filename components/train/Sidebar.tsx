"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getOpenLeakCount } from "@/lib/actions/training";

type Role = "guest" | "registered" | "premium";

const ROLE_RANK: Record<Role, number> = { guest: 0, registered: 1, premium: 2 };

function hasAccess(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

const equityLinks: { key: string; href: string; minRole: Role }[] = [
  { key: "handVsRange", href: "/train/equity/hand-vs-range", minRole: "guest" },
  { key: "flopHandVsRange", href: "/train/equity/hand-vs-range-flop", minRole: "guest" },
  { key: "turnHandVsRange", href: "/train/equity/hand-vs-range-turn", minRole: "registered" },
  { key: "riverHandVsRange", href: "/train/equity/hand-vs-range-river", minRole: "registered" },
  { key: "potOdds", href: "/train/equity/pot-odds", minRole: "guest" },
  { key: "handVsRangePotOdds", href: "/train/equity/hand-vs-range-pot-odds", minRole: "registered" },
];

const leakLinks: { key: string; href: string; minRole: Role }[] = [
  { key: "equityLeaks", href: "/train/leak-fixing/equity", minRole: "premium" },
];

export default function TrainSidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const [leakCount, setLeakCount] = useState(0);

  useEffect(() => {
    if (role !== "premium") return;
    const refresh = () => getOpenLeakCount().then(setLeakCount);
    refresh();
    window.addEventListener("leak-processed", refresh);
    return () => window.removeEventListener("leak-processed", refresh);
  }, [pathname, role]);

  return (
    <aside className="hidden md:block bg-gray-900 text-white md:w-64 md:min-h-screen">
      <nav className="flex flex-row md:flex-col gap-1 p-3 md:p-4 overflow-x-auto">
        <span className="hidden md:block text-xs text-gray-400 uppercase tracking-wider mb-2">
          {t("equityTraining")}
        </span>
        {equityLinks.map((link) => {
          const accessible = hasAccess(role, link.minRole);
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between whitespace-nowrap px-3 py-2 rounded text-sm ${
                active
                  ? "bg-lime-600 text-white font-semibold"
                  : accessible
                  ? "hover:bg-gray-700"
                  : "text-gray-500 hover:bg-gray-800"
              }`}
            >
              {t(link.key as Parameters<typeof t>[0])}
              {!accessible && (
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  link.minRole === "premium"
                    ? "bg-amber-700 text-amber-100"
                    : "bg-lime-700 text-lime-100"
                }`}>
                  {link.minRole === "premium" ? "PRO" : "REG"}
                </span>
              )}
            </a>
          );
        })}
        <span className="hidden md:block text-xs text-gray-400 uppercase tracking-wider mb-2 mt-6">
          {t("weaknessTraining")}
        </span>
        {leakLinks.map((link) => {
          const accessible = hasAccess(role, link.minRole);
          const active = pathname === link.href;
          return (
            <a
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between whitespace-nowrap px-3 py-2 rounded text-sm ${
                active
                  ? "bg-lime-600 text-white font-semibold"
                  : accessible
                  ? "hover:bg-gray-700"
                  : "text-gray-500 hover:bg-gray-800"
              }`}
            >
              {t(link.key as Parameters<typeof t>[0])}
              {accessible && leakCount > 0 && (
                <span className="ml-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                  {leakCount}
                </span>
              )}
              {!accessible && (
                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-700 text-amber-100">
                  PRO
                </span>
              )}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
