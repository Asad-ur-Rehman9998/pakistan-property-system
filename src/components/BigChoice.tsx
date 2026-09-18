import { cn } from "@/lib/cn";

export function BigChoice({
  selected,
  onClick,
  title,
  hint,
  icon,
}: {
  selected?: boolean;
  onClick: () => void;
  title: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected ?? false}
      className={cn(
        "flex w-full min-h-[4.25rem] items-center gap-3 rounded-[var(--radius)] border px-4 py-3 text-start",
        selected
          ? "border-[var(--green)] bg-[var(--green-soft)]"
          : "border-[var(--line)] bg-[var(--paper-2)]",
      )}
    >
      {icon ? (
        <span className={cn("rural-hide-icon shrink-0 text-[var(--green-deep)]", selected && "text-[var(--green)]")}>{icon}</span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-base font-semibold leading-snug">{title}</span>
        {hint ? <span className="mt-0.5 block text-sm leading-snug text-[var(--muted)]">{hint}</span> : null}
      </span>
    </button>
  );
}

export function TriButtons({
  value,
  onChange,
  yes,
  no,
  unsure,
}: {
  value?: string;
  onChange: (v: "yes" | "no" | "unsure") => void;
  yes: string;
  no: string;
  unsure: string;
}) {
  const btn = (id: "yes" | "no" | "unsure", label: string, tone: string) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      aria-pressed={value === id}
      className={cn(
        "min-h-12 flex-1 rounded-[var(--radius)] border px-2 text-sm font-semibold",
        value === id ? tone : "border-[var(--line)] bg-[var(--paper-2)]",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="flex gap-2" role="group">
      {btn("yes", yes, "border-[var(--green)] bg-[var(--green-soft)]")}
      {btn("no", no, "border-[var(--red)] text-[var(--red)]")}
      {btn("unsure", unsure, "border-[var(--amber)] text-[var(--amber)]")}
    </div>
  );
}

export function TokenMarks({
  value,
  onChange,
  confirmed,
  verify,
  missing,
  na,
}: {
  value?: string;
  onChange: (v: "confirmed" | "verify" | "missing" | "na") => void;
  confirmed: string;
  verify: string;
  missing: string;
  na: string;
}) {
  const btn = (id: "confirmed" | "verify" | "missing" | "na", label: string, tone: string) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      aria-pressed={value === id}
      className={cn(
        "min-h-[4.25rem] rounded-[var(--radius)] border px-3 py-3 text-start text-base font-semibold leading-snug",
        value === id ? tone : "border-[var(--line)] bg-[var(--paper-2)]",
      )}
    >
      {label}
    </button>
  );
  return (
    <div className="grid grid-cols-2 gap-2" role="group">
      {btn("confirmed", confirmed, "border-[var(--green)] bg-[var(--green-soft)]")}
      {btn("verify", verify, "border-[var(--amber)] text-[var(--amber)]")}
      {btn("missing", missing, "border-[var(--red)] text-[var(--red)]")}
      {btn("na", na, "border-[var(--line)] bg-[var(--paper-2)]")}
    </div>
  );
}
