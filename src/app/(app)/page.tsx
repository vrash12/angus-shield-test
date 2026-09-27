import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";
import { FALLBACK_TIME_ZONE, isTimeZone, monthRange } from "@/lib/month";
import { createClient } from "@/lib/supabase/server";
import { loadMonth, type Entry } from "@/lib/transactions";

export const metadata: Metadata = { title: "This month" };

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const isDemo = data.claims.app_metadata?.demo === true;

  // The browser stores its time zone after the first visit, so the server
  // renders the right month straight away (the page corrects itself if not).
  const savedZone = (await cookies()).get("tz")?.value;
  const range = monthRange(isTimeZone(savedZone) ? savedZone : FALLBACK_TIME_ZONE);

  let entries: Entry[] | null = null;
  try {
    entries = await loadMonth(supabase, range, isDemo);
  } catch (error) {
    console.error("Couldn't load this month", error);
  }

  return <Dashboard initialEntries={entries} initialRange={range} isDemo={isDemo} />;
}
