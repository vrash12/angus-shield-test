import { ShieldCheck } from "lucide-react";

/** The logo, labelled "Site VIP" or, once signed in, the business's name. */
export function Brand({ label = "Site VIP" }: { label?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-ink text-canvas">
        <ShieldCheck className="size-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="truncate text-[17px] font-semibold tracking-tight">{label}</span>
    </div>
  );
}
