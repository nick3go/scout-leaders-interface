import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

const dovoljeneVrste = [
  "Znanje",
  "Zabavno",
  "Ustvarjalno",
  "Povezovalno",
];

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
      { error: "Neveljaven ID ideje." },
      { status: 400 }
    );
  }

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
        .select("id")
        .eq("id", Number(vodnik_id))
        .maybeSingle();

    if (vodnikError || !vodnik) {
      return NextResponse.json(
        { error: "Izbrani vodnik ne obstaja." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("ideja")
      .update({
        vodnik_id: Number(vodnik_id),
        vrsta,
        tema: tema.trim(),
        opis: opis.trim(),
        opombe: opombe?.trim() || null,
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
        { error: "Ideja ne obstaja." },
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
      { error: "Neveljaven ID ideje." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("ideja")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Ideje ni bilo mogoče izbrisati." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Ideja ne obstaja." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
