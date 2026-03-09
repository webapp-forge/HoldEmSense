"use client";

import { usePathname } from "next/navigation";

const links = [
  { label: "Hand vs Range", href: "/train/equity/hand-vs-range" },
  { label: "Flop: Hand vs Range", href: "/train/equity/hand-vs-range-flop" },
  { label: "Turn: Hand vs Range", href: "/train/equity/hand-vs-range-turn" },
  { label: "River: Hand vs Range", href: "/train/equity/hand-vs-range-river" },
  { label: "Hand vs Range + Pot Odds", href: "/train/equity/hand-vs-range-pot-odds" },
];

export default function TrainSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:block bg-gray-900 text-white md:w-64 md:min-h-screen">
      <nav className="flex flex-row md:flex-col gap-1 p-3 md:p-4 overflow-x-auto">
        <span className="hidden md:block text-xs text-gray-400 uppercase tracking-wider mb-2">
          Equity Training
        </span>
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap px-3 py-2 rounded text-sm ${
              pathname === link.href
                ? "bg-lime-600 text-white font-semibold"
                : "hover:bg-gray-700"
            }`}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
