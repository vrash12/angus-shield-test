import { Brand } from "@/components/brand";

function Block({ className }: { className: string }) {
  return <div className={`rounded-full bg-line/70 motion-safe:animate-pulse ${className}`} />;
}

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5" aria-busy="true">
      <p className="sr-only" role="status">
        Loading this month
      </p>
      <header className="box-content flex h-16 shrink-0 items-center pt-[env(safe-area-inset-top)]">
        <Brand />
      </header>

      <div className="mt-2 px-1">
        <Block className="h-5 w-28" />
      </div>

      <div className="mt-3 overflow-hidden rounded-[28px] border border-line bg-surface shadow-card">
        <div className="px-6 pt-5 pb-6">
          <Block className="h-4 w-14" />
          <Block className="mt-4 h-14 w-48 rounded-2xl" />
          <Block className="mt-5 h-8 w-36" />
        </div>
        <div className="grid grid-cols-2 border-t border-line">
          <div className="px-6 py-5">
            <Block className="h-4 w-16" />
            <Block className="mt-3 h-7 w-24 rounded-xl" />
          </div>
          <div className="border-l border-line px-6 py-5">
            <Block className="h-4 w-16" />
            <Block className="mt-3 h-7 w-24 rounded-xl" />
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0">
        <div className="mx-auto max-w-md px-5 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="h-16 rounded-2xl bg-ink/90" />
        </div>
      </div>
    </div>
  );
}
