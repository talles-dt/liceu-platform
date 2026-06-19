"use client";

import { useEffect, useState } from "react";

/**
 * Scroll Progress Indicator — Thin bar at top showing page scroll progress.
 * Reference: stitch-webdesign skill, references/interactive-components.md
 */
export function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight > 0) {
        setProgress(Math.min(scrollTop / docHeight, 1));
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-[2px] bg-transparent">
      <div
        className="h-full origin-left"
        style={{
          transform: `scaleX(${progress})`,
          background: "var(--liceu-accent)",
          willChange: "transform",
          transition: "transform 0.05s linear",
        }}
      />
    </div>
  );
}
