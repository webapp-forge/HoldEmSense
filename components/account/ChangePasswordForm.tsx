"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { changePassword } from "@/lib/actions/account";

export default function ChangePasswordForm() {
  const t = useTranslations("account");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const result = await changePassword(formData);
      if (result?.error) {
        setErrorMsg(t(result.error === "wrongPassword" ? "wrongPassword" : "wrongPassword"));
        setStatus("error");
      } else {
        setStatus("success");
        setTimeout(() => {
          setOpen(false);
          setTimeout(() => setStatus("idle"), 4000);
        }, 1500);
      }
    } catch {
      setErrorMsg(t("wrongPassword"));
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{t("changePassword")}</div>
          {status === "success" && (
            <div className="text-xs text-lime-400 mt-0.5">{t("passwordChanged")}</div>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-lime-400 hover:text-lime-300"
        >
          {t("change")}
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="text-sm font-medium mb-3">{t("changePassword")}</div>
      <form action={handleSubmit} className="flex flex-col gap-3">
        <input
          name="currentPassword"
          type="password"
          placeholder={t("currentPassword")}
          required
          className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500 text-sm"
        />
        <input
          name="newPassword"
          type="password"
          placeholder={t("newPassword")}
          required
          minLength={6}
          className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-lime-500 text-sm"
        />
        {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
        {status === "success" && (
          <p className="text-lime-400 text-xs">{t("passwordChanged")}</p>
        )}
        <div className="flex gap-3 items-center">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="bg-lime-600 hover:bg-lime-500 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            {t("changePasswordSubmit")}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setStatus("idle"); setErrorMsg(""); }}
            className="text-gray-400 hover:text-gray-300 text-sm"
          >
            {t("cancel")}
          </button>
        </div>
      </form>
    </div>
  );
}
