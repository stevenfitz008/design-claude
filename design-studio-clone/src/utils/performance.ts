// Performance optimization utilities
import React from 'react';

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  RAF_WARNING: 16.67, // 60fps threshold
  RAF_CRITICAL: 33.33, // 30fps threshold
  RENDER_TIME_WARNING: 50,
  RENDER_TIME_CRITICAL: 100,
} as const;

// Enhanced throttle function to reduce excessive calls
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  let lastArgs: Parameters<T>;
  let lastResult: any;
  
  return function (this: any, ...args: Parameters<T>) {
    lastArgs = args;
    
    if (!inThrottle) {
      lastResult = func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        // Execute with most recent args if called during throttle
        if (lastArgs !== args) {
          lastResult = func.apply(this, lastArgs);
        }
      }, limit);
    }
    
    return lastResult;
  };
};

// Debounce function to delay expensive operations
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

// Optimized requestAnimationFrame that prevents stacking
let rafId: number | null = null;

export const optimizedRaf = (callback: () => void) => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
  }
  rafId = requestAnimationFrame(() => {
    callback();
    rafId = null;
  });
};

// Break heavy operations into smaller chunks
export const yieldToMain = () => {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
};

// Performance-aware setTimeout wrapper
export const performanceTimeout = (callback: () => void, delay: number = 0) => {
  return setTimeout(() => {
    const start = performance.now();
    callback();
    const end = performance.now();
    
    // If operation took too long, warn in development but suppress violation
    if (import.meta.env.DEV && (end - start) > 16) {
      // Only log to our debug console, not browser console
      if ((window as any).__console) {
        (window as any).__console.log(`Heavy operation detected: ${end - start}ms`);
      }
    }
  }, delay);
};

// Performance monitoring class
class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private rafTimes: number[] = [];
  private renderTimes: number[] = [];
  private violationCounts = { warning: 0, critical: 0 };
  private isMonitoring = false;

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startMonitoring() {
    if (this.isMonitoring || !import.meta.env.DEV) return;
    this.isMonitoring = true;
    
    // Monitor long tasks (only in supported browsers)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > PERFORMANCE_THRESHOLDS.RAF_WARNING) {
              this.violationCounts.warning++;
              if ((window as any).__console) {
                (window as any).__console.warn(`Long task: ${entry.duration.toFixed(2)}ms`);
              }
            }
            if (entry.duration > PERFORMANCE_THRESHOLDS.RAF_CRITICAL) {
              this.violationCounts.critical++;
            }
          });
        });
        
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Silently fail if longtask monitoring isn't supported
      }
    }
  }

  recordRAFTime(duration: number) {
    this.rafTimes.push(duration);
    if (this.rafTimes.length > 100) this.rafTimes.shift();
  }

  recordRenderTime(duration: number) {
    this.renderTimes.push(duration);
    if (this.renderTimes.length > 100) this.renderTimes.shift();
  }

  getStats() {
    const avgRAF = this.rafTimes.length ? 
      this.rafTimes.reduce((a, b) => a + b, 0) / this.rafTimes.length : 0;
    const avgRender = this.renderTimes.length ? 
      this.renderTimes.reduce((a, b) => a + b, 0) / this.renderTimes.length : 0;

    return {
      avgRAFTime: avgRAF,
      avgRenderTime: avgRender,
      violations: this.violationCounts,
      isHealthy: avgRAF < PERFORMANCE_THRESHOLDS.RAF_WARNING
    };
  }
}

export const perfMonitor = PerformanceMonitor.getInstance();

// RequestAnimationFrame wrapper with performance monitoring
export function rafWithPerfCheck(callback: () => void): number {
  const start = performance.now();
  
  return requestAnimationFrame(() => {
    const frameStart = performance.now();
    callback();
    const frameEnd = performance.now();
    
    const rafDuration = frameEnd - start;
    const renderDuration = frameEnd - frameStart;
    
    perfMonitor.recordRAFTime(rafDuration);
    perfMonitor.recordRenderTime(renderDuration);
    
    if (import.meta.env.DEV && rafDuration > PERFORMANCE_THRESHOLDS.RAF_WARNING) {
      if ((window as any).__console) {
        (window as any).__console.warn(`RAF violation: ${rafDuration.toFixed(2)}ms`);
      }
    }
  });
}

// React-specific performance hooks
export const usePerformantCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  throttleMs = 16
): T => {
  const throttledCallback = React.useMemo(
    () => throttle(callback, throttleMs),
    [callback, throttleMs]
  );
  
  return React.useCallback(throttledCallback, deps) as T;
};

export const usePerformantEffect = (
  effect: React.EffectCallback,
  deps?: React.DependencyList,
  delay = 0
) => {
  React.useEffect(() => {
    if (delay === 0) {
      return effect();
    }
    
    const timeoutId = performanceTimeout(() => {
      effect();
    }, delay);
    
    return () => clearTimeout(timeoutId);
  }, deps);
};

// Canvas-specific optimizations
export const canvasOptimizations = {
  // Batch canvas operations to reduce redraws
  batchCanvasOperations: debounce((operations: (() => void)[]) => {
    const start = performance.now();
    operations.forEach(op => op());
    const duration = performance.now() - start;
    
    if (import.meta.env.DEV && duration > PERFORMANCE_THRESHOLDS.RENDER_TIME_WARNING) {
      if ((window as any).__console) {
        (window as any).__console.warn(`Batched canvas ops took: ${duration.toFixed(2)}ms`);
      }
    }
  }, 16),

  // Optimize Konva stage updates
  optimizeStageUpdates: throttle((stage: any) => {
    if (stage?.batchDraw) {
      rafWithPerfCheck(() => stage.batchDraw());
    }
  }, 16),

  // Virtual scrolling for large lists
  calculateVisibleRange: (
    scrollTop: number,
    itemHeight: number,
    containerHeight: number,
    totalItems: number,
    overscan = 5
  ) => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      Math.ceil((scrollTop + containerHeight) / itemHeight),
      totalItems - 1
    );
    
    return {
      start: Math.max(0, visibleStart - overscan),
      end: Math.min(totalItems - 1, visibleEnd + overscan)
    };
  }
};

// Enhanced RAF queue for better batching
class RAFQueue {
  private queue: Array<() => void> = [];
  private isScheduled = false;
  
  add(callback: () => void) {
    this.queue.push(callback);
    this.schedule();
  }
  
  private schedule() {
    if (this.isScheduled || this.queue.length === 0) return;
    
    this.isScheduled = true;
    requestAnimationFrame(() => {
      const start = performance.now();
      const callbacks = [...this.queue];
      this.queue.length = 0;
      this.isScheduled = false;
      
      // Execute callbacks in chunks to prevent long frames
      const CHUNK_SIZE = 5;
      const executeChunk = (startIndex: number) => {
        const endIndex = Math.min(startIndex + CHUNK_SIZE, callbacks.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          try {
            callbacks[i]();
          } catch (error) {
            if ((window as any).__console) {
              (window as any).__console.error('RAF callback error:', error);
            }
          }
        }
        
        const elapsed = performance.now() - start;
        if (endIndex < callbacks.length && elapsed < 10) { // Leave time for other work
          executeChunk(endIndex);
        } else if (endIndex < callbacks.length) {
          // Schedule remaining callbacks for next frame
          requestAnimationFrame(() => executeChunk(endIndex));
        }
      };
      
      executeChunk(0);
      
      const duration = performance.now() - start;
      perfMonitor.recordRAFTime(duration);
    });
  }
}

const rafQueue = new RAFQueue();

// Enhanced RAF with automatic batching
export const batchedRAF = (callback: () => void) => {
  rafQueue.add(callback);
};

// React-specific optimizations
export const useStableCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  const callbackRef = React.useRef(callback);
  
  React.useLayoutEffect(() => {
    callbackRef.current = callback;
  });
  
  return React.useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, deps) as T;
};

// Optimized memo with performance tracking
export const performantMemo = <T extends React.ComponentType<any>>(
  Component: T,
  areEqual?: (prevProps: any, nextProps: any) => boolean
): T => {
  const MemoComponent = React.memo(Component, areEqual) as any;
  
  if (import.meta.env.DEV) {
    MemoComponent.displayName = `PerformantMemo(${Component.displayName || Component.name})`;
  }
  
  return MemoComponent;
};

// Development performance logging
export function enableDevPerformanceLogging() {
  if (!import.meta.env.DEV) return;
  
  perfMonitor.startMonitoring();
  
  // Log performance stats periodically
  let logInterval: number;
  
  const startLogging = () => {
    logInterval = window.setInterval(() => {
      const stats = perfMonitor.getStats();
      if (!stats.isHealthy && (window as any).__console) {
        (window as any).__console.warn('Performance stats:', stats);
      }
      
      // Also check and report violations from console monitoring
      if ((window as any).__logPerformanceReport) {
        (window as any).__logPerformanceReport();
      }
    }, 30000); // Every 30 seconds
  };
  
  // Auto-start logging
  if (document.readyState === 'complete') {
    startLogging();
  } else {
    window.addEventListener('load', startLogging, { once: true });
  }
  
  // Make performance tools available globally
  if (import.meta.env.DEV) {
    (window as any).__perfMonitor = perfMonitor;
    (window as any).__batchedRAF = batchedRAF;
  }
  
  // Cleanup
  return () => {
    if (logInterval) clearInterval(logInterval);
  };
}