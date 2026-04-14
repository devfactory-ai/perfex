import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/layouts/DashboardLayout';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { PasswordlessVerifyPage } from './pages/auth/PasswordlessVerifyPage';
import { DashboardPage } from './pages/DashboardPage';

// Import route registry
import { allRoutes, routeInfo } from './routes';

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Log route info in development
if (import.meta.env.DEV) {
  console.log(`[Perfex] App Variant: ${routeInfo.variant}`);
  console.log(`[Perfex] Routes loaded: ${routeInfo.totalRoutes}`);
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <LanguageProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  {/* Auth routes */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/auth/passwordless" element={<PasswordlessVerifyPage />} />

                  {/* Main dashboard routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    {/* Dashboard index */}
                    <Route index element={<DashboardPage />} />

                    {/* Dynamic routes from registry */}
                    {allRoutes.map((route) => (
                      <Route
                        key={route.path}
                        path={route.path}
                        element={
                          <Suspense fallback={<PageLoader />}>
                            <route.component />
                          </Suspense>
                        }
                      />
                    ))}
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
