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

  const [month, business] = await Promise.allSettled([
    loadMonth(supabase, range, isDemo),
    // Row Level Security returns this login's business and nothing else.
    supabase.from("businesses").select("name").maybeSingle(),
  ]);

  let entries: Entry[] | null = null;
  if (month.status === "fulfilled") entries = month.value;
  else console.error("Couldn't load this month", month.reason);
  // Signed in, but the account has no business: it was deleted (e.g. a demo
  // reset) while this session was still open.
  if (business.status === "fulfilled" && !business.value.error && !business.value.data) {
    redirect("/auth/sign-out");
  }
  const businessName = business.status === "fulfilled" ? (business.value.data?.name ?? null) : null;

  return (
    <Dashboard
      initialEntries={entries}
      initialRange={range}
      isDemo={isDemo}
      businessName={businessName}
    />
  );
}
