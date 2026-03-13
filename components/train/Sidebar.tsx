"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { getOpenLeakCount } from "@/lib/actions/training";
import { trainNavSections, type Role } from "@/components/train/trainNavConfig";

const ROLE_RANK: Record<Role, number> = { guest: 0, registered: 1, premium: 2 };

function hasAccess(userRole: Role, minRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[minRole];
}

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
        {trainNavSections.map((section, i) => (
          <div key={section.sectionKey}>
            <span className={`hidden md:block text-xs text-gray-400 uppercase tracking-wider mb-2 ${i > 0 ? "mt-6" : ""}`}>
              {t(section.sectionKey as Parameters<typeof t>[0])}
            </span>
            {section.links.map((link) => {
              const accessible = hasAccess(role, link.minRole);
              const active = pathname === link.href;
              const isLeakSection = section.sectionKey === "weaknessTraining";
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
                  {accessible && isLeakSection && leakCount > 0 && (
                    <span className="ml-2 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center">
                      {leakCount}
                    </span>
                  )}
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
