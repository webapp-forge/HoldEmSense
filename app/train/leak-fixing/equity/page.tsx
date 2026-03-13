import { auth } from "../../../../lib/auth";
import TrainPageLayout from "../../../../components/train/TrainPageLayout";
import LeakTraining from "../../../../components/train/LeakTraining";
import { getTranslations } from "next-intl/server";
import { getFourColorDeck } from "../../../../lib/actions/deckStyle";

export default async function EquityLeaksPage() {
  const [session, fourColor] = await Promise.all([auth(), getFourColorDeck()]);
  const isPremium = (session?.user as any)?.isPremium === true;
  const t = await getTranslations("leakInfo");

  if (!session) {
    return (
      <TrainPageLayout info={null} explanation={null}>
        <div className="flex flex-col gap-6 max-w-xl">
          <div>
            <h2 className="text-xl font-bold">{t("title")}</h2>
            <p className="text-gray-500 text-sm mt-1">{t("proFeature")}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col gap-4">
            <p className="text-gray-300 leading-relaxed">{t("body1")}</p>
            <p className="text-gray-300 leading-relaxed">
              {t.rich("body2", {
                leak: (chunks) => <span className="text-white font-medium">{chunks}</span>,
              })}
            </p>
            <p className="text-gray-400 text-sm">{t("guestNote")}</p>
            <div className="flex gap-3 flex-wrap pt-1">
              <a
                href="/register"
                className="px-4 py-2 bg-lime-600 hover:bg-lime-500 rounded text-sm font-medium text-white"
              >
                {t("registerCta")}
              </a>
              <a
                href="/premium"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium text-white"
              >
                {t("learnProCta")}
              </a>
            </div>
          </div>
        </div>
      </TrainPageLayout>
    );
  }

  if (!isPremium) {
    return (
      <TrainPageLayout info={null} explanation={null}>
        <div className="flex flex-col gap-6 max-w-xl">
          <div>
            <h2 className="text-xl font-bold">{t("title")}</h2>
            <p className="text-gray-500 text-sm mt-1">{t("proFeature")}</p>
          </div>
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col gap-4">
            <p className="text-gray-300 leading-relaxed">{t("body1")}</p>
            <p className="text-gray-300 leading-relaxed">
              {t.rich("body2", {
                leak: (chunks) => <span className="text-white font-medium">{chunks}</span>,
              })}
            </p>
            <p className="text-gray-400 text-sm">{t("registeredNote")}</p>
            <div className="flex gap-3 flex-wrap pt-1">
              <a
                href="/premium"
                className="px-4 py-2 bg-lime-600 hover:bg-lime-500 rounded text-sm font-medium text-white"
              >
                {t("upgradeProCta")}
              </a>
            </div>
          </div>
        </div>
      </TrainPageLayout>
    );
  }

  return <LeakTraining fourColor={fourColor} />;
}
