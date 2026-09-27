import { createClient } from "@supabase/supabase-js";
import { FALLBACK_TIME_ZONE, monthRange } from "@/lib/month";
import { supabaseConfig } from "@/lib/supabase/config";

/**
 * Called daily by Vercel Cron (see vercel.json). Free Supabase projects pause
 * after a week without activity; this signs in as the demo account, makes
 * sure its month has data, and keeps the project awake for reviewers.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return Response.json({ ok: false, reason: "No demo account" }, { status: 503 });

  const { url, key } = supabaseConfig();
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) return Response.json({ ok: false, reason: "Demo sign-in failed" }, { status: 502 });

  const range = monthRange(FALLBACK_TIME_ZONE);
  const { data: seeded, error } = await supabase.rpc("ensure_demo_month", {
    month_start: range.start,
    month_end: range.end,
  });
  // Local scope: only this session ends, reviewers stay signed in.
  await supabase.auth.signOut({ scope: "local" });

  if (error) return Response.json({ ok: false, reason: "Database unavailable" }, { status: 502 });
  return Response.json({ ok: true, seeded });
}
