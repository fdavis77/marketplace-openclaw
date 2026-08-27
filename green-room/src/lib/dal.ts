import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";

export type Profile = Tables<"profiles">;

/**
 * Single source of truth for "who is making this request". Memoized per
 * request with React's cache() so it's cheap to call from every Server
 * Component, Server Action, and Route Handler that needs it.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile as Profile | null;
});

/** Redirects to /login if there is no session. Use in pages that require any signed-in member. */
export async function requireUser() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");
  return profile;
}

/** Redirects unless the current user is an admin. Use at the top of every /admin page. */
export async function requireAdmin() {
  const profile = await getCurrentUser();
  if (!profile || profile.role !== "admin") redirect("/");
  return profile;
}

/** Throws instead of redirecting — use inside Server Actions, where a thrown
 * error becomes a caught, user-facing message rather than a silent redirect. */
export async function assertAdmin() {
  const profile = await getCurrentUser();
  if (!profile || profile.role !== "admin") {
    throw new Error("Forbidden: admin access required.");
  }
  return profile;
}

/** Throws instead of redirecting — use inside Server Actions for any signed-in member. */
export async function assertUser() {
  const profile = await getCurrentUser();
  if (!profile) throw new Error("You must be signed in to do that.");
  return profile;
}
