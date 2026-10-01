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
      { error: "Neveljaven ID srečanja." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { datum, vrsta, tema, prisotni, opis, opombe } = body;

    if (
      !datum ||
      !vrsta ||
      !tema?.trim() ||
      prisotni === undefined ||
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

    const steviloPrisotnih = Number(prisotni);

    if (
      !Number.isInteger(steviloPrisotnih) ||
      steviloPrisotnih < 0
    ) {
      return NextResponse.json(
        { error: "Neveljavno število prisotnih." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("srecanje")
      .update({
        datum,
        vrsta,
        tema: tema.trim(),
        prisotni: steviloPrisotnih,
        opis: opis.trim(),
        opombe: opombe?.trim() || null,
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Napaka pri shranjevanju sprememb." },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Srečanje ne obstaja." },
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
      { error: "Neveljaven ID srečanja." },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("srecanje")
    .delete()
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Napaka pri brisanju srečanja." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Srečanje ne obstaja." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
