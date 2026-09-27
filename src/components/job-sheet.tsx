"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type RefObject,
} from "react";
import { CircleAlert, X } from "lucide-react";
import { MAX_PRICE_CENTS, cleanPriceInput, formatMoney, parsePrice } from "@/lib/money";

export type NewJob = { customer: string; job: string; cents: number };
export type JobSheetHandle = { open: () => void };

type Field = "customer" | "job" | "price";
type Errors = Partial<Record<Field, string>>;

const FIELDS: Field[] = ["customer", "job", "price"];

const inputClass =
  "block w-full rounded-xl border border-line bg-canvas px-4 text-ink transition-colors placeholder:text-faint focus:border-ink focus:bg-surface focus:ring-4 focus:ring-ink/10 focus:outline-none aria-invalid:border-negative";

const tidy = (value: string) => value.trim().replace(/\s+/g, " ");

function check(customer: string, job: string, price: string): { errors: Errors } | { job: NewJob } {
  const errors: Errors = {};
  const cents = parsePrice(price);

  if (!tidy(customer)) errors.customer = "Who was the job for?";
  if (!tidy(job)) errors.job = "What was the job?";
  if (cents === null || cents <= 0) errors.price = "Enter a price above $0.";
  else if (cents > MAX_PRICE_CENTS) errors.price = "That’s over $1,000,000. Check the price.";

  if (cents === null || Object.keys(errors).length > 0) return { errors };
  return { job: { customer: tidy(customer), job: tidy(job), cents } };
}

/**
 * Keeps the sheet above the on-screen keyboard. iOS Safari doesn't resize the
 * page for the keyboard, so measure the visual viewport instead.
 */
function useKeyboardInset(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const viewport = window.visualViewport;
    const element = ref.current;
    if (!viewport || !element) return;

    const update = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      element.style.setProperty("--keyboard-inset", `${Math.round(inset)}px`);
      element.style.setProperty("--viewport-height", `${Math.round(viewport.height)}px`);
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
    };
  }, [ref]);
}

export function JobSheet({ ref, onSubmit }: { ref: Ref<JobSheetHandle>; onSubmit: (job: NewJob) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const customerInput = useRef<HTMLInputElement>(null);
  const jobInput = useRef<HTMLInputElement>(null);
  const priceInput = useRef<HTMLInputElement>(null);
  const submitted = useRef(false);
  const submittedAt = useRef(Number.NEGATIVE_INFINITY);
  const pressStartedOnBackdrop = useRef(false);

  const [customer, setCustomer] = useState("");
  const [job, setJob] = useState("");
  const [price, setPrice] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);

  const inputs = { customer: customerInput, job: jobInput, price: priceInput };
  const cents = parsePrice(price);
  const validPrice = cents !== null && cents > 0 && cents <= MAX_PRICE_CENTS;

  useKeyboardInset(dialog);

  useImperativeHandle(
    ref,
    () => ({
      open() {
        const element = dialog.current;
        if (!element || element.open) return;
        // "Add" sits where "Job done" does: the second tap of a double tap
        // on Add must not pop the sheet straight back open.
        if (performance.now() - submittedAt.current < 600) return;
        submitted.current = false;
        setSending(false);
        setErrors({});
        element.showModal();
        // Focusing inside the tap handler lets phones raise the keyboard at once.
        const firstEmpty = [customerInput, jobInput, priceInput].find((input) => !input.current?.value.trim());
        (firstEmpty ?? customerInput).current?.focus();
      },
    }),
    [],
  );

  function close() {
    dialog.current?.close();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitted.current) return; // a double tap must not add the job twice

    const result = check(customer, job, price);
    if ("errors" in result) {
      setErrors(result.errors);
      const first = FIELDS.find((field) => result.errors[field]);
      if (first) inputs[first].current?.focus();
      return;
    }

    submitted.current = true;
    submittedAt.current = performance.now();
    setSending(true);
    close();
    onSubmit(result.job);
    setCustomer("");
    setJob("");
    setPrice("");
  }

  function clearError(field: Field) {
    if (!errors[field]) return;
    setErrors((current) => {
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  // Enter moves to the next field instead of submitting half a job.
  function focusOnEnter(event: KeyboardEvent<HTMLInputElement>, next: RefObject<HTMLInputElement | null>) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault();
      next.current?.focus();
    }
  }

  return (
    <dialog
      ref={dialog}
      aria-labelledby="job-sheet-title"
      className="sheet"
      onPointerDown={(event) => {
        pressStartedOnBackdrop.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressStartedOnBackdrop.current && event.target === event.currentTarget) close();
      }}
    >
      {/* method="post" keeps typed details out of the URL even if the form
          were somehow submitted before the page's JavaScript loaded. */}
      <form
        method="post"
        noValidate
        onSubmit={handleSubmit}
        className="min-h-0 overflow-y-auto overscroll-contain rounded-t-[28px] bg-surface px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:rounded-[28px] sm:pb-6"
      >
        <div className="flex items-center justify-between">
          <h2 id="job-sheet-title" className="text-[22px] font-semibold tracking-tight">
            Job done
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-2 grid size-11 place-items-center rounded-full text-muted transition-colors hover:bg-canvas hover:text-ink"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 space-y-4">
          <Field id="job-customer" label="Customer" error={errors.customer}>
            <input
              ref={customerInput}
              id="job-customer"
              name="customer"
              value={customer}
              onChange={(event) => {
                setCustomer(event.target.value);
                clearError("customer");
              }}
              onKeyDown={(event) => focusOnEnter(event, jobInput)}
              placeholder="e.g. Sarah Mitchell"
              autoComplete="off"
              autoCapitalize="words"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="next"
              maxLength={80}
              aria-invalid={Boolean(errors.customer)}
              aria-describedby={errors.customer ? "job-customer-error" : undefined}
              className={`${inputClass} h-[52px] text-[17px]`}
            />
          </Field>

          <Field id="job-name" label="Job" error={errors.job}>
            <input
              ref={jobInput}
              id="job-name"
              name="job"
              value={job}
              onChange={(event) => {
                setJob(event.target.value);
                clearError("job");
              }}
              onKeyDown={(event) => focusOnEnter(event, priceInput)}
              placeholder="e.g. Hot water system swap"
              autoComplete="off"
              autoCapitalize="sentences"
              enterKeyHint="next"
              maxLength={120}
              aria-invalid={Boolean(errors.job)}
              aria-describedby={errors.job ? "job-name-error" : undefined}
              className={`${inputClass} h-[52px] text-[17px]`}
            />
          </Field>

          <Field id="job-price" label="Price" error={errors.price}>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[22px] font-semibold text-muted"
              >
                $
              </span>
              <input
                ref={priceInput}
                id="job-price"
                name="price"
                value={price}
                onChange={(event) => {
                  setPrice(cleanPriceInput(event.target.value));
                  clearError("price");
                }}
                placeholder="0"
                inputMode="decimal"
                autoComplete="off"
                enterKeyHint="done"
                aria-invalid={Boolean(errors.price)}
                aria-describedby={errors.price ? "job-price-error" : undefined}
                className={`${inputClass} h-14 pl-9 text-[22px] font-semibold tabular-nums`}
              />
            </div>
          </Field>
        </div>

        <button
          type="submit"
          disabled={sending}
          className="mt-6 flex h-14 w-full items-center justify-center rounded-2xl bg-ink text-[17px] font-semibold text-white shadow-cta transition active:scale-[0.985] disabled:opacity-60"
        >
          {validPrice ? `Add ${formatMoney(cents, { exact: true })}` : "Add job"}
        </button>
      </form>
    </dialog>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[15px] font-medium text-ink-soft">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 flex items-center gap-1.5 text-[14px] font-medium text-negative">
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
