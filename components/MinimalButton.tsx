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
    "inline-flex items-center justify-center whitespace-nowrap px-4 py-2 font-[var(--font-space-grotesk)] text-xs tracking-[0.12em] uppercase transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--liceu-primary)] disabled:opacity-50 disabled:cursor-not-allowed";

  const styles =
    variant === "primary"
      ? "border border-[var(--liceu-primary)] bg-[var(--liceu-primary)] text-[var(--liceu-text)] hover:bg-[var(--liceu-primary-dark)] hover:border-[var(--liceu-primary-dark)]"
      : "border border-[var(--liceu-stone)] text-[var(--liceu-muted)] hover:text-[var(--liceu-text)] hover:border-[var(--liceu-secondary)]";

  return (
    <button {...props} className={`${base} ${styles} ${className}`.trim()}>
      {children}
    </button>
  );
}

