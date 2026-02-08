/**
 * Accessibility Utilities
 * Provides helpers for ARIA attributes, keyboard navigation, and screen reader support
 */

/**
 * Generate unique ID for ARIA references
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * ARIA Live Region Announcements
 * Programmatically announces messages to screen readers
 */
class AriaAnnouncer {
  private static instance: AriaAnnouncer;
  private politeRegion: HTMLElement | null = null;
  private assertiveRegion: HTMLElement | null = null;

  private constructor() {
    this.createRegions();
  }

  public static getInstance(): AriaAnnouncer {
    if (!AriaAnnouncer.instance) {
      AriaAnnouncer.instance = new AriaAnnouncer();
    }
    return AriaAnnouncer.instance;
  }

  private createRegions(): void {
    // Create polite region
    this.politeRegion = document.createElement('div');
    this.politeRegion.setAttribute('role', 'status');
    this.politeRegion.setAttribute('aria-live', 'polite');
    this.politeRegion.setAttribute('aria-atomic', 'true');
    this.politeRegion.className = 'sr-only';
    document.body.appendChild(this.politeRegion);

    // Create assertive region
    this.assertiveRegion = document.createElement('div');
    this.assertiveRegion.setAttribute('role', 'alert');
    this.assertiveRegion.setAttribute('aria-live', 'assertive');
    this.assertiveRegion.setAttribute('aria-atomic', 'true');
    this.assertiveRegion.className = 'sr-only';
    document.body.appendChild(this.assertiveRegion);
  }

  public announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const region = priority === 'assertive' ? this.assertiveRegion : this.politeRegion;
    if (region) {
      // Clear and re-set to trigger announcement
      region.textContent = '';
      setTimeout(() => {
        region.textContent = message;
      }, 100);
    }
  }
}

/**
 * Announce message to screen readers
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof document !== 'undefined') {
    AriaAnnouncer.getInstance().announce(message, priority);
  }
}

/**
 * Focus management utilities
 */
export const focusUtils = {
  /**
   * Move focus to an element
   */
  focusElement(element: HTMLElement | null): void {
    if (element) {
      element.focus();
    }
  },

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(focusableSelectors));
  },

  /**
   * Trap focus within a container (for modals/dialogs)
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  },

  /**
   * Return focus to a previously focused element
   */
  restoreFocus(element: HTMLElement | null): void {
    if (element && element.focus) {
      element.focus();
    }
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboardUtils = {
  /**
   * Check if Enter or Space was pressed
   */
  isActivationKey(event: KeyboardEvent): boolean {
    return event.key === 'Enter' || event.key === ' ';
  },

  /**
   * Check if Escape was pressed
   */
  isEscapeKey(event: KeyboardEvent): boolean {
    return event.key === 'Escape';
  },

  /**
   * Handle arrow key navigation in a list
   */
  handleArrowNavigation(
    event: KeyboardEvent,
    items: HTMLElement[],
    currentIndex: number,
    options: { wrap?: boolean; vertical?: boolean } = {}
  ): number {
    const { wrap = true, vertical = true } = options;
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';

    let newIndex = currentIndex;

    if (event.key === prevKey) {
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : wrap ? items.length - 1 : currentIndex;
    } else if (event.key === nextKey) {
      event.preventDefault();
      newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : wrap ? 0 : currentIndex;
    } else if (event.key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      newIndex = items.length - 1;
    }

    items[newIndex]?.focus();
    return newIndex;
  },
};

/**
 * ARIA attribute builders
 */
export const ariaAttrs = {
  /**
   * Build ARIA attributes for a dialog/modal
   */
  dialog(labelledBy: string, describedBy?: string): Record<string, string> {
    return {
      role: 'dialog',
      'aria-modal': 'true',
      'aria-labelledby': labelledBy,
      ...(describedBy && { 'aria-describedby': describedBy }),
    };
  },

  /**
   * Build ARIA attributes for an alert
   */
  alert(type: 'error' | 'warning' | 'info' | 'success'): Record<string, string> {
    return {
      role: type === 'error' ? 'alert' : 'status',
      'aria-live': type === 'error' ? 'assertive' : 'polite',
    };
  },

  /**
   * Build ARIA attributes for a loading state
   */
  loading(isLoading: boolean, loadingMessage?: string): Record<string, string | boolean> {
    return {
      'aria-busy': isLoading,
      ...(isLoading && loadingMessage && { 'aria-label': loadingMessage }),
    };
  },

  /**
   * Build ARIA attributes for expandable content
   */
  expandable(isExpanded: boolean, controlsId: string): Record<string, string | boolean> {
    return {
      'aria-expanded': isExpanded,
      'aria-controls': controlsId,
    };
  },

  /**
   * Build ARIA attributes for a tab
   */
  tab(isSelected: boolean, tabPanelId: string): Record<string, string | boolean> {
    return {
      role: 'tab',
      'aria-selected': isSelected,
      'aria-controls': tabPanelId,
      tabIndex: isSelected ? 0 : -1,
    };
  },

  /**
   * Build ARIA attributes for a tab panel
   */
  tabPanel(isHidden: boolean, tabId: string): Record<string, string | boolean> {
    return {
      role: 'tabpanel',
      'aria-labelledby': tabId,
      hidden: isHidden,
      tabIndex: 0,
    };
  },

  /**
   * Build ARIA attributes for a menu
   */
  menu(labelledBy?: string): Record<string, string> {
    return {
      role: 'menu',
      ...(labelledBy && { 'aria-labelledby': labelledBy }),
    };
  },

  /**
   * Build ARIA attributes for a menu item
   */
  menuItem(disabled?: boolean): Record<string, string | boolean | number> {
    return {
      role: 'menuitem',
      tabIndex: -1,
      ...(disabled && { 'aria-disabled': true }),
    };
  },

  /**
   * Build ARIA attributes for pagination
   */
  pagination(currentPage: number, totalPages: number): Record<string, string> {
    return {
      role: 'navigation',
      'aria-label': `Pagination, page ${currentPage} sur ${totalPages}`,
    };
  },

  /**
   * Build ARIA attributes for a table
   */
  table(caption: string, sortable?: boolean): Record<string, string | boolean> {
    return {
      role: 'table',
      'aria-label': caption,
      ...(sortable && { 'aria-describedby': 'table-sort-instructions' }),
    };
  },

  /**
   * Build ARIA attributes for a sortable table header
   */
  sortableHeader(
    sortDirection: 'ascending' | 'descending' | 'none',
    columnName: string
  ): Record<string, string> {
    return {
      'aria-sort': sortDirection,
      'aria-label': `Trier par ${columnName}${
        sortDirection !== 'none' ? `, actuellement ${sortDirection === 'ascending' ? 'croissant' : 'decroissant'}` : ''
      }`,
    };
  },

  /**
   * Build ARIA attributes for form validation
   */
  formField(
    hasError: boolean,
    errorId?: string,
    describedBy?: string
  ): Record<string, string | boolean> {
    const descriptions = [describedBy, hasError && errorId].filter(Boolean).join(' ');
    return {
      'aria-invalid': hasError,
      ...(descriptions && { 'aria-describedby': descriptions }),
    };
  },
};

/**
 * Skip link component props
 */
export interface SkipLinkProps {
  targetId: string;
  label?: string;
}

/**
 * Create skip link HTML
 */
export function createSkipLinkHtml(targetId: string, label = 'Aller au contenu principal'): string {
  return `<a href="#${targetId}" class="skip-link">${label}</a>`;
}

/**
 * Healthcare-specific accessibility helpers
 */
export const healthcareA11y = {
  /**
   * Announce patient context change
   */
  announcePatientChange(patientName: string): void {
    announce(`Patient selectionne: ${patientName}`, 'polite');
  },

  /**
   * Announce alert status
   */
  announceAlert(severity: 'critical' | 'high' | 'medium' | 'low', message: string): void {
    const priority = severity === 'critical' || severity === 'high' ? 'assertive' : 'polite';
    announce(`Alerte ${severity}: ${message}`, priority);
  },

  /**
   * Announce form submission result
   */
  announceFormResult(success: boolean, entityType: string): void {
    if (success) {
      announce(`${entityType} enregistre avec succes`, 'polite');
    } else {
      announce(`Erreur lors de l'enregistrement du ${entityType}`, 'assertive');
    }
  },

  /**
   * Announce navigation
   */
  announceNavigation(pageName: string): void {
    announce(`Navigation vers ${pageName}`, 'polite');
  },

  /**
   * Announce loading state
   */
  announceLoading(isLoading: boolean, context?: string): void {
    if (isLoading) {
      announce(`Chargement${context ? ` de ${context}` : ''} en cours`, 'polite');
    } else {
      announce('Chargement termine', 'polite');
    }
  },
};

/**
 * CSS class for visually hidden but screen reader accessible content
 */
export const srOnlyClass = 'sr-only';

/**
 * Inert polyfill - make content inert (non-interactive)
 */
export function setInert(element: HTMLElement, inert: boolean): void {
  if (inert) {
    element.setAttribute('inert', '');
    element.setAttribute('aria-hidden', 'true');
  } else {
    element.removeAttribute('inert');
    element.removeAttribute('aria-hidden');
  }
}
