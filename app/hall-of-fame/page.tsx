import { getHallOfFameMonth } from "../../lib/actions/hallOfFame";
import { auth } from "../../lib/auth";
import HallOfFameBoard from "../../components/HallOfFameBoard";
import { getLocale } from "next-intl/server";

export default async function HallOfFamePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [entries, session, locale] = await Promise.all([
    getHallOfFameMonth(year, month),
    auth(),
    getLocale(),
  ]);

  const currentUsername = (session?.user as any)?.name ?? null;
  const monthLabel = new Date(year, month - 1, 1).toLocaleString(locale, { month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <HallOfFameBoard
          initialView="month"
          initialEntries={entries}
          currentMonth={{ year, month, label: monthLabel }}
          currentUsername={currentUsername}
        />
      </main>
    </div>
  );
}
