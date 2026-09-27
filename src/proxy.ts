import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Pages only: skip Next.js assets, icons, the manifest and the keep-alive cron.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|apple-icon|manifest.webmanifest|api/keep-alive).*)",
  ],
};
