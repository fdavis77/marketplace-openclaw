import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { SESSION_COOKIE, verifySessionToken } from "./session-token";

/**
 * The real security boundary. Every page and every server action calls this;
 * the proxy redirect is only a convenience. Also confirms the user still
 * exists, so deleting a login takes effect immediately.
 */
export const requireUser = cache(async () => {
  const jar = await cookies();
  const session = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!session) redirect("/login");

  const [user] = await db
    .select({ id: users.id, name: users.name, person: users.person })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);
  if (!user) redirect("/login");
  return user;
});

export type CurrentUser = Awaited<ReturnType<typeof requireUser>>;
