import { auth } from "../../../../lib/auth";
import RegisterToUnlock from "../../../../components/train/RegisterToUnlock";
import EquityTraining from "../../../../components/train/EquityTraining";
import { getTranslations } from "next-intl/server";

export default async function HandVsRangeRiverPage() {
  const session = await auth();
  if (!session) {
    const t = await getTranslations("sidebar");
    return <RegisterToUnlock title={t("riverHandVsRange")} />;
  }
  const role = (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session.user as any).isAdmin;
  return <EquityTraining handModule="river" role={role} isAdmin={isAdmin} />;
}
