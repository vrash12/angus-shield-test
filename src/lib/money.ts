// All money is handled in whole cents so totals never drift.

export const MAX_PRICE_CENTS = 1_000_000_00;

const THOUSANDS = /\B(?=(\d{3})+(?!\d))/g;

/**
 * Formats cents as Australian dollars: 1845000 → "$18,450".
 * Totals drop cents once they pass $100; `exact` always keeps them when
 * they aren't zero (for a single job or expense).
 */
export function formatMoney(cents: number, { exact = false } = {}): string {
  const value = Math.round(cents);
  const abs = Math.abs(value);
  const showCents = abs % 100 !== 0 && (exact || abs < 100_00);
  const dollars = showCents ? Math.floor(abs / 100) : Math.round(abs / 100);

  let text = `$${String(dollars).replace(THOUSANDS, ",")}`;
  if (showCents) text += `.${String(abs % 100).padStart(2, "0")}`;
  return value < 0 ? `−${text}` : text;
}

/**
 * The three dashboard figures, rounded the way they're shown ($100 and up to
 * whole dollars) with profit worked out from the two figures beside it, so
 * what's on screen always adds up. Under a dollar, profit stays exact so its
 * sign is never misleading.
 */
export function displayTotals(moneyIn: number, moneyOut: number) {
  const round = (cents: number) => (Math.abs(cents) >= 100_00 ? Math.round(cents / 100) * 100 : cents);
  const shownIn = round(moneyIn);
  const shownOut = round(moneyOut);
  const exactProfit = moneyIn - moneyOut;
  return {
    moneyIn: shownIn,
    moneyOut: shownOut,
    profit: Math.abs(exactProfit) < 100 ? exactProfit : shownIn - shownOut,
  };
}

/** Keeps a price field to digits and one decimal point with at most two places. */
export function cleanPriceInput(raw: string): string {
  const [whole, ...rest] = raw.replace(/[^\d.]/g, "").split(".");
  const dollars = whole.replace(/^0+(?=\d)/, "").slice(0, 7);
  return rest.length === 0 ? dollars : `${dollars}.${rest.join("").slice(0, 2)}`;
}

/** Reads a typed price as cents, or null if it isn't a number. */
export function parsePrice(input: string): number | null {
  const match = /^(\d*)(?:\.(\d{0,2}))?$/.exec(input.replace(/[\s$,]/g, ""));
  if (!match || (match[1] === "" && !match[2])) return null;
  const cents = Number(match[1] || "0") * 100 + Number((match[2] ?? "").padEnd(2, "0"));
  return Number.isSafeInteger(cents) ? cents : null;
}
