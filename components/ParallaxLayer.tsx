"use client";

import { useEffect, useRef } from "react";
import { useIsMobile } from "@/lib/hooks/useMobile";

/**
 * Parallax Layer — Elements that move at different speeds on scroll.
 * Disabled on mobile devices for performance.
 * Reference: stitch-webdesign skill, references/gsap-choreography.md
 */
export function ParallaxLayer({
  children,
  speed = -15,
  className = "",
}: {
  children: React.ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const el = ref.current;
    if (!el || isMobile) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const elementCenter = rect.top + rect.height / 2;
      const viewportCenter = viewportHeight / 2;
      const offset = (elementCenter - viewportCenter) * (speed / 100);
      el.style.transform = `translate3d(0, ${offset}px, 0)`;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed, isMobile]);

  // On mobile, just render children without parallax effect
  if (isMobile) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
