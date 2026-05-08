"use client";

import { useEffect, useState } from "react";

type Props = { lessonId: string };

export function VideoPlayer({ lessonId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/lessons/${lessonId}/stream-token`)
      .then((r) => r.json())
      .then((d: { token?: string; videoId?: string; error?: string }) => {
        if (d.error) { setError(d.error); return; }
        setToken(d.token ?? null);
        setVideoId(d.videoId ?? null);
      })
      .catch(() => setError("Erro ao carregar vídeo."));
  }, [lessonId]);

  if (error) {
    return (
      <div className="border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/35 px-5 py-5">
        <p className="font-[var(--font-liceu-sans)] text-[12px] text-[var(--liceu-muted)]">
          {error}
        </p>
      </div>
    );
  }

  if (!token || !videoId) {
    return (
      <div className="aspect-video w-full border border-[var(--liceu-stone)] bg-[var(--liceu-surface)]/20 flex items-center justify-center">
        <span className="font-[var(--font-liceu-mono)] text-[10px] uppercase tracking-[0.22em] text-[var(--liceu-muted)]">
          Carregando vídeo...
        </span>
      </div>
    );
  }

  // Cloudflare Stream signed iframe URL
  const src = `https://customer-${process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN ?? "stream"}.cloudflarestream.com/${token}/iframe`;

  return (
    <div className="aspect-video w-full border border-[var(--liceu-stone)] overflow-hidden bg-black">
      <iframe
        src={src}
        title="Aula em vídeo"
        className="h-full w-full"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </div>
  );
}
