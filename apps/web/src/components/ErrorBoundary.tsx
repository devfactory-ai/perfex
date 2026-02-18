/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });
    console.error('Error caught by boundary:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-xl font-semibold text-gray-900 mb-2">
                Une erreur s'est produite
              </h1>

              <p className="text-gray-600 mb-6">
                Nous sommes désolés, quelque chose s'est mal passé.
              </p>

              <div className="space-y-3">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>

                <Button onClick={this.handleGoHome} className="w-full" variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-6 text-left">
                  <summary className="cursor-pointer text-sm text-gray-500">
                    Détails techniques
                  </summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-xs text-red-600 overflow-auto max-h-48">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

export const MinimalErrorFallback: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Erreur de chargement', onRetry }) => (
  <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
    <AlertTriangle className="w-4 h-4" />
    <span className="text-sm">{message}</span>
    {onRetry && (
      <button onClick={onRetry} className="ml-auto text-sm underline">
        Réessayer
      </button>
    )}
  </div>
);

export default ErrorBoundary;
