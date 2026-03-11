import type { GlossaryCategory } from "../types";

const equity: GlossaryCategory = {
  slug: "equity",
  section: "poker",
  title: { en: "Equity", de: "Equity" },
  description: {
    en: "Your mathematical share of the pot based on your chance of winning.",
    de: "Dein mathematischer Anteil am Pot basierend auf deiner Gewinnwahrscheinlichkeit.",
  },
  terms: [
    {
      slug: "what-is-equity",
      category: "equity",
      title: { en: "What is Equity?", de: "Was ist Equity?" },
      summary: {
        en: "Equity is your share of the pot if the hand were played to showdown with no more betting.",
        de: "Equity ist dein Anteil am Pot, wenn die Hand ohne weiteres Setzen bis zum Showdown gespielt würde.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "Equity represents the percentage of the pot you would win on average if all remaining cards were dealt out and no more bets were placed. If you hold a 60% equity, you would, on average, win 60% of the pot.",
            de: "Equity ist der Prozentsatz des Pots, den du im Durchschnitt gewinnen würdest, wenn alle verbleibenden Karten aufgedeckt und keine weiteren Einsätze getätigt würden. Mit 60% Equity gewinnst du im Durchschnitt 60% des Pots.",
          },
        },
        {
          type: "example",
          label: { en: "Example", de: "Beispiel" },
          text: {
            en: "You hold A♠ K♦ against an opponent with Q♣ Q♥ before the flop. Your hand has roughly 46% equity — you will win about 46 out of 100 times if the hand is always played to showdown.",
            de: "Du hältst A♠ K♦ gegen einen Gegner mit Q♣ Q♥ vor dem Flop. Deine Hand hat etwa 46% Equity — du gewinnst ca. 46 von 100 Malen, wenn die Hand immer bis zum Showdown gespielt wird.",
          },
        },
        {
          type: "paragraph",
          text: {
            en: "Equity alone does not tell you whether a call or bet is profitable — for that you also need to consider pot odds and implied odds. But it is the foundation of all poker math.",
            de: "Equity allein sagt dir nicht, ob ein Call oder Bet profitabel ist — dafür brauchst du auch Pot Odds und Implied Odds. Aber sie ist die Grundlage aller Poker-Mathematik.",
          },
        },
      ],
      relatedSlugs: ["equity/equity-vs-range", "pot-odds/what-are-pot-odds"],
    },
    {
      slug: "equity-vs-range",
      category: "equity",
      title: { en: "Equity vs a Range", de: "Equity gegen eine Range" },
      summary: {
        en: "In real play your opponent holds an unknown hand — you calculate equity against the full distribution of hands they might have.",
        de: "Im echten Spiel hält dein Gegner eine unbekannte Hand — du berechnest Equity gegen die gesamte Verteilung möglicher Hände.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "You rarely know your opponent's exact hand. Instead, you assign them a range — a set of possible hands weighted by how likely they are given their actions. Your equity is then the average across all those hands.",
            de: "Du kennst selten die genaue Hand deines Gegners. Stattdessen weist du ihm eine Range zu — eine Menge möglicher Hände, gewichtet nach ihrer Wahrscheinlichkeit aufgrund seiner Aktionen. Deine Equity ist dann der Durchschnitt über all diese Hände.",
          },
        },
        {
          type: "example",
          label: { en: "Example", de: "Beispiel" },
          text: {
            en: "A tight player 3-bets from early position. You put them on a range of JJ+, AK. Your K♥ Q♥ has about 35% equity against this range — worse than against a random hand, because the range heavily favors premium holdings.",
            de: "Ein enger Spieler 3-bettet aus früher Position. Du ordnest ihm eine Range von JJ+, AK zu. Dein K♥ Q♥ hat gegen diese Range etwa 35% Equity — schlechter als gegen eine zufällige Hand, weil die Range stark zu Premium-Händen tendiert.",
          },
        },
        {
          type: "tip",
          text: {
            en: "This is exactly what HoldEmSense trains: estimating your equity against a defined villain range so you can make quick, accurate decisions at the table.",
            de: "Genau das trainiert HoldEmSense: deine Equity gegen eine definierte Villain-Range einzuschätzen, damit du am Tisch schnelle, präzise Entscheidungen treffen kannst.",
          },
        },
      ],
      relatedSlugs: ["equity/what-is-equity", "ranges/what-is-a-range"],
    },
  ],
};

export default equity;
