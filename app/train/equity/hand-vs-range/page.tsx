import { auth } from "../../../../lib/auth";
import HandVsRangePreflopTraining from "./HandVsRangePreflopTraining";

export default async function HandVsRangePage() {
  const session = await auth();
  const role = !session ? "guest" : (session.user as any).isPremium ? "premium" : "registered";
  return <HandVsRangePreflopTraining role={role} />;
}
