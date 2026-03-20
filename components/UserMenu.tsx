"use client";

import { useRouter } from "next/navigation";

export function UserMenu({ email }: { email: string | null }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  if (!email) return null;

  return (
    <div className="flex items-center gap-3 text-xs text-zinc-700">
      <span className="truncate max-w-[160px]">{email}</span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded border border-zinc-300 px-2 py-1 text-[11px]"
      >
        Log out
      </button>
    </div>
  );
}

