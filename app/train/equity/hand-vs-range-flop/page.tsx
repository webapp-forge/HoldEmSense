import { auth } from "../../../../lib/auth";
import HandVsRangeFlopTraining from "./HandVsRangeFlopTraining";

export default async function HandVsRangeFlopPage() {
  const session = await auth();
  const role = !session ? "guest" : (session.user as any).isPremium ? "premium" : "registered";
  return <HandVsRangeFlopTraining role={role} />;
}
