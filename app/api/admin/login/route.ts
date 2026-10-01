import { NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  preveriAdminGeslo,
  ustvariAdminSessionToken,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (!preveriAdminGeslo(String(password ?? ""))) {
      return NextResponse.json(
        { error: "Napačno geslo." },
        { status: 401 }
      );
    }

    const response = NextResponse.json({ success: true });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: ustvariAdminSessionToken(),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Neveljavna zahteva." },
      { status: 400 }
    );
  }
}
