import type { SupabaseClient } from "@supabase/supabase-js";
import type { MonthRange } from "./month";

export type Entry = {
  id: string;
  type: "income" | "expense";
  cents: number;
  customer: string | null;
  job: string | null;
  description: string | null;
  createdAt: string;
  /** Shown straight away, still on its way to the database. */
  saving?: boolean;
};

export type Totals = { moneyIn: number; moneyOut: number; profit: number };

type Row = {
  id: string;
  type: "income" | "expense";
  amount: number | string;
  customer: string | null;
  job_name: string | null;
  description: string | null;
  created_at: string;
};

const TIMEOUT_MS = 15_000;

function toEntry(row: Row): Entry {
  return {
    id: row.id,
    type: row.type,
    cents: Math.round(Number(row.amount) * 100),
    customer: row.customer,
    job: row.job_name,
    description: row.description,
    createdAt: row.created_at,
  };
}

export function totalsOf(entries: Entry[]): Totals {
  let moneyIn = 0;
  let moneyOut = 0;
  for (const entry of entries) {
    if (entry.type === "income") moneyIn += entry.cents;
    else moneyOut += entry.cents;
  }
  return { moneyIn, moneyOut, profit: moneyIn - moneyOut };
}

/** Everything in the given month, newest first. */
export async function loadMonth(
  supabase: SupabaseClient,
  range: MonthRange,
  isDemo: boolean,
): Promise<Entry[]> {
  if (isDemo) {
    // Demo account only: make sure this month has sample activity.
    await supabase
      .rpc("ensure_demo_month", { month_start: range.start, month_end: range.end })
      .abortSignal(AbortSignal.timeout(TIMEOUT_MS));
  }

  const { data, error } = await supabase
    .from("transactions")
    .select("id, type, amount, customer, job_name, description, created_at")
    .gte("created_at", range.start)
    .lt("created_at", range.end)
    .order("created_at", { ascending: false })
    .abortSignal(AbortSignal.timeout(TIMEOUT_MS))
    .overrideTypes<Row[], { merge: false }>();

  if (error) throw error;
  return data.map(toEntry);
}

/**
 * Saves a finished job. The id is made on the device, so retrying after a
 * dropped connection can never record the same job twice.
 */
export async function saveJob(supabase: SupabaseClient, entry: Entry): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .insert({
      id: entry.id,
      type: "income",
      amount: (entry.cents / 100).toFixed(2),
      customer: entry.customer,
      job_name: entry.job,
    })
    .abortSignal(AbortSignal.timeout(TIMEOUT_MS));

  // 23505 = this id is already saved: an earlier attempt got through.
  if (error && error.code !== "23505") throw error;
}

export async function removeEntry(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .abortSignal(AbortSignal.timeout(TIMEOUT_MS));

  if (error) throw error;
}

/** A v4 UUID, even outside HTTPS (e.g. testing on a phone over the LAN). */
export function newId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
