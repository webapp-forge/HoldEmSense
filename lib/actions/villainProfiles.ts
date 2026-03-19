"use server";

import { prisma } from "../prisma";
import { auth } from "../auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) throw new Error("Unauthorized");
}

export async function listVillainProfiles() {
  await requireAdmin();
  return prisma.villainProfile.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { positions: true } } },
  });
}

export async function getVillainProfile(id: string) {
  await requireAdmin();
  return prisma.villainProfile.findUniqueOrThrow({
    where: { id },
    include: { positions: { orderBy: { position: "desc" } } },
  });
}

export async function createVillainProfile(formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name || !slug) throw new Error("Name und Slug erforderlich");

  const profile = await prisma.villainProfile.create({
    data: { name, slug, description },
  });
  revalidatePath("/supervillain/profiles");
  redirect(`/supervillain/profiles/${profile.id}`);
}

export async function updateVillainProfile(id: string, formData: FormData) {
  await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name || !slug) throw new Error("Name und Slug erforderlich");

  await prisma.villainProfile.update({
    where: { id },
    data: { name, slug, description },
  });
  revalidatePath(`/supervillain/profiles/${id}`);
  revalidatePath("/supervillain/profiles");
}

export async function deleteVillainProfile(id: string) {
  await requireAdmin();
  await prisma.villainProfile.delete({ where: { id } });
  revalidatePath("/supervillain/profiles");
  redirect("/supervillain/profiles");
}

export async function toggleProfilePublished(id: string, isPublished: boolean) {
  await requireAdmin();
  await prisma.villainProfile.update({
    where: { id },
    data: { isPublished },
  });
  revalidatePath("/supervillain/profiles");
  revalidatePath(`/supervillain/profiles/${id}`);
}

export async function saveProfilePosition(
  profileId: string,
  position: number,
  hands: string[]
) {
  await requireAdmin();
  await prisma.villainProfilePosition.upsert({
    where: { profileId_position: { profileId, position } },
    update: { hands },
    create: { profileId, position, hands },
  });
  revalidatePath(`/supervillain/profiles/${profileId}`);
}
