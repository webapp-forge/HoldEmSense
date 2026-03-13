"use client";

import { useTransition } from "react";
import { setFourColorDeck } from "@/lib/actions/deckStyle";
import { useTranslations } from "next-intl";

export default function FourColorDeckToggle({ enabled }: { enabled: boolean }) {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("account");

  function toggle() {
    startTransition(async () => {
      await setFourColorDeck(!enabled);
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label={t("fourColorDeck")}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-400 ${
        enabled ? "bg-lime-500" : "bg-gray-600"
      } ${isPending ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition duration-200 ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
