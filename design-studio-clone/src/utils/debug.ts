// Debug utilities to control console logging - ERRORS AND WARNINGS ONLY
const ERRORS_WARNINGS_ONLY = true; // Only show errors and warnings

export const debug = {
  log: (...args: any[]) => {
    // Completely silent - no regular logs
  },
  warn: (...args: any[]) => {
    // Always show warnings
    console.warn(...args);
  },
  error: (...args: any[]) => {
    // Always show errors
    console.error(...args);
  },
  api: (...args: any[]) => {
    // Silent - no API logs
  },
  service: (...args: any[]) => {
    // Silent - no service logs
  },
  component: (...args: any[]) => {
    // Silent - no component logs
  }
};

export default debug;