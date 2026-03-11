import { auth } from "../../lib/auth";
import { notFound } from "next/navigation";
import { getVillainConfig, saveVillainConfig, resetVillainConfig } from "../../lib/actions/villain";
import { CONFIG_DEFAULTS, type ConfigKey } from "../../lib/config";

const CONFIG_LABELS: Record<ConfigKey, { label: string; description: string }> = {
  progressWindowSize: {
    label: "Rolling Window",
    description: "Anzahl der letzten Hände im Fortschritts-Fenster",
  },
  unlockThreshold: {
    label: "Unlock-Schwelle (Punkte)",
    description: "Benötigte Punkte im Fenster zum Freischalten der nächsten Stufe",
  },
  maxProgressPoints: {
    label: "Max. Punkte (Anzeige)",
    description: "Maximalpunkte für den Fortschrittsbalken (3 × Window-Size)",
  },
};

export default async function SuperVillainPage() {
  const session = await auth();
  if (!(session?.user as any)?.isAdmin) return notFound();

  const config = await getVillainConfig();

  return (
    <main className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Supervillain HQ</h1>
      <p className="text-gray-500 text-sm mb-10">App-Konfiguration — nur für Admins sichtbar.</p>

      <div className="flex flex-col gap-6">
        {(Object.keys(CONFIG_DEFAULTS) as ConfigKey[]).map((key) => {
          const current = config[key];
          const def = CONFIG_DEFAULTS[key];
          const isCustom = current !== def;
          const { label, description } = CONFIG_LABELS[key];

          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-lg p-5">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-white font-semibold">{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${isCustom ? "bg-amber-800 text-amber-200" : "bg-gray-800 text-gray-400"}`}>
                  {isCustom ? `${current} (custom)` : `${current} (default)`}
                </span>
              </div>

              <div className="flex gap-2 mt-4">
                <form
                  className="flex gap-2"
                  action={async (formData: FormData) => {
                    "use server";
                    const val = Number(formData.get("value"));
                    await saveVillainConfig(key, val);
                  }}
                >
                  <input
                    name="value"
                    type="number"
                    defaultValue={current}
                    min={1}
                    className="w-28 bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-sm"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-lime-700 hover:bg-lime-600 rounded text-sm text-white"
                  >
                    Speichern
                  </button>
                </form>
                {isCustom && (
                  <form
                    action={async () => {
                      "use server";
                      await resetVillainConfig(key);
                    }}
                  >
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                    >
                      Reset ({def})
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
