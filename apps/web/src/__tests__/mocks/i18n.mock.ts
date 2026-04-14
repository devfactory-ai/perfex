import { vi } from 'vitest';

// Mock useTranslation hook
export const mockT = vi.fn((key: string, options?: Record<string, unknown>) => {
  // Return the key itself, optionally with interpolation
  if (options) {
    let result = key;
    Object.entries(options).forEach(([k, v]) => {
      result = result.replace(`{{${k}}}`, String(v));
    });
    return result;
  }
  return key;
});

export const mockI18n = {
  language: 'fr',
  languages: ['fr', 'en'],
  changeLanguage: vi.fn().mockResolvedValue(undefined),
  t: mockT,
  exists: vi.fn().mockReturnValue(true),
  getFixedT: vi.fn().mockReturnValue(mockT),
  hasLoadedNamespace: vi.fn().mockReturnValue(true),
  loadNamespaces: vi.fn().mockResolvedValue(undefined),
  loadLanguages: vi.fn().mockResolvedValue(undefined),
  reloadResources: vi.fn().mockResolvedValue(undefined),
  setDefaultNamespace: vi.fn(),
  dir: vi.fn().mockReturnValue('ltr'),
  format: vi.fn((value: string) => value),
};

export const mockUseTranslation = () => ({
  t: mockT,
  i18n: mockI18n,
  ready: true,
});

// Mock Trans component
export const MockTrans = ({ children }: { children: React.ReactNode }) => children;

// Reset i18n mocks
export function resetI18nMocks() {
  mockT.mockClear();
  mockI18n.changeLanguage.mockClear();
}
