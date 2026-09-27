import type { NextRequest } from "next/server";
import { contentSecurityPolicy } from "@/lib/csp";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce);

  // Next.js reads the nonce from the request's policy and adds it to its own scripts.
  request.headers.set("x-nonce", nonce);
  request.headers.set("content-security-policy", csp);

  const response = await updateSession(request);
  response.headers.set("content-security-policy", csp);
  return response;
}

export const config = {
  // Pages only: skip Next.js assets, icons, the manifest and the keep-alive cron.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|manifest.webmanifest|api/keep-alive).*)",
  ],
};
