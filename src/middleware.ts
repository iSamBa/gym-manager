import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware for server-side authentication
 *
 * Validates Supabase session on every request to protected routes.
 * Redirects unauthenticated users to /login with redirect parameter.
 *
 * Security improvements:
 * - Server-side JWT validation with getUser() (validates token with Supabase servers)
 * - Proper cookie handling pattern (setAll updates both request and response)
 * - Cookie-based session (more secure than localStorage)
 * - No flash of protected content before redirect
 * - Automatic token refresh handling
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public routes (no auth required)
  const publicRoutes = ["/login"];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname === "/";

  // Allow public routes without auth check
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Response object that will be recreated when cookies are set
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Create Supabase client for server-side auth check
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // IMPORTANT: Set cookies on request first (for immediate reads in this request)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          // CRITICAL: Recreate response with updated request
          // This ensures server components receive the refreshed cookies
          supabaseResponse = NextResponse.next({
            request,
          });

          // Set cookies on response (for browser to receive)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if user is authenticated - IMPORTANT: Use getUser() not getSession()
  // getUser() validates the token with Supabase servers, getSession() just reads cookies
  // This call may also trigger token refresh via the setAll callback above
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // If no user or error, redirect to login with original path preserved
  if (error || !user) {
    const redirectUrl = new URL("/login", request.url);
    // Preserve current path for redirect after login
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated, return response with potentially refreshed cookies
  return supabaseResponse;
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
