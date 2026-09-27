"use client";

import { ArrowDownLeft, ArrowUpRight, CircleCheck, Clock3, TrendingDown } from "lucide-react";
import { displayTotals, formatMoney } from "@/lib/money";
import type { Totals } from "@/lib/transactions";
import { useAnimatedNumber } from "./use-animated-number";

const STATUS = {
  ahead: { label: "In the black", Icon: CircleCheck, tone: "bg-positive-soft text-positive" },
  behind: { label: "Behind this month", Icon: TrendingDown, tone: "bg-negative-soft text-negative" },
  empty: { label: "No jobs yet", Icon: Clock3, tone: "bg-canvas text-muted" },
} as const;

/** Big enough to read at arm's length, small enough to never overflow. */
function fitSize(text: string, sizes: [number, number, number, number]) {
  const px = text.length <= 6 ? sizes[0] : text.length <= 8 ? sizes[1] : text.length <= 10 ? sizes[2] : sizes[3];
  return `min(${px}px, ${(px / 3.75).toFixed(2)}vw)`;
}

export function MonthSummary({ totals, empty }: { totals: Totals; empty: boolean }) {
  // The status always comes from the exact figure; the numbers are as shown.
  const state = empty ? "empty" : totals.profit >= 0 ? "ahead" : "behind";
  const { label, Icon, tone } = STATUS[state];
  const shown = displayTotals(totals.moneyIn, totals.moneyOut);

  return (
    <section
      aria-label="This month’s numbers"
      className="overflow-hidden rounded-[28px] border border-line bg-surface shadow-card"
    >
      <div className="px-6 pt-5 pb-6">
        <Profit cents={shown.profit} />
        <p
          key={state}
          className={`mt-4 inline-flex animate-pop items-center gap-1.5 rounded-full py-1.5 pr-3.5 pl-2.5 text-[15px] font-semibold ${tone}`}
        >
          <Icon className="size-[18px]" strokeWidth={2.25} aria-hidden="true" />
          {label}
        </p>
      </div>

      <dl className="grid grid-cols-2 border-t border-line">
        <Figure label="$ in" cents={shown.moneyIn} direction="in" />
        <Figure label="$ out" cents={shown.moneyOut} direction="out" />
      </dl>
    </section>
  );
}

function Profit({ cents }: { cents: number }) {
  const shown = useAnimatedNumber(cents);
  const final = formatMoney(cents);

  return (
    <>
      <p className="text-[15px] font-medium text-muted">Profit</p>
      <p
        className={`mt-2 leading-none font-semibold tracking-[-0.045em] tabular-nums transition-colors ${
          shown < 0 ? "text-negative" : "text-ink"
        }`}
        style={{ fontSize: fitSize(final, [76, 64, 52, 44]) }}
      >
        <span aria-hidden="true">{formatMoney(shown)}</span>
        <span className="sr-only">{final}</span>
      </p>
    </>
  );
}

function Figure({ label, cents, direction }: { label: string; cents: number; direction: "in" | "out" }) {
  const shown = useAnimatedNumber(cents);
  const final = formatMoney(cents);
  const Icon = direction === "in" ? ArrowDownLeft : ArrowUpRight;

  return (
    <div className={`px-6 py-5 ${direction === "out" ? "border-l border-line" : ""}`}>
      <dt className="flex items-center gap-2 text-[15px] font-medium text-muted">
        <span
          className={`grid size-6 place-items-center rounded-full ${
            direction === "in" ? "bg-positive-soft text-positive" : "bg-canvas text-ink-soft"
          }`}
        >
          <Icon className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
        </span>
        {label}
      </dt>
      <dd
        className="mt-2 font-semibold tracking-[-0.03em] tabular-nums"
        style={{ fontSize: fitSize(final, [28, 25, 21, 18]) }}
      >
        <span aria-hidden="true">{formatMoney(shown)}</span>
        <span className="sr-only">{final}</span>
      </dd>
    </div>
  );
}
