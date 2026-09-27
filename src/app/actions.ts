"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error: string | null };

async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error;
}

export async function logIn(_state: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const error = await signIn(email, password);
  if (error?.code === "invalid_credentials") return { error: "That email and password don’t match." };
  if (error) return { error: "Couldn’t log in just now. Try again." };
  redirect("/");
}

export async function logInAsDemo(): Promise<LoginState> {
  const email = process.env.DEMO_EMAIL;
  const password = process.env.DEMO_PASSWORD;
  if (!email || !password) return { error: "The demo account isn’t set up." };

  if (await signIn(email, password)) {
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
