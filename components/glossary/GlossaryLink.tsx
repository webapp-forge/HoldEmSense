"use client";

import type { ReactNode } from "react";

type Props = {
  slug: string; // e.g. "equity/what-is-equity"
  children: ReactNode;
};

export default function GlossaryLink({ slug, children }: Props) {
  function open() {
    window.dispatchEvent(new CustomEvent("open-glossary", { detail: { slug } }));
  }

  return (
    <button
      onClick={open}
      className="font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
