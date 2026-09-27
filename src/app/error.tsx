"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";
import { Brand } from "@/components/brand";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
      <header className="box-content flex h-16 items-center pt-[env(safe-area-inset-top)]">
        <Brand />
      </header>
      <div className="flex flex-1 flex-col justify-center pb-16">
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-[17px] text-muted">It’s not you. Give it another go.</p>
        <button
          type="button"
          onClick={() => retry()}
          className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink text-[17px] font-semibold text-white shadow-cta transition active:scale-[0.985]"
        >
          <RotateCcw className="size-5" aria-hidden="true" />
          Try again
        </button>
      </div>
    </main>
  );
}
