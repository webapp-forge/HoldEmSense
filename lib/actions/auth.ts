"use server";

import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { signIn } from "../auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { cookies } from "next/headers";


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
