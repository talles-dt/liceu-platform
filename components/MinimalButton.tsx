import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "quiet";
  children: ReactNode;
};

export function MinimalButton({
  variant = "primary",
  className = "",
  children,
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-4 py-2 font-[var(--font-liceu-sans)] text-xs tracking-[0.12em] uppercase transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--liceu-accent)]/60 disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "border border-[var(--liceu-accent)]/50 text-[var(--liceu-text)] hover:border-[var(--liceu-accent)] hover:bg-[var(--liceu-surface)]"
      : "border border-[#2F2F2F] text-[#A1A1A1] hover:text-[#EAEAEA] hover:border-[#6b6b6b]";

  return (
    <button {...props} className={`${base} ${styles} ${className}`.trim()}>
      {children}
    </button>
  );
}

