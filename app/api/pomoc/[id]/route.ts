import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const dovoljeniTipi = ["Iščem pomoč", "Ponujam pomoč"];
const dovoljeniStatusi = ["Aktivno", "Zaključeno"];

type RouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json(
      { error: "Neveljaven ID oglasa." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { tip, vodnik_id, tema, opis, status } = body;

    if (
      !tip ||
      !vodnik_id ||
      !tema?.trim() ||
      !opis?.trim() ||
      !status
    ) {
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

    if (!dovoljeniStatusi.includes(status)) {
      return NextResponse.json(
        { error: "Neveljaven status oglasa." },
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
        .select("id")
        .eq("id", vodnikId)
        .maybeSingle();

    if (vodnikError || !vodnik) {
      return NextResponse.json(
        { error: "Izbrani vodnik ne obstaja." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("pomoc")
      .update({
        tip,
        vodnik_id: vodnikId,
        tema: tema.trim(),
        opis: opis.trim(),
        status,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(error);
      return NextResponse.json(
        { error: "Sprememb ni bilo mogoče shraniti." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Oglas ne obstaja." },
        { status: 404 }
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

export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json(
      { error: "Neveljaven ID oglasa." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("pomoc")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Oglasa ni bilo mogoče izbrisati." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Oglas ne obstaja." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
