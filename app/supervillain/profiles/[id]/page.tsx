import { auth } from "../../../../lib/auth";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/prisma";
import { HAND_RANKINGS } from "../../../../lib/range";
import Link from "next/link";
import {
  updateVillainProfile,
  deleteVillainProfile,
  toggleProfilePublished,
} from "../../../../lib/actions/villainProfiles";
import { ProfilePositionEditor } from "../../../../components/admin/ProfilePositionEditor";

const POSITION_LABELS: Record<number, string> = {
  9: "UTG",
  8: "UTG+1",
  7: "MP",
  6: "LJ",
  5: "HJ",
  4: "CO",
  3: "BTN",
};

const POSITIONS = [9, 8, 7, 6, 5, 4, 3] as const;

export default async function ProfileEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pos?: string }>;
}) {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) return notFound();

  const { id } = await params;
  const { pos } = await searchParams;
  const activePos = Number(pos ?? 9);

  const profile = await prisma.villainProfile.findUnique({
    where: { id },
    include: { positions: true },
  });
  if (!profile) return notFound();

  const positionMap = new Map(
    profile.positions.map((p) => [p.position, p.hands as string[]])
  );
  const activeHands = positionMap.get(activePos) ?? [];

  const updateAction = updateVillainProfile.bind(null, id);
  const deleteAction = deleteVillainProfile.bind(null, id);
  const toggleAction = toggleProfilePublished.bind(null, id, !profile.isPublished);

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
          <p className="text-xs font-mono text-gray-500 mt-0.5">{profile.slug}</p>
        </div>
        <Link
          href="/supervillain/profiles"
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          ← Profile
        </Link>
      </div>

      {/* Basic info */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 mb-6">
        <h2 className="text-sm font-semibold text-white mb-4">Profil-Daten</h2>
        <form action={updateAction} className="flex flex-col gap-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 block mb-1">Name</label>
              <input
                name="name"
                defaultValue={profile.name}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm"
              />
            </div>
            <div className="w-40">
              <label className="text-xs text-gray-500 block mb-1">Slug</label>
              <input
                name="slug"
                defaultValue={profile.slug}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Beschreibung
            </label>
            <textarea
              name="description"
              defaultValue={profile.description}
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="px-4 py-1.5 bg-lime-700 hover:bg-lime-600 rounded text-sm text-white"
            >
              Speichern
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-800">
          <form action={toggleAction}>
            <button
              type="submit"
              className={`px-4 py-1.5 rounded text-sm transition-colors ${
                profile.isPublished
                  ? "bg-amber-900 text-amber-300 hover:bg-amber-800"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {profile.isPublished ? "Unpublish" : "Publish"}
            </button>
          </form>
          <form action={deleteAction} className="ml-auto">
            <button
              type="submit"
              className="px-4 py-1.5 bg-gray-900 hover:bg-red-950 border border-gray-800 hover:border-red-900 rounded text-sm text-gray-600 hover:text-red-400 transition-colors"
            >
              Profil löschen
            </button>
          </form>
        </div>
      </div>

      {/* Position ranges */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-white mb-4">
          Open-Raise Ranges
        </h2>

        {/* Position tabs */}
        <div className="flex gap-1 mb-6 flex-wrap">
          {POSITIONS.map((pos) => {
            const configured = positionMap.has(pos);
            return (
              <Link
                key={pos}
                href={`?pos=${pos}`}
                className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                  activePos === pos
                    ? "bg-lime-700 text-white"
                    : configured
                    ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                    : "bg-gray-800 text-gray-500 hover:bg-gray-700"
                }`}
              >
                {POSITION_LABELS[pos]}
                {configured && activePos !== pos ? (
                  <span className="ml-1 text-lime-500">·</span>
                ) : null}
              </Link>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 mb-4">
          <span className="font-semibold text-gray-300">
            {POSITION_LABELS[activePos]}
          </span>{" "}
          — Preset wählen als Basis, dann einzelne Zellen anklicken zum
          Anpassen.
        </p>

        <ProfilePositionEditor
          profileId={id}
          position={activePos}
          initialHands={activeHands}
          handRankings={HAND_RANKINGS}
        />
      </div>
    </main>
  );
}
