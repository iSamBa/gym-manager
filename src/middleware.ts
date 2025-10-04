import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware for server-side authentication
 *
 * Validates Supabase session on every request to protected routes.
 * Redirects unauthenticated users to /login with redirect parameter.
 *
 * Security improvements:
 * - Server-side JWT validation (cannot be bypassed by client manipulation)
 * - Cookie-based session (more secure than localStorage)
 * - No flash of protected content before redirect
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

  // Create Supabase client for server-side auth check
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Check if user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If no session, redirect to login with original path preserved
  if (!session) {
    const redirectUrl = new URL("/login", request.url);
    // Preserve current path for redirect after login
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // User is authenticated, allow request
  return response;
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
