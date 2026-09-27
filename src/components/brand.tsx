import { ShieldCheck } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-8 place-items-center rounded-[10px] bg-ink text-canvas">
        <ShieldCheck className="size-[18px]" strokeWidth={2.25} aria-hidden="true" />
      </span>
      <span className="text-[17px] font-semibold tracking-tight">Site VIP</span>
    </div>
  );
}
