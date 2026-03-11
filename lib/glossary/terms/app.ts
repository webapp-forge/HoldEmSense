import type { GlossaryCategory } from "../types";

const app: GlossaryCategory = {
  slug: "app",
  section: "app",
  title: { en: "How HoldEmSense Works", de: "Wie HoldEmSense funktioniert" },
  description: {
    en: "App-specific concepts: difficulty levels, scoring, and the leak system.",
    de: "App-spezifische Konzepte: Schwierigkeitsstufen, Punktevergabe und das Leak-System.",
  },
  terms: [
    {
      slug: "difficulty-levels",
      category: "app",
      title: { en: "Difficulty Levels", de: "Schwierigkeitsstufen" },
      summary: {
        en: "Four difficulty levels control the size of the equity brackets you must estimate — the harder the level, the more precise you need to be.",
        de: "Vier Schwierigkeitsstufen bestimmen die Größe der Equity-Klassen, die du schätzen musst — je schwieriger die Stufe, desto präziser musst du sein.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "Your equity estimate is grouped into brackets. At Beginner level, each bracket is 20 percentage points wide (0–20%, 20–40%, etc.) — a rough guess is enough. At Expert level, brackets are only 2 percentage points wide, demanding near-exact calculation.",
            de: "Deine Equity-Schätzung wird in Klassen eingeteilt. Auf Anfänger-Niveau ist jede Klasse 20 Prozentpunkte breit (0–20%, 20–40% usw.) — eine grobe Schätzung reicht. Auf Experten-Niveau sind die Klassen nur 2 Prozentpunkte breit, was eine nahezu exakte Berechnung erfordert.",
          },
        },
        {
          type: "list",
          items: [
            {
              en: "Beginner — brackets of 20% (5 options)",
              de: "Anfänger — Klassen von 20% (5 Optionen)",
            },
            {
              en: "Intermediate — brackets of 10% (10 options)",
              de: "Mittel — Klassen von 10% (10 Optionen)",
            },
            {
              en: "Advanced — brackets of 5% (20 options, slider)",
              de: "Fortgeschritten — Klassen von 5% (20 Optionen, Slider)",
            },
            {
              en: "Expert — brackets of 2% (50 options, slider)",
              de: "Experte — Klassen von 2% (50 Optionen, Slider)",
            },
          ],
        },
        {
          type: "paragraph",
          text: {
            en: "Levels unlock automatically once you reach 250 out of 300 possible points on your last 100 hands at the current level.",
            de: "Stufen schalten sich automatisch frei, sobald du auf deinen letzten 100 Händen der aktuellen Stufe 250 von 300 möglichen Punkten erreichst.",
          },
        },
      ],
      relatedSlugs: ["app/scoring", "app/leak-system"],
    },
    {
      slug: "scoring",
      category: "app",
      title: { en: "Scoring System", de: "Punktesystem" },
      summary: {
        en: "Each hand scores 0, 1, or 3 points depending on how close your equity estimate is to the correct answer.",
        de: "Jede Hand bringt 0, 1 oder 3 Punkte, je nachdem wie nah deine Equity-Schätzung an der richtigen Antwort ist.",
      },
      blocks: [
        {
          type: "list",
          items: [
            {
              en: "Perfect (+3 pts) — exact bracket",
              de: "Volltreffer (+3 Punkte) — exakte Klasse",
            },
            {
              en: "Close (+1 pt) — one bracket off",
              de: "Nah dran (+1 Punkt) — eine Klasse daneben",
            },
            {
              en: "Miss (+0 pts) — two or more brackets off",
              de: "Daneben (+0 Punkte) — zwei oder mehr Klassen daneben",
            },
          ],
        },
        {
          type: "paragraph",
          text: {
            en: "Your score is tracked over a rolling window of your last 100 hands (max 300 points). This window ensures that your current skill level is always reflected — old mistakes fade out over time.",
            de: "Dein Score wird über ein rollendes Fenster deiner letzten 100 Hände verfolgt (max. 300 Punkte). Dieses Fenster stellt sicher, dass dein aktuelles Niveau immer widergespiegelt wird — alte Fehler verschwinden mit der Zeit.",
          },
        },
      ],
      relatedSlugs: ["app/difficulty-levels", "app/leak-system"],
    },
    {
      slug: "leak-system",
      category: "app",
      title: { en: "Leak System", de: "Leak-System" },
      summary: {
        en: "Hands you miss or nearly miss are automatically scheduled for review using spaced repetition — fix your weak spots systematically.",
        de: "Hände, die du verfehlst oder knapp verfehlst, werden automatisch mittels Spaced Repetition zur Wiederholung eingeplant — behebe deine Schwachstellen systematisch.",
      },
      blocks: [
        {
          type: "paragraph",
          text: {
            en: "Every hand that scores less than 3 points becomes a leak — a spot where your intuition needs more work. The system schedules these hands for review at increasing intervals, similar to flashcard apps like Anki.",
            de: "Jede Hand mit weniger als 3 Punkten wird zu einem Leak — eine Situation, bei der deine Intuition mehr Arbeit braucht. Das System plant diese Hände zur Wiederholung in wachsenden Abständen ein, ähnlich wie Karteikarten-Apps wie Anki.",
          },
        },
        {
          type: "list",
          items: [
            {
              en: "Stage 1 — review after 1 hour",
              de: "Stufe 1 — Wiederholung nach 1 Stunde",
            },
            {
              en: "Stage 2 — review after 24 hours",
              de: "Stufe 2 — Wiederholung nach 24 Stunden",
            },
            {
              en: "Stage 3 — review after 7 days",
              de: "Stufe 3 — Wiederholung nach 7 Tagen",
            },
            {
              en: "Fixed — answered correctly three times; leak removed",
              de: "Behoben — dreimal korrekt beantwortet; Leak entfernt",
            },
          ],
        },
        {
          type: "tip",
          text: {
            en: "A miss drops you back to Stage 1. Consistent accuracy is what fixes a leak — not just getting lucky once.",
            de: "Ein Fehltreffer setzt dich auf Stufe 1 zurück. Konsistente Genauigkeit behebt einen Leak — nicht nur einmal Glück zu haben.",
          },
        },
      ],
      relatedSlugs: ["app/scoring", "app/difficulty-levels"],
    },
  ],
};

export default app;
