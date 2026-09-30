import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { preveriVodnikPin } from "@/lib/verify-vodnik-pin";

const dovoljeneVrste = [
  "Znanje",
  "Zabavno",
  "Ustvarjalno",
  "Povezovalno",
];

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getSrecanje(id: number) {
  return supabaseAdmin
    .from("srecanje")
    .select("id, vodnik_id")
    .eq("id", id)
    .single();
}

function parseId(idParam: string) {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function avtorizirajSrecanje(id: number, pin: string) {
  const { data: srecanje, error } = await getSrecanje(id);

  if (error || !srecanje) {
    return {
      response: NextResponse.json(
        { error: "Srečanje ne obstaja." },
        { status: 404 }
      ),
      srecanje: null,
    };
  }

  const pinPravilen = await preveriVodnikPin(
    srecanje.vodnik_id,
    pin
  );

  if (!pinPravilen) {
    return {
      response: NextResponse.json(
        { error: "Napačen PIN." },
        { status: 403 }
      ),
      srecanje: null,
    };
  }

  return { response: null, srecanje };
}

export async function POST(request: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json(
      { error: "Neveljaven ID srečanja." },
      { status: 400 }
    );
  }

  try {
    const { pin } = await request.json();

    const { response } = await avtorizirajSrecanje(
      id,
      String(pin ?? "")
    );

    if (response) {
      return response;
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Neveljavna zahteva." },
      { status: 400 }
    );
  }
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
    const { pin, datum, vrsta, tema, prisotni, opis, opombe } = body;

    const { response } = await avtorizirajSrecanje(
      id,
      String(pin ?? "")
    );

    if (response) {
      return response;
    }

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

    const { error } = await supabaseAdmin
      .from("srecanje")
      .update({
        datum,
        vrsta,
        tema: tema.trim(),
        prisotni: steviloPrisotnih,
        opis: opis.trim(),
        opombe: opombe?.trim() || null,
      })
      .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Napaka pri shranjevanju sprememb." },
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

export async function DELETE(request: Request, context: RouteContext) {
  const { id: idParam } = await context.params;
  const id = parseId(idParam);

  if (!id) {
    return NextResponse.json(
      { error: "Neveljaven ID srečanja." },
      { status: 400 }
    );
  }

  try {
    const { pin } = await request.json();

    const { response } = await avtorizirajSrecanje(
      id,
      String(pin ?? "")
    );

    if (response) {
      return response;
    }

    const { error } = await supabaseAdmin
      .from("srecanje")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);

      return NextResponse.json(
        { error: "Napaka pri brisanju srečanja." },
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
