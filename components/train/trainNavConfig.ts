export type Role = "guest" | "registered" | "premium";

export type NavLinkConfig = {
  key: string;
  href: string;
  minRole: Role;
};

export type NavSection = {
  sectionKey: string;
  links: NavLinkConfig[];
};

export const trainNavSections: NavSection[] = [
  {
    sectionKey: "equityTraining",
    links: [
      { key: "handVsHand", href: "/train/equity/hand-vs-hand", minRole: "guest" },
      { key: "handVsRange", href: "/train/equity/hand-vs-range", minRole: "guest" },
      { key: "flopHandVsRange", href: "/train/equity/hand-vs-range-flop", minRole: "guest" },
      { key: "turnHandVsRange", href: "/train/equity/hand-vs-range-turn", minRole: "registered" },
      { key: "riverHandVsRange", href: "/train/equity/hand-vs-range-river", minRole: "registered" },
      { key: "potOdds", href: "/train/equity/pot-odds", minRole: "guest" },
      { key: "handVsRangePotOdds", href: "/train/equity/hand-vs-range-pot-odds", minRole: "registered" },
    ],
  },
  {
    sectionKey: "weaknessTraining",
    links: [
      { key: "equityLeaks", href: "/train/leak-fixing/equity", minRole: "premium" },
    ],
  },
];
