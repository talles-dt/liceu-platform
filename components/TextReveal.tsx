"use client";

import { useEffect, useRef, useState, type ElementType } from "react";

/**
 * Text Reveal — Characters emerge from below with staggered timing.
 * Reference: stitch-webdesign skill, Section 3 (Kinetic Typography Header)
 *
 * @example
 * <TextReveal text="Liceu Underground" as="h1" />
 */
export function TextReveal<T extends ElementType = "h1">({
  text,
  as,
  className = "",
  staggerDelay = 0.03,
  delay = 0,
}: {
  text: string;
  as?: T;
  className?: string;
  staggerDelay?: number;
  delay?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const Tag = as || "h1";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as React.RefObject<HTMLHeadingElement>}
      className={`overflow-hidden ${className}`}
    >
      {text.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            transform: isVisible ? "translateY(0%)" : "translateY(110%)",
            opacity: isVisible ? 1 : 0,
            transition: `transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${delay + i * staggerDelay}s, opacity 0.6s ease ${delay + i * staggerDelay}s`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </Tag>
  );
}
