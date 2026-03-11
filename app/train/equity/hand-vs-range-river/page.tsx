import { auth } from "../../../../lib/auth";
import RegisterToUnlock from "../../../../components/train/RegisterToUnlock";
import HandVsRangeRiverTraining from "./HandVsRangeRiverTraining";
import { getTranslations } from "next-intl/server";

export default async function HandVsRangeRiverPage() {
  const session = await auth();
  if (!session) {
    const t = await getTranslations("sidebar");
    return <RegisterToUnlock title={t("riverHandVsRange")} />;
  }
  const role = (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session.user as any).isAdmin;
  return <HandVsRangeRiverTraining role={role} isAdmin={isAdmin} />;
}
