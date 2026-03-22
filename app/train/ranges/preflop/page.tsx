import { auth } from "../../../../lib/auth";
import RangeTraining from "../../../../components/train/RangeTraining";
import { getFourColorDeck } from "../../../../lib/actions/deckStyle";

export default async function PreflopRangePage() {
  const [session, fourColor] = await Promise.all([auth(), getFourColorDeck()]);
  const role = !session ? "guest" : (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session?.user as any)?.isAdmin;
  return <RangeTraining role={role} isAdmin={isAdmin} fourColor={fourColor} />;
}
