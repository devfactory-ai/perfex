/**
 * Keyboard Shortcuts Hook
 * Global keyboard shortcuts for improved UX
 */

import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
  category: string;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled: boolean = true) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input/textarea
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow escape in inputs
      if (event.key !== 'Escape') return;
    }

    for (const shortcut of shortcutsRef.current) {
      const ctrlMatch = shortcut.ctrl ? (isMac ? event.metaKey : event.ctrlKey) : true;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const metaMatch = shortcut.meta ? event.metaKey : true;

      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        ctrlMatch && shiftMatch && altMatch && (shortcut.meta ? metaMatch : true)
      ) {
        event.preventDefault();
        shortcut.action();
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useGlobalShortcuts() {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    // Navigation
    {
      key: 'g',
      ctrl: true,
      description: 'Aller au tableau de bord',
      action: () => navigate('/dashboard'),
      category: 'Navigation',
    },
    {
      key: 'p',
      ctrl: true,
      shift: true,
      description: 'Recherche rapide',
      action: () => document.dispatchEvent(new CustomEvent('open-command-palette')),
      category: 'Navigation',
    },
    {
      key: 'k',
      ctrl: true,
      description: 'Ouvrir la palette de commandes',
      action: () => document.dispatchEvent(new CustomEvent('open-command-palette')),
      category: 'Navigation',
    },

    // Dialyse
    {
      key: 'd',
      ctrl: true,
      shift: true,
      description: 'Dialyse - Patients',
      action: () => navigate('/dialyse/patients'),
      category: 'Dialyse',
    },
    {
      key: 's',
      ctrl: true,
      shift: true,
      description: 'Dialyse - Sessions',
      action: () => navigate('/dialyse/sessions'),
      category: 'Dialyse',
    },

    // Finance
    {
      key: 'i',
      ctrl: true,
      shift: true,
      description: 'Nouvelle facture',
      action: () => navigate('/invoices/new'),
      category: 'Finance',
    },

    // General
    {
      key: 'Escape',
      description: 'Fermer modal/dialog',
      action: () => document.dispatchEvent(new CustomEvent('close-modal')),
      category: 'General',
    },
    {
      key: '?',
      shift: true,
      description: 'Afficher les raccourcis',
      action: () => document.dispatchEvent(new CustomEvent('show-shortcuts')),
      category: 'General',
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}

export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

export function getShortcutsByCategory(shortcuts: KeyboardShortcut[]): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, KeyboardShortcut[]>);
}
