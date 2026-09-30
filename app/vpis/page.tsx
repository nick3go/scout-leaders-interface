"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Vodnik = {
  id: number;
  name: string;
  vod_id: number;
};

type Vod = {
  id: number;
  name: string;
};

export default function VpisPage() {
  const danes = () => new Date().toLocaleDateString("en-CA");

  const [datum, setDatum] = useState(danes());
  const [vodniki, setVodniki] = useState<Vodnik[]>([]);
  const [vodi, setVodi] = useState<Vod[]>([]);
  const [izbranVodnikId, setIzbranVodnikId] = useState<number | null>(null);

  const [vrsta, setVrsta] = useState("Znanje");
  const [tema, setTema] = useState("");
  const [prisotni, setPrisotni] = useState("");
  const [opis, setOpis] = useState("");
  const [opombe, setOpombe] = useState("");

  const [sporocilo, setSporocilo] = useState("");
  const [shranjujem, setShranjujem] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [
        { data: vodnikiData, error: vodnikiError },
        { data: vodiData, error: vodiError },
      ] = await Promise.all([
        supabase
          .from("vodnik")
          .select("id, name, vod_id")
          .eq("active", true)
          .order("name"),
        supabase
          .from("vod")
          .select("id, name")
          .eq("active", true)
          .order("name"),
      ]);

      if (vodnikiError || vodiError) {
        console.error(vodnikiError || vodiError);
        return;
      }

      setVodniki(vodnikiData ?? []);
      setVodi(vodiData ?? []);

      if (vodnikiData && vodnikiData.length > 0) {
        setIzbranVodnikId(vodnikiData[0].id);
      }
    }

    loadData();
  }, []);

  const izbranVodnik = vodniki.find(
    (vodnik) => vodnik.id === izbranVodnikId
  );

  const izbranVod = vodi.find(
    (vod) => vod.id === izbranVodnik?.vod_id
  );

  async function shraniSrecanje(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSporocilo("");

    if (!izbranVodnik || !izbranVod) {
      setSporocilo("Napaka: vodnik ali vod ni pravilno izbran.");
      return;
    }

    if (!tema.trim() || !opis.trim() || prisotni === "") {
      setSporocilo("Izpolni vsa obvezna polja.");
      return;
    }

    const steviloPrisotnih = Number(prisotni);

    if (!Number.isInteger(steviloPrisotnih) || steviloPrisotnih < 0) {
      setSporocilo("Število prisotnih mora biti celo število 0 ali več.");
      return;
    }

    setShranjujem(true);

    const response = await fetch("/api/srecanja", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        vod_id: izbranVod.id,
        vodnik_id: izbranVodnik.id,
        datum,
        vrsta,
        tema,
        prisotni: steviloPrisotnih,
        opis,
        opombe,
      }),
    });

const result = await response.json();

setShranjujem(false);

if (!response.ok) {
  setSporocilo(
    `Napaka pri shranjevanju: ${
      result.error ?? "Neznana napaka"
    }`
  );
  return;
}

    setShranjujem(false);

    setSporocilo("Srečanje je bilo uspešno shranjeno.");
    setTema("");
    setPrisotni("");
    setOpis("");
    setOpombe("");
    setVrsta("Znanje");
    setDatum(danes());
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            ← Domov
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Vpiši srečanje
          </h1>

          <p className="mt-2 text-slate-600">
            Vnesi podatke o izvedenem vodovem srečanju.
          </p>
        </div>

        <form
          onSubmit={shraniSrecanje}
          className="space-y-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vodnik
              </label>

              <select
                value={izbranVodnikId ?? ""}
                onChange={(e) =>
                  setIzbranVodnikId(Number(e.target.value))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              >
                {vodniki.map((vodnik) => (
                  <option key={vodnik.id} value={vodnik.id}>
                    {vodnik.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vod
              </label>

              <input
                value={izbranVod?.name ?? ""}
                disabled
                className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 text-slate-600"
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Datum
              </label>

              <input
                type="date"
                value={datum}
                onChange={(e) => setDatum(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vrsta srečanja
              </label>

              <select
                value={vrsta}
                onChange={(e) => setVrsta(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              >
                <option value="Znanje">Znanje</option>
                <option value="Zabavno">Zabavno</option>
                <option value="Ustvarjalno">Ustvarjalno</option>
                <option value="Povezovalno">Povezovalno</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tema srečanja
            </label>

            <input
              type="text"
              value={tema}
              onChange={(e) => setTema(e.target.value)}
              placeholder="npr. Orientacija s kompasom"
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Število prisotnih
            </label>

            <input
              type="number"
              min="0"
              step="1"
              value={prisotni}
              onChange={(e) => setPrisotni(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Opis srečanja
            </label>

            <textarea
              rows={5}
              value={opis}
              onChange={(e) => setOpis(e.target.value)}
              placeholder="Kaj ste počeli na srečanju?"
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Opombe
              <span className="ml-2 font-normal text-slate-400">
                neobvezno
              </span>
            </label>

            <textarea
              rows={3}
              value={opombe}
              onChange={(e) => setOpombe(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
            />
          </div>

          {sporocilo && (
            <div
              className={`rounded-xl p-4 text-sm ${
                sporocilo.startsWith("Srečanje")
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {sporocilo}
            </div>
          )}

          <button
            type="submit"
            disabled={shranjujem}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {shranjujem ? "Shranjujem..." : "Shrani srečanje"}
          </button>
        </form>
      </div>
    </main>
  );
}