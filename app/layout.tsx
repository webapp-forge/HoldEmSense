import type { Metadata } from "next";
import "./globals.css";
import Header from "../components/Header";
import GlossaryDrawer from "../components/glossary/GlossaryDrawer";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";

export const metadata: Metadata = {
  title: "Hold'em Sense — train your intuition",
  description: "Train your poker intuition",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const messages = await getMessages();

  return (
    <html lang="en">
      <body>
        <NextIntlClientProvider messages={messages}>
          <Header />
          {children}
          <GlossaryDrawer />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
