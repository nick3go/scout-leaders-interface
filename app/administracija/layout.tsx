import { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE_NAME,
  preveriAdminSessionToken,
} from "@/lib/admin-auth";

export default async function AdministracijaLayout({
  children,
}: {
  children: ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!preveriAdminSessionToken(token)) {
    redirect("/admin-login");
  }

  return children;
}
