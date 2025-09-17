/**
 * Production-Safe Logging Utility
 * This replaces all console.log statements with performance-optimized logging
 * that only runs in development mode and respects the debug console setup.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  info: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

/**
 * Creates a namespaced logger that only logs in development mode
 * Uses the existing __console system or falls back to regular console
 */
export const createLogger = (namespace: string): Logger => {
  const isDev = import.meta.env.DEV;
  const prefix = `[${namespace}]`;

  const createLogFunction = (level: LogLevel) => {
    return (...args: any[]) => {
      // Only log in development mode
      if (!isDev) return;

      // Use existing debug console if available, otherwise regular console
      const debugConsole = (window as any).__console;
      const targetConsole = debugConsole || console;

      // For errors, always log even in production
      if (level === 'error') {
        console.error(prefix, ...args);
        return;
      }

      // For other levels, only log in development
      if (targetConsole && targetConsole[level]) {
        targetConsole[level](prefix, ...args);
      }
    };
  };

  return {
    log: createLogFunction('log'),
    warn: createLogFunction('warn'),
    error: createLogFunction('error'),
    info: createLogFunction('info'),
    debug: createLogFunction('debug')
  };
};

/**
 * Performance-aware logging that tracks heavy operations
 */
export const createPerformanceLogger = (namespace: string) => {
  const logger = createLogger(namespace);

  return {
    ...logger,

    /**
     * Times an operation and logs if it's too slow
     */
    timeOperation: <T>(name: string, operation: () => T, warnThreshold = 16): T => {
      if (!import.meta.env.DEV) {
        return operation();
      }

      const start = performance.now();
      const result = operation();
      const duration = performance.now() - start;

      if (duration > warnThreshold) {
        logger.warn(`Slow operation '${name}': ${duration.toFixed(2)}ms`);
      } else {
        logger.debug(`${name}: ${duration.toFixed(2)}ms`);
      }

      return result;
    },

    /**
     * Logs performance metrics for canvas operations
     */
    logCanvasMetrics: (metrics: {
      elementsCount?: number;
      renderTime?: number;
      frameRate?: number;
      memoryUsage?: number;
    }) => {
      if (!import.meta.env.DEV) return;

      const warnings = [];

      if (metrics.renderTime && metrics.renderTime > 16.67) {
        warnings.push(`Slow render: ${metrics.renderTime.toFixed(2)}ms`);
      }

      if (metrics.frameRate && metrics.frameRate < 30) {
        warnings.push(`Low FPS: ${metrics.frameRate.toFixed(1)}`);
      }

      if (metrics.memoryUsage && metrics.memoryUsage > 100) {
        warnings.push(`High memory: ${metrics.memoryUsage.toFixed(1)}MB`);
      }

      if (warnings.length > 0) {
        logger.warn('Canvas performance issues:', warnings.join(', '), metrics);
      } else {
        logger.debug('Canvas metrics:', metrics);
      }
    }
  };
};

/**
 * Pre-configured loggers for common components
 */
export const canvasLogger = createPerformanceLogger('Canvas');
export const imageLogger = createLogger('ImageElement');
export const textLogger = createLogger('TextElement');
export const shapeLogger = createLogger('ShapeElement');
export const transformLogger = createLogger('Transform');
export const cropLogger = createLogger('Crop');
export const dragDropLogger = createLogger('DragDrop');

/**
 * Development-only assertion logging
 */
export const assertLogger = createLogger('Assert');

/**
 * Replaces console.log with production-safe equivalent
 * Use this to quickly replace existing console.log statements
 */
export const devLog = (...args: any[]) => {
  if (import.meta.env.DEV && (window as any).__console) {
    (window as any).__console.log(...args);
  }
};

export const devWarn = (...args: any[]) => {
  if (import.meta.env.DEV) {
    console.warn(...args);
  }
};

export const devError = (...args: any[]) => {
  // Always log errors
  console.error(...args);
};

/**
 * Global performance monitoring integration
 */
if (import.meta.env.DEV) {
  // Make loggers available for debugging
  (window as any).__canvasLogger = canvasLogger;
  (window as any).__imageLogger = imageLogger;
}