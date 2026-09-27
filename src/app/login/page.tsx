import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  const demoAvailable = Boolean(process.env.DEMO_EMAIL && process.env.DEMO_PASSWORD);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <header className="box-content flex h-16 items-center pt-[env(safe-area-inset-top)]">
        <Brand />
      </header>

      <div className="flex flex-1 flex-col justify-center py-8">
        <h1 className="text-[2rem] leading-[1.1] font-semibold tracking-[-0.03em] text-balance">
          Know you’re in the black.
        </h1>
        <p className="mt-3 text-[17px] leading-relaxed text-pretty text-muted">
          This month’s money in, money out and profit, on one screen.
        </p>
        <div className="mt-8">
          <LoginForm demoAvailable={demoAvailable} />
        </div>
      </div>
    </main>
  );
}
