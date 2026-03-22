"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

export default function GuestBanner() {
  const t = useTranslations("guestBanner");
  const pathname = usePathname();

  if (!pathname.startsWith("/train")) return null;

  return (
    <div className="bg-amber-600/80 border-b border-amber-500/50 px-4 py-2 text-center text-sm text-yellow-100">
      <span>{t("message")}</span>
      <Link href="/login" className="ml-2 underline hover:text-white font-medium">
        {t("register")}
      </Link>
    </div>
  );
}
