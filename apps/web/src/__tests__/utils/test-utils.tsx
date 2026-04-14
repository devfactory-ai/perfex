import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Create a new QueryClient for each test
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// All providers wrapper
interface AllProvidersProps {
  children: React.ReactNode;
  initialEntries?: string[];
}

function AllProviders({ children, initialEntries = ['/'] }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

// Custom render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

// Custom render function
function customRender(
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult {
  const { initialEntries, ...renderOptions } = options;

  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries}>
        {children}
      </AllProviders>
    ),
    ...renderOptions,
  });
}

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Utility to wait for element
export async function waitForElement(
  callback: () => HTMLElement | null,
  timeout = 1000
): Promise<HTMLElement> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = callback();
    if (element) return element;
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('Element not found within timeout');
}

// Utility to mock console
export function mockConsole() {
  const originalConsole = { ...console };
  const mocks = {
    log: vi.spyOn(console, 'log').mockImplementation(() => {}),
    error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
    info: vi.spyOn(console, 'info').mockImplementation(() => {}),
  };

  return {
    mocks,
    restore: () => {
      Object.assign(console, originalConsole);
    },
  };
}

// Utility to create delayed promise
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Utility to flush all pending promises
export async function flushPromises(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

// Utility to create mock event
export function createMockEvent<T extends Partial<Event>>(overrides: T = {} as T): Event {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as Event;
}

// Utility to create mock form event
export function createMockFormEvent<T extends Partial<React.FormEvent>>(
  overrides: T = {} as T
): React.FormEvent {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: document.createElement('form'),
    ...overrides,
  } as unknown as React.FormEvent;
}
