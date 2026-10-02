"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type Oglas = {
  id: number;
  tip: string;
  vodnik_id: number;
  tema: string;
  opis: string;
  status: string;
  created_at: string;
};

type Vodnik = {
  id: number;
  name: string;
  active: boolean;
};

const tipi = ["Iščem pomoč", "Ponujam pomoč"];

export default function PomocPage() {
  const [oglasi, setOglasi] = useState<Oglas[]>([]);
  const [vodniki, setVodniki] = useState<Vodnik[]>([]);
  const [nalaganje, setNalaganje] = useState(true);
  const [napaka, setNapaka] = useState("");
  const [sporocilo, setSporocilo] = useState("");

  const [dodajanjeOdprto, setDodajanjeOdprto] = useState(false);
  const [tip, setTip] = useState("Iščem pomoč");
  const [vodnikId, setVodnikId] = useState<number | null>(null);
  const [tema, setTema] = useState("");
  const [opis, setOpis] = useState("");
  const [shranjujem, setShranjujem] = useState(false);

  const [iskanje, setIskanje] = useState("");
  const [tipFilter, setTipFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("Aktivno");

  const [urejanjeId, setUrejanjeId] = useState<number | null>(null);
  const [editTip, setEditTip] = useState("Iščem pomoč");
  const [editVodnikId, setEditVodnikId] = useState<number | null>(null);
  const [editTema, setEditTema] = useState("");
  const [editOpis, setEditOpis] = useState("");
  const [editShranjujem, setEditShranjujem] = useState(false);
  const [spreminjamStatusId, setSpreminjamStatusId] = useState<number | null>(null);
  const [brisemId, setBrisemId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setNalaganje(true);
    setNapaka("");

    const [
      { data: oglasiData, error: oglasiError },
      { data: vodnikiData, error: vodnikiError },
    ] = await Promise.all([
      supabase
        .from("pomoc")
        .select("id, tip, vodnik_id, tema, opis, status, created_at")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false }),
      supabase
        .from("vodnik")
        .select("id, name, active")
        .order("name"),
    ]);

    const error = oglasiError || vodnikiError;

    if (error) {
      console.error(error);
      setNapaka("Oglasov ni bilo mogoče naložiti.");
      setNalaganje(false);
      return;
    }

    setOglasi(oglasiData ?? []);
    setVodniki(vodnikiData ?? []);

    setVodnikId((trenutni) => {
      if (
        trenutni &&
        vodnikiData?.some(
          (vodnik) => vodnik.id === trenutni && vodnik.active
        )
      ) {
        return trenutni;
      }

      return vodnikiData?.find((vodnik) => vodnik.active)?.id ?? null;
    });

    setNalaganje(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const aktivniVodniki = useMemo(
    () => vodniki.filter((vodnik) => vodnik.active),
    [vodniki]
  );

  const filtriraniOglasi = useMemo(() => {
    const query = iskanje.trim().toLowerCase();

    return oglasi.filter((oglas) => {
      if (
        query &&
        !oglas.tema.toLowerCase().includes(query) &&
        !oglas.opis.toLowerCase().includes(query) &&
        !(
          vodniki
            .find((vodnik) => vodnik.id === oglas.vodnik_id)
            ?.name.toLowerCase()
            .includes(query) ?? false
        )
      ) {
        return false;
      }

      if (tipFilter && oglas.tip !== tipFilter) {
        return false;
      }

      if (statusFilter && oglas.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [oglasi, vodniki, iskanje, tipFilter, statusFilter]);

  const vodnikIme = (id: number) =>
    vodniki.find((vodnik) => vodnik.id === id)?.name ?? "Neznan vodnik";

  function resetForm() {
    setTip("Iščem pomoč");
    setTema("");
    setOpis("");
  }

  async function dodajOglas(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNapaka("");
    setSporocilo("");

    if (!vodnikId || !tema.trim() || !opis.trim()) {
      setNapaka("Izpolni vsa obvezna polja.");
      return;
    }

    setShranjujem(true);

    const response = await fetch("/api/pomoc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tip,
        vodnik_id: vodnikId,
        tema,
        opis,
      }),
    });

    const result = await response.json();
    setShranjujem(false);

    if (!response.ok) {
      setNapaka(result.error ?? "Oglasa ni bilo mogoče shraniti.");
      return;
    }

    resetForm();
    setDodajanjeOdprto(false);
    setSporocilo("Oglas je bil dodan.");
    await loadData();
  }

  function zacniUrejanje(oglas: Oglas) {
    setUrejanjeId(oglas.id);
    setEditTip(oglas.tip);
    setEditVodnikId(oglas.vodnik_id);
    setEditTema(oglas.tema);
    setEditOpis(oglas.opis);
    setNapaka("");
    setSporocilo("");
  }

  async function shraniUrejanje(oglas: Oglas) {
    if (!editVodnikId || !editTema.trim() || !editOpis.trim()) {
      setNapaka("Izpolni vsa obvezna polja.");
      return;
    }

    setEditShranjujem(true);
    setNapaka("");
    setSporocilo("");

    const response = await fetch(`/api/pomoc/${oglas.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tip: editTip,
        vodnik_id: editVodnikId,
        tema: editTema,
        opis: editOpis,
        status: oglas.status,
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

  async function spremeniStatus(oglas: Oglas) {
    const novStatus = oglas.status === "Aktivno" ? "Zaključeno" : "Aktivno";

    setSpreminjamStatusId(oglas.id);
    setNapaka("");
    setSporocilo("");

    const response = await fetch(`/api/pomoc/${oglas.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tip: oglas.tip,
        vodnik_id: oglas.vodnik_id,
        tema: oglas.tema,
        opis: oglas.opis,
        status: novStatus,
      }),
    });

    const result = await response.json();
    setSpreminjamStatusId(null);

    if (!response.ok) {
      setNapaka(result.error ?? "Statusa ni bilo mogoče spremeniti.");
      return;
    }

    setSporocilo(
      novStatus === "Zaključeno"
        ? "Oglas je označen kot zaključen."
        : "Oglas je ponovno aktiven."
    );
    await loadData();
  }

  async function izbrisiOglas(id: number) {
    if (
      !window.confirm(
        "Ali res želiš izbrisati ta oglas? Tega dejanja ni mogoče razveljaviti."
      )
    ) {
      return;
    }

    setBrisemId(id);
    setNapaka("");
    setSporocilo("");

    const response = await fetch(`/api/pomoc/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    setBrisemId(null);

    if (!response.ok) {
      setNapaka(result.error ?? "Oglasa ni bilo mogoče izbrisati.");
      return;
    }

    if (urejanjeId === id) {
      setUrejanjeId(null);
    }

    setSporocilo("Oglas je bil izbrisan.");
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
            Oglasna deska
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Pomoč med vodniki
          </h1>

          <p className="mt-2 text-slate-600">
            Poišči pomoč pri temi ali ponudi znanje, ki ga lahko deliš z drugim vodom.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setDodajanjeOdprto((trenutno) => !trenutno);
            setNapaka("");
            setSporocilo("");
          }}
          className="mt-5 w-full rounded-2xl bg-emerald-700 px-4 py-4 text-base font-semibold text-white shadow-sm"
        >
          {dodajanjeOdprto ? "Zapri obrazec" : "+ Dodaj oglas"}
        </button>

        {dodajanjeOdprto && (
          <form
            onSubmit={dodajOglas}
            className="mt-4 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Nov oglas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Povej, ali pomoč iščeš ali jo ponujaš.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setDodajanjeOdprto(false)}
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-600"
              >
                Zapri
              </button>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Iščem ali ponujam?
              </label>

              <select
                value={tip}
                onChange={(e) => setTip(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
              >
                {tipi.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Vodnik
              </label>

              <select
                value={vodnikId ?? ""}
                onChange={(e) => setVodnikId(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                required
              >
                {aktivniVodniki.length === 0 && (
                  <option value="">Ni aktivnih vodnikov</option>
                )}

                {aktivniVodniki.map((vodnik) => (
                  <option key={vodnik.id} value={vodnik.id}>
                    {vodnik.name}
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
                placeholder="npr. Orientacija s karto in kompasom"
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Opis / opombe
              </label>

              <textarea
                rows={5}
                value={opis}
                onChange={(e) => setOpis(e.target.value)}
                placeholder="Na kratko opiši, kaj točno iščeš ali kaj lahko ponudiš ..."
                className="w-full rounded-xl border border-slate-300 px-3 py-3"
                required
              />
            </div>

            <button
              type="submit"
              disabled={shranjujem || aktivniVodniki.length === 0}
              className="w-full rounded-xl bg-emerald-700 px-4 py-4 font-semibold text-white disabled:opacity-50"
            >
              {shranjujem ? "Shranjujem ..." : "Objavi oglas"}
            </button>
          </form>
        )}

        {sporocilo && (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            {sporocilo}
          </div>
        )}

        {napaka && (
          <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {napaka}
          </div>
        )}

        <section className="mt-7">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Oglasi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {filtriraniOglasi.length === oglasi.length
                ? `${oglasi.length} ${oglasi.length === 1 ? "oglas" : "oglasov"}`
                : `Prikazanih ${filtriraniOglasi.length} od ${oglasi.length}`}
            </p>
          </div>

          <div className="mt-4 space-y-3">
            <input
              type="search"
              value={iskanje}
              onChange={(e) => setIskanje(e.target.value)}
              placeholder="Išči po temi, opisu ali vodniku ..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-base outline-none focus:border-emerald-600"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={tipFilter}
                onChange={(e) => setTipFilter(e.target.value)}
                className="min-w-0 rounded-2xl border border-slate-300 bg-white px-3 py-4 text-base"
              >
                <option value="">Vsi tipi</option>
                {tipi.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="min-w-0 rounded-2xl border border-slate-300 bg-white px-3 py-4 text-base"
              >
                <option value="Aktivno">Aktivni</option>
                <option value="Zaključeno">Zaključeni</option>
                <option value="">Vsi</option>
              </select>
            </div>
          </div>

          {nalaganje ? (
            <div className="mt-4 rounded-2xl bg-white p-8 text-center text-slate-500 shadow-sm">
              Nalagam oglase ...
            </div>
          ) : filtriraniOglasi.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="font-semibold text-slate-800">
                Ni najdenih oglasov.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Poskusi spremeniti iskanje ali filtre.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {filtriraniOglasi.map((oglas) => (
                <article
                  key={oglas.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  {urejanjeId === oglas.id ? (
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Iščem ali ponujam?
                        </label>
                        <select
                          value={editTip}
                          onChange={(e) => setEditTip(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                        >
                          {tipi.map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Vodnik
                        </label>
                        <select
                          value={editVodnikId ?? ""}
                          onChange={(e) => setEditVodnikId(Number(e.target.value))}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3"
                        >
                          {vodniki.map((vodnik) => (
                            <option key={vodnik.id} value={vodnik.id}>
                              {vodnik.name}
                              {vodnik.active ? "" : " (neaktiven)"}
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
                          value={editTema}
                          onChange={(e) => setEditTema(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-3"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Opis / opombe
                        </label>
                        <textarea
                          rows={5}
                          value={editOpis}
                          onChange={(e) => setEditOpis(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 px-3 py-3"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => shraniUrejanje(oglas)}
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
                        <div className="min-w-0">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                              oglas.tip === "Iščem pomoč"
                                ? "bg-amber-50 text-amber-800"
                                : "bg-emerald-50 text-emerald-800"
                            }`}
                          >
                            {oglas.tip}
                          </span>

                          <h3 className="mt-3 text-xl font-bold leading-tight text-slate-900">
                            {oglas.tema}
                          </h3>

                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {vodnikIme(oglas.vodnik_id)}
                          </p>
                        </div>

                        {oglas.status === "Zaključeno" && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Zaključeno
                          </span>
                        )}
                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {oglas.opis}
                      </p>

                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() => zacniUrejanje(oglas)}
                          className="rounded-xl bg-slate-100 px-3 py-3 font-semibold text-slate-800"
                        >
                          Uredi
                        </button>

                        <button
                          type="button"
                          onClick={() => spremeniStatus(oglas)}
                          disabled={spreminjamStatusId === oglas.id}
                          className="rounded-xl bg-emerald-50 px-3 py-3 font-semibold text-emerald-800 disabled:opacity-50"
                        >
                          {spreminjamStatusId === oglas.id
                            ? "Shranjujem ..."
                            : oglas.status === "Aktivno"
                              ? "Zaključi"
                              : "Ponovno odpri"}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => izbrisiOglas(oglas.id)}
                        disabled={brisemId === oglas.id}
                        className="mt-2 w-full rounded-xl bg-red-50 px-3 py-3 font-semibold text-red-700 disabled:opacity-50"
                      >
                        {brisemId === oglas.id ? "Brišem ..." : "Izbriši oglas"}
                      </button>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
