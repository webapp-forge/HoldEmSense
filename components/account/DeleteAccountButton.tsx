"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { deleteAccount } from "@/lib/actions/account";

export default function DeleteAccountButton() {
  const t = useTranslations("account");
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setErrorMsg("");
    try {
      const result = await deleteAccount(formData);
      if (result?.error) {
        setErrorMsg(t(result.error === "wrongPassword" ? "wrongPassword" : "wrongPassword"));
        setStatus("error");
      }
    } catch {
      // signOut redirects, which throws in Next.js — this is expected
    }
  }

  if (!open) {
    return (
      <div className="px-5 py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-red-400">{t("deleteAccount")}</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="text-sm text-red-400 hover:text-red-300"
        >
          {t("delete")}
        </button>
      </div>
    );
  }

  return (
    <div className="px-5 py-4">
      <div className="text-sm font-medium text-red-400 mb-2">{t("deleteConfirmTitle")}</div>
      <p className="text-xs text-gray-400 mb-3">{t("deleteConfirmBody")}</p>
      <form action={handleSubmit} className="flex flex-col gap-3">
        <input
          name="password"
          type="password"
          placeholder={t("deleteConfirmPassword")}
          required
          className="bg-gray-800 text-white px-4 py-2 rounded border border-gray-700 focus:outline-none focus:border-red-500 text-sm"
        />
        {errorMsg && <p className="text-red-400 text-xs">{errorMsg}</p>}
        <div className="flex gap-3 items-center">
          <button
            type="submit"
            disabled={status === "submitting"}
            className="bg-red-700 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded text-sm disabled:opacity-50"
          >
            {t("deleteConfirmButton")}
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
