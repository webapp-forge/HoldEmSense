import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getUserAchievements } from "@/lib/actions/achievements";
import { ACHIEVEMENT_CONFIG } from "@/lib/achievementConfig";
import { getFourColorDeck } from "@/lib/actions/deckStyle";
import FourColorDeckToggle from "@/components/FourColorDeckToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ChipTooltip from "@/components/ChipTooltip";
import ChangePasswordForm from "@/components/account/ChangePasswordForm";
import DeleteAccountButton from "@/components/account/DeleteAccountButton";
import { prisma } from "@/lib/prisma";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const [session, t, ta, tv, fourColor, params] = await Promise.all([
    auth(),
    getTranslations("account"),
    getTranslations("achievements"),
    getTranslations("emailVerification"),
    getFourColorDeck(),
    searchParams,
  ]);

  if (!session?.user) redirect("/login");

  const user = session.user as { id?: string; name?: string; email?: string };
  const dbUser = user.id ? await prisma.user.findUnique({
    where: { id: user.id },
    select: { emailVerified: true },
  }) : null;
  const earnedKeys = user.id ? await getUserAchievements(user.id) : [];
  const justVerified = params.verified === "1";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <main className="max-w-5xl mx-auto px-4 py-10">

        {/* Verification success message */}
        {justVerified && (
          <div className="bg-lime-900/40 border border-lime-700 rounded-lg px-4 py-3 text-lime-300 text-sm mb-10">
            {tv("verified")}
          </div>
        )}

        {/* Profile header */}
        <section className="mb-10">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{user.email}</p>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10">

          {/* Left column: Settings */}
          <div className="space-y-10">

            {/* Account Settings */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{t("accountSettings")}</h2>
              <div className="bg-gray-900 rounded-xl divide-y divide-gray-800">

                {/* Email verification status */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{tv("emailStatus")}</div>
                  </div>
                  {dbUser?.emailVerified ? (
                    <span className="text-lime-400 text-sm">{tv("verifiedLabel")}</span>
                  ) : (
                    <span className="text-yellow-400 text-sm">{tv("unverified")}</span>
                  )}
                </div>

                {/* Change Password */}
                <ChangePasswordForm />

                {/* Delete Account */}
                <DeleteAccountButton />

              </div>
            </section>

            {/* App Settings */}
            <section className="space-y-4">
              <h2 className="text-lg font-semibold">{t("appSettings")}</h2>
              <div className="bg-gray-900 rounded-xl divide-y divide-gray-800">

                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t("language")}</div>
                  </div>
                  <LanguageSwitcher />
                </div>

                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{t("fourColorDeck")}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{t("fourColorDeckHint")}</div>
                  </div>
                  <FourColorDeckToggle enabled={fourColor} />
                </div>

              </div>
            </section>

          </div>

          {/* Right column: Chip Stack */}
          <div className="lg:w-80">
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
                      <ChipTooltip
                        key={key}
                        label={ta(key)}
                        color={cfg.color}
                        value={cfg.value}
                        size={80}
                      />
                    );
                  })}
                </div>
              )}
            </section>
          </div>

        </div>

      </main>
    </div>
  );
}
