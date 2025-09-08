import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorLogger } from '../../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    errorLogger.logError(error, {
      component: this.props.componentName || 'ErrorBoundary',
      action: 'Component Error',
      additionalData: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true
      }
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          margin: '10px',
          backgroundColor: '#ff4757',
          color: 'white',
          borderRadius: '8px',
          fontFamily: 'monospace'
        }}>
          <h2>🚨 Component Error</h2>
          <details style={{ marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
              Error Details (click to expand)
            </summary>
            <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '4px' }}>
              <p><strong>Component:</strong> {this.props.componentName || 'Unknown'}</p>
              <p><strong>Error:</strong> {this.state.error?.message}</p>
              {this.state.error?.stack && (
                <details>
                  <summary>Stack Trace</summary>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>{this.state.error.stack}</pre>
                </details>
              )}
              {this.state.errorInfo?.componentStack && (
                <details>
                  <summary>Component Stack</summary>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>{this.state.errorInfo.componentStack}</pre>
                </details>
              )}
            </div>
          </details>
          <button 
            onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: 'white',
              color: '#ff4757',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}