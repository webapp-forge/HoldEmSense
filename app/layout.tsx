import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import "./globals.css";

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
import Header from "../components/Header";
import GlossaryDrawer from "../components/glossary/GlossaryDrawer";
import EmailVerificationBanner from "../components/EmailVerificationBanner";
import GuestBanner from "../components/GuestBanner";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Hold'em Sense — train your intuition",
  description: "Train your poker intuition",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, session] = await Promise.all([getMessages(), auth()]);

  let showVerificationBanner = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { emailVerified: true },
    });
    showVerificationBanner = !user?.emailVerified;
  }

  return (
    <html lang="en" className={oswald.variable}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header />
          {showVerificationBanner && <EmailVerificationBanner />}
          {!session?.user && <GuestBanner />}
          {children}
          <GlossaryDrawer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
