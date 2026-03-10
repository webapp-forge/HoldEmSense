import { auth } from "../../../../lib/auth";
import RegisterToUnlock from "../../../../components/train/RegisterToUnlock";
import { getTranslations } from "next-intl/server";

export default async function HandVsRangePotOddsPage() {
  const session = await auth();
  const t = await getTranslations("sidebar");

  if (!session) return <RegisterToUnlock title={t("handVsRangePotOdds")} />;

  return (
    <div>
      <h2 className="text-xl font-bold">{t("handVsRangePotOdds")}</h2>
      <p className="text-gray-400 mt-2">Placeholder — with pot odds.</p>
    </div>
  );
}
