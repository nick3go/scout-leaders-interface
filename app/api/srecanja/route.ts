import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const dovoljeneVrste = [
  "Znanje",
  "Zabavno",
  "Ustvarjalno",
  "Povezovalno",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      vod_id,
      vodnik_id,
      datum,
      vrsta,
      tema,
      prisotni,
      opis,
      opombe,
    } = body;

    if (
      !vod_id ||
      !vodnik_id ||
      !datum ||
      !vrsta ||
      !tema?.trim() ||
      prisotni === undefined ||
      !opis?.trim()
    ) {
      return NextResponse.json(
        { error: "Manjkajo obvezni podatki." },
        { status: 400 }
      );
    }

    if (!dovoljeneVrste.includes(vrsta)) {
      return NextResponse.json(
        { error: "Neveljavna vrsta srečanja." },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(Number(prisotni)) ||
      Number(prisotni) < 0
    ) {
      return NextResponse.json(
        { error: "Neveljavno število prisotnih." },
        { status: 400 }
      );
    }

    const { data: vodnik, error: vodnikError } =
      await supabaseAdmin
        .from("vodnik")
        .select("id, vod_id, active")
        .eq("id", vodnik_id)
        .single();

    if (
      vodnikError ||
      !vodnik ||
      !vodnik.active ||
      vodnik.vod_id !== vod_id
    ) {
      return NextResponse.json(
        { error: "Vodnik in vod se ne ujemata." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("srecanje")
      .insert({
        vod_id,
        vodnik_id,
        datum,
        vrsta,
        tema: tema.trim(),
        prisotni: Number(prisotni),
        opis: opis.trim(),
        opombe: opombe?.trim() || null,
      });

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Napaka pri shranjevanju." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Neveljavna zahteva." },
      { status: 400 }
    );
  }
}