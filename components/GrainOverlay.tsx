"use client";

/**
 * Grain Overlay — The Verdant Scriptorium texture.
 * Fixed-position noise texture that removes the "flat digital" feel.
 * Reference: stitch-webdesign skill, Section 4 (Grain Texture Overlay CSS)
 */
export function GrainOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] opacity-[0.035]"
      aria-hidden="true"
      style={{
        top: "-50%",
        left: "-50%",
        right: "-50%",
        bottom: "-50%",
        width: "200%",
        height: "200%",
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        animation: "grain-shift 8s steps(10) infinite",
      }}
    />
  );
}
