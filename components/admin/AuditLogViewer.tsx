"use client";

import React, { useState, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_identifier: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface AuditLogViewerProps {
  logs: AuditLog[];
  users: { id: string; name: string; email: string }[];
}

const ACTION_COLORS: Record<string, string> = {
  user_created: "bg-green-900/30 text-green-400 border-green-800",
  user_updated: "bg-blue-900/30 text-blue-400 border-blue-800",
  user_deleted: "bg-red-900/30 text-red-400 border-red-800",
  access_granted: "bg-purple-900/30 text-purple-400 border-purple-800",
  access_revoked: "bg-orange-900/30 text-orange-400 border-orange-800",
  access_grant_updated: "bg-amber-900/30 text-amber-400 border-amber-800",
  partnership_created: "bg-indigo-900/30 text-indigo-400 border-indigo-800",
  partnership_updated: "bg-teal-900/30 text-teal-400 border-teal-800",
  partnership_terminated: "bg-red-900/30 text-red-400 border-red-800",
  partnership_member_added: "bg-cyan-900/30 text-cyan-400 border-cyan-800",
  partnership_member_removed: "bg-pink-900/30 text-pink-400 border-pink-800",
  content_published: "bg-emerald-900/30 text-emerald-400 border-emerald-800",
  content_unpublished: "bg-rose-900/30 text-rose-400 border-rose-800",
  content_updated: "bg-sky-900/30 text-sky-400 border-sky-800",
  settings_changed: "bg-gray-900/30 text-gray-400 border-gray-800",
  login: "bg-lime-900/30 text-lime-400 border-lime-800",
  logout: "bg-stone-900/30 text-stone-400 border-stone-800",
  role_changed: "bg-violet-900/30 text-violet-400 border-violet-800",
  module_access_changed: "bg-fuchsia-900/30 text-fuchsia-400 border-fuchsia-800",
  course_access_changed: "bg-fuchsia-900/30 text-fuchsia-400 border-fuchsia-800",
};

const TARGET_TYPE_LABELS: Record<string, string> = {
  user: "User",
  access_grant: "Access Grant",
  partnership: "Partnership",
  module: "Module",
  course: "Course",
  content: "Content",
  settings: "Settings",
};

export function AuditLogViewer({ logs, users }: AuditLogViewerProps) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [targetTypeFilter, setTargetTypeFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = !search || 
        log.actor_email?.toLowerCase().includes(search.toLowerCase()) ||
        log.target_identifier?.toLowerCase().includes(search.toLowerCase()) ||
        log.action.toLowerCase().includes(search.toLowerCase()) ||
        log.id.toLowerCase().includes(search.toLowerCase());
      
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      const matchesTargetType = targetTypeFilter === "all" || log.target_type === targetTypeFilter;

      return matchesSearch && matchesAction && matchesTargetType;
    });
  }, [logs, search, actionFilter, targetTypeFilter]);

  const uniqueActions = useMemo(() => 
    [...new Set(logs.map(l => l.action))].sort(), [logs]
  );

  const uniqueTargetTypes = useMemo(() => 
    [...new Set(logs.map(l => l.target_type).filter(Boolean))].sort(), [logs]
  );

  const getActionColor = (action: string) => ACTION_COLORS[action] || "bg-gray-900/30 text-gray-400 border-gray-800";

  const formatAction = (action: string) => action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());

  const formatTargetType = (type: string | null) => type ? (TARGET_TYPE_LABELS[type] || type) : "—";

  const RenderExpandedContent = ({ log }: { log: AuditLog }) => (
    <div className="bg-[var(--liceu-bg)] border-t border-[var(--liceu-stone)] p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
        <div className="space-y-3 md:col-span-2">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
            Old Values
          </h4>
          <pre className="bg-[var(--liceu-bg)] border border-[var(--liceu-stone)] rounded p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto text-[var(--liceu-muted)]">
            {log.old_values ? JSON.stringify(log.old_values, null, 2) : "—"}
          </pre>
        </div>
        <div className="space-y-3 md:col-span-2">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
            New Values
          </h4>
          <pre className="bg-[var(--liceu-bg)] border border-[var(--liceu-stone)] rounded p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto text-[var(--liceu-text)]">
            {log.new_values ? JSON.stringify(log.new_values, null, 2) : "—"}
          </pre>
        </div>
        <div className="space-y-3 md:col-span-2">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
            Metadata
          </h4>
          <pre className="bg-[var(--liceu-bg)] border border-[var(--liceu-stone)] rounded p-3 text-xs overflow-x-auto max-h-64 overflow-y-auto text-[var(--liceu-muted)]">
            {log.metadata ? JSON.stringify(log.metadata, null, 2) : "—"}
          </pre>
        </div>
        <div className="space-y-3 md:col-span-2">
          <h4 className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
            Context
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">Actor ID</span>
              <div className="font-mono text-xs text-[var(--liceu-text)]">{log.actor_id || "—"}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">Target Type</span>
              <div className="font-mono text-xs text-[var(--liceu-text)]">{formatTargetType(log.target_type)}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">Target ID</span>
              <div className="font-mono text-xs text-[var(--liceu-text)]">{log.target_id || "—"}</div>
            </div>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">Log ID</span>
              <div className="font-mono text-xs text-[var(--liceu-text)]">{log.id}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-[var(--font-noto-serif)] text-xl font-bold text-[var(--liceu-text)]">
            Audit Logs
          </h2>
          <p className="text-sm text-[var(--liceu-muted)] mt-1">
            {logs.length} total events · {filteredLogs.length} filtered
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email, action, ID..."
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container-highest)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              Action
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container-highest)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(a => (
                <option key={a} value={a}>{formatAction(a)}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              Target Type
            </label>
            <select
              value={targetTypeFilter}
              onChange={(e) => setTargetTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--liceu-surface-container-highest)] border border-[var(--liceu-stone)] text-[var(--liceu-text)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--liceu-accent)] focus:border-transparent"
            >
              <option value="all">All Types</option>
              {uniqueTargetTypes.map(t => {
                const val = t as string;
                return <option key={val} value={val}>{formatTargetType(val)}</option>;
              })}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] mb-1">
              &nbsp;
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setSearch(""); setActionFilter("all"); setTargetTypeFilter("all"); }}
                className="px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] bg-[var(--liceu-surface-container-highest)] border border-[var(--liceu-stone)] rounded transition-colors"
              >
                Clear Filters
              </button>
              <span className="text-sm text-[var(--liceu-muted)]">
                {logs.length - filteredLogs.length} hidden
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[var(--liceu-surface-container)] border border-[var(--liceu-stone)] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-[var(--liceu-surface-container-highest)] border-b border-[var(--liceu-stone)]">
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] w-8">
                #
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
                Time
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
                Actor
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
                Action
              </th>
              <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)]">
                Target
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-[var(--liceu-muted)] pr-4">
                Details
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-mono text-xs uppercase tracking-wider text-[var(--liceu-muted)]">
                  No audit logs match your filters.
                </td>
              </tr>
            ) : (
              <>
                {filteredLogs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className="border-b border-[var(--liceu-stone)] hover:bg-[var(--liceu-surface-container-highest)] transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-4 py-3 font-mono text-xs tabular-nums text-[var(--liceu-muted)]">
                        {logs.length - logs.indexOf(log)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--liceu-muted)]">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-[var(--liceu-text)]">
                          {log.actor_email || "System"}
                        </div>
                        {log.actor_id && (
                          <div className="font-mono text-[10px] text-[var(--liceu-muted)]">
                            {log.actor_id.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "inline-flex items-center px-2 py-1 text-[10px] font-mono uppercase tracking-wider rounded border",
                          getActionColor(log.action)
                        )}>
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs text-[var(--liceu-text)]">
                          {log.target_identifier || log.target_id?.slice(0, 12) || "—"}
                        </div>
                        {log.target_type && (
                          <div className="font-mono text-[10px] text-[var(--liceu-muted)]">
                            {formatTargetType(log.target_type)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right pr-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedId(expandedId === log.id ? null : log.id); }}
                          className="p-1.5 text-[var(--liceu-muted)] hover:text-[var(--liceu-accent)] hover:bg-[var(--liceu-surface-container-highest)] rounded transition-colors"
                          aria-label={expandedId === log.id ? "Collapse" : "Expand"}
                        >
                          <svg className={cn("w-4 h-4 transition-transform", expandedId === log.id && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded row */}
                    {expandedId === log.id && (
                      <tr>
                        <td colSpan={6} className="p-0">
                          <RenderExpandedContent log={log} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination info */}
      <div className="flex items-center justify-between text-sm text-[var(--liceu-muted)]">
        <span>Showing {filteredLogs.length} of {logs.length} events</span>
        <span className="font-mono">Auto-refresh: Off</span>
      </div>
    </div>
  );
}