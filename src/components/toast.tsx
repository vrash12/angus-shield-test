import { Check, CircleAlert, Undo2, X } from "lucide-react";
import type { NewJob } from "./job-sheet";

export type ToastAction = { type: "undo"; id: string } | { type: "retry"; id: string; job: NewJob };

export type Toast = {
  key: number;
  tone: "success" | "error" | "neutral";
  title: string;
  detail?: string;
  action?: ToastAction;
};

const ICONS = {
  success: { Icon: Check, tone: "bg-positive" },
  error: { Icon: CircleAlert, tone: "bg-negative" },
  neutral: { Icon: Undo2, tone: "bg-white/15" },
};

export function ToastView({
  toast,
  onAction,
  onDismiss,
}: {
  toast: Toast;
  onAction: (action: ToastAction) => void;
  onDismiss: () => void;
}) {
  const { Icon, tone } = ICONS[toast.tone];
  const { action } = toast;

  return (
    <div className="mb-3 flex animate-rise items-center gap-3 rounded-2xl bg-ink py-2 pr-2 pl-3 text-white shadow-float">
      <span className={`grid size-8 shrink-0 place-items-center rounded-full ${tone}`}>
        <Icon className="size-4" strokeWidth={2.75} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 py-1">
        <p className="leading-snug font-semibold">{toast.title}</p>
        {toast.detail && (
          <p className={`text-[14px] leading-snug text-white/70 ${toast.tone === "error" ? "" : "truncate"}`}>
            {toast.detail}
          </p>
        )}
      </div>
      {action && (
        <button
          type="button"
          onClick={() => onAction(action)}
          className="h-11 shrink-0 rounded-xl px-3.5 text-[15px] font-semibold transition-colors hover:bg-white/10 focus-visible:outline-white active:bg-white/15"
        >
          {action.type === "undo" ? "Undo" : "Retry"}
        </button>
      )}
      {action?.type === "retry" && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="grid size-11 shrink-0 place-items-center rounded-xl text-white/70 transition-colors hover:bg-white/10 focus-visible:outline-white"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
