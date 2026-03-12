import { getHallOfFameMonth } from "../../lib/actions/hallOfFame";
import { auth } from "../../lib/auth";
import HallOfFameBoard from "../../components/HallOfFameBoard";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function HallOfFamePage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [entries, session] = await Promise.all([
    getHallOfFameMonth(year, month),
    auth(),
  ]);

  const currentUsername = (session?.user as any)?.name ?? null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-3xl mx-auto px-4 py-10">
        <HallOfFameBoard
          initialView="month"
          initialEntries={entries}
          currentMonth={{ year, month, label: `${MONTH_NAMES[month - 1]} ${year}` }}
          currentUsername={currentUsername}
        />
      </main>
    </div>
  );
}
