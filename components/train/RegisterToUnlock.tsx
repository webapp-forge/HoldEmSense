import TrainPageLayout from "./TrainPageLayout";
import { getTranslations } from "next-intl/server";

export default async function RegisterToUnlock({ title }: { title: string }) {
  const t = await getTranslations("registerToUnlock");

  return (
    <TrainPageLayout info={null} explanation={null}>
      <div className="flex flex-col gap-6 max-w-xl">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-gray-500 text-sm mt-1">{t("subtitle")}</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 flex flex-col gap-4">
          <p className="text-gray-300 leading-relaxed">{t("body1")}</p>
          <p className="text-gray-300 leading-relaxed">{t("body2")}</p>
          <div className="flex gap-3 flex-wrap pt-1">
            <a
              href="/register"
              className="px-4 py-2 bg-lime-600 hover:bg-lime-500 rounded text-sm font-medium text-white"
            >
              {t("registerCta")}
            </a>
            <a
              href="/login"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium text-white"
            >
              {t("signIn")}
            </a>
          </div>
        </div>
      </div>
    </TrainPageLayout>
  );
}
