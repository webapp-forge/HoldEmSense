import { auth } from "../../lib/auth";
import Sidebar from "../../components/train/Sidebar";

export default async function TrainLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const role = !session
    ? "guest"
    : (session.user as any).isPremium
    ? "premium"
    : "registered";

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar role={role} />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
