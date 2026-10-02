import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Vodniški interface
          </p>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Vodova srečanja
          </h1>

          <p className="mt-3 text-slate-600">
            Vpisuj in pregleduj izvedena vodova srečanja.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/vpis"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-8 text-3xl">＋</div>

            <h2 className="text-xl font-semibold text-slate-900">
              Vpiši srečanje
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Dodaj novo izvedeno vodovo srečanje.
            </p>

            <p className="mt-6 font-medium text-emerald-700">
              Odpri obrazec →
            </p>
          </Link>

          <Link
            href="/srecanja"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-8 text-3xl">☰</div>

            <h2 className="text-xl font-semibold text-slate-900">
              Pregled srečanj
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Poišči, filtriraj in preglej pretekla srečanja.
            </p>

            <p className="mt-6 font-medium text-emerald-700">
              Poglej srečanja →
            </p>
          </Link>

          <Link
            href="/ideje"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-8 text-3xl">✦</div>

            <h2 className="text-xl font-semibold text-slate-900">
              Ideje za srečanja
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Dodaj, preglej in uredi skupne ideje za prihodnja srečanja.
            </p>

            <p className="mt-6 font-medium text-emerald-700">
              Poglej ideje →
            </p>
          </Link>

          <Link
            href="/administracija"
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-8 text-3xl">⚙</div>

            <h2 className="text-xl font-semibold text-slate-900">
              Administracija
            </h2>

            <p className="mt-2 text-sm text-slate-600">
              Upravljaj vode in vodnike.
            </p>

            <p className="mt-6 font-medium text-emerald-700">
              Odpri nastavitve →
            </p>
          </Link>
        </div>
      </div>
    </main>
  );
}