"use client";

type Props = {
  url?: string;
};

export function TypebotEmbed({ url }: Props) {
  const src = url || "https://typebot.co/diag-liceu-v2-vmc59ej";
  
  return (
    <div className="border border-[var(--liceu-stone)]">
      <iframe
        title="Typebot"
        src={src}
        style={{ border: "none", width: "100%", height: "600px" }}
        allow="microphone; clipboard-read; clipboard-write"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
    </div>
  );
}
