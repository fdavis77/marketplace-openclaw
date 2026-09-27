import { jwtVerify, SignJWT } from "jose";
import type { Person } from "@/lib/domain";

/**
 * Session token signing/verification. Kept free of Next.js imports so the
 * proxy (optimistic redirect) and the server data layer can both use it.
 */

export const SESSION_COOKIE = "ea_session";
export const SESSION_DAYS = 30;

export type SessionPayload = { userId: string; person: Person };

function key() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(key());
}

export async function verifySessionToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (typeof payload.userId !== "string" || typeof payload.person !== "string") return null;
    return { userId: payload.userId, person: payload.person as Person };
  } catch {
    return null;
  }
}
