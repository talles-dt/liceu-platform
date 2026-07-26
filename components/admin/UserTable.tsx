"use client";

import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "student";
  created_at: string;
  email_verified: boolean;
  last_login_at: string | null;
  login_count: number;
  suspended_at: string | null;
  metadata: Record<string, unknown>;
  active_grants: number;
}

interface UserTableProps {
  users: User[];
  loading?: boolean;
  emptyMessage?: string;
  onUserClick?: (user: User) => void;
  onSuspend?: (user: User, suspend: boolean) => void;
  onRoleChange?: (user: User, role: "admin" | "student") => void;
  onDelete?: (user: User) => void;
  onViewGrants?: (user: User) => void;
}

export function UserTable({
  users,
  loading = false,
  emptyMessage = "No users found",
  onUserClick,
  onSuspend,
  onRoleChange,
  onDelete,
  onViewGrants
}: UserTableProps) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: "asc" | "desc" }>({
    key: "created_at",
    direction: "desc"
  });
  
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  
  const sortedUsers = [...users].sort((a, b) => {
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal === null && bVal === null) return 0;
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });
  
  const handleSort = (key: keyof User) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc"
    }));
  };
  
  const toggleSelect = (id: string) => {
    setSelectedUsers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  
  const toggleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };
  
  const getStatusBadge = (user: User) => {
    if (user.suspended_at) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-red-900/30 text-red-400 border border-red-800 rounded">
          Suspended
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-green-900/30 text-green-400 border border-green-800 rounded">
        Active
      </span>
    );
  };
  
  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-amber-900/30 text-amber-400 border border-amber-800 rounded">
          Admin
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-[10px] font-mono uppercase tracking-wider bg-slate-700/50 text-slate-400 border border-slate-600 rounded">
        Student
      </span>
    );
  };
  
  if (loading) {
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-800/50 border-b border-slate-700">
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">User</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">Active Grants</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">Last Login</th>
                <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500">Joined</th>
                <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="border-t border-slate-800 animate-pulse">
                  <td className="px-4 py-3">
                    <div className="h-4 w-40 bg-slate-700 rounded"></div>
                    <div className="h-3 w-32 bg-slate-700 rounded mt-1"></div>
                  </td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-slate-700 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-5 w-16 bg-slate-700 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-5 w-8 bg-slate-700 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-4 w-24 bg-slate-700 rounded"></div></td>
                  <td className="px-4 py-3"><div className="h-4 w-20 bg-slate-700 rounded"></div></td>
                  <td className="px-4 py-3 text-right"><div className="h-6 w-20 bg-slate-700 rounded mx-auto"></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }
  
  if (users.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-12 text-center">
        <div className="text-slate-500 font-mono text-sm">{emptyMessage}</div>
      </div>
    );
  }
  
  return (
    <div className="bg-slate-900/50 border border-slate-700 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-800/50 border-b border-slate-700">
              <th 
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 w-10"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 accent-amber-500 rounded border-slate-600"
                  aria-label="Select all users"
                />
              </th>
              <th 
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300"
                onClick={() => handleSort("name")}
              >
                User
                <span className="ml-1 opacity-50">
                  {sortConfig.key === "name" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⋮"}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300"
                onClick={() => handleSort("role")}
              >
                Role
                <span className="ml-1 opacity-50">
                  {sortConfig.key === "role" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⋮"}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300"
                onClick={() => handleSort("suspended_at")}
              >
                Status
                <span className="ml-1 opacity-50">
                  {sortConfig.key === "suspended_at" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⋮"}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300"
                onClick={() => handleSort("active_grants")}
              >
                Active Grants
                <span className="ml-1 opacity-50">
                  {sortConfig.key === "active_grants" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⋮"}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300"
                onClick={() => handleSort("last_login_at")}
              >
                Last Login
                <span className="ml-1 opacity-50">
                  {sortConfig.key === "last_login_at" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⋮"}
                </span>
              </th>
              <th 
                className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300"
                onClick={() => handleSort("created_at")}
              >
                Joined
                <span className="ml-1 opacity-50">
                  {sortConfig.key === "created_at" ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⋮"}
                </span>
              </th>
              <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
              <tr
                key={user.id}
                className={cn(
                  "border-t border-slate-800 transition-colors",
                  selectedUsers.has(user.id) && "bg-amber-900/10"
                )}
                onClick={() => onUserClick?.(user)}
              >
                <td className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.id)}
                    onChange={(e) => {
                      e.stopPropagation();
                      toggleSelect(user.id);
                    }}
                    className="w-4 h-4 accent-amber-500 rounded border-slate-600"
                    aria-label={`Select ${user.name}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-mono text-xs text-slate-400">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-serif text-sm text-slate-100">{user.name}</div>
                      <div className="font-mono text-[11px] text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {getRoleBadge(user.role)}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(user)}
                </td>
                <td className="px-4 py-3 font-mono text-sm tabular-nums text-slate-300">
                  {user.active_grants}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {user.last_login_at ? format(new Date(user.last_login_at), "MMM d, yyyy") : "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {format(new Date(user.created_at), "MMM d, yyyy")}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); onViewGrants?.(user); }}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400 hover:text-slate-100 border border-slate-700 hover:border-slate-500 rounded transition-colors"
                    >
                      Grants
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onSuspend?.(user, !user.suspended_at); }}
                      className={cn(
                        "px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-colors",
                        user.suspended_at
                          ? "bg-green-900/30 text-green-400 border-green-800 hover:bg-green-900/50"
                          : "bg-red-900/30 text-red-400 border-red-800 hover:bg-red-900/50"
                      )}
                    >
                      {user.suspended_at ? "Unsuspend" : "Suspend"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onRoleChange?.(user, user.role === "admin" ? "student" : "admin"); }}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 border-amber-800 bg-amber-900/30 hover:bg-amber-900/50 rounded transition-colors"
                    >
                      {user.role === "admin" ? "Demote" : "Promote"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete?.(user); }}
                      className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400 border-red-800 bg-red-900/30 hover:bg-red-900/50 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selectedUsers.size > 0 && (
        <div className="p-4 border-t border-slate-700 bg-slate-900/30 flex items-center justify-between">
          <span className="font-mono text-sm text-slate-400">
            {selectedUsers.size} user{selectedUsers.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-red-400 border-red-800 bg-red-900/30 hover:bg-red-900/50 rounded transition-colors">
              Suspend All
            </button>
            <button className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-400 border-amber-800 bg-amber-900/30 hover:bg-amber-900/50 rounded transition-colors">
              Promote All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}