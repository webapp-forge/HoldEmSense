"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { resendVerificationEmail } from "@/lib/actions/auth";

export default function EmailVerificationBanner() {
  const t = useTranslations("emailVerification");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleResend() {
    setStatus("sending");
    setErrorMsg("");
    try {
      const result = await resendVerificationEmail();
      if (result?.error) {
        setErrorMsg(result.error);
        setStatus("error");
      } else {
        setStatus("sent");
      }
    } catch {
      setErrorMsg("Failed to send email");
      setStatus("error");
    }
  }

  return (
    <div className="bg-amber-600/80 border-b border-amber-500/50 px-4 py-2 text-center text-sm text-yellow-100">
      <span>{t("banner")}</span>
      {status === "idle" && (
        <button onClick={handleResend} className="ml-2 underline hover:text-white">
          {t("resend")}
        </button>
      )}
      {status === "sending" && <span className="ml-2">{t("sending")}</span>}
      {status === "sent" && <span className="ml-2 text-lime-400">{t("sent")}</span>}
      {status === "error" && <span className="ml-2 text-red-400">{errorMsg}</span>}
    </div>
  );
}
