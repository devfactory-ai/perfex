/**
 * Healthcare Module Error Boundary
 * Specialized error boundary for healthcare modules with medical-appropriate messaging
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ArrowLeft, Phone, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  moduleName: 'dialyse' | 'cardiology' | 'ophthalmology';
  patientContext?: {
    id: string;
    name?: string;
  };
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
}

const moduleLabels = {
  dialyse: 'Dialyse',
  cardiology: 'Cardiologie',
  ophthalmology: 'Ophtalmologie',
};

const moduleColors = {
  dialyse: 'blue',
  cardiology: 'red',
  ophthalmology: 'green',
};

class HealthcareErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
    return { hasError: true, error, errorId };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Healthcare module error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);

    // Log to error tracking service (if available)
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo): void {
    // This would typically send to an error tracking service
    const errorData = {
      errorId: this.state.errorId,
      module: this.props.moduleName,
      patientId: this.props.patientContext?.id,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    };

    console.error('Error logged:', errorData);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    });
  };

  handleGoBack = (): void => {
    window.history.back();
  };

  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      const { moduleName, patientContext } = this.props;
      const moduleLabel = moduleLabels[moduleName];
      const color = moduleColors[moduleName];

      return (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className={`w-16 h-16 bg-${color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
                <AlertCircle className={`w-8 h-8 text-${color}-600`} />
              </div>
              <CardTitle className="text-xl">
                Erreur dans le module {moduleLabel}
              </CardTitle>
              <CardDescription>
                Une erreur inattendue s'est produite. Vos donnees sont en securite.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {patientContext && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>Contexte patient:</strong> {patientContext.name || patientContext.id}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Notez ces informations si vous devez contacter le support.
                  </p>
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-mono">
                  Reference erreur: {this.state.errorId}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button onClick={this.handleReset} className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reessayer
                </Button>

                <Button onClick={this.handleGoBack} variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Retour a la page precedente
                </Button>
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-600 text-center mb-3">
                  Si le probleme persiste, contactez le support technique:
                </p>
                <div className="flex justify-center gap-4">
                  <Button variant="ghost" size="sm">
                    <Phone className="w-4 h-4 mr-2" />
                    Support
                  </Button>
                  <Button variant="ghost" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Signaler
                  </Button>
                </div>
              </div>

              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Details techniques (dev uniquement)
                  </summary>
                  <pre className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-xs text-red-700 overflow-auto max-h-32">
                    {this.state.error.message}
                    {'\n\n'}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap healthcare components with error boundary
 */
export function withHealthcareErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleName: 'dialyse' | 'cardiology' | 'ophthalmology'
): React.FC<P & { patientContext?: { id: string; name?: string } }> {
  return function WithHealthcareErrorBoundary(props) {
    const { patientContext, ...restProps } = props as any;
    return (
      <HealthcareErrorBoundary moduleName={moduleName} patientContext={patientContext}>
        <WrappedComponent {...(restProps as P)} />
      </HealthcareErrorBoundary>
    );
  };
}

export default HealthcareErrorBoundary;
