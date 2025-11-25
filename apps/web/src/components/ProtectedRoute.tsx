/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  console.log('[ProtectedRoute] Render', {
    isAuthenticated,
    isLoading,
    path: location.pathname
  });

  useEffect(() => {
    console.log('[ProtectedRoute] Effect triggered', { isAuthenticated, isLoading });
    if (!isLoading && !isAuthenticated) {
      console.log('[ProtectedRoute] NOT authenticated - redirecting to /login');
      navigate('/login', { state: { from: location }, replace: true });
    } else {
      console.log('[ProtectedRoute] Authenticated or still loading - staying on page');
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
