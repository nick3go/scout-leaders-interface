"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Srecanje = {
  id: number;
  vod_id: number;
  vodnik_id: number;
  datum: string;
  vrsta: string;
  tema: string;
  prisotni: number;
  opis: string;
  opombe: string | null;
};

type Vodnik = {
  id: number;
  name: string;
};

type Vod = {
  id: number;
  name: string;
};

function formatDatum(datum: string) {
  return new Date(`${datum}T00:00:00`).toLocaleDateString("sl-SI", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function SrecanjePage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);

  const [srecanje, setSrecanje] = useState<Srecanje | null>(null);
  const [vodnik, setVodnik] = useState<Vodnik | null>(null);
  const [vod, setVod] = useState<Vod | null>(null);

  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");

  const [urejanje, setUrejanje] = useState(false);
  const [datum, setDatum] = useState("");
  const [vrsta, setVrsta] = useState("Znanje");
  const [tema, setTema] = useState("");
  const [prisotni, setPrisotni] = useState("");
  const [opis, setOpis] = useState("");
  const [opombe, setOpombe] = useState("");

  const [sporocilo, setSporocilo] = useState("");
  const [shranjujem, setShranjujem] = useState(false);
  const [brisem, setBrisem] = useState(false);

  const loadData = useCallback(async () => {
    if (!Number.isInteger(id) || id < 1) {
      setNapaka("Neveljaven ID srečanja.");
      setNalaganje(false);
      return;
    }

    setNalaganje(true);
    setNapaka("");

    const { data: srecanjeData, error: srecanjeError } = await supabase
      .from("srecanje")
      .select(
        "id, vod_id, vodnik_id, datum, vrsta, tema, prisotni, opis, opombe"
      )
      .eq("id", id)
      .single();

    if (srecanjeError || !srecanjeData) {
      setNapaka("Srečanja ni bilo mogoče najti.");
      setNalaganje(false);
      return;
    }

    const [
      { data: vodnikData, error: vodnikError },
      { data: vodData, error: vodError },
    ] = await Promise.all([
      supabase
        .from("vodnik")
        .select("id, name")
        .eq("id", srecanjeData.vodnik_id)
        .single(),
      supabase
        .from("vod")
        .select("id, name")
        .eq("id", srecanjeData.vod_id)
        .single(),
    ]);

    if (vodnikError || vodError) {
      setNapaka("Podatkov o vodniku ali vodu ni mogoče naložiti.");
      setNalaganje(false);
      return;
    }

    setSrecanje(srecanjeData);
    setVodnik(vodnikData);
    setVod(vodData);

    setDatum(srecanjeData.datum);
    setVrsta(srecanjeData.vrsta);
    setTema(srecanjeData.tema);
    setPrisotni(String(srecanjeData.prisotni));
    setOpis(srecanjeData.opis);
    setOpombe(srecanjeData.opombe ?? "");

    setNalaganje(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function shraniSpremembe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSporocilo("");

    const steviloPrisotnih = Number(prisotni);

    if (
      !tema.trim() ||
      !opis.trim() ||
      !Number.isInteger(steviloPrisotnih) ||
      steviloPrisotnih < 0
    ) {
      setSporocilo("Preveri obvezna polja.");
      return;
    }

    setShranjujem(true);

    const response = await fetch(`/api/srecanja/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
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
      setSporocilo(result.error ?? "Napaka pri shranjevanju.");
      return;
    }

    setUrejanje(false);
    setSporocilo("Spremembe so bile shranjene.");
    await loadData();
  }

  async function izbrisiSrecanje() {
    setSporocilo("");

    const potrjeno = window.confirm(
      "Ali res želiš izbrisati to srečanje? Tega dejanja ni mogoče razveljaviti."
    );

    if (!potrjeno) {
      return;
    }

    setBrisem(true);

    const response = await fetch(`/api/srecanja/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    setBrisem(false);

    if (!response.ok) {
      setSporocilo(result.error ?? "Napaka pri brisanju.");
      return;
    }

    router.push("/srecanja");
    router.refresh();
  }

  if (nalaganje) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-2xl rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
          Nalagam srečanje ...
        </div>
      </main>
    );
  }

  if (napaka || !srecanje) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/srecanja"
            className="text-sm font-medium text-slate-500"
          >
            ← Nazaj na srečanja
          </Link>

          <div className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700">
            {napaka || "Srečanje ne obstaja."}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-12">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/srecanja"
          className="text-sm font-medium text-slate-500"
        >
          ← Nazaj na srečanja
        </Link>

        {!urejanje ? (
          <>
            <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {formatDatum(srecanje.datum)}
                  </p>

                  <h1 className="mt-1 text-3xl font-bold leading-tight text-slate-900">
                    {srecanje.tema}
                  </h1>
                </div>

                <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800">
                  {srecanje.vrsta}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Vod
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {vod?.name ?? "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Vodnik
                  </p>
                  <p className="mt-1 font-semibold text-slate-800">
                    {vodnik?.name ?? "—"}
                  </p>
                </div>

                <div className="col-span-2 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Prisotnih
                  </p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">
                    {srecanje.prisotni}
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Opis srečanja
                </h2>
                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {srecanje.opis}
                </p>
              </div>

              {srecanje.opombe && (
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <h2 className="text-sm font-semibold text-slate-700">
                    Opombe
                  </h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {srecanje.opombe}
                  </p>
                </div>
              )}

              {sporocilo && (
                <div className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                  {sporocilo}
                </div>
              )}
            </section>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setSporocilo("");
                  setUrejanje(true);
                }}
                className="rounded-xl bg-emerald-700 px-4 py-4 font-semibold text-white"
              >
                Uredi srečanje
              </button>

              <button
                type="button"
                onClick={izbrisiSrecanje}
                disabled={brisem}
                className="rounded-xl bg-red-50 px-4 py-4 font-semibold text-red-700 disabled:opacity-50"
              >
                {brisem ? "Brišem ..." : "Izbriši srečanje"}
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={shraniSpremembe}
            className="mt-5 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Uredi srečanje
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                {vod?.name} · {vodnik?.name}
              </p>
            </div>

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
                <option value="Drugo">Drugo</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tema srečanja
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
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
                rows={6}
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Opombe
              </label>
              <textarea
                rows={3}
                value={opombe}
                onChange={(e) => setOpombe(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
              />
            </div>

            {sporocilo && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {sporocilo}
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="submit"
                disabled={shranjujem}
                className="rounded-xl bg-emerald-700 px-4 py-4 font-semibold text-white disabled:opacity-50"
              >
                {shranjujem ? "Shranjujem ..." : "Shrani spremembe"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setUrejanje(false);
                  setSporocilo("");
                  setDatum(srecanje.datum);
                  setVrsta(srecanje.vrsta);
                  setTema(srecanje.tema);
                  setPrisotni(String(srecanje.prisotni));
                  setOpis(srecanje.opis);
                  setOpombe(srecanje.opombe ?? "");
                }}
                className="rounded-xl bg-slate-100 px-4 py-4 font-semibold text-slate-700"
              >
                Prekliči
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
