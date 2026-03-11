import { auth } from "../../../../lib/auth";
import PotOddsTraining from "./PotOddsTraining";

export default async function PotOddsPage() {
  const session = await auth();
  const role = !session ? "guest" : (session.user as any).isPremium ? "premium" : "registered";
  const isAdmin = !!(session?.user as any)?.isAdmin;
  return <PotOddsTraining role={role} isAdmin={isAdmin} />;
}
