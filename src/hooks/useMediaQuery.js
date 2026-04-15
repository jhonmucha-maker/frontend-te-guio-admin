import { useState, useEffect } from 'react';

// Breakpoints matching Tailwind's defaults
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

/**
 * Custom hook to detect media query matches
 * @param {string} query - Media query string (e.g., '(min-width: 768px)') or breakpoint name (e.g., 'md')
 * @returns {boolean} - Whether the media query matches
 */
export function useMediaQuery(query) {
  // Convert breakpoint name to media query if needed
  const mediaQuery = breakpoints[query]
    ? `(min-width: ${breakpoints[query]})`
    : query;

  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(mediaQuery).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(mediaQuery);

    const listener = (event) => {
      setMatches(event.matches);
    };

    // Set initial value
    setMatches(mediaQueryList.matches);

    // Add listener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', listener);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(listener);
    }

    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', listener);
      } else {
        mediaQueryList.removeListener(listener);
      }
    };
  }, [mediaQuery]);

  return matches;
}

/**
 * Hook to check if screen is mobile (below md breakpoint)
 * @returns {boolean} - Whether the screen is mobile
 */
export function useIsMobile() {
  return !useMediaQuery('md');
}

/**
 * Hook to check if screen is tablet or smaller (below lg breakpoint)
 * @returns {boolean} - Whether the screen is tablet or smaller
 */
export function useIsTablet() {
  return !useMediaQuery('lg');
}

/**
 * Hook to check if screen is desktop (lg breakpoint and above)
 * @returns {boolean} - Whether the screen is desktop
 */
export function useIsDesktop() {
  return useMediaQuery('lg');
}

export default useMediaQuery;
