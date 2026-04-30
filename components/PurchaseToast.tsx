"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";

export function PurchaseToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const purchase = searchParams.get("purchase");
    if (purchase === "success") {
      // @ts-ignore — Next.js router.replace with scroll: false is safe
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setMessage("Acesso confirmado. Seus módulos estão disponíveis.");
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setVisible(true);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("purchase");
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl as any, { scroll: false });
    }
  }, [searchParams, router, pathname]);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-start gap-4 border border-[var(--liceu-accent)]/40 bg-[var(--liceu-bg)] px-5 py-4 shadow-lg"
      style={{ maxWidth: "360px" }}
    >
      <div className="flex-1 space-y-1">
        <div className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-accent)]">
          Pagamento confirmado
        </div>
        <p className="font-[var(--font-liceu-sans)] text-[12px] leading-relaxed text-[var(--liceu-text)]">
          {message}
        </p>
      </div>
      <button
        onClick={() => setVisible(false)}
        className="shrink-0 font-[var(--font-liceu-mono)] text-[11px] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)]"
      >
        ✕
      </button>
    </div>
  );
}
