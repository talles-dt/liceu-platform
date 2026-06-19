"use client";

import { useEffect, useRef } from "react";

/**
 * Magnetic Hover Effect — Elements subtly attracted to the cursor.
 * Reference: stitch-webdesign skill, Section 4 (Magnetic Hover Effect)
 *
 * @example
 * <Magnetic strength={0.3}>
 *   <button>Hover me</button>
 * </Magnetic>
 */
export function Magnetic({
  children,
  strength = 0.25,
  className = "",
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let rafId: number | null = null;

    const animate = () => {
      if (!el) return;
      const dx = targetX - currentX;
      const dy = targetY - currentY;
      currentX += dx * 0.15;
      currentY += dy * 0.15;
      el.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      rafId = requestAnimationFrame(animate);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      targetX = (e.clientX - centerX) * strength;
      targetY = (e.clientY - centerY) * strength;
    };

    const onMouseLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    rafId = requestAnimationFrame(animate);

    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [strength]);

  return (
    <div ref={ref} className={className} style={{ willChange: "transform" }}>
      {children}
    </div>
  );
}
