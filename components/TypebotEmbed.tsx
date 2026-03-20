"use client";

export function TypebotEmbed() {
  return (
    <div className="border border-[var(--liceu-stone)]">
      <iframe
        title="Typebot"
        src="https://typebot.co/diag-liceu-v2-vmc59ej"
        style={{ border: "none", width: "100%", height: "600px" }}
        allow="microphone; clipboard-read; clipboard-write"
      />
    </div>
  );
}
