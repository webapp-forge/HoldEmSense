"use server";

import { prisma } from "../prisma";
import bcrypt from "bcryptjs";
import { signIn } from "../auth";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";


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

  await prisma.user.create({
    data: { email, username, passwordHash },
  });

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
