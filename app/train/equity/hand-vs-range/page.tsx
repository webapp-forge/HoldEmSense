import { auth } from "../../../../lib/auth";
import EquityTraining from "../../../../components/train/EquityTraining";
import { getFourColorDeck } from "../../../../lib/actions/deckStyle";

export default async function HandVsRangePage() {
  const [session, fourColor] = await Promise.all([auth(), getFourColorDeck()]);
  const role = !session ? "guest" : (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session?.user as any)?.isAdmin;
  return <EquityTraining handModule="preflop" role={role} isAdmin={isAdmin} fourColor={fourColor} />;
}
