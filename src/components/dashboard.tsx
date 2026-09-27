"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle, LogOut, RotateCcw } from "lucide-react";
import { logOut } from "@/app/actions";
import { formatMoney } from "@/lib/money";
import { browserTimeZone, monthRange, type MonthRange } from "@/lib/month";
import { createClient } from "@/lib/supabase/client";
import { loadMonth, newId, removeEntry, saveJob, totalsOf, type Entry } from "@/lib/transactions";
import { Brand } from "./brand";
import { JobSheet, type JobSheetHandle, type NewJob } from "./job-sheet";
import { Latest } from "./latest";
import { MonthSummary } from "./month-summary";
import { ToastView, type Toast, type ToastAction } from "./toast";

type Props = {
  /** null when the server couldn't load the month; the page retries itself. */
  initialEntries: Entry[] | null;
  initialRange: MonthRange;
  isDemo: boolean;
  businessName: string | null;
};

/** Coming back to the app after this long refreshes the numbers. */
const STALE_AFTER_MS = 60_000;

const newestFirst = (a: Entry, b: Entry) => Date.parse(b.createdAt) - Date.parse(a.createdAt);

export function Dashboard({ initialEntries, initialRange, isDemo, businessName }: Props) {
  const [supabase] = useState(createClient);
  const [range, setRange] = useState(initialRange);
  const [entries, setEntries] = useState(initialEntries);
  const [retrying, setRetrying] = useState(initialEntries === null);
  const [toast, setToast] = useState<Toast | null>(null);

  const sheet = useRef<JobSheetHandle>(null);
  const saves = useRef(new Map<string, Promise<boolean>>());
  const undone = useRef(new Set<string>());
  const loadedAt = useRef(0);
  const toastCount = useRef(0);

  const totals = useMemo(() => totalsOf(entries ?? []), [entries]);

  const showToast = useCallback((next: Omit<Toast, "key">) => {
    toastCount.current += 1;
    setToast({ ...next, key: toastCount.current });
  }, []);

  /** Reloads this month quietly, keeping anything still being saved. */
  const reload = useCallback(async () => {
    const next = monthRange(browserTimeZone());
    try {
      const fresh = await loadMonth(supabase, next, isDemo);
      const skip = new Set(undone.current);
      loadedAt.current = Date.now();
      setRange(next);
      setEntries((current) => {
        const freshIds = new Set(fresh.map((entry) => entry.id));
        const stillSaving = (current ?? []).filter((entry) => entry.saving && !freshIds.has(entry.id));
        return [...stillSaving, ...fresh.filter((entry) => !skip.has(entry.id))];
      });
    } catch {
      // Keep what's on screen. If there's nothing, the card offers a retry.
    }
  }, [supabase, isDemo]);

  useEffect(() => {
    // Remember this device's time zone so the server can render the right
    // month next time; reload now if the server guessed a different month.
    const zone = browserTimeZone();
    document.cookie = `tz=${zone}; path=/; max-age=31536000; samesite=lax`;
    loadedAt.current = Date.now();

    // Deferred a tick so the server-rendered numbers paint first.
    const needsReload = initialEntries === null || monthRange(zone).start !== initialRange.start;
    const timer = needsReload
      ? window.setTimeout(() => void reload().then(() => setRetrying(false)), 0)
      : undefined;

    const onVisible = () => {
      if (document.visibilityState === "visible" && Date.now() - loadedAt.current > STALE_AFTER_MS) {
        void reload();
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [initialEntries, initialRange.start, reload]);

  useEffect(() => {
    // Confirmations fade on their own; a failed save waits for the person.
    if (!toast || toast.action?.type === "retry") return;
    const timer = window.setTimeout(() => setToast(null), toast.action ? 8000 : 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function addJob(job: NewJob, id = newId()) {
    const entry: Entry = {
      id,
      type: "income",
      cents: job.cents,
      customer: job.customer,
      job: job.job,
      description: null,
      createdAt: new Date().toISOString(),
      saving: true,
    };
    const backInBlack = entries !== null && totals.profit < 0 && totals.profit + job.cents >= 0;

    // Show it straight away; the database catches up in the background.
    undone.current.delete(id);
    setEntries((current) => current && [entry, ...current.filter((existing) => existing.id !== id)]);
    showToast({
      tone: "success",
      title: backInBlack ? "Back in the black" : "Job added",
      detail: `${formatMoney(job.cents, { exact: true })} · ${job.job}`,
      action: { type: "undo", id },
    });

    const save = saveJob(supabase, entry).then(
      () => {
        setEntries((current) =>
          current && current.map((existing) => (existing.id === id ? { ...existing, saving: false } : existing)),
        );
        if (entries === null) void reload();
        return true;
      },
      () => {
        setEntries((current) => current && current.filter((existing) => existing.id !== id));
        if (!undone.current.has(id)) {
          showToast({
            tone: "error",
            title: "Job not saved",
            detail: "Check your signal, then retry.",
            action: { type: "retry", id, job },
          });
        }
        return false;
      },
    );
    saves.current.set(id, save);
  }

  async function undo(id: string) {
    const entry = entries?.find((existing) => existing.id === id);
    if (!entry) return;

    undone.current.add(id);
    setEntries((current) => current && current.filter((existing) => existing.id !== id));
    showToast({ tone: "neutral", title: "Job removed" });

    const saved = await saves.current.get(id);
    if (!saved) return; // it never reached the database

    try {
      await removeEntry(supabase, id);
    } catch {
      undone.current.delete(id);
      setEntries((current) => current && [{ ...entry, saving: false }, ...current].sort(newestFirst));
      showToast({
        tone: "error",
        title: "Couldn’t undo",
        detail: "It still counts. Check your signal and try again.",
        action: { type: "undo", id },
      });
    }
  }

  function runToastAction(action: ToastAction) {
    if (action.type === "undo") void undo(action.id);
    else addJob(action.job, action.id);
  }

  async function retry() {
    setRetrying(true);
    await reload();
    setRetrying(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5">
      <header className="box-content flex h-16 shrink-0 items-center justify-between gap-3 pt-[env(safe-area-inset-top)]">
        <Brand label={businessName ?? undefined} />
        <div className="-mr-2 flex shrink-0 items-center gap-1">
          {isDemo && (
            <span className="rounded-full border border-line bg-surface px-2.5 py-0.5 text-[14px] font-medium text-ink-soft">
              Demo
            </span>
          )}
          <form action={logOut}>
            <LogOutButton />
          </form>
        </div>
      </header>

      <main className="flex-1 pb-48">
        <div className="mt-2 flex items-baseline justify-between px-1">
          <h1 className="text-[17px] font-semibold tracking-tight">This month</h1>
          <p className="text-[15px] text-muted">{range.label}</p>
        </div>

        <div className="mt-3">
          {entries ? (
            <MonthSummary totals={totals} empty={entries.length === 0} />
          ) : (
            <LoadProblem retrying={retrying} onRetry={retry} />
          )}
        </div>

        {entries && <Latest entries={entries} timeZone={range.timeZone} />}
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-10">
        <div className="pointer-events-auto mx-auto max-w-md bg-linear-to-t from-canvas from-60% to-transparent px-5 pt-8 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div aria-live="polite" aria-atomic="true">
            {toast && (
              <ToastView key={toast.key} toast={toast} onAction={runToastAction} onDismiss={() => setToast(null)} />
            )}
          </div>
          <button
            type="button"
            onClick={() => sheet.current?.open()}
            className="flex h-16 w-full items-center justify-center gap-2.5 rounded-2xl bg-ink text-[18px] font-semibold text-white shadow-cta transition active:scale-[0.985]"
          >
            <Check className="size-[22px]" strokeWidth={2.75} aria-hidden="true" />
            Job done
          </button>
        </div>
      </div>

      <JobSheet ref={sheet} onSubmit={addJob} />
    </div>
  );
}

function LogOutButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Log out"
      title="Log out"
      className="grid size-11 place-items-center rounded-full text-ink-soft transition-colors hover:bg-black/5 active:bg-black/10 disabled:opacity-50"
    >
      {pending ? (
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-5" aria-hidden="true" />
      )}
    </button>
  );
}

function LoadProblem({ retrying, onRetry }: { retrying: boolean; onRetry: () => void }) {
  return (
    <div className="rounded-[28px] border border-line bg-surface px-6 py-7">
      <p className="font-semibold">{retrying ? "Loading this month…" : "Couldn’t load this month"}</p>
      <p className="mt-1 text-[15px] text-muted">
        {retrying ? "Just a moment." : "Check your signal and try again."}
      </p>
      <button
        type="button"
        onClick={onRetry}
        disabled={retrying}
        className="mt-5 inline-flex h-12 items-center gap-2 rounded-xl border border-line px-4 font-semibold transition-colors hover:border-ink/30 disabled:opacity-60"
      >
        {retrying ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <RotateCcw className="size-4" aria-hidden="true" />
        )}
        Try again
      </button>
    </div>
  );
}
