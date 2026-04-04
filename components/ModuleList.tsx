import Link from "next/link";

export type ModuleStatus = "locked" | "current" | "completed";

export type ModuleListItem = {
  id: string;
  title: string;
  href: `/${string}`;
  status: ModuleStatus;
};

const statusLabel: Record<ModuleStatus, string> = {
  locked: "LOCKED",
  current: "CURRENT",
  completed: "COMPLETED",
};

const statusTone: Record<ModuleStatus, string> = {
  locked: "text-[var(--liceu-muted)] border-[var(--liceu-stone)]",
  current: "text-[var(--liceu-primary)] border-[var(--liceu-primary)]",
  completed: "text-[var(--liceu-secondary)] border-[var(--liceu-secondary)]",
};

export function ModuleList({ items }: { items: ModuleListItem[] }) {
  return (
    <ol className="space-y-2">
      {items.map((m) => {
        const isLocked = m.status === "locked";
        const commonClassName = [
          "group block border bg-[var(--liceu-surface)] px-4 py-3",
          "border-[var(--liceu-stone)]",
          !isLocked &&
            "hover:border-[var(--liceu-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--liceu-primary)]",
          isLocked && "opacity-60",
        ].join(" ");

        const inner = (
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <div className="truncate font-[var(--font-work-sans)] text-sm tracking-tight text-[var(--liceu-text)]">
                {m.title}
              </div>
            </div>
            <div
              className={[
                "shrink-0 border px-2 py-0.5",
                "font-[var(--font-space-grotesk)] text-[10px] tracking-[0.22em]",
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
              <Link href={m.href as `/modules/${string}`} className={commonClassName}>
                {inner}
              </Link>
            )}
          </li>
        );
      })}
    </ol>
  );
}

