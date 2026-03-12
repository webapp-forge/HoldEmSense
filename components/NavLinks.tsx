"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLinkItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type Props = {
  links: NavLinkItem[];
};

export default function NavLinks({ links }: Props) {
  const pathname = usePathname();

  return (
    <>
      {links.map(({ href, label, icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              isActive ? "text-lime-400" : "hover:text-lime-400"
            }`}
          >
            {icon}
            {label}
          </Link>
        );
      })}
    </>
  );
}
