"use client";

import type { ReactNode } from "react";

export type Column<Row> = {
  key: string;
  header: string;
  className?: string;
  render: (row: Row) => ReactNode;
};

type Props<Row> = {
  caption?: string;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  dense?: boolean;
};

export function DataTable<Row>({
  caption,
  columns,
  rows,
  rowKey,
  dense = true,
}: Props<Row>) {
  return (
    <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-neutral)]">
      {caption && (
        <div className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
          <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
            {caption}
          </div>
        </div>
      )}
      <div className="overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[var(--liceu-stone)]/70">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={[
                    "whitespace-nowrap px-3 text-left",
                    dense ? "py-2" : "py-3",
                    "font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.18em] text-[var(--liceu-muted)]",
                    col.className ?? "",
                  ].join(" ")}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-[var(--liceu-stone)]/60 last:border-b-0"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[
                      "px-3 align-top",
                      dense ? "py-2" : "py-3",
                      "text-[12px] leading-snug text-[var(--liceu-text)]",
                      col.className ?? "",
                    ].join(" ")}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

