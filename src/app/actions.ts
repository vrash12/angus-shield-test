"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

// Real accounts sign in from the browser (see AuthForm). Only the demo signs
// in here, because its password stays on the server.
export async function logInAsDemo(): Promise<LoginState> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return { error: "The demo account isn’t set up." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "The demo account isn’t available right now. Try again." };
  }
  redirect("/");
}

export async function logOut() {
  const supabase = await createClient();
  // "local" ends this device's session only. Reviewers share the demo
  // account, so logging out here mustn't sign everyone else out.
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
