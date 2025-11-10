import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "./env";

/**
 * Creates a Supabase client for server-side usage
 *
 * Use this for:
 * - Server components
 * - API routes
 * - Middleware (use inline creation instead)
 *
 * This client properly handles cookies for session management
 * and ensures server-side session validation.
 *
 * @returns A Supabase client configured for server-side operations
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );
}
