// Creates the demo account (or resets it if it already exists).
//
//   npm run seed
//
// Reads NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_EMAIL and
// DEMO_PASSWORD from .env.local. The account is created already confirmed, so
// nobody waits for an email. Its current month fills with sample activity the
// first time it opens the dashboard (see ensure_demo_month in the migration).

import { createClient } from "@supabase/supabase-js";

const {
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  DEMO_EMAIL: email,
  DEMO_PASSWORD: password,
} = process.env;

if (!url || !serviceKey || !email || !password) {
  console.error(
    "Missing settings. Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_EMAIL and DEMO_PASSWORD in .env.local.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function findUser(address) {
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === address.toLowerCase());
    if (match || data.users.length < perPage) return match ?? null;
  }
}

try {
  // The demo account can't be edited (see protect_demo_account), so a reset
  // removes it, with its business and entries, and creates it again.
  const existing = await findUser(email);
  if (existing) {
    const { data: memberships, error: membershipError } = await admin
      .from("business_members")
      .select("business_id")
      .eq("user_id", existing.id);
    if (membershipError) throw membershipError;

    const businessIds = memberships.map((row) => row.business_id);
    if (businessIds.length) {
      const { error: businessError } = await admin.from("businesses").delete().in("id", businessIds);
      if (businessError) throw businessError;
    }
    const { error: deleteError } = await admin.auth.admin.deleteUser(existing.id);
    if (deleteError) throw deleteError;
  }

  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { demo: true },
    user_metadata: { business_name: "Demo Plumbing" },
  });
  if (error) throw error;

  console.log(`${existing ? "Reset" : "Created"} demo account ${email}.`);
  console.log("Its current month fills with sample activity when it first opens the dashboard.");
} catch (error) {
  console.error("Couldn't set up the demo account:", error.message ?? error);
  process.exit(1);
}
