import { auth } from "../../../../lib/auth";
import EquityTraining from "../../../../components/train/EquityTraining";

export default async function HandVsRangePage() {
  const session = await auth();
  const role = !session ? "guest" : (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session?.user as any)?.isAdmin;
  return <EquityTraining handModule="preflop" role={role} isAdmin={isAdmin} />;
}
