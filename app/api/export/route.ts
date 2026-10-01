import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

function csvPolje(value: unknown) {
  const text = String(value ?? "").replace(/"/g, '""');
  return `"${text}"`;
}

export async function GET() {
  const [
    { data: srecanja, error: srecanjaError },
    { data: vodniki, error: vodnikiError },
    { data: vodi, error: vodiError },
  ] = await Promise.all([
    supabaseAdmin
      .from("srecanje")
      .select(
        "id, vod_id, vodnik_id, datum, vrsta, tema, prisotni, opis, opombe"
      )
      .order("datum", { ascending: true })
      .order("id", { ascending: true }),
    supabaseAdmin.from("vodnik").select("id, name"),
    supabaseAdmin.from("vod").select("id, name"),
  ]);

  const error = srecanjaError || vodnikiError || vodiError;

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Izvoza ni bilo mogoče pripraviti." },
      { status: 500 }
    );
  }

  const vodnikIme = new Map(
    (vodniki ?? []).map((vodnik) => [vodnik.id, vodnik.name])
  );

  const vodIme = new Map(
    (vodi ?? []).map((vod) => [vod.id, vod.name])
  );

  const vrstice = [
    [
      "Datum",
      "Vod",
      "Vodnik",
      "Vrsta srečanja",
      "Tema",
      "Število prisotnih",
      "Opis",
      "Opombe",
    ],
    ...(srecanja ?? []).map((srecanje) => [
      srecanje.datum,
      vodIme.get(srecanje.vod_id) ?? "",
      vodnikIme.get(srecanje.vodnik_id) ?? "",
      srecanje.vrsta,
      srecanje.tema,
      srecanje.prisotni,
      srecanje.opis,
      srecanje.opombe ?? "",
    ]),
  ];

  const csv =
    "\uFEFF" +
    vrstice
      .map((vrstica) => vrstica.map(csvPolje).join(","))
      .join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'attachment; filename="vodova-srecanja.csv"',
    },
  });
}
