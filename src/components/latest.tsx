import { formatMoney } from "@/lib/money";
import { dayLabel } from "@/lib/month";
import type { Entry } from "@/lib/transactions";

/** The last few entries: enough to trust the totals, not enough to manage. */
export function Latest({ entries, timeZone }: { entries: Entry[]; timeZone: string }) {
  if (entries.length === 0) {
    return (
      <div className="mt-6 rounded-[24px] border border-dashed border-line px-6 py-7 text-center">
        <p className="font-semibold">Nothing recorded yet</p>
        <p className="mt-1 text-[15px] text-pretty text-muted">
          Finished a job? Tap Job done and it counts straight away.
        </p>
      </div>
    );
  }

  return (
    <section aria-labelledby="latest-heading" className="mt-7">
      <h2 id="latest-heading" className="px-1 text-[15px] font-medium text-muted">
        Latest
      </h2>
      <ul className="mt-1 divide-y divide-line">
        {entries.slice(0, 3).map((entry) => (
          <Row key={entry.id} entry={entry} timeZone={timeZone} />
        ))}
      </ul>
    </section>
  );
}

function Row({ entry, timeZone }: { entry: Entry; timeZone: string }) {
  const income = entry.type === "income";
  const title = (income ? entry.job : entry.description) ?? (income ? "Job" : "Expense");
  const context = income ? entry.customer : "Expense";

  return (
    <li className={`flex items-center justify-between gap-4 px-1 py-3.5 ${entry.saving ? "animate-rise" : ""}`}>
      <div className="min-w-0">
        <p className="truncate font-medium">{title}</p>
        <p className="truncate text-[14px] text-muted">
          {context} · {entry.saving ? "Saving…" : dayLabel(entry.createdAt, timeZone)}
        </p>
      </div>
      <p className={`shrink-0 font-semibold tabular-nums ${income ? "text-positive" : "text-ink-soft"}`}>
        {income ? "+" : "−"}
        {formatMoney(entry.cents, { exact: true })}
      </p>
    </li>
  );
}
