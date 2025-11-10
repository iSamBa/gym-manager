import { createBrowserClient } from "@supabase/ssr";
import { env } from "./env";

/**
 * CLIENT-SIDE Supabase client
 *
 * Use this for:
 * - Client components ("use client")
 * - Browser-side auth operations (signIn, signOut)
 * - Real-time subscriptions
 * - Client-side data fetching
 *
 * DO NOT use this for:
 * - Server components (use createSupabaseServerClient from '@/lib/supabase-server')
 * - API routes (use createSupabaseServerClient from '@/lib/supabase-server')
 * - Middleware (create inline client with @supabase/ssr)
 *
 * This client automatically handles:
 * - Token refresh (every ~55 minutes)
 * - Session persistence in cookies (compatible with middleware)
 * - Session detection from URL (OAuth callbacks)
 */
export const supabase = createBrowserClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
