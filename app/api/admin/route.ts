import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  ADMIN_COOKIE_NAME,
  preveriAdminSessionToken,
} from "@/lib/admin-auth";

type AdminBody = {
  entity?: "vod" | "vodnik";
  action?: "create" | "update";
  id?: number;
  name?: string;
  vod_id?: number;
  active?: boolean;
};

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!preveriAdminSessionToken(token)) {
    return NextResponse.json(
      { error: "Za administracijo se moraš prijaviti." },
      { status: 401 }
    );
  }

  try {
    const body = (await request.json()) as AdminBody;
    const { entity, action } = body;

    if (entity === "vod" && action === "create") {
      const name = cleanName(body.name);

      if (!name) {
        return NextResponse.json(
          { error: "Vnesi ime voda." },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("vod")
        .insert({ name, active: true })
        .select("id, name, active")
        .single();

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Voda ni bilo mogoče dodati." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    if (entity === "vod" && action === "update") {
      const id = Number(body.id);
      const name = cleanName(body.name);

      if (!Number.isInteger(id) || id < 1 || !name) {
        return NextResponse.json(
          { error: "Neveljavni podatki za vod." },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("vod")
        .update({
          name,
          active: body.active !== false,
        })
        .eq("id", id)
        .select("id, name, active")
        .maybeSingle();

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Voda ni bilo mogoče posodobiti." },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "Vod ne obstaja." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    if (entity === "vodnik" && action === "create") {
      const name = cleanName(body.name);
      const vodId = Number(body.vod_id);

      if (!name || !Number.isInteger(vodId) || vodId < 1) {
        return NextResponse.json(
          { error: "Vnesi ime vodnika in izberi vod." },
          { status: 400 }
        );
      }

      const { data: vod, error: vodError } = await supabaseAdmin
        .from("vod")
        .select("id")
        .eq("id", vodId)
        .maybeSingle();

      if (vodError || !vod) {
        return NextResponse.json(
          { error: "Izbrani vod ne obstaja." },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("vodnik")
        .insert({
          name,
          vod_id: vodId,
          active: true,
        })
        .select("id, name, vod_id, active")
        .single();

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Vodnika ni bilo mogoče dodati." },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    if (entity === "vodnik" && action === "update") {
      const id = Number(body.id);
      const name = cleanName(body.name);
      const vodId = Number(body.vod_id);

      if (
        !Number.isInteger(id) ||
        id < 1 ||
        !name ||
        !Number.isInteger(vodId) ||
        vodId < 1
      ) {
        return NextResponse.json(
          { error: "Neveljavni podatki za vodnika." },
          { status: 400 }
        );
      }

      const { data: vod, error: vodError } = await supabaseAdmin
        .from("vod")
        .select("id")
        .eq("id", vodId)
        .maybeSingle();

      if (vodError || !vod) {
        return NextResponse.json(
          { error: "Izbrani vod ne obstaja." },
          { status: 400 }
        );
      }

      const { data, error } = await supabaseAdmin
        .from("vodnik")
        .update({
          name,
          vod_id: vodId,
          active: body.active !== false,
        })
        .eq("id", id)
        .select("id, name, vod_id, active")
        .maybeSingle();

      if (error) {
        console.error(error);
        return NextResponse.json(
          { error: "Vodnika ni bilo mogoče posodobiti." },
          { status: 500 }
        );
      }

      if (!data) {
        return NextResponse.json(
          { error: "Vodnik ne obstaja." },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data });
    }

    return NextResponse.json(
      { error: "Neveljavna administratorska zahteva." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { error: "Neveljavna zahteva." },
      { status: 400 }
    );
  }
}
