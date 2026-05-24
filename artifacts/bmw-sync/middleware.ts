import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function resolveCredentials(): { url: string; key: string } | null {
  let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  if (url.startsWith("eyJ") && key.startsWith("https://")) {
    [url, key] = [key, url];
  }

  if (!url.startsWith("https://")) return null;

  return { url, key };
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const creds = resolveCredentials();

  if (!creds) {
    return supabaseResponse;
  }

  const { url, key } = creds;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>,
      ) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(
            name,
            value,
            options as Parameters<typeof supabaseResponse.cookies.set>[2],
          ),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const ADMIN_EMAIL = "biaframight@gmail.com";
  const pathname = request.nextUrl.pathname;
  const isDashboard = pathname.startsWith("/dashboard");
  const isAdmin = pathname.startsWith("/admin");
  const isLogin = pathname.startsWith("/login");

  if (!user && (isDashboard || isAdmin)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // Non-admin user trying to access /admin → back to dashboard
  if (user && isAdmin && user.email !== ADMIN_EMAIL) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  if (user && isLogin) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/admin", "/login"],
};
