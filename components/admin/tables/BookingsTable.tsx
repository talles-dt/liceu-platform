"use client";

import { DataTable } from "@/components/admin/DataTable";

export type BookingRow = {
  id: string;
  student: string;
  sessionId: string;
  bookedAt: string;
};

export function BookingsTable({ rows }: { rows: BookingRow[] }) {
  return (
    <DataTable
      caption="bookings"
      rows={rows}
      rowKey={(r) => r.id}
      columns={[
        {
          key: "student",
          header: "student",
          render: (r) => <span className="font-[var(--font-noto-serif)]">{r.student}</span>,
        },
        {
          key: "sessionId",
          header: "session_id",
          render: (r) => (
            <span className="font-mono text-[10px] text-[var(--liceu-muted)]">
              {r.sessionId}
            </span>
          ),
        },
        {
          key: "bookedAt",
          header: "booked_at",
          render: (r) => (
            <span className="font-[var(--font-space-grotesk)] tabular-nums text-[11px] text-[var(--liceu-muted)]">
              {r.bookedAt}
            </span>
          ),
        },
      ]}
    />
  );
}
