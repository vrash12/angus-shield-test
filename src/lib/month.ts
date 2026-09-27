// "This month" is the calendar month where the person is, not where the
// server is. Month boundaries are worked out in their time zone and sent to
// the database as exact UTC instants.

export const FALLBACK_TIME_ZONE = "Australia/Sydney";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_MS = 86_400_000;

export type MonthRange = {
  /** First instant of the month (inclusive), ISO 8601 UTC. */
  start: string;
  /** First instant of next month (exclusive), ISO 8601 UTC. */
  end: string;
  /** e.g. "September" */
  label: string;
  timeZone: string;
};

export function isTimeZone(value: string | undefined): value is string {
  if (!value) return false;
  try {
    new Intl.DateTimeFormat("en-AU", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export function browserTimeZone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isTimeZone(zone) ? zone : FALLBACK_TIME_ZONE;
}

/** Wall-clock date and time of an instant in a time zone. */
function wallClock(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/** The instant a month begins (midnight on the 1st) in a time zone. DST-safe. */
function startOfMonth(year: number, month: number, timeZone: string): Date {
  const target = Date.UTC(year, month - 1, 1);
  let guess = target;
  // Two passes settle the zone's offset, including across daylight saving.
  for (let pass = 0; pass < 2; pass++) {
    const wall = wallClock(new Date(guess), timeZone);
    guess += target - Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  }
  return new Date(guess);
}

export function monthRange(timeZone: string, now = new Date()): MonthRange {
  const { year, month } = wallClock(now, timeZone);
  return {
    start: startOfMonth(year, month, timeZone).toISOString(),
    end: startOfMonth(year, month + 1, timeZone).toISOString(),
    label: MONTHS[month - 1],
    timeZone,
  };
}

/** "Today", "Yesterday", a weekday this week, else "12 Sep". */
export function dayLabel(iso: string, timeZone: string, now = new Date()): string {
  const then = wallClock(new Date(iso), timeZone);
  const today = wallClock(now, timeZone);
  const thenDay = Date.UTC(then.year, then.month - 1, then.day);
  const days = Math.round((Date.UTC(today.year, today.month - 1, today.day) - thenDay) / DAY_MS);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return WEEKDAYS[new Date(thenDay).getUTCDay()];
  return `${then.day} ${MONTHS[then.month - 1].slice(0, 3)}`;
}
