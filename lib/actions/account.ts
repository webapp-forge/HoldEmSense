"use server";

import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { auth, signOut } from "../auth";

export async function changePassword(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "notAuthenticated" };

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;

  if (!currentPassword || !newPassword) return { error: "missingFields" };
  if (newPassword.length < 6) return { error: "tooShort" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "notAuthenticated" };

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return { error: "wrongPassword" };

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  return { success: true };
}

export async function deleteAccount(formData: FormData) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "notAuthenticated" };

  const password = formData.get("password") as string;
  if (!password) return { error: "missingFields" };

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "notAuthenticated" };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "wrongPassword" };

  // Soft-delete: mark as deleted, block login — do NOT anonymize yet.
  // A nightly cron job will notify the admin for review,
  // then anonymize after the retention period (payment data: 10 years per AO §147).
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        passwordHash: "",
      },
    }),
    prisma.verificationToken.deleteMany({
      where: { email: user.email },
    }),
  ]);

  await signOut({ redirectTo: "/" });
}
