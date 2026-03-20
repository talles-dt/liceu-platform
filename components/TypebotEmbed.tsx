"use client";

type Props = {
  url: string;
  title?: string;
};

export function TypebotEmbed({ url, title = "Diagnóstico (Typebot)" }: Props) {
  return (
    <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-bg)]">
      <iframe
        src={url}
        title={title}
        className="h-[72vh] w-full"
        allow="microphone; clipboard-read; clipboard-write"
      />
    </div>
  );
}

