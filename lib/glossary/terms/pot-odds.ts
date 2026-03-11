import type { GlossaryCategory } from "../types";

const potOdds: GlossaryCategory = {
  slug: "pot-odds",
  section: "poker",
  title: { en: "Pot Odds", de: "Pot Odds" },
  description: {
    en: "The ratio between the pot size and the cost of a call — tells you how much equity you need to break even.",
    de: "Das Verhältnis zwischen Pot-Größe und Call-Kosten — zeigt dir, wie viel Equity du brauchst, um kostendeckend zu spielen.",
  },
  terms: [
    {
      slug: "what-are-pot-odds",
      category: "pot-odds",
      title: { en: "What are Pot Odds?", de: "Was sind Pot Odds?" },
      summary: {
        en: "Pot odds express the price you are getting on a call as a percentage of the total pot after you call.",
        de: "Pot Odds drücken den Preis, den du für einen Call bekommst, als Prozentsatz des Gesamtpots nach dem Call aus.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "When facing a bet, pot odds tell you what percentage of the time you need to win to break even. If the pot is 100 and your opponent bets 50, you need to call 50 to win 150. Your pot odds are 50 / (100 + 50 + 50) = 25%. You need at least 25% equity to call profitably.",
            de: "Wenn du mit einem Bet konfrontiert bist, sagen dir Pot Odds, wie oft du gewinnen musst, um kostendeckend zu spielen. Ist der Pot 100 und dein Gegner bettet 50, musst du 50 callen um 150 zu gewinnen. Deine Pot Odds sind 50 / (100 + 50 + 50) = 25%. Du brauchst mindestens 25% Equity für einen profitablen Call.",
          },
        },
        {
          type: "heading",
          level: 3,
          text: { en: "The Formula", de: "Die Formel" },
        },
        {
          type: "paragraph",
          text: {
            en: "Required equity = Call amount ÷ (Pot before call + Opponent's bet + Your call)",
            de: "Benötigte Equity = Call-Betrag ÷ (Pot vor dem Call + Gegner-Bet + Dein Call)",
          },
        },
        {
          type: "tip",
          text: {
            en: "A half-pot bet means you need 25% equity. A pot-sized bet means you need 33%. A 2× pot bet means you need 40%. These are worth memorizing.",
            de: "Ein Half-Pot-Bet bedeutet 25% benötigte Equity. Ein Pot-Bet bedeutet 33%. Ein 2×-Pot-Bet bedeutet 40%. Diese Werte sind es wert, auswendig zu lernen.",
          },
        },
      ],
      relatedSlugs: ["pot-odds/pot-odds-vs-equity", "equity/what-is-equity"],
    },
    {
      slug: "pot-odds-vs-equity",
      category: "pot-odds",
      title: { en: "Pot Odds vs Equity", de: "Pot Odds vs. Equity" },
      summary: {
        en: "Comparing your equity to the pot odds required tells you whether a call is mathematically profitable.",
        de: "Den Vergleich deiner Equity mit den benötigten Pot Odds zeigt dir, ob ein Call mathematisch profitabel ist.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "The core decision rule is simple: if your equity exceeds the pot odds required, calling is profitable in the long run. If your equity is lower, folding is correct.",
            de: "Die grundlegende Entscheidungsregel ist einfach: Wenn deine Equity die benötigten Pot Odds übersteigt, ist ein Call langfristig profitabel. Liegt deine Equity darunter, ist Folden korrekt.",
          },
        },
        {
          type: "example",
          label: { en: "Example", de: "Beispiel" },
          text: {
            en: "You have a flush draw on the turn (roughly 20% equity). Pot is 80, opponent bets 20. Required equity = 20 / (80 + 20 + 20) = 16.7%. Since 20% > 16.7%, calling is profitable.",
            de: "Du hast einen Flush-Draw auf dem Turn (ca. 20% Equity). Pot ist 80, Gegner bettet 20. Benötigte Equity = 20 / (80 + 20 + 20) = 16,7%. Da 20% > 16,7%, ist Callen profitabel.",
          },
        },
        {
          type: "paragraph",
          text: {
            en: "In practice, equity is never exact — you are always working with estimates. Training your intuition to quickly gauge whether you have enough equity is far more valuable than precise calculation at the table.",
            de: "In der Praxis ist Equity nie exakt — du arbeitest immer mit Schätzungen. Deine Intuition zu trainieren, schnell einzuschätzen ob du genug Equity hast, ist am Tisch wertvoller als präzise Berechnungen.",
          },
        },
      ],
      relatedSlugs: ["pot-odds/what-are-pot-odds", "equity/what-is-equity"],
    },
  ],
};

export default potOdds;
