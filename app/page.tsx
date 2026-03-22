"use client";

import { useState } from "react";
import { login } from "@/lib/actions/auth";
import Logo from "@/components/Logo";
import Link from "next/link";
import { useTranslations } from "next-intl";

function Check() {
  return <span className="text-lime-400 mr-2">✓</span>;
}

export default function Home() {
  const [loginError, setLoginError] = useState("");
  const t = useTranslations("home");
  const tl = useTranslations("login");

  async function handleLogin(formData: FormData) {
    setLoginError("");
    const result = await login(formData);
    if (result?.error) setLoginError(result.error);
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center px-4 py-16 gap-12">

      {/* Hero */}
      <div className="text-center flex flex-col items-center gap-4">
        <Logo size="lg" stacked />
        <p className="text-gray-400 text-lg max-w-md mx-auto">
          {t("tagline")}
        </p>
      </div>

      {/* 3 boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">

        {/* Guest */}
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold">{t("guestTitle")}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{t("guestSubtitle")}</p>
          </div>
          <ul className="text-sm text-gray-300 flex flex-col gap-2 flex-1">
            <li><Check />{t("guestFeat1")}</li>
            <li><Check />{t("guestFeat2")}</li>
            <li><Check />{t("guestFeat3")}</li>
            <li className="text-gray-600 pl-5">{t("guestNote")}</li>
          </ul>
          <a
            href="/train/equity/hand-vs-range"
            className="mt-2 block text-center px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
          >
            {t("guestCta")}
          </a>
        </div>

        {/* Free account */}
        <div className="bg-gray-900 border border-lime-700 rounded-xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold">{t("freeTitle")}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{t("freeSubtitle")}</p>
          </div>
          <ul className="text-sm text-gray-300 flex flex-col gap-2 flex-1">
            <li><Check />{t("freeFeat1")}</li>
            <li><Check />{t("freeFeat2")}</li>
            <li><Check />{t("freeFeat3")}</li>
            <li><Check />{t("freeFeat4")}</li>
            <li><Check />{t("freeFeat5")}</li>
          </ul>
          <a
            href="/register"
            className="mt-2 block text-center px-4 py-2 bg-lime-600 hover:bg-lime-500 rounded text-sm font-medium"
          >
            {t("freeCta")}
          </a>
        </div>

        {/* Pro */}
        <div className="bg-gray-900 border border-amber-700 rounded-xl p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold">{t("proTitle")}</h2>
            <p className="text-gray-500 text-sm mt-0.5">{t("proSubtitle")}</p>
          </div>
          <ul className="text-sm text-gray-300 flex flex-col gap-2 flex-1">
            <li><Check />{t("proFeat1")}</li>
            <li><Check />{t("proFeat2")}</li>
            <li><Check />{t("proFeat3")}</li>
            <li className="text-gray-500 text-xs pl-5">{t("proFeatNote")}</li>
          </ul>
          <a
            href="/register?plan=premium"
            className="mt-2 block text-center px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium"
          >
            {t("proCta")}
          </a>
        </div>

      </div>

      {/* Login */}
      <div className="w-full max-w-sm">
        <p className="text-center text-gray-500 text-sm mb-4">{t("alreadyHaveAccount")}</p>
        <form action={handleLogin} className="flex flex-col gap-3">
          <input
            name="email"
            type="email"
            placeholder={t("email")}
            required
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500 text-sm"
          />
          <input
            name="password"
            type="password"
            placeholder={t("password")}
            required
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500 text-sm"
          />
          {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
          <button
            type="submit"
            className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 rounded text-sm"
          >
            {t("signIn")}
          </button>
          <Link href="/forgot-password" className="text-lime-400 hover:underline text-sm text-center">
            {tl("forgotPassword")}
          </Link>
        </form>
      </div>

    </main>
  );
}
