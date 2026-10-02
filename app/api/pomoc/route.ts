import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const dovoljeniTipi = ["Iščem pomoč", "Ponujam pomoč"];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tip, vodnik_id, tema, opis } = body;

    if (!tip || !vodnik_id || !tema?.trim() || !opis?.trim()) {
      return NextResponse.json(
        { error: "Izpolni vsa obvezna polja." },
        { status: 400 }
      );
    }

    if (!dovoljeniTipi.includes(tip)) {
      return NextResponse.json(
        { error: "Neveljaven tip oglasa." },
        { status: 400 }
      );
    }

    const vodnikId = Number(vodnik_id);

    if (!Number.isInteger(vodnikId) || vodnikId < 1) {
      return NextResponse.json(
        { error: "Neveljaven vodnik." },
        { status: 400 }
      );
    }

    const { data: vodnik, error: vodnikError } =
      await supabaseAdmin
        .from("vodnik")
        .select("id, active")
        .eq("id", vodnikId)
        .maybeSingle();

    if (vodnikError || !vodnik || !vodnik.active) {
      return NextResponse.json(
        { error: "Izbrani vodnik ne obstaja ali ni aktiven." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("pomoc")
      .insert({
        tip,
        vodnik_id: vodnikId,
        tema: tema.trim(),
        opis: opis.trim(),
        status: "Aktivno",
      });

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Oglasa ni bilo mogoče shraniti." },
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
