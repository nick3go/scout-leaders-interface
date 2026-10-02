import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const dovoljeneVrste = [
  "Znanje",
  "Zabavno",
  "Ustvarjalno",
  "Povezovalno",
  "Drugo",
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { vrsta, tema, opis, opombe } = body;

    if (!vrsta || !tema?.trim() || !opis?.trim()) {
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

    const { error } = await supabaseAdmin
      .from("ideja")
      .insert({
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
