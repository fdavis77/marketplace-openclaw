import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./database.types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config";

// Server Component / Server Action / Route Handler client. Reads the
// session from cookies and (where possible) writes refreshed tokens back.
// Session refresh across page navigations is handled by proxy.ts.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component that can't set cookies — the
            // proxy is responsible for refreshing the session in that case.
          }
        },
      },
    }
  );
}
