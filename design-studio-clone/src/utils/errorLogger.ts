// Comprehensive error logging system for the Design Studio frontend

export interface ErrorDetails {
  message: string;
  stack?: string;
  component?: string;
  action?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  additionalData?: Record<string, any>;
}

class ErrorLogger {
  private errors: ErrorDetails[] = [];
  private maxErrors = 100;

  // Log any error with context
  logError(error: Error | string, context?: {
    component?: string;
    action?: string;
    additionalData?: Record<string, any>;
  }) {
    const errorDetails: ErrorDetails = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'object' ? error.stack : undefined,
      component: context?.component || 'Unknown',
      action: context?.action || 'Unknown',
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData: context?.additionalData
    };

    this.errors.push(errorDetails);
    
    // Keep only the latest errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Console log with styling
    console.group(`🚨 Error in ${errorDetails.component}`);
    console.error('Message:', errorDetails.message);
    if (errorDetails.stack) console.error('Stack:', errorDetails.stack);
    if (errorDetails.action) console.error('Action:', errorDetails.action);
    if (errorDetails.additionalData) console.error('Additional Data:', errorDetails.additionalData);
    console.error('Full Details:', errorDetails);
    console.groupEnd();

    // Store in localStorage for persistence
    try {
      localStorage.setItem('design-studio-errors', JSON.stringify(this.errors));
    } catch (e) {
      console.warn('Failed to store errors in localStorage:', e);
    }
  }

  // Get all logged errors
  getErrors(): ErrorDetails[] {
    return [...this.errors];
  }

  // Clear all errors
  clearErrors() {
    this.errors = [];
    localStorage.removeItem('design-studio-errors');
  }

  // Get error summary
  getErrorSummary() {
    const componentCounts = this.errors.reduce((acc, error) => {
      acc[error.component || 'Unknown'] = (acc[error.component || 'Unknown'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errors.length,
      componentCounts,
      latestError: this.errors[this.errors.length - 1],
      timeRange: this.errors.length > 0 ? {
        first: new Date(this.errors[0].timestamp).toISOString(),
        last: new Date(this.errors[this.errors.length - 1].timestamp).toISOString()
      } : null
    };
  }

  // Load errors from localStorage on initialization
  loadStoredErrors() {
    try {
      const stored = localStorage.getItem('design-studio-errors');
      if (stored) {
        this.errors = JSON.parse(stored);
        console.log(`📋 Loaded ${this.errors.length} stored errors`);
      }
    } catch (e) {
      console.warn('Failed to load stored errors:', e);
    }
  }
}

// Global error logger instance
export const errorLogger = new ErrorLogger();

// Initialize on load
errorLogger.loadStoredErrors();

// Global error handlers
window.addEventListener('error', (event) => {
  errorLogger.logError(event.error || event.message, {
    component: 'Global',
    action: 'Unhandled Error',
    additionalData: {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    }
  });
});

window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError(event.reason, {
    component: 'Global',
    action: 'Unhandled Promise Rejection'
  });
});

// Console commands for debugging
(window as any).designStudioDebug = {
  errors: () => errorLogger.getErrors(),
  errorSummary: () => errorLogger.getErrorSummary(),
  clearErrors: () => errorLogger.clearErrors(),
  logTest: () => errorLogger.logError('Test error', { component: 'Debug', action: 'Test' })
};

console.log('🔧 Design Studio Error Logger initialized. Use designStudioDebug in console for debugging.');