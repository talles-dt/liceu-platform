"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";

export type NotificationItem = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  created_at: string;
};

async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch("/api/notifications");
  if (!res.ok) return [];
  return res.json();
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "agora";
  if (diffMin < 60) return `${diffMin}min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString("pt-BR");
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadNotifications();

    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, loadNotifications]);

  async function handleNotificationClick(notification: NotificationItem) {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)),
    );

    // Navigate if there's a link
    if (notification.link) {
      setOpen(false);
      router.push(notification.link as Route);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-accent)]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--liceu-accent)]"
        aria-label="Notificacoes"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--liceu-secondary)] px-1 font-[var(--font-space-grotesk)] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--liceu-on-primary)]">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-lg border border-[var(--liceu-stone)] bg-[var(--liceu-surface)] shadow-lg">
          <div className="border-b border-[var(--liceu-stone)]/70 px-4 py-3">
            <div className="font-[var(--font-space-grotesk)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-secondary)]">
              Notificacoes
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
                Carregando...
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <div className="px-4 py-6 text-center font-[var(--font-work-sans)] text-sm text-[var(--liceu-muted)]">
                Nenhuma notificacao.
              </div>
            )}
            {!loading &&
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full border-b border-[var(--liceu-stone)]/40 px-4 py-3 text-left transition-colors ${
                    n.link
                      ? "cursor-pointer hover:bg-[var(--liceu-surface-container-high)]"
                      : "cursor-default"
                  } ${!n.read ? "bg-[var(--liceu-neutral)]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-[var(--font-work-sans)] text-[13px] font-medium text-[var(--liceu-text)]">
                      {n.title}
                    </div>
                    <span className="shrink-0 font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.15em] text-[var(--liceu-muted)]">
                      {formatRelativeTime(n.created_at)}
                    </span>
                  </div>
                  <p className="mt-1 font-[var(--font-work-sans)] text-[12px] leading-relaxed text-[var(--liceu-muted)]">
                    {n.body}
                  </p>
                  {n.type === "assignment_feedback" && n.body && (
                    <div className="mt-2">
                      {n.body.includes("approved") && (
                        <span className="inline-block rounded bg-[var(--liceu-accent)]/10 px-1.5 py-0.5 font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-[var(--liceu-accent)]">
                          aprovado
                        </span>
                      )}
                      {n.body.includes("revision") && (
                        <span className="inline-block rounded bg-[var(--liceu-secondary)]/10 px-1.5 py-0.5 font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-[var(--liceu-secondary)]">
                          revisao
                        </span>
                      )}
                      {n.body.includes("rejected") && (
                        <span className="inline-block rounded border border-red-300/40 bg-red-500/10 px-1.5 py-0.5 font-[var(--font-space-grotesk)] text-[9px] uppercase tracking-[0.18em] text-red-400">
                          rejeitado
                        </span>
                      )}
                    </div>
                  )}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
