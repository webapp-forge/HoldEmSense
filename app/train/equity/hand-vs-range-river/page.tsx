import { auth } from "../../../../lib/auth";
import RegisterToUnlock from "../../../../components/train/RegisterToUnlock";
import EquityTraining from "../../../../components/train/EquityTraining";
import { getTranslations } from "next-intl/server";
import { getFourColorDeck } from "../../../../lib/actions/deckStyle";

export default async function HandVsRangeRiverPage() {
  const [session, fourColor] = await Promise.all([auth(), getFourColorDeck()]);
  if (!session) {
    const t = await getTranslations("sidebar");
    return <RegisterToUnlock title={t("riverHandVsRange")} />;
  }
  const role = (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session.user as any).isAdmin;
  return <EquityTraining handModule="river" role={role} isAdmin={isAdmin} fourColor={fourColor} />;
}
