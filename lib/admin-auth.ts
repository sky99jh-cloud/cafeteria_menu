import { createHash } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_token";

export function getTokenHash(): string {
  const password = process.env.ADMIN_PASSWORD ?? "";
  return createHash("sha256").update(password).digest("hex");
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return token === getTokenHash();
}
