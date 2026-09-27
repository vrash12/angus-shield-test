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
  const settings = { password, email_confirm: true, app_metadata: { demo: true } };
  const existing = await findUser(email);
  const { data, error } = existing
    ? await admin.auth.admin.updateUserById(existing.id, settings)
    : await admin.auth.admin.createUser({ email, ...settings });
  if (error) throw error;

  // Start the demo fresh: the app re-seeds the current month on next open.
  const { error: clearError } = await admin.from("transactions").delete().eq("user_id", data.user.id);
  if (clearError) throw clearError;

  console.log(`${existing ? "Reset" : "Created"} demo account ${email}.`);
  console.log("Its current month fills with sample activity when it first opens the dashboard.");
} catch (error) {
  console.error("Couldn't set up the demo account:", error.message ?? error);
  process.exit(1);
}
