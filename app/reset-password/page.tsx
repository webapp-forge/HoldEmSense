"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/actions/auth";
import Link from "next/link";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const t = useTranslations("resetPassword");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  async function handleSubmit(formData: FormData) {
    const password = formData.get("password") as string;
    const confirm = formData.get("confirmPassword") as string;

    if (password !== confirm) {
      setErrorMsg(t("mismatch"));
      return;
    }

    setStatus("submitting");
    setErrorMsg("");

    formData.set("token", token ?? "");

    try {
      const result = await resetPassword(formData);
      if (result?.error) {
        setErrorMsg(result.error === "invalidToken" ? t("invalidToken") : t("invalidToken"));
        setStatus("error");
      } else {
        setStatus("success");
      }
    } catch {
      setErrorMsg(t("invalidToken"));
      setStatus("error");
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm text-center">
          <p className="text-red-400 text-sm mb-4">{t("invalidToken")}</p>
          <Link href="/forgot-password" className="text-lime-400 hover:underline text-sm">
            {t("requestNew")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="bg-gray-900 p-8 rounded-lg w-full max-w-sm">
        <h1 className="text-2xl font-bold text-white mb-6">{t("title")}</h1>

        {status === "success" ? (
          <div>
            <p className="text-lime-400 text-sm mb-4">{t("success")}</p>
            <Link href="/login" className="text-lime-400 hover:underline text-sm">
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          <form action={handleSubmit} className="flex flex-col gap-4">
            <input
              name="password"
              type="password"
              placeholder={t("password")}
              required
              minLength={6}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
            />
            <input
              name="confirmPassword"
              type="password"
              placeholder={t("confirmPassword")}
              required
              minLength={6}
              className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500"
            />

            {errorMsg && <p className="text-red-400 text-sm">{errorMsg}</p>}

            <button
              type="submit"
              disabled={status === "submitting"}
              className="bg-lime-600 hover:bg-lime-500 text-white font-semibold py-2 rounded disabled:opacity-50"
            >
              {t("submit")}
            </button>

            {status === "error" && (
              <Link href="/forgot-password" className="text-gray-400 hover:underline text-sm">
                {t("requestNew")}
              </Link>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
