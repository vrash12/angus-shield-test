"use client";

import { useActionState, useState } from "react";
import { ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { logIn, logInAsDemo, type LoginState } from "@/app/actions";

const idle: LoginState = { error: null };

const inputClass =
  "block h-[52px] w-full rounded-xl border border-line bg-surface px-4 text-[17px] text-ink transition-colors placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/10 focus:outline-none";

export function LoginForm({ demoAvailable }: { demoAvailable: boolean }) {
  const [login, loginAction, loggingIn] = useActionState(logIn, idle);
  const [demo, demoAction, openingDemo] = useActionState(logInAsDemo, idle);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const busy = loggingIn || openingDemo;

  return (
    <div>
      <form action={loginAction} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-[15px] font-medium text-ink-soft">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-[15px] font-medium text-ink-soft">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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
        </div>

        {login.error && <FormError message={login.error} />}

        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[17px] font-semibold text-white shadow-cta transition active:scale-[0.985] disabled:opacity-60"
        >
          {loggingIn && <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />}
          {loggingIn ? "Logging in…" : "Log in"}
        </button>
      </form>

      {demoAvailable && (
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
