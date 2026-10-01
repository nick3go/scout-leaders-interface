import "server-only";
import { createHash, timingSafeEqual } from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD ?? "";
}

function safeEqual(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

export function preveriAdminGeslo(password: string) {
  const adminPassword = getAdminPassword();

  if (!adminPassword || !password) {
    return false;
  }

  return safeEqual(password, adminPassword);
}

export function ustvariAdminSessionToken() {
  const adminPassword = getAdminPassword();

  if (!adminPassword) {
    return "";
  }

  return createHash("sha256")
    .update(`vodniski-admin-session:${adminPassword}`)
    .digest("hex");
}

export function preveriAdminSessionToken(token: string | undefined) {
  if (!token) {
    return false;
  }

  const expected = ustvariAdminSessionToken();

  if (!expected) {
    return false;
  }

  return safeEqual(token, expected);
}
