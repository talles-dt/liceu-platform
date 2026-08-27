"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the user is on a mobile device.
 * Uses both user agent string and viewport width for detection.
 */
export function useMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check user agent for mobile browsers
    const userAgent = navigator.userAgent || navigator.vendor || "";
    const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );

    // Check viewport width
    const checkViewport = () => {
      const viewportWidth = window.innerWidth;
      // Consider devices with width <= 1024px as mobile/tablet
      // This includes iPads in portrait mode
      const isSmallViewport = viewportWidth <= 1024;

      // Device is mobile if either user agent matches or viewport is small
      setIsMobile(isMobileAgent || isSmallViewport);
    };

    // Initial check
    checkViewport();

    // Add resize listener
    window.addEventListener("resize", checkViewport, { passive: true });

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

  return isMobile;
}

/**
 * Hook that returns true for the first render on server,
 * then syncs with client-side mobile detection.
 * Useful for avoiding hydration mismatches.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const userAgent = navigator.userAgent || navigator.vendor || "";
    const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      userAgent,
    );
    const isSmallViewport = window.innerWidth <= 1024;
    setIsMobile(isMobileAgent || isSmallViewport);
  }, []);

  // Return false during server render to avoid hydration issues
  // This means animations will render on server, but disable on mobile client
  return hasMounted ? isMobile : false;
}
