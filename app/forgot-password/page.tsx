"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const t = useTranslations("forgotPassword");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const result = await requestPasswordReset(formData);
      if (result?.error) {
        setErrorMsg(result.error === "rateLimited" ? t("rateLimited") : result.error);
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMsg(t("rateLimited"));
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">{t("title")}</h1>

        {status === "sent" ? (
          <div>
            <p className="text-gray-300 text-sm mb-4">{t("success")}</p>
            <Link href="/login" className="text-lime-400 hover:underline text-sm">
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <input
              name="email"
              type="email"
              placeholder={t("email")}
              required
              className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
            />

            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="bg-lime-600 hover:bg-lime-500 text-white font-semibold py-2 rounded disabled:opacity-50"
            >
              {status === "submitting" ? t("sending") : t("submit")}
            </button>

            <Link href="/login" className="text-gray-400 hover:underline text-sm">
              {t("backToLogin")}
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
