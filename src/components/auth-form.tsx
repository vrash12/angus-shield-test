"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { logInAsDemo, type LoginState } from "@/app/actions";
import { MIN_PASSWORD_LENGTH, isBreachedPassword, passwordProblem } from "@/lib/password";
import { createClient } from "@/lib/supabase/client";

type Mode = "login" | "signup";

const idle: LoginState = { error: null };

const inputClass =
  "block h-[52px] w-full rounded-xl border border-line bg-surface px-4 text-[17px] text-ink transition-colors placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/10 focus:outline-none";

const labelClass = "mb-1.5 block text-[15px] font-medium text-ink-soft";

function authMessage(error: AuthError, mode: Mode): string {
  if (error.status === 429 || error.code?.startsWith("over_")) {
    return "Too many attempts. Wait a few minutes, then try again.";
  }
  switch (error.code) {
    case "invalid_credentials":
      return "That email and password don’t match.";
    case "user_already_exists":
    case "email_exists":
      return "There’s already an account with that email. Log in instead.";
    case "weak_password":
      return `Use at least ${MIN_PASSWORD_LENGTH} characters, with letters and a number.`;
    case "email_address_invalid":
    case "validation_failed":
      return "Check the email address.";
    case "signup_disabled":
      return "New accounts are paused right now.";
  }
  if (error.name === "AuthRetryableFetchError") return "Couldn’t reach Site VIP. Check your connection.";
  return mode === "signup" ? "Couldn’t create your account just now. Try again." : "Couldn’t log in just now. Try again.";
}

export function AuthForm({ demoAvailable }: { demoAvailable: boolean }) {
  const router = useRouter();
  const [demo, demoAction, openingDemo] = useActionState(logInAsDemo, idle);
  const [mode, setMode] = useState<Mode>("login");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = submitting || openingDemo;
  const signingUp = mode === "signup";

  function switchMode() {
    setMode(signingUp ? "login" : "signup");
    setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const cleanEmail = email.trim();
    const cleanName = businessName.trim();
    if (signingUp && !cleanName) return setError("Enter your business name.");
    if (!cleanEmail || !password) return setError("Enter your email and password.");
    const problem = signingUp ? passwordProblem(password) : null;
    if (problem) return setError(problem);

    setError(null);
    setSubmitting(true);

    if (signingUp && (await isBreachedPassword(password))) {
      setSubmitting(false);
      return setError("That password has appeared in a data breach. Choose another.");
    }

    // Straight from the phone to Supabase Auth: the password never passes
    // through our server, and Auth's per-device rate limits apply.
    const supabase = createClient();
    const { data, error: authError } = signingUp
      ? await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { business_name: cleanName } },
        })
      : await supabase.auth.signInWithPassword({ email: cleanEmail, password });

    if (authError || !data.session) {
      setSubmitting(false);
      return setError(authError ? authMessage(authError, mode) : "Check your email to confirm your account.");
    }

    // Stay busy until the dashboard takes over.
    router.replace("/");
    router.refresh();
  }

  return (
    <div>
      <form onSubmit={submit} noValidate className="space-y-4">
        {signingUp && (
          <div>
            <label htmlFor="business" className={labelClass}>
              Business name
            </label>
            <input
              id="business"
              name="business"
              autoComplete="organization"
              autoCapitalize="words"
              maxLength={80}
              required
              value={businessName}
              onChange={(event) => setBusinessName(event.target.value)}
              className={inputClass}
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete={signingUp ? "email" : "username"}
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className={labelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={signingUp ? "new-password" : "current-password"}
              minLength={signingUp ? MIN_PASSWORD_LENGTH : undefined}
              aria-describedby={signingUp ? "password-hint" : undefined}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={`${inputClass} pr-14`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((shown) => !shown)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-1 my-auto grid size-11 place-items-center rounded-lg text-muted transition-colors hover:text-ink"
            >
              {showPassword ? (
                <EyeOff className="size-5" aria-hidden="true" />
              ) : (
                <Eye className="size-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {signingUp && (
            <p id="password-hint" className="mt-1.5 text-[14px] text-muted">
              At least {MIN_PASSWORD_LENGTH} characters, with letters and a number.
            </p>
          )}
        </div>

        {error && <FormError message={error} />}

        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[17px] font-semibold text-white shadow-cta transition active:scale-[0.985] disabled:opacity-60"
        >
          {submitting && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {signingUp
            ? submitting
              ? "Creating your account…"
              : "Create account"
            : submitting
              ? "Logging in…"
              : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-center text-[15px] text-muted">
        {signingUp ? "Already have an account?" : "New to Site VIP?"}{" "}
        <button
          type="button"
          onClick={switchMode}
          disabled={busy}
          className="-my-2 inline-flex min-h-11 items-center rounded-md px-1 font-semibold text-ink underline-offset-4 hover:underline"
        >
          {signingUp ? "Log in" : "Create an account"}
        </button>
      </p>

      {demoAvailable && !signingUp && (
        <>
          <div className="my-6 flex items-center gap-3 text-[14px] text-muted" aria-hidden="true">
            <span className="h-px flex-1 bg-line" />
            or
            <span className="h-px flex-1 bg-line" />
          </div>

          <form action={demoAction}>
            <button
              type="submit"
              disabled={busy}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-[17px] font-semibold text-ink transition hover:border-ink/30 active:scale-[0.985] disabled:opacity-60"
            >
              {openingDemo ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
              ) : null}
              {openingDemo ? "Opening the demo…" : "Use demo account"}
              {!openingDemo && <ArrowRight className="size-5" aria-hidden="true" />}
            </button>
            {demo.error && <FormError message={demo.error} />}
          </form>
          <p className="mt-3 text-center text-[14px] text-muted">
            A sample plumbing business. No sign-up.
          </p>
        </>
      )}
    </div>
  );
}

function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-3 flex items-start gap-2 text-[15px] font-medium text-negative">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
