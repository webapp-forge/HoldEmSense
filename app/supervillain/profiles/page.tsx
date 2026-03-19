import { auth } from "../../../lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import {
  createVillainProfile,
  deleteVillainProfile,
  toggleProfilePublished,
} from "../../../lib/actions/villainProfiles";

export default async function ProfilesPage() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) return notFound();

  const profiles = await prisma.villainProfile.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { positions: true } } },
  });

  return (
    <main className="max-w-3xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Villain-Profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            Spielertypen für das Profil-Training
          </p>
        </div>
        <Link
          href="/supervillain"
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          ← Supervillain HQ
        </Link>
      </div>

      {/* Create form */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Neues Profil</h2>
        <form action={createVillainProfile} className="flex gap-3 flex-wrap">
          <input
            name="name"
            placeholder="Name (z.B. TAG)"
            required
            className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm"
          />
          <input
            name="slug"
            placeholder="Slug (z.B. tag)"
            required
            className="w-32 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm"
          />
          <input
            name="description"
            placeholder="Kurzbeschreibung"
            className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm"
          />
          <button
            type="submit"
            className="px-4 py-1.5 bg-lime-700 hover:bg-lime-600 rounded text-sm text-white"
          >
            Erstellen
          </button>
        </form>
      </div>

      {/* Profile list */}
      <div className="flex flex-col gap-3">
        {profiles.length === 0 && (
          <p className="text-gray-600 text-sm text-center py-8">
            Noch keine Profile. Oben anlegen.
          </p>
        )}
        {profiles.map((profile) => {
          const toggleAction = toggleProfilePublished.bind(
            null,
            profile.id,
            !profile.isPublished
          );
          const deleteAction = deleteVillainProfile.bind(null, profile.id);

          return (
            <div
              key={profile.id}
              className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-white font-semibold">{profile.name}</span>
                  <span className="text-xs font-mono text-gray-500">
                    {profile.slug}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      profile.isPublished
                        ? "bg-lime-900 text-lime-300"
                        : "bg-gray-800 text-gray-500"
                    }`}
                  >
                    {profile.isPublished ? "published" : "draft"}
                  </span>
                </div>
                {profile.description && (
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {profile.description}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-0.5">
                  {profile._count.positions} / 7 Positionen konfiguriert
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <form action={toggleAction}>
                  <button
                    type="submit"
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      profile.isPublished
                        ? "bg-amber-900 text-amber-300 hover:bg-amber-800"
                        : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    {profile.isPublished ? "Unpublish" : "Publish"}
                  </button>
                </form>
                <Link
                  href={`/supervillain/profiles/${profile.id}`}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300"
                >
                  Bearbeiten
                </Link>
                <form action={deleteAction}>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-gray-900 hover:bg-red-950 border border-gray-800 hover:border-red-900 rounded text-xs text-gray-600 hover:text-red-400 transition-colors"
                  >
                    ✕
                  </button>
                </form>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
