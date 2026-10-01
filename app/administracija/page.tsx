"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Vod = {
  id: number;
  name: string;
  active: boolean;
};

type Vodnik = {
  id: number;
  name: string;
  vod_id: number;
  active: boolean;
};

type AdminResponse = {
  success?: boolean;
  error?: string;
};

export default function AdministracijaPage() {
  const [vodi, setVodi] = useState<Vod[]>([]);
  const [vodniki, setVodniki] = useState<Vodnik[]>([]);

  const [novVod, setNovVod] = useState("");
  const [novVodnik, setNovVodnik] = useState("");
  const [novVodnikVodId, setNovVodnikVodId] = useState<number | null>(null);

  const [nalaganje, setNalaganje] = useState(true);
  const [shranjujem, setShranjujem] = useState("");
  const [sporocilo, setSporocilo] = useState("");
  const [napaka, setNapaka] = useState("");

  const loadData = useCallback(async () => {
    setNalaganje(true);
    setNapaka("");

    const [
      { data: vodiData, error: vodiError },
      { data: vodnikiData, error: vodnikiError },
    ] = await Promise.all([
      supabase
        .from("vod")
        .select("id, name, active")
        .order("active", { ascending: false })
        .order("name"),
      supabase
        .from("vodnik")
        .select("id, name, vod_id, active")
        .order("active", { ascending: false })
        .order("name"),
    ]);

    const error = vodiError || vodnikiError;

    if (error) {
      console.error(error);
      setNapaka("Podatkov ni bilo mogoče naložiti.");
      setNalaganje(false);
      return;
    }

    const noviVodi = vodiData ?? [];

    setVodi(noviVodi);
    setVodniki(vodnikiData ?? []);

    setNovVodnikVodId((trenutniId) => {
      if (
        trenutniId &&
        noviVodi.some((vod) => vod.id === trenutniId && vod.active)
      ) {
        return trenutniId;
      }

      return noviVodi.find((vod) => vod.active)?.id ?? null;
    });

    setNalaganje(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const aktivniVodi = useMemo(
    () => vodi.filter((vod) => vod.active),
    [vodi]
  );

  async function adminRequest(body: object) {
    const response = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as AdminResponse;

    if (!response.ok) {
      throw new Error(result.error ?? "Prišlo je do napake.");
    }
  }

  async function dodajVod() {
    setSporocilo("");
    setNapaka("");

    if (!novVod.trim()) {
      setNapaka("Vnesi ime voda.");
      return;
    }

    setShranjujem("nov-vod");

    try {
      await adminRequest({
        entity: "vod",
        action: "create",
        name: novVod,
      });

      setNovVod("");
      setSporocilo("Vod je bil dodan.");
      await loadData();
    } catch (error) {
      setNapaka(
        error instanceof Error ? error.message : "Voda ni bilo mogoče dodati."
      );
    } finally {
      setShranjujem("");
    }
  }

  async function shraniVod(vod: Vod) {
    setSporocilo("");
    setNapaka("");
    setShranjujem(`vod-${vod.id}`);

    try {
      await adminRequest({
        entity: "vod",
        action: "update",
        id: vod.id,
        name: vod.name,
        active: vod.active,
      });

      setSporocilo("Spremembe voda so shranjene.");
      await loadData();
    } catch (error) {
      setNapaka(
        error instanceof Error
          ? error.message
          : "Sprememb voda ni bilo mogoče shraniti."
      );
    } finally {
      setShranjujem("");
    }
  }

  async function dodajVodnika() {
    setSporocilo("");
    setNapaka("");

    if (!novVodnik.trim() || !novVodnikVodId) {
      setNapaka("Vnesi ime vodnika in izberi vod.");
      return;
    }

    setShranjujem("nov-vodnik");

    try {
      await adminRequest({
        entity: "vodnik",
        action: "create",
        name: novVodnik,
        vod_id: novVodnikVodId,
      });

      setNovVodnik("");
      setSporocilo("Vodnik je bil dodan.");
      await loadData();
    } catch (error) {
      setNapaka(
        error instanceof Error
          ? error.message
          : "Vodnika ni bilo mogoče dodati."
      );
    } finally {
      setShranjujem("");
    }
  }

  async function shraniVodnika(vodnik: Vodnik) {
    setSporocilo("");
    setNapaka("");
    setShranjujem(`vodnik-${vodnik.id}`);

    try {
      await adminRequest({
        entity: "vodnik",
        action: "update",
        id: vodnik.id,
        name: vodnik.name,
        vod_id: vodnik.vod_id,
        active: vodnik.active,
      });

      setSporocilo("Spremembe vodnika so shranjene.");
      await loadData();
    } catch (error) {
      setNapaka(
        error instanceof Error
          ? error.message
          : "Sprememb vodnika ni bilo mogoče shraniti."
      );
    } finally {
      setShranjujem("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 pb-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-slate-500">
          ← Domov
        </Link>

        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Nastavitve
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Administracija
          </h1>

          <p className="mt-2 text-slate-600">
            Dodajaj in urejaj vode ter vodnike.
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

        {nalaganje ? (
          <div className="mt-6 rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
            Nalagam ...
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Vodi
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Neaktiven vod ostane pri starih srečanjih, ne bo pa več na voljo pri novih vpisih.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  value={novVod}
                  onChange={(e) => setNovVod(e.target.value)}
                  placeholder="Ime novega voda"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3"
                />

                <button
                  type="button"
                  onClick={dodajVod}
                  disabled={shranjujem === "nov-vod"}
                  className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {shranjujem === "nov-vod" ? "Dodajam ..." : "+ Dodaj vod"}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {vodi.map((vod) => (
                  <div
                    key={vod.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]">
                      <input
                        type="text"
                        value={vod.name}
                        onChange={(e) =>
                          setVodi((trenutni) =>
                            trenutni.map((item) =>
                              item.id === vod.id
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-3"
                      />

                      <select
                        value={vod.active ? "active" : "inactive"}
                        onChange={(e) =>
                          setVodi((trenutni) =>
                            trenutni.map((item) =>
                              item.id === vod.id
                                ? {
                                    ...item,
                                    active: e.target.value === "active",
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-3"
                      >
                        <option value="active">Aktiven</option>
                        <option value="inactive">Neaktiven</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => shraniVod(vod)}
                        disabled={shranjujem === `vod-${vod.id}`}
                        className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {shranjujem === `vod-${vod.id}`
                          ? "Shranjujem ..."
                          : "Shrani"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Vodniki
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Vodniku lahko spremeniš ime, pripadajoči vod ali ga označiš kot neaktivnega.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  type="text"
                  value={novVodnik}
                  onChange={(e) => setNovVodnik(e.target.value)}
                  placeholder="Ime vodnika"
                  className="rounded-xl border border-slate-300 px-3 py-3"
                />

                <select
                  value={novVodnikVodId ?? ""}
                  onChange={(e) => setNovVodnikVodId(Number(e.target.value))}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-3"
                >
                  {aktivniVodi.length === 0 && (
                    <option value="">Najprej dodaj aktiven vod</option>
                  )}

                  {aktivniVodi.map((vod) => (
                    <option key={vod.id} value={vod.id}>
                      {vod.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={dodajVodnika}
                  disabled={
                    shranjujem === "nov-vodnik" || aktivniVodi.length === 0
                  }
                  className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white disabled:opacity-50"
                >
                  {shranjujem === "nov-vodnik"
                    ? "Dodajam ..."
                    : "+ Dodaj vodnika"}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {vodniki.map((vodnik) => (
                  <div
                    key={vodnik.id}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        type="text"
                        value={vodnik.name}
                        onChange={(e) =>
                          setVodniki((trenutni) =>
                            trenutni.map((item) =>
                              item.id === vodnik.id
                                ? { ...item, name: e.target.value }
                                : item
                            )
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-3"
                      />

                      <select
                        value={vodnik.vod_id}
                        onChange={(e) =>
                          setVodniki((trenutni) =>
                            trenutni.map((item) =>
                              item.id === vodnik.id
                                ? {
                                    ...item,
                                    vod_id: Number(e.target.value),
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-3"
                      >
                        {vodi.map((vod) => (
                          <option key={vod.id} value={vod.id}>
                            {vod.name}
                            {vod.active ? "" : " (neaktiven)"}
                          </option>
                        ))}
                      </select>

                      <select
                        value={vodnik.active ? "active" : "inactive"}
                        onChange={(e) =>
                          setVodniki((trenutni) =>
                            trenutni.map((item) =>
                              item.id === vodnik.id
                                ? {
                                    ...item,
                                    active: e.target.value === "active",
                                  }
                                : item
                            )
                          )
                        }
                        className="rounded-xl border border-slate-300 bg-white px-3 py-3"
                      >
                        <option value="active">Aktiven</option>
                        <option value="inactive">Neaktiven</option>
                      </select>

                      <button
                        type="button"
                        onClick={() => shraniVodnika(vodnik)}
                        disabled={shranjujem === `vodnik-${vodnik.id}`}
                        className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50"
                      >
                        {shranjujem === `vodnik-${vodnik.id}`
                          ? "Shranjujem ..."
                          : "Shrani spremembe"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
