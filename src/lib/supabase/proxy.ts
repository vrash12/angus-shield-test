import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "./config";

/**
 * Refreshes the Supabase session on every page request and keeps people on
 * the right side of the login: signed-out visitors go to /login, signed-in
 * people skip it.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // Headers Supabase asks for when it writes auth cookies (no CDN caching).
  let authHeaders: Record<string, string> = {};
  const { url, key } = supabaseConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        authHeaders = { ...authHeaders, ...headers };
      },
    },
  });

  // Validates (and if needed refreshes) the session. Keep this directly after
  // creating the client.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const onLogin = request.nextUrl.pathname === "/login";

  if (signedIn === onLogin) {
    const target = request.nextUrl.clone();
    target.pathname = signedIn ? "/" : "/login";
    target.search = "";

    const redirect = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    response = redirect;
  }

  for (const [name, value] of Object.entries(authHeaders)) response.headers.set(name, value);
  return response;
}
