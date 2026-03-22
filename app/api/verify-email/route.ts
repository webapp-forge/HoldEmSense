import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/login?error=invalid-token");
  }

  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!record || record.type !== "email-verification" || record.expiresAt < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } });
    }
    redirect("/login?error=invalid-token");
  }

  // Mark user as verified
  await prisma.user.update({
    where: { email: record.email },
    data: { emailVerified: new Date() },
  });

  // Clean up the used token
  await prisma.verificationToken.delete({ where: { token } });

  redirect("/account?verified=1");
}
