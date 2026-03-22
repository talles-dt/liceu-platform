"use client";

import { useEffect } from "react";

export function ModuleStartTracker({ moduleId }: { moduleId: string }) {
  useEffect(() => {
    // Fire and forget — sets started_at on module_progress if not already set
    fetch(`/api/modules/${moduleId}/start`, { method: "POST" }).catch(() => {});
  }, [moduleId]);

  return null;
}
