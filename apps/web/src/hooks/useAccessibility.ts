/**
 * Accessibility Hook
 * Provides React hooks for accessibility features
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  announce,
  focusUtils,
  keyboardUtils,
  generateAriaId,
  healthcareA11y,
} from '@/utils/accessibility';

/**
 * Hook for making announcements to screen readers
 */
export function useAnnounce() {
  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite');
  }, []);

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive');
  }, []);

  return { announcePolite, announceAssertive };
}

/**
 * Hook for focus management
 */
export function useFocusManagement() {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    focusUtils.restoreFocus(previousFocusRef.current);
  }, []);

  const focusFirst = useCallback((container: HTMLElement) => {
    const focusable = focusUtils.getFocusableElements(container);
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }, []);

  return { saveFocus, restoreFocus, focusFirst };
}

/**
 * Hook for focus trap (modals, dialogs)
 */
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save current focus
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Trap focus
    const cleanup = focusUtils.trapFocus(containerRef.current);

    return () => {
      cleanup();
      // Restore focus on cleanup
      focusUtils.restoreFocus(previousFocusRef.current);
    };
  }, [isActive, containerRef]);
}

/**
 * Hook for arrow key navigation in lists
 */
export function useArrowNavigation<T extends HTMLElement>(
  items: T[],
  options: { wrap?: boolean; vertical?: boolean } = {}
) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const newIndex = keyboardUtils.handleArrowNavigation(
        event.nativeEvent,
        items,
        activeIndex,
        options
      );
      setActiveIndex(newIndex);
    },
    [items, activeIndex, options]
  );

  return { activeIndex, setActiveIndex, handleKeyDown };
}

/**
 * Hook for generating unique ARIA IDs
 */
export function useAriaId(prefix: string = 'aria') {
  const idRef = useRef<string | null>(null);

  if (!idRef.current) {
    idRef.current = generateAriaId(prefix);
  }

  return idRef.current;
}

/**
 * Hook for managing ARIA expanded state
 */
export function useAriaExpanded(initialState = false) {
  const [isExpanded, setIsExpanded] = useState(initialState);
  const contentId = useAriaId('expandable-content');

  const toggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const triggerProps = {
    'aria-expanded': isExpanded,
    'aria-controls': contentId,
    onClick: toggle,
  };

  const contentProps = {
    id: contentId,
    hidden: !isExpanded,
  };

  return { isExpanded, setIsExpanded, toggle, triggerProps, contentProps };
}

/**
 * Hook for handling escape key to close modals/dialogs
 */
export function useEscapeKey(onEscape: () => void, isActive = true) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (keyboardUtils.isEscapeKey(event)) {
        onEscape();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onEscape, isActive]);
}

/**
 * Hook for loading state announcements
 */
export function useLoadingAnnouncement(isLoading: boolean, context?: string) {
  const previousLoadingRef = useRef(isLoading);

  useEffect(() => {
    if (previousLoadingRef.current !== isLoading) {
      healthcareA11y.announceLoading(isLoading, context);
      previousLoadingRef.current = isLoading;
    }
  }, [isLoading, context]);
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Hook for high contrast mode detection
 */
export function useHighContrast(): boolean {
  const [isHighContrast, setIsHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setIsHighContrast(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsHighContrast(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return isHighContrast;
}

/**
 * Healthcare-specific accessibility hook
 */
export function useHealthcareAccessibility() {
  const announcePatientChange = useCallback((patientName: string) => {
    healthcareA11y.announcePatientChange(patientName);
  }, []);

  const announceAlert = useCallback(
    (severity: 'critical' | 'high' | 'medium' | 'low', message: string) => {
      healthcareA11y.announceAlert(severity, message);
    },
    []
  );

  const announceFormResult = useCallback((success: boolean, entityType: string) => {
    healthcareA11y.announceFormResult(success, entityType);
  }, []);

  const announceNavigation = useCallback((pageName: string) => {
    healthcareA11y.announceNavigation(pageName);
  }, []);

  return {
    announcePatientChange,
    announceAlert,
    announceFormResult,
    announceNavigation,
  };
}

/**
 * Hook for keyboard-only users detection
 */
export function useKeyboardUser(): boolean {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleFirstTab = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        setIsKeyboardUser(true);
        document.body.classList.add('keyboard-user');
        window.removeEventListener('keydown', handleFirstTab);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
      document.body.classList.remove('keyboard-user');
      window.addEventListener('keydown', handleFirstTab);
    };

    window.addEventListener('keydown', handleFirstTab);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleFirstTab);
      window.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser;
}
