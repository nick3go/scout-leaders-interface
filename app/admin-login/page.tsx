"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [napaka, setNapaka] = useState("");
  const [prijavljam, setPrijavljam] = useState(false);

  async function prijava(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNapaka("");
    setPrijavljam(true);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ password }),
    });

    const result = await response.json();
    setPrijavljam(false);

    if (!response.ok) {
      setNapaka(result.error ?? "Prijava ni uspela.");
      return;
    }

    router.replace("/administracija");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-medium text-slate-500">
          ← Domov
        </Link>

        <form
          onSubmit={prijava}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-700">
            Administracija
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Vnesi geslo
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Administracija je zaščitena z enim skupnim geslom.
          </p>

          <label className="mt-6 block text-sm font-semibold text-slate-700">
            Geslo
          </label>

          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-4 outline-none focus:border-emerald-600"
          />

          {napaka && (
            <div className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {napaka}
            </div>
          )}

          <button
            type="submit"
            disabled={prijavljam}
            className="mt-5 w-full rounded-xl bg-emerald-700 px-4 py-4 font-semibold text-white disabled:opacity-50"
          >
            {prijavljam ? "Preverjam ..." : "Odpri administracijo"}
          </button>
        </form>
      </div>
    </main>
  );
}
