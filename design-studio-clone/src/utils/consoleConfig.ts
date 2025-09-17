// Console configuration for development
// This file centralizes console log management

export const configureConsole = () => {
  if (import.meta.env.DEV) {
    // Store original methods
    const originalMethods = {
      log: console.log,
      info: console.info,
      debug: console.debug,
      warn: console.warn,
      error: console.error
    };

    // Override methods to suppress logs
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
    
    // Enhanced performance violation tracking
    const originalWarn = console.warn;
    const violations: Array<{type: string, duration: number, timestamp: number, message: string}> = [];
    
    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      
      // Capture and analyze performance violations instead of suppressing
      if (message.includes('[Violation]')) {
        const durationMatch = message.match(/(\d+)ms/);
        const duration = durationMatch ? parseInt(durationMatch[1]) : 0;
        
        let violationType = 'unknown';
        if (message.includes('requestAnimationFrame handler took')) {
          violationType = 'raf';
        } else if (message.includes('setTimeout handler took')) {
          violationType = 'timeout';
        } else if (message.includes('Promise handler took')) {
          violationType = 'promise';
        }
        
        violations.push({
          type: violationType,
          duration,
          timestamp: Date.now(),
          message: message.slice(0, 200) // Truncate long messages
        });
        
        // Store violations for analysis
        (window as any).__performanceViolations = violations;
        
        // Only log severe violations (>50ms) to reduce noise
        if (duration > 50) {
          if ((window as any).__console) {
            (window as any).__console.warn(`🚨 SEVERE ${violationType.toUpperCase()} VIOLATION: ${duration}ms`);
            (window as any).__console.warn(message);
          }
        }
        
        return; // Don't show in regular console
      }
      
      originalWarn.apply(console, args);
    };
    
    // Store original methods for debugging if needed
    (window as any).__console = originalMethods;
    
    // Optional: Re-enable logging for specific debugging
    // Uncomment the line below to enable logging when needed
    // console.log = originalMethods.log;
  }
};

// Utility to temporarily enable logging for debugging
export const enableDebugging = () => {
  if (import.meta.env.DEV && (window as any).__console) {
    const original = (window as any).__console;
    console.log = original.log;
    console.info = original.info;
    console.debug = original.debug;
  }
};

// Utility to disable logging again
export const disableDebugging = () => {
  if (import.meta.env.DEV) {
    console.log = () => {};
    console.info = () => {};
    console.debug = () => {};
  }
};

// Performance violation analysis utilities
export const getPerformanceViolations = () => {
  return (window as any).__performanceViolations || [];
};

export const getViolationStats = () => {
  const violations = getPerformanceViolations();
  const stats = violations.reduce((acc: any, v: any) => {
    acc[v.type] = acc[v.type] || { count: 0, totalDuration: 0, maxDuration: 0 };
    acc[v.type].count++;
    acc[v.type].totalDuration += v.duration;
    acc[v.type].maxDuration = Math.max(acc[v.type].maxDuration, v.duration);
    return acc;
  }, {});
  
  // Calculate averages
  Object.keys(stats).forEach(type => {
    stats[type].avgDuration = Math.round(stats[type].totalDuration / stats[type].count);
  });
  
  return stats;
};

export const logPerformanceReport = () => {
  const violations = getPerformanceViolations();
  const stats = getViolationStats();
  
  if ((window as any).__console) {
    const console = (window as any).__console;
    console.log('📊 PERFORMANCE VIOLATIONS REPORT');
    console.log('=================================');
    console.log(`Total violations: ${violations.length}`);
    
    Object.entries(stats).forEach(([type, data]: [string, any]) => {
      console.log(`${type.toUpperCase()}: ${data.count} violations`);
      console.log(`  - Average: ${data.avgDuration}ms`);
      console.log(`  - Maximum: ${data.maxDuration}ms`);
      console.log(`  - Total time: ${data.totalDuration}ms`);
    });
    
    if (violations.length > 0) {
      console.log('\nRecent violations (last 10):');
      violations.slice(-10).forEach((v: any, i: number) => {
        console.log(`${i + 1}. ${v.type} - ${v.duration}ms`);
      });
    }
  }
};

// Make utilities available globally for browser console debugging
if (import.meta.env.DEV) {
  (window as any).__getPerformanceViolations = getPerformanceViolations;
  (window as any).__getViolationStats = getViolationStats;
  (window as any).__logPerformanceReport = logPerformanceReport;
}