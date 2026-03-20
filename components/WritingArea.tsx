import type { TextareaHTMLAttributes } from "react";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function WritingArea({ className = "", ...props }: Props) {
  return (
    <div className="rounded-sm border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/70 px-5 py-4">
      <textarea
        {...props}
        className={[
          "block h-[440px] w-full resize-none border-none bg-transparent",
          "font-serif text-[15px] leading-[1.95] text-[var(--liceu-text)]",
          "placeholder:text-[var(--liceu-muted)]/60",
          "focus:outline-none",
          className,
        ].join(" ")}
      />
    </div>
  );
}

