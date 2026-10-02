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
    const { vodnik_id, vrsta, tema, opis, opombe } = body;

    if (
      !vodnik_id ||
      !vrsta ||
      !tema?.trim() ||
      !opis?.trim()
    ) {
      return NextResponse.json(
        { error: "Izpolni vsa obvezna polja." },
        { status: 400 }
      );
    }

    if (!dovoljeneVrste.includes(vrsta)) {
      return NextResponse.json(
        { error: "Neveljavna vrsta srečanja." },
        { status: 400 }
      );
    }

    const { data: vodnik, error: vodnikError } =
      await supabaseAdmin
        .from("vodnik")
        .select("id, active")
        .eq("id", Number(vodnik_id))
        .maybeSingle();

    if (vodnikError || !vodnik || !vodnik.active) {
      return NextResponse.json(
        { error: "Izbrani vodnik ne obstaja ali ni aktiven." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("ideja")
      .insert({
        vodnik_id: Number(vodnik_id),
        vrsta,
        tema: tema.trim(),
        opis: opis.trim(),
        opombe: opombe?.trim() || null,
      });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Ideje ni bilo mogoče shraniti." },
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
