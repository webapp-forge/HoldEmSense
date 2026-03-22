"use server";

import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { signIn, auth } from "../auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../email";


async function generateAndSendVerificationToken(email: string) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

  // Delete any existing email-verification tokens for this email
  await prisma.verificationToken.deleteMany({ where: { email, type: "email-verification" } });

  await prisma.verificationToken.create({
    data: { email, token, type: "email-verification", expiresAt },
  });

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "en";

  await sendVerificationEmail(email, token, locale);
}


export async function register(formData: FormData) {
  const email = formData.get("email") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!email || !username || !password) {
    return { error: "All fields are required." };
  }

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });

  if (existing) {
    return { error: "Email or username already taken." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { email, username, passwordHash },
  });

  // Send verification email (non-blocking)
  generateAndSendVerificationToken(email).catch(() => {});

  const guestId = (await cookies()).get("guestId")?.value ?? null;
  if (guestId) {
    await prisma.trainingHand.updateMany({
      where: { guestId },
      data: { userId: user.id, guestId: null },
    });
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/train" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Registration failed." };
  }

}

export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", { email, password, redirectTo: "/train" });
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return { error: "Invalid email or password." };
  }
}

export async function resendVerificationEmail() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { error: "Not authenticated" };

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) return { error: "User not found" };
  if (user.emailVerified) return { error: "Already verified" };

  // Rate limit: don't resend if token was created less than 60 seconds ago
  const recentToken = await prisma.verificationToken.findFirst({
    where: { email: user.email, type: "email-verification" },
    orderBy: { createdAt: "desc" },
  });
  if (recentToken && Date.now() - recentToken.createdAt.getTime() < 60_000) {
    return { error: "Please wait before requesting another email." };
  }

  try {
    await generateAndSendVerificationToken(user.email);
  } catch (e) {
    return { error: "Failed to send email. Please try again later." };
  }
  return { success: true };
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required." };

  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success to prevent email enumeration
  if (!user) return { success: true };

  // Rate limit: 60s cooldown
  const recentToken = await prisma.verificationToken.findFirst({
    where: { email, type: "password-reset" },
    orderBy: { createdAt: "desc" },
  });
  if (recentToken && Date.now() - recentToken.createdAt.getTime() < 60_000) {
    return { error: "rateLimited" };
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

  await prisma.verificationToken.deleteMany({ where: { email, type: "password-reset" } });
  await prisma.verificationToken.create({
    data: { email, token, type: "password-reset", expiresAt },
  });

  const cookieStore = await cookies();
  const locale = cookieStore.get("locale")?.value ?? "en";

  try {
    await sendPasswordResetEmail(email, token, locale);
  } catch {
    return { error: "Failed to send email. Please try again later." };
  }

  return { success: true };
}

export async function resetPassword(formData: FormData) {
  const token = formData.get("token") as string;
  const password = formData.get("password") as string;

  if (!token || !password) return { error: "missingFields" };

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.type !== "password-reset" || record.expiresAt < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({ where: { token } });
    }
    return { error: "invalidToken" };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { email: record.email },
      data: { passwordHash },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  return { success: true };
}
