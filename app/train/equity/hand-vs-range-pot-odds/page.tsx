import { auth } from "../../../../lib/auth";
import { getFourColorDeck } from "../../../../lib/actions/deckStyle";
import RegisterToUnlock from "../../../../components/train/RegisterToUnlock";
import { getTranslations } from "next-intl/server";
import CombinedPotOddsTraining from "./CombinedPotOddsTraining";

export default async function HandVsRangePotOddsPage() {
  const t = await getTranslations("sidebar");
  const [session, fourColor] = await Promise.all([auth(), getFourColorDeck()]);

  if (!session) return <RegisterToUnlock title={t("handVsRangePotOdds")} />;

  const role = (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session.user as any).isAdmin;

  return <CombinedPotOddsTraining role={role} isAdmin={isAdmin} fourColor={fourColor} />;
}
