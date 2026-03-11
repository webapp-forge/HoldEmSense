import type { GlossaryCategory } from "../types";

const ranges: GlossaryCategory = {
  slug: "ranges",
  section: "poker",
  title: { en: "Hand Ranges", de: "Hand-Ranges" },
  description: {
    en: "Thinking in ranges — the set of hands a player might hold — is one of the most important skills in poker.",
    de: "In Ranges zu denken — die Menge der Hände, die ein Spieler halten könnte — ist eine der wichtigsten Fähigkeiten im Poker.",
  },
  terms: [
    {
      slug: "what-is-a-range",
      category: "ranges",
      title: { en: "What is a Hand Range?", de: "Was ist eine Hand-Range?" },
      summary: {
        en: "A range is the full set of hands a player could hold at any given point, based on their position and actions.",
        de: "Eine Range ist die Gesamtheit der Hände, die ein Spieler zu einem bestimmten Zeitpunkt halten könnte, basierend auf seiner Position und seinen Aktionen.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "You never know an opponent's exact hand — but you can deduce which hands are consistent with how they played. This set of possible hands is their range. Strong players think in ranges rather than guessing a single hand.",
            de: "Du kennst die genaue Hand eines Gegners nie — aber du kannst ableiten, welche Hände mit seiner Spielweise vereinbar sind. Diese Menge möglicher Hände ist seine Range. Starke Spieler denken in Ranges, anstatt eine einzelne Hand zu erraten.",
          },
        },
        {
          type: "example",
          label: { en: "Example", de: "Beispiel" },
          text: {
            en: "A player raises from under the gun at a full table. Most recreational players here have a tight range: big pairs (TT+), big aces (AQ+), and a few suited connectors. They are unlikely to hold 72o or even K5s.",
            de: "Ein Spieler raised von Under the Gun am vollen Tisch. Die meisten Freizeitspieler haben hier eine enge Range: große Paare (TT+), starke Asse (AQ+) und einige Suited Connectors. Es ist unwahrscheinlich, dass sie 72o oder K5s halten.",
          },
        },
        {
          type: "tip",
          text: {
            en: "Ranges change as the hand progresses. Each action your opponent takes narrows (or sometimes widens) their range. Updating your range read on each street is a key skill.",
            de: "Ranges verändern sich im Verlauf einer Hand. Jede Aktion deines Gegners verengt (oder manchmal erweitert) seine Range. Das Aktualisieren deines Range-Reads auf jeder Street ist eine Schlüsselkompetenz.",
          },
        },
      ],
      relatedSlugs: ["ranges/top-x-percent", "equity/equity-vs-range"],
    },
    {
      slug: "top-x-percent",
      category: "ranges",
      title: { en: "Top X% Ranges", de: "Top X%-Ranges" },
      summary: {
        en: "Describing a range as the 'top X%' of hands is a simple way to define how tight or loose a player's range is.",
        de: "Eine Range als 'Top X%' der Hände zu beschreiben ist eine einfache Methode, um festzulegen, wie eng oder weit die Range eines Spielers ist.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "There are 169 distinct starting hand combinations in Hold'em (ignoring suits). Ranking them by strength, the 'top 10%' refers to roughly the 17 strongest hands. The top 20% includes strong aces, broadways, and medium pairs.",
            de: "Es gibt 169 verschiedene Starthände im Hold'em (Farben ignoriert). Geordnet nach Stärke bezeichnet 'Top 10%' ca. die 17 stärksten Hände. Die Top 20% umfassen starke Asse, Broadway-Hände und mittlere Paare.",
          },
        },
        {
          type: "list",
          items: [
            {
              en: "Top 2%: AA, KK, QQ, AKs",
              de: "Top 2%: AA, KK, QQ, AKs",
            },
            {
              en: "Top 5%: + JJ, TT, AKo, AQs",
              de: "Top 5%: + JJ, TT, AKo, AQs",
            },
            {
              en: "Top 10%: + 99, 88, AQo, AJs, KQs",
              de: "Top 10%: + 99, 88, AQo, AJs, KQs",
            },
            {
              en: "Top 20%: + 77, 66, ATs, AJo, KJs, QJs, JTs and more",
              de: "Top 20%: + 77, 66, ATs, AJo, KJs, QJs, JTs und mehr",
            },
          ],
        },
        {
          type: "paragraph",
          text: {
            en: "In HoldEmSense, the villain's range is expressed as a top X% figure. This is how poker players typically describe ranges in live games — 'he's a nit, he probably has the top 5%' or 'she's loose, she's playing the top 30%'.",
            de: "In HoldEmSense wird die Range des Villains als Top X%-Wert angegeben. So beschreiben Pokerspieler Ranges typischerweise in Live-Spielen — 'er ist ein Nit, er hat wahrscheinlich die Top 5%' oder 'sie spielt loose, ca. Top 30%'.",
          },
        },
      ],
      relatedSlugs: ["ranges/what-is-a-range", "equity/equity-vs-range"],
    },
  ],
};

export default ranges;
