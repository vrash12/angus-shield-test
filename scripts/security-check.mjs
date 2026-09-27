// Tries to break the separation between businesses, the way an attacker would:
// straight at the database API with a real login, skipping the app entirely.
//
//   npm run security-check
//
// Creates two throwaway businesses (A and B), runs every attack below as A,
// then deletes both. Needs NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local.
// DEMO_EMAIL and DEMO_PASSWORD add the demo-takeover check.

import { createClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  DEMO_EMAIL: demoEmail,
  DEMO_PASSWORD: demoPassword,
} = process.env;

if (!url || !anonKey || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, serviceKey, noSession);
const client = (headers) => createClient(url, anonKey, headers ? { ...noSession, global: { headers } } : noSession);

const run = Date.now().toString(36);
const password = `Check-${run}-Passw0rd`;
const results = [];

function check(name, passed, detail = "") {
  results.push({ name, passed });
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${passed || !detail ? "" : `  (${detail})`}`);
}

async function makeBusiness(label) {
  const email = `security-check-${label}-${run}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { business_name: `Security check ${label.toUpperCase()}` },
  });
  if (error) throw error;

  const supabase = client();
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw signInError;

  const { data: businessId, error: rpcError } = await supabase.rpc("current_business_id");
  if (rpcError) throw rpcError;

  const rowId = crypto.randomUUID();
  const { error: insertError } = await supabase
    .from("transactions")
    .insert({ id: rowId, type: "income", amount: 1234, customer: `Customer of ${label}`, job_name: "Secret job" });
  if (insertError) throw insertError;

  return { userId: data.user.id, businessId, rowId, supabase, token: session.session.access_token };
}

async function stillThere(id) {
  const { data } = await admin.from("transactions").select("id").eq("id", id);
  return data?.length === 1;
}

const created = [];

try {
  const a = await makeBusiness("a");
  created.push(a);
  const b = await makeBusiness("b");
  created.push(b);

  // A record from yesterday, past the undo window.
  const oldRowId = crypto.randomUUID();
  const { error: oldError } = await admin.from("transactions").insert({
    id: oldRowId,
    user_id: a.userId,
    business_id: a.businessId,
    type: "income",
    amount: 500,
    customer: "Old customer",
    job_name: "Old job",
    created_at: new Date(Date.now() - 86_400_000).toISOString(),
  });
  if (oldError) throw oldError;

  console.log("\nSigned-out visitors");
  const anon = client();
  for (const table of ["transactions", "businesses", "business_members"]) {
    const { data, error } = await anon.from(table).select("*");
    check(`can't read ${table}`, Boolean(error) || data.length === 0, `${data?.length} rows`);
  }
  {
    const { error } = await anon.from("transactions").insert({ type: "income", amount: 1, customer: "x", job_name: "x" });
    check("can't add a transaction", Boolean(error));
  }

  console.log("\nBusiness A trying to reach business B");
  {
    const { data } = await a.supabase.from("transactions").select("id, business_id");
    check("A's list holds only A's records", data.length > 0 && data.every((row) => row.business_id === a.businessId));
  }
  {
    const { data } = await a.supabase.from("transactions").select("*").eq("id", b.rowId);
    check("A can't read B's record by its id", data.length === 0);
  }
  {
    const { data } = await a.supabase.from("transactions").select("*").eq("business_id", b.businessId);
    check("A can't read B's records by business id", data.length === 0);
  }
  {
    const { data } = await a.supabase.from("businesses").select("id");
    check("A sees only its own business", data.length === 1 && data[0].id === a.businessId);
  }
  {
    const { data } = await a.supabase.from("business_members").select("user_id");
    check("A sees only its own membership", data.length === 1 && data[0].user_id === a.userId);
  }
  {
    const { error } = await a.supabase
      .from("transactions")
      .insert({ type: "income", amount: 1, customer: "x", job_name: "x", business_id: b.businessId });
    check("A can't write into B's business", Boolean(error));
  }
  {
    const { error } = await a.supabase
      .from("transactions")
      .insert({ type: "income", amount: 1, customer: "x", job_name: "x", user_id: b.userId });
    check("A can't record an entry as B", Boolean(error));
  }
  {
    const { error } = await a.supabase
      .from("business_members")
      .insert({ business_id: b.businessId, user_id: a.userId });
    check("A can't join B's business", Boolean(error));
  }
  {
    const { data } = await a.supabase.from("businesses").update({ name: "Hacked" }).eq("id", b.businessId).select();
    const { data: after } = await admin.from("businesses").select("name").eq("id", b.businessId).single();
    check("A can't rename B's business", !data?.length && after.name !== "Hacked");
  }
  {
    await a.supabase.from("transactions").delete().eq("id", b.rowId);
    check("A can't delete B's record", await stillThere(b.rowId));
  }
  {
    const payload = JSON.parse(Buffer.from(a.token.split(".")[1], "base64url"));
    const forged = [
      a.token.split(".")[0],
      Buffer.from(JSON.stringify({ ...payload, sub: b.userId })).toString("base64url"),
      a.token.split(".")[2],
    ].join(".");
    const { data, error } = await client({ Authorization: `Bearer ${forged}` }).from("transactions").select("id");
    check("A can't pose as B with an edited login token", Boolean(error) || data.length === 0);
  }

  console.log("\nBusiness A's own records");
  {
    const { error } = await a.supabase
      .from("transactions")
      .insert({ type: "income", amount: 1, customer: "x", job_name: "x", created_at: "2020-01-01T00:00:00Z" });
    check("can't back-date an entry", Boolean(error));
  }
  {
    const { error } = await a.supabase.from("transactions").update({ amount: 1 }).eq("id", a.rowId);
    const { data } = await admin.from("transactions").select("amount").eq("id", a.rowId).single();
    check("can't edit an amount", Boolean(error) && Number(data.amount) === 1234);
  }
  {
    const { error } = await a.supabase.from("transactions").insert({ type: "income", amount: 5_000_000, customer: "x", job_name: "x" });
    check("can't enter an absurd amount", Boolean(error));
  }
  {
    await a.supabase.from("transactions").delete().eq("id", oldRowId);
    check("can't delete a record older than 10 minutes", await stillThere(oldRowId));
  }
  {
    await a.supabase.from("transactions").delete().eq("id", a.rowId);
    check("can undo its own entry straight away (control)", !(await stillThere(a.rowId)));
  }
  {
    const { data } = await a.supabase.rpc("ensure_demo_month", {
      month_start: new Date(Date.now() - 86_400_000).toISOString(),
      month_end: new Date(Date.now() + 86_400_000).toISOString(),
    });
    check("can't trigger demo data on a real account", data === false);
  }

  console.log("\nSign-up and passwords");
  for (const weak of ["password1", "abcdefghijkl", "12345678901"]) {
    const { data, error } = await client().auth.signUp({ email: `weak-${run}-${weak.length}${weak[0]}@example.com`, password: weak });
    check(`server rejects the password "${weak}"`, error?.code === "weak_password", error?.code ?? "accepted");
    if (data?.user) created.push({ userId: data.user.id, businessId: null });
  }

  if (demoEmail && demoPassword) {
    console.log("\nShared demo account");
    const demo = client();
    const { error: demoSignIn } = await demo.auth.signInWithPassword({ email: demoEmail, password: demoPassword });
    if (demoSignIn) {
      check("demo account signs in", false, demoSignIn.message);
    } else {
      const { error } = await demo.auth.updateUser({ password: `Takeover-${run}-9` });
      const { error: stillWorks } = await client().auth.signInWithPassword({ email: demoEmail, password: demoPassword });
      check("a demo user can't change the demo password", Boolean(error) && !stillWorks);
      const { error: emailError } = await demo.auth.updateUser({ email: `takeover-${run}@example.com` });
      check("a demo user can't change the demo email", Boolean(emailError));
      await demo.auth.signOut({ scope: "local" });
    }
  }
} catch (error) {
  check("setup", false, error.message ?? String(error));
} finally {
  for (const { userId } of created) {
    const { data: memberships } = await admin.from("business_members").select("business_id").eq("user_id", userId);
    const businessIds = (memberships ?? []).map((row) => row.business_id);
    if (businessIds.length) await admin.from("businesses").delete().in("id", businessIds);
    await admin.auth.admin.deleteUser(userId);
  }
}

const failed = results.filter((result) => !result.passed).length;
console.log(`\n${results.length - failed} of ${results.length} checks passed.`);
process.exit(failed ? 1 : 0);
