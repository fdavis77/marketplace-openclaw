"use server";

import bcrypt from "bcryptjs";
import { and, eq, gt, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { loginAttempts, users } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/auth/session";

const MAX_FAILURES = 5;
const WINDOW_MINUTES = 15;
// Compared against when the email is unknown, so response time doesn't reveal
// which emails have accounts.
const DUMMY_HASH = "$2b$12$eoHQmLU9aL06l0bWEErfw.zIv/6UvP9bsjLcUj8hGwqcxG/wLCBre";

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200),
});

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password." };
  const { email, password } = parsed.data;

  const since = sql`now() - make_interval(mins => ${WINDOW_MINUTES})`;
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), gt(loginAttempts.attemptedAt, since)));
  if (count >= MAX_FAILURES) {
    return { error: `Too many attempts. Try again in ${WINDOW_MINUTES} minutes.` };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

  if (!user || !ok) {
    await db.insert(loginAttempts).values({ email });
    return { error: "That email and password don't match." };
  }

  await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
  await createSession({ userId: user.id, person: user.person });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
