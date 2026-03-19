import { auth, signOut } from "@/lib/auth";
import Link from "next/link";
import Logo from "@/components/Logo";
import NavMenu from "@/components/NavMenu";
import NavLinks from "@/components/NavLinks";
import LeakNavBadge from "@/components/LeakNavBadge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getTranslations } from "next-intl/server";
import { getDailyStreak, getOpenLeakCount } from "@/lib/actions/training";

export default async function Header() {
  const [session, t] = await Promise.all([auth(), getTranslations("nav")]);
  const isPremium = !!(session?.user as any)?.isPremium;
  const [{ streak, trainedToday }, leakCount] = await Promise.all([
    session?.user ? getDailyStreak() : Promise.resolve({ streak: 0, trainedToday: false }),
    isPremium ? getOpenLeakCount() : Promise.resolve(0),
  ]);

  const logoutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/" });
  };


  return (
    <header className="sticky top-0 z-40 flex items-center px-6 py-4 bg-gray-900 text-white">
      {/* Left: Logo */}
      <Link href={session ? "/train/equity/hand-vs-range" : "/"} className="flex-none">
        <Logo size="md" />
      </Link>

      {/* Center: Main nav — absolutely centered */}
      <nav className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center gap-8">
        <NavLinks links={[
          {
            href: "/train",
            label: t("train"),
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
              </svg>
            ),
          },
          {
            href: "/glossary",
            label: t("glossary"),
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
            ),
          },
          {
            href: "/hall-of-fame",
            label: t("hallOfFame"),
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                <path d="M4 22h16" />
                <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
                <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
              </svg>
            ),
          },
        ]} />
        {isPremium && (
          <LeakNavBadge initialCount={leakCount} label={t("leakTraining")} />
        )}
      </nav>

      {/* Right: Language + User */}
      <div className="ml-auto flex items-center gap-6">
        {!session && (
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>
        )}
        <NavMenu username={session?.user?.name} logoutAction={logoutAction} streak={streak} trainedToday={trainedToday} isPremium={isPremium} leakCount={leakCount} />
      </div>
    </header>
  );
}
