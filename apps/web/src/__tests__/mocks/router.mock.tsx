import React from 'react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock navigation functions
export const mockNavigate = vi.fn();
export const mockLocation = {
  pathname: '/',
  search: '',
  hash: '',
  state: null,
  key: 'default',
};

// Mock useNavigate
export const mockUseNavigate = () => mockNavigate;

// Mock useLocation
export const mockUseLocation = () => mockLocation;

// Mock useParams
export const mockUseParams = vi.fn(() => ({}));

// Mock useSearchParams
export const mockSearchParams = new URLSearchParams();
export const mockSetSearchParams = vi.fn();
export const mockUseSearchParams = () => [mockSearchParams, mockSetSearchParams] as const;

// Test wrapper with router
interface TestRouterWrapperProps {
  children: React.ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}

export function TestRouterWrapper({
  children,
  initialEntries = ['/'],
  initialIndex = 0,
}: TestRouterWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {children}
    </MemoryRouter>
  );
}

// Test wrapper with routes
interface TestRoutesWrapperProps {
  children: React.ReactNode;
  path?: string;
  initialEntries?: string[];
}

export function TestRoutesWrapper({
  children,
  path = '/',
  initialEntries = ['/'],
}: TestRoutesWrapperProps) {
  return (
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path={path} element={children} />
        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// Reset all router mocks
export function resetRouterMocks() {
  mockNavigate.mockReset();
  mockUseParams.mockReset().mockReturnValue({});
  mockSetSearchParams.mockReset();
  mockLocation.pathname = '/';
  mockLocation.search = '';
  mockLocation.hash = '';
  mockLocation.state = null;
}
