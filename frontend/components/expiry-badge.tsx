import { cn } from "@/lib/utils";
import type { ExpiryInfo } from "@/lib/types";

function label(info: ExpiryInfo): string {
  if (!info.due_date) return "Nessun dato";
  const d = info.days_until;
  if (d == null) return "Nessun dato";
  if (d < 0) return `Scaduto da ${-d}g`;
  if (d === 0) return "Scade oggi";
  if (d === 1) return "Scade domani";
  return `Tra ${d}g`;
}

const styles: Record<ExpiryInfo["status"], string> = {
  ok: "bg-ok-bg text-ok",
  warning: "bg-warn-bg text-warn",
  critical: "bg-crit-bg text-crit",
  unknown: "bg-slate-100 text-slate-500",
};

export function ExpiryBadge({ info, title }: { info: ExpiryInfo; title?: string }) {
  return (
    <div
      className={cn(
        "inline-flex flex-col rounded-lg px-3 py-2 text-xs font-medium min-w-[110px]",
        styles[info.status]
      )}
    >
      {title && <span className="opacity-70 mb-0.5">{title}</span>}
      <span>{label(info)}</span>
    </div>
  );
}
