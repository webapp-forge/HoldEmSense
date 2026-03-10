import { auth } from "../../../../lib/auth";
import RegisterToUnlock from "../../../../components/train/RegisterToUnlock";
import HandVsRangeTurnTraining from "./HandVsRangeTurnTraining";
import { getTranslations } from "next-intl/server";

export default async function HandVsRangeTurnPage() {
  const session = await auth();
  if (!session) {
    const t = await getTranslations("sidebar");
    return <RegisterToUnlock title={t("turnHandVsRange")} />;
  }
  const role = (session.user as any).isPremium ? "premium" : "registered";
  return <HandVsRangeTurnTraining role={role} />;
}
