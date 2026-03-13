import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import PokerChip from "@/components/PokerChip";
import { getUserAchievements } from "@/lib/actions/achievements";
import { ACHIEVEMENT_CONFIG } from "@/lib/achievementConfig";

export default async function AccountPage() {
  const [session, t, ta] = await Promise.all([auth(), getTranslations("account"), getTranslations("achievements")]);

  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; name?: string; email?: string };
  const earnedKeys = user.id ? await getUserAchievements(user.id) : [];

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-3xl mx-auto px-4 py-10 space-y-10">

        {/* Profile header */}
        <section>
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
        </section>

        {/* Chip Stack */}
        <section>
          <h2 className="text-lg font-semibold mb-1">{t("chipStack")}</h2>
          <p className="text-gray-400 text-sm mb-6">{t("chipStackSubtitle")}</p>
          {earnedKeys.length === 0 ? (
            <p className="text-gray-500 text-sm">{t("noChipsYet")}</p>
          ) : (
            <div className="flex flex-wrap gap-4">
              {earnedKeys.map((key) => {
                const cfg = ACHIEVEMENT_CONFIG[key];
                return (
                  <div key={key} title={ta(key)}>
                    <PokerChip color={cfg.color as any} value={cfg.value} size={80} />
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Settings sections — placeholders */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">{t("settings")}</h2>
          <div className="bg-gray-900 rounded-xl divide-y divide-gray-800">

            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t("language")}</div>
              </div>
              <span className="text-gray-500 text-sm">{t("comingSoon")}</span>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">{t("changePassword")}</div>
              </div>
              <span className="text-gray-500 text-sm">{t("comingSoon")}</span>
            </div>

            <div className="px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-red-400">{t("deleteAccount")}</div>
              </div>
              <span className="text-gray-500 text-sm">{t("comingSoon")}</span>
            </div>

          </div>
        </section>

      </main>
    </div>
  );
}
