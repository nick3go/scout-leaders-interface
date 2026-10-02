"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export default function SrecanjaPage() {
  const [srecanja, setSrecanja] = useState<Srecanje[]>([]);
  const [vodniki, setVodniki] = useState<Vodnik[]>([]);
  const [vodi, setVodi] = useState<Vod[]>([]);

  const [iskanje, setIskanje] = useState("");
  const [vodnikFilter, setVodnikFilter] = useState("");
  const [vodFilter, setVodFilter] = useState("");
  const [vrstaFilter, setVrstaFilter] = useState("");

  const [filtriOdprti, setFiltriOdprti] = useState(false);

  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");

  useEffect(() => {
    async function loadData() {
      setNalaganje(true);

      const [
        { data: srecanjaData, error: srecanjaError },
        { data: vodnikiData, error: vodnikiError },
        { data: vodiData, error: vodiError },
      ] = await Promise.all([
        supabase
          .from("srecanje")
          .select(
            "id, vod_id, vodnik_id, datum, vrsta, tema, prisotni, opis, opombe"
          )
          .order("datum", { ascending: false })
          .order("id", { ascending: false }),

        supabase
          .from("vodnik")
          .select("id, name")
          .order("name"),

        supabase
          .from("vod")
          .select("id, name")
          .order("name"),
      ]);

      const error =
        srecanjaError ||
        vodnikiError ||
        vodiError;

      if (error) {
        console.error(error);
        setNapaka(error.message);
        setNalaganje(false);
        return;
      }

      setSrecanja(srecanjaData ?? []);
      setVodniki(vodnikiData ?? []);
      setVodi(vodiData ?? []);
      setNalaganje(false);
    }

    loadData();
  }, []);

  const vodnikIme = (id: number) =>
    vodniki.find((vodnik) => vodnik.id === id)?.name ??
    "Neznan vodnik";

  const vodIme = (id: number) =>
    vodi.find((vod) => vod.id === id)?.name ??
    "Neznan vod";

  const filtriranaSrecanja = useMemo(() => {
    const query = iskanje.trim().toLowerCase();

    return srecanja.filter((srecanje) => {
      if (
        query &&
        !srecanje.tema.toLowerCase().includes(query) &&
        !srecanje.opis.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (
        vodnikFilter &&
        srecanje.vodnik_id !== Number(vodnikFilter)
      ) {
        return false;
      }

      if (
        vodFilter &&
        srecanje.vod_id !== Number(vodFilter)
      ) {
        return false;
      }

      if (
        vrstaFilter &&
        srecanje.vrsta !== vrstaFilter
      ) {
        return false;
      }

      return true;
    });
  }, [
    srecanja,
    iskanje,
    vodnikFilter,
    vodFilter,
    vrstaFilter,
  ]);

  function ponastaviFiltre() {
    setIskanje("");
    setVodnikFilter("");
    setVodFilter("");
    setVrstaFilter("");
  }

  const aktivniFiltri =
    Number(Boolean(vodnikFilter)) +
    Number(Boolean(vodFilter)) +
    Number(Boolean(vrstaFilter));

  return (
    <main className="min-h-screen bg-slate-50 pb-28">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm font-medium text-slate-500"
          >
            ← Domov
          </Link>

          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Pregled srečanj
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {srecanja.length}{" "}
            {srecanja.length === 1
              ? "vpisano srečanje"
              : "vpisanih srečanj"}
          </p>

          <a
            href="/api/export"
            className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm sm:w-auto"
          >
            Izvozi za Google Sheets
          </a>
        </div>

        <div className="mb-4">
          <input
            type="search"
            value={iskanje}
            onChange={(e) => setIskanje(e.target.value)}
            placeholder="Išči po temi ali opisu..."
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base outline-none focus:border-emerald-600"
          />
        </div>

        <div className="mb-5">
          <button
            type="button"
            onClick={() =>
              setFiltriOdprti((trenutno) => !trenutno)
            }
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm"
          >
            <span className="font-semibold text-slate-800">
              Filtri
              {aktivniFiltri > 0 && (
                <span className="ml-2 rounded-full bg-emerald-100 px-2 py-1 text-xs text-emerald-800">
                  {aktivniFiltri}
                </span>
              )}
            </span>

            <span className="text-slate-500">
              {filtriOdprti ? "▲" : "▼"}
            </span>
          </button>

          {filtriOdprti && (
            <div className="mt-2 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Vodnik
                </label>

                <select
                  value={vodnikFilter}
                  onChange={(e) =>
                    setVodnikFilter(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                >
                  <option value="">
                    Vsi vodniki
                  </option>

                  {vodniki.map((vodnik) => (
                    <option
                      key={vodnik.id}
                      value={vodnik.id}
                    >
                      {vodnik.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Vod
                </label>

                <select
                  value={vodFilter}
                  onChange={(e) =>
                    setVodFilter(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                >
                  <option value="">
                    Vsi vodi
                  </option>

                  {vodi.map((vod) => (
                    <option
                      key={vod.id}
                      value={vod.id}
                    >
                      {vod.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Vrsta srečanja
                </label>

                <select
                  value={vrstaFilter}
                  onChange={(e) =>
                    setVrstaFilter(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                >
                  <option value="">
                    Vse vrste
                  </option>
                  <option value="Znanje">
                    Znanje
                  </option>
                  <option value="Zabavno">
                    Zabavno
                  </option>
                  <option value="Ustvarjalno">
                    Ustvarjalno
                  </option>
                  <option value="Povezovalno">
                    Povezovalno
                  </option>
                  <option value="Drugo">
                    Drugo
                  </option>
                </select>
              </div>

              <button
                type="button"
                onClick={ponastaviFiltre}
                className="w-full rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700"
              >
                Ponastavi filtre
              </button>
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Prikazanih:{" "}
            {filtriranaSrecanja.length}
          </p>
        </div>

        {nalaganje && (
          <div className="rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
            Nalagam srečanja ...
          </div>
        )}

        {napaka && (
          <div className="rounded-2xl bg-red-50 p-5 text-red-700">
            Napaka pri nalaganju: {napaka}
          </div>
        )}

        {!nalaganje &&
          !napaka &&
          filtriranaSrecanja.length === 0 && (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <p className="font-semibold text-slate-800">
                Ni najdenih srečanj.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Poskusi spremeniti iskanje ali filtre.
              </p>
            </div>
          )}

        <div className="space-y-4">
          {filtriranaSrecanja.map(
            (srecanje) => (
              <article
                key={srecanje.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-slate-500">
                      {formatDatum(
                        srecanje.datum
                      )}
                    </p>

                    <h2 className="mt-1 text-xl font-bold leading-tight text-slate-900">
                      {srecanje.tema}
                    </h2>
                  </div>

                  <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    {srecanje.vrsta}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm font-medium text-slate-600">
                  <span>
                    {vodIme(
                      srecanje.vod_id
                    )}
                  </span>

                  <span>•</span>

                  <span>
                    {vodnikIme(
                      srecanje.vodnik_id
                    )}
                  </span>

                  <span>•</span>

                  <span>
                    {srecanje.prisotni}{" "}
                    prisotnih
                  </span>
                </div>

                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-700">
                  {srecanje.opis}
                </p>

                {srecanje.opombe && (
                  <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                    <span className="font-semibold">
                      Opombe:
                    </span>{" "}
                    {srecanje.opombe}
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Link
                    href={`/srecanja/${srecanje.id}`}
                    className="block w-full rounded-xl bg-slate-100 px-4 py-3 text-center font-semibold text-slate-800"
                  >
                    Poglej podrobnosti
                  </Link>
                </div>
              </article>
            )
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/vpis"
            className="block w-full rounded-2xl bg-emerald-700 px-4 py-4 text-center text-base font-semibold text-white shadow-lg"
          >
            + Vpiši srečanje
          </Link>
        </div>
      </div>
    </main>
  );
}