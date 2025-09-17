/**
 * High-Performance Console Override
 * Eliminates console.log performance overhead in development
 */

// Store original console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info,
  debug: console.debug
};

// Fast no-op functions for performance
const noop = () => {};

// Only enable console in development with performance mode
const enableConsole = import.meta.env.DEV && !import.meta.env.PROD;

// Override console methods for performance
if (!enableConsole) {
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
  // Keep console.error for critical issues
}

// Export for manual control if needed
export const restoreConsole = () => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
  console.debug = originalConsole.debug;
};

export const disableConsole = () => {
  console.log = noop;
  console.warn = noop;
  console.info = noop;
  console.debug = noop;
};