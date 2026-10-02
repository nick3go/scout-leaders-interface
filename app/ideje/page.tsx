"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Ideja = {
  id: number;
  vrsta: string;
  tema: string;
  opis: string;
  opombe: string | null;
  created_at: string;
};

const vrste = ["Znanje", "Zabavno", "Ustvarjalno", "Povezovalno"];

export default function IdejePage() {
  const [ideje, setIdeje] = useState<Ideja[]>([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");
  const [sporocilo, setSporocilo] = useState("");

  const [vrsta, setVrsta] = useState("Znanje");
  const [tema, setTema] = useState("");
  const [opis, setOpis] = useState("");
  const [opombe, setOpombe] = useState("");
  const [shranjujem, setShranjujem] = useState(false);

  const [iskanje, setIskanje] = useState("");
  const [vrstaFilter, setVrstaFilter] = useState("");

  const [urejanjeId, setUrejanjeId] = useState<number | null>(null);
  const [editVrsta, setEditVrsta] = useState("Znanje");
  const [editTema, setEditTema] = useState("");
  const [editOpis, setEditOpis] = useState("");
  const [editOpombe, setEditOpombe] = useState("");
  const [editShranjujem, setEditShranjujem] = useState(false);
  const [brisemId, setBrisemId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setNalaganje(true);
    setNapaka("");

    const { data, error } = await supabase
      .from("ideja")
      .select("id, vrsta, tema, opis, opombe, created_at")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      setNapaka("Idej ni bilo mogoče naložiti.");
      setNalaganje(false);
      return;
    }

    setIdeje(data ?? []);
    setNalaganje(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtriraneIdeje = useMemo(() => {
    const query = iskanje.trim().toLowerCase();

    return ideje.filter((ideja) => {
      if (
        query &&
        !ideja.tema.toLowerCase().includes(query) &&
        !ideja.opis.toLowerCase().includes(query)
      ) {
        return false;
      }

      if (vrstaFilter && ideja.vrsta !== vrstaFilter) {
        return false;
      }

      return true;
    });
  }, [ideje, iskanje, vrstaFilter]);

  function resetForm() {
    setVrsta("Znanje");
    setTema("");
    setOpis("");
    setOpombe("");
  }

  async function dodajIdejo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNapaka("");
    setSporocilo("");

    if (!tema.trim() || !opis.trim()) {
      setNapaka("Izpolni vsa obvezna polja.");
      return;
    }

    setShranjujem(true);

    const response = await fetch("/api/ideje", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vrsta, tema, opis, opombe }),
    });

    const result = await response.json();
    setShranjujem(false);

    if (!response.ok) {
      setNapaka(result.error ?? "Ideje ni bilo mogoče shraniti.");
      return;
    }

    resetForm();
    setSporocilo("Ideja je bila dodana.");
    await loadData();
  }

  function zacniUrejanje(ideja: Ideja) {
    setUrejanjeId(ideja.id);
    setEditVrsta(ideja.vrsta);
    setEditTema(ideja.tema);
    setEditOpis(ideja.opis);
    setEditOpombe(ideja.opombe ?? "");
    setNapaka("");
    setSporocilo("");
  }

  async function shraniUrejanje(id: number) {
    if (!editTema.trim() || !editOpis.trim()) {
      setNapaka("Izpolni vsa obvezna polja.");
      return;
    }

    setEditShranjujem(true);
    setNapaka("");
    setSporocilo("");

    const response = await fetch(`/api/ideje/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vrsta: editVrsta,
        tema: editTema,
        opis: editOpis,
        opombe: editOpombe,
      }),
    });

    const result = await response.json();
    setEditShranjujem(false);

    if (!response.ok) {
      setNapaka(result.error ?? "Sprememb ni bilo mogoče shraniti.");
      return;
    }

    setUrejanjeId(null);
    setSporocilo("Spremembe so bile shranjene.");
    await loadData();
  }

  async function izbrisiIdejo(id: number) {
    if (
      !window.confirm(
        "Ali res želiš izbrisati to idejo? Tega dejanja ni mogoče razveljaviti."
      )
    ) {
      return;
    }

    setBrisemId(id);
    setNapaka("");
    setSporocilo("");

    const response = await fetch(`/api/ideje/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    setBrisemId(null);

    if (!response.ok) {
      setNapaka(result.error ?? "Ideje ni bilo mogoče izbrisati.");
      return;
    }

    setSporocilo("Ideja je bila izbrisana.");
    await loadData();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-slate-500">
          ← Domov
        </Link>

        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Skupni seznam
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Ideje za srečanja
          </h1>
          <p className="mt-2 text-slate-600">
            Vsi vodniki lahko dodajajo, pregledujejo in urejajo ideje.
          </p>
        </div>

        {sporocilo && (
          <div className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            {sporocilo}
          </div>
        )}

        {napaka && (
          <div className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {napaka}
          </div>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form onSubmit={dodajIdejo} className="space-y-5 p-5 sm:p-7">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Dodaj novo idejo
              </h2>
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
                {vrste.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tema
              </label>
              <input
                type="text"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="npr. Kuhanje na ognju"
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Opis
              </label>
              <textarea
                rows={5}
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder="Opiši idejo za srečanje ..."
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

            <button
              type="submit"
              disabled={shranjujem}
              className="w-full rounded-xl bg-emerald-700 px-4 py-4 font-semibold text-white disabled:opacity-50"
            >
              {shranjujem ? "Shranjujem ..." : "+ Dodaj idejo"}
            </button>
          </form>

          <div className="border-t border-slate-200 bg-slate-50/70 p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Seznam idej
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {ideje.length} {ideje.length === 1 ? "ideja" : "idej"}
                </p>
              </div>

              <select
                value={vrstaFilter}
                onChange={(e) => setVrstaFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm"
              >
                <option value="">Vse vrste</option>
                {vrste.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="search"
              value={iskanje}
              onChange={(e) => setIskanje(e.target.value)}
              placeholder="Išči po temi ali opisu ..."
              className="mt-4 w-full rounded-xl border border-slate-300 bg-white px-4 py-3"
            />

            {nalaganje ? (
              <div className="mt-4 rounded-xl bg-white p-6 text-center text-slate-500">
                Nalagam ideje ...
              </div>
            ) : filtriraneIdeje.length === 0 ? (
              <div className="mt-4 rounded-xl bg-white p-6 text-center text-slate-500">
                Ni najdenih idej.
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {filtriraneIdeje.map((ideja) => (
                  <article
                    key={ideja.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    {urejanjeId === ideja.id ? (
                      <div className="space-y-4">
                        <select
                          value={editVrsta}
                          onChange={(e) => setEditVrsta(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                        >
                          {vrste.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>

                        <input
                          type="text"
                          value={editTema}
                          onChange={(e) => setEditTema(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-3"
                        />

                        <textarea
                          rows={5}
                          value={editOpis}
                          onChange={(e) => setEditOpis(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-3"
                        />

                        <textarea
                          rows={3}
                          value={editOpombe}
                          onChange={(e) => setEditOpombe(e.target.value)}
                          placeholder="Opombe"
                          className="w-full rounded-xl border border-slate-300 px-3 py-3"
                        />

                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => shraniUrejanje(ideja.id)}
                            disabled={editShranjujem}
                            className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
                          >
                            {editShranjujem ? "Shranjujem ..." : "Shrani spremembe"}
                          </button>

                          <button
                            type="button"
                            onClick={() => setUrejanjeId(null)}
                            className="rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-700"
                          >
                            Prekliči
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-lg font-bold text-slate-900">
                            {ideja.tema}
                          </h3>

                          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                            {ideja.vrsta}
                          </span>
                        </div>

                        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {ideja.opis}
                        </p>

                        {ideja.opombe && (
                          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            <span className="font-semibold">Opombe:</span>{" "}
                            {ideja.opombe}
                          </div>
                        )}

                        <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => zacniUrejanje(ideja)}
                            className="rounded-xl bg-slate-100 px-4 py-3 font-semibold text-slate-800"
                          >
                            Uredi
                          </button>

                          <button
                            type="button"
                            onClick={() => izbrisiIdejo(ideja.id)}
                            disabled={brisemId === ideja.id}
                            className="rounded-xl bg-red-50 px-4 py-3 font-semibold text-red-700 disabled:opacity-50"
                          >
                            {brisemId === ideja.id ? "Brišem ..." : "Izbriši"}
                          </button>
                        </div>
                      </>
                    )}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
