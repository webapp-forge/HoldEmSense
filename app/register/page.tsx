"use client";

import { useState } from "react";
import { register } from "@/lib/actions/auth";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const t = useTranslations("register");

  async function handleSubmit(formData: FormData) {
    setError("");
    const result = await register(formData);
    if (result?.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">{t("title")}</h1>

        <form action={handleSubmit} className="flex flex-col gap-4">
          <input
            name="email"
            type="email"
            placeholder={t("email")}
            required
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
          />
          <input
            name="username"
            type="text"
            placeholder={t("username")}
            required
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
          />
          <input
            name="password"
            type="password"
            placeholder={t("password")}
            required
            className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
          />

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            className="bg-lime-600 hover:bg-lime-500 text-white font-semibold py-2 rounded"
          >
            {t("submit")}
          </button>
        </form>

        <p className="text-gray-400 text-sm mt-4">
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="text-lime-400 hover:underline">
            {t("login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
