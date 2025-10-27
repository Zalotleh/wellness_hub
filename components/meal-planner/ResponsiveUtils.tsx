'use client';

import { useState, useEffect } from 'react';

// Custom hook for responsive breakpoints
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 640) {
        setBreakpoint('mobile');
        setIsMobile(true);
        setIsTablet(false);
        setIsDesktop(false);
      } else if (width < 1024) {
        setBreakpoint('tablet');
        setIsMobile(false);
        setIsTablet(true);
        setIsDesktop(false);
      } else {
        setBreakpoint('desktop');
        setIsMobile(false);
        setIsTablet(false);
        setIsDesktop(true);
      }
    };

    // Set initial values
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    // Utility functions
    isSmallScreen: isMobile || isTablet,
    isLargeScreen: isDesktop,
  };
}

// Custom hook for touch device detection
export function useTouch() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

// Custom hook for orientation detection
export function useOrientation() {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    handleOrientationChange();
    window.addEventListener('resize', handleOrientationChange);

    return () => window.removeEventListener('resize', handleOrientationChange);
  }, []);

  return orientation;
}

// Responsive class utilities
export const responsiveClasses = {
  // Container classes
  container: {
    mobile: 'px-4 mx-auto max-w-full',
    tablet: 'px-6 mx-auto max-w-4xl',
    desktop: 'px-8 mx-auto max-w-7xl',
  },
  
  // Grid classes
  grid: {
    mobile: 'grid grid-cols-1 gap-4',
    tablet: 'grid grid-cols-2 gap-6',
    desktop: 'grid grid-cols-3 lg:grid-cols-4 gap-8',
  },
  
  // Text classes
  text: {
    heading: {
      mobile: 'text-2xl font-bold',
      tablet: 'text-3xl font-bold',
      desktop: 'text-4xl font-bold',
    },
    subheading: {
      mobile: 'text-lg font-semibold',
      tablet: 'text-xl font-semibold',
      desktop: 'text-2xl font-semibold',
    },
    body: {
      mobile: 'text-sm',
      tablet: 'text-base',
      desktop: 'text-base',
    },
  },
  
  // Spacing classes
  spacing: {
    section: {
      mobile: 'py-8',
      tablet: 'py-12',
      desktop: 'py-16',
    },
    element: {
      mobile: 'mb-4',
      tablet: 'mb-6',
      desktop: 'mb-8',
    },
  },
  
  // Button classes
  button: {
    primary: {
      mobile: 'px-4 py-2 text-sm font-medium',
      tablet: 'px-6 py-3 text-base font-medium',
      desktop: 'px-8 py-3 text-base font-medium',
    },
    secondary: {
      mobile: 'px-3 py-2 text-xs font-medium',
      tablet: 'px-4 py-2 text-sm font-medium',
      desktop: 'px-6 py-2 text-sm font-medium',
    },
  },
};

// Helper function to get responsive classes
export function getResponsiveClasses(
  classes: Record<string, string>,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): string {
  return classes[breakpoint] || classes.desktop || '';
}

// Mobile-specific utilities
export const mobileUtils = {
  // Touch-friendly sizing
  touchTarget: 'min-h-[44px] min-w-[44px]', // iOS guidelines
  
  // Safe area handling
  safeArea: {
    top: 'pt-safe-top',
    bottom: 'pb-safe-bottom',
    left: 'pl-safe-left',
    right: 'pr-safe-right',
  },
  
  // Mobile navigation
  navigation: {
    height: 'h-16',
    padding: 'px-4 py-2',
    sticky: 'sticky top-0 z-10',
  },
  
  // Modal/drawer classes
  modal: {
    mobile: 'fixed inset-x-0 bottom-0 rounded-t-xl',
    tablet: 'fixed inset-0 m-4 rounded-xl',
    desktop: 'fixed inset-0 flex items-center justify-center',
  },
  
  // Scroll behavior
  scroll: {
    horizontal: 'overflow-x-auto scrollbar-hide',
    vertical: 'overflow-y-auto scrollbar-hide',
    snap: 'scroll-snap-type-x mandatory',
    smooth: 'scroll-smooth',
  },
};

// Animation utilities for mobile
export const mobileAnimations = {
  // Slide animations
  slideUp: {
    initial: 'transform translate-y-full opacity-0',
    animate: 'transform translate-y-0 opacity-100',
    exit: 'transform translate-y-full opacity-0',
  },
  
  slideIn: {
    initial: 'transform translate-x-full opacity-0',
    animate: 'transform translate-x-0 opacity-100',
    exit: 'transform translate-x-full opacity-0',
  },
  
  // Fade animations
  fade: {
    initial: 'opacity-0',
    animate: 'opacity-100',
    exit: 'opacity-0',
  },
  
  // Scale animations
  scale: {
    initial: 'transform scale-95 opacity-0',
    animate: 'transform scale-100 opacity-100',
    exit: 'transform scale-95 opacity-0',
  },
};

// Accessibility utilities
export const a11yUtils = {
  // Focus management
  focus: {
    visible: 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2',
    within: 'focus-within:ring-2 focus-within:ring-green-500',
    skip: 'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-white px-4 py-2 rounded',
  },
  
  // Screen reader utilities
  screenReader: {
    only: 'sr-only',
    skip: 'sr-only focus:not-sr-only',
    live: 'sr-live',
  },
  
  // Keyboard navigation
  keyboard: {
    interactive: 'focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  },
  
  // Touch accessibility
  touch: {
    target: 'min-h-[44px] min-w-[44px]', // Minimum touch target size
    feedback: 'active:scale-95 transition-transform',
  },
};

// Performance utilities
export const performanceUtils = {
  // Image optimization
  image: {
    lazy: 'loading="lazy"',
    eager: 'loading="eager"',
    responsive: 'w-full h-auto',
    aspectRatio: 'aspect-w-16 aspect-h-9',
  },
  
  // Component lazy loading
  lazyLoad: {
    threshold: 0.1,
    rootMargin: '50px',
  },
  
  // Intersection observer options
  intersectionObserver: {
    threshold: [0, 0.25, 0.5, 0.75, 1],
    rootMargin: '0px 0px -100px 0px',
  },
};

// Utility function to conditionally apply classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Responsive component wrapper
interface ResponsiveWrapperProps {
  children: React.ReactNode;
  mobileClass?: string;
  tabletClass?: string;
  desktopClass?: string;
  className?: string;
}

export function ResponsiveWrapper({
  children,
  mobileClass = '',
  tabletClass = '',
  desktopClass = '',
  className = '',
}: ResponsiveWrapperProps) {
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const responsiveClass = cn(
    className,
    isMobile && mobileClass,
    isTablet && tabletClass,
    isDesktop && desktopClass
  );
  
  return (
    <div className={responsiveClass}>
      {children}
    </div>
  );
}

// Export all utilities
export default {
  useResponsive,
  useTouch,
  useOrientation,
  responsiveClasses,
  getResponsiveClasses,
  mobileUtils,
  mobileAnimations,
  a11yUtils,
  performanceUtils,
  cn,
  ResponsiveWrapper,
};