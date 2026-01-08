/**
 * Mobile Responsiveness Utilities
 * Optimizations for mobile devices and small screens
 */

import { useEffect, useState } from 'react';

export interface Breakpoint {
  mobile: boolean;
  tablet: boolean;
  desktop: boolean;
  largeDesktop: boolean;
}

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>({
    mobile: false,
    tablet: false,
    desktop: false,
    largeDesktop: false,
  });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setBreakpoint({
        mobile: width < 768,
        tablet: width >= 768 && width < 1024,
        desktop: width >= 1024 && width < 1536,
        largeDesktop: width >= 1536,
      });
    };

    // Initial check
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return breakpoint;
}

export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouch();
  }, []);

  return isTouch;
}

export function getOptimalChartSize(breakpoint: Breakpoint): number {
  if (breakpoint.mobile) return 200;
  if (breakpoint.tablet) return 250;
  if (breakpoint.desktop) return 280;
  return 320;
}

export function getGridColumns(breakpoint: Breakpoint): string {
  if (breakpoint.mobile) return 'grid-cols-1';
  if (breakpoint.tablet) return 'grid-cols-2';
  return 'grid-cols-3';
}

export function getFontSize(breakpoint: Breakpoint): {
  heading: string;
  subheading: string;
  body: string;
  small: string;
} {
  if (breakpoint.mobile) {
    return {
      heading: 'text-2xl',
      subheading: 'text-lg',
      body: 'text-base',
      small: 'text-sm',
    };
  }

  return {
    heading: 'text-3xl',
    subheading: 'text-xl',
    body: 'text-base',
    small: 'text-sm',
  };
}

export function getSpacing(breakpoint: Breakpoint): {
  section: string;
  card: string;
  element: string;
} {
  if (breakpoint.mobile) {
    return {
      section: 'space-y-4',
      card: 'p-4',
      element: 'space-y-2',
    };
  }

  return {
    section: 'space-y-6',
    card: 'p-6',
    element: 'space-y-3',
  };
}

export function shouldRenderCompactView(breakpoint: Breakpoint): boolean {
  return breakpoint.mobile;
}

export function getModalSize(breakpoint: Breakpoint): string {
  if (breakpoint.mobile) return 'max-w-full h-full';
  if (breakpoint.tablet) return 'max-w-2xl';
  return 'max-w-4xl';
}

/**
 * Optimize touch targets for mobile (minimum 44x44px)
 */
export function getTouchTargetClass(breakpoint: Breakpoint): string {
  if (breakpoint.mobile) return 'min-h-[44px] min-w-[44px]';
  return '';
}

/**
 * Hide elements on mobile to reduce clutter
 */
export function getMobileVisibility(show: boolean): string {
  return show ? 'block' : 'hidden md:block';
}
