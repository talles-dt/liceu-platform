import Link from "next/link";

export type ModuleStatus = "locked" | "current" | "completed";

export type ModuleListItem = {
  id: string;
  title: string;
  href: string;
  status: ModuleStatus;
};

const statusLabel: Record<ModuleStatus, string> = {
  locked: "LOCKED",
  current: "CURRENT",
  completed: "COMPLETED",
};

const statusTone: Record<ModuleStatus, string> = {
  locked: "text-[var(--liceu-muted)] border-[var(--liceu-stone)]/80",
  current: "text-[var(--liceu-accent)] border-[var(--liceu-accent)]/45",
  completed: "text-[var(--liceu-muted)]/80 border-[var(--liceu-stone)]/70",
};

export function ModuleList({ items }: { items: ModuleListItem[] }) {
  return (
    <ol className="space-y-2">
      {items.map((m) => {
        const isLocked = m.status === "locked";
        const commonClassName = [
          "group block rounded-sm border bg-[var(--liceu-surface)]/60 px-4 py-3",
          "border-[var(--liceu-stone)]/80",
          !isLocked &&
            "hover:border-[var(--liceu-accent)]/35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-accent)]/55",
          isLocked && "opacity-60",
        ].join(" ");

        const inner = (
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="truncate font-[var(--font-liceu-sans)] text-sm tracking-tight text-[var(--liceu-text)]">
                {m.title}
              </div>
            </div>
            <div
              className={[
                "shrink-0 rounded-full border px-2 py-0.5",
                "font-[var(--font-liceu-mono)] text-[10px] tracking-[0.22em]",
                statusTone[m.status],
              ].join(" ")}
            >
              {statusLabel[m.status]}
            </div>
          </div>
        );

        return (
          <li key={m.id}>
            {isLocked ? (
              <div className={commonClassName}>{inner}</div>
            ) : (
              <Link href={m.href as never} className={commonClassName}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

