import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import Logo from "@/components/Logo";
import NavMenu from "@/components/NavMenu";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default async function Header() {
  const session = await auth();

  const logoutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-gray-900 text-white">
      <Link href="/">
        <Logo size="md" />
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden md:block"><LanguageSwitcher /></div>
        <NavMenu username={session?.user?.name} logoutAction={logoutAction} />
      </div>
    </header>
  );
}
