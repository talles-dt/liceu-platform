"use client";

import { useEffect } from "react";

export function ModuleStartTracker({ moduleId }: { moduleId: string }) {
  useEffect(() => {
    // Fire and forget — sets started_at on module_progress if not already set
    fetch(`/api/modules/${moduleId}/start`, { method: "POST" }).catch((e) =>
      console.error("[ModuleStartTracker] failed to record module start", e),
    );
  }, [moduleId]);

  return null;
}
