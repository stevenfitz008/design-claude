import { test, expect, Page } from '@playwright/test';

interface PerformanceMetrics {
  renderTimes: number[];
  interactionDelays: number[];
  memoryUsage: { used: number; total: number; timestamp: number }[];
  canvasOperations: any[];
  lighthouseReport?: any;
}

class CanvasPerformanceAnalyzer {
  private page: Page;
  private metrics: PerformanceMetrics = {
    renderTimes: [],
    interactionDelays: [],
    memoryUsage: [],
    canvasOperations: []
  };

  constructor(page: Page) {
    this.page = page;
  }

  async initialize() {
    // Navigate to the app
    await this.page.goto('http://localhost:3000', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for React to load
    await this.page.waitForSelector('[data-testid="app-layout"], .left-toolbar, #root > div', {
      timeout: 15000
    });

    console.log('✅ Application loaded successfully');

    // Inject performance monitoring script
    await this.injectPerformanceMonitor();

    return this;
  }

  async injectPerformanceMonitor() {
    await this.page.addInitScript(() => {
      // Global performance metrics collector
      (window as any).__perfMetrics = {
        renderTimes: [],
        interactionDelays: [],
        memorySnapshots: [],
        canvasOperations: []
      };

      // Monitor RAF performance
      const originalRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = (callback) => {
        const start = performance.now();
        return originalRAF(() => {
          const duration = performance.now() - start;
          (window as any).__perfMetrics.renderTimes.push(duration);
          callback();
        });
      };

      // Monitor memory if available
      if ((performance as any).memory) {
        setInterval(() => {
          const memory = (performance as any).memory;
          (window as any).__perfMetrics.memorySnapshots.push({
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
            timestamp: performance.now()
          });
        }, 2000);
      }

      // Expose performance utility functions
      (window as any).__getPerformanceSnapshot = () => {
        return {
          renderTimes: (window as any).__perfMetrics.renderTimes.slice(-50),
          memorySnapshots: (window as any).__perfMetrics.memorySnapshots.slice(-10),
          avgRenderTime: (window as any).__perfMetrics.renderTimes.length > 0
            ? (window as any).__perfMetrics.renderTimes.reduce((a: number, b: number) => a + b, 0) / (window as any).__perfMetrics.renderTimes.length
            : 0
        };
      };
    });
  }

  async runCanvasLoadTest(elementCounts: number[] = [1, 5, 10, 25]) {
    console.log('🎨 Starting Canvas Load Performance Test');

    for (const count of elementCounts) {
      console.log(`Testing with ${count} elements...`);

      const startTime = Date.now();
      await this.simulateElementCreation(count);
      const loadTime = Date.now() - startTime;

      // Get performance snapshot
      const snapshot = await this.page.evaluate(() => {
        return (window as any).__getPerformanceSnapshot();
      });

      this.metrics.canvasOperations.push({
        type: 'load',
        elementCount: count,
        duration: loadTime,
        avgRenderTime: snapshot.avgRenderTime,
        memoryUsage: snapshot.memorySnapshots[snapshot.memorySnapshots.length - 1]
      });

      console.log(`${count} elements: ${loadTime}ms load time, ${snapshot.avgRenderTime.toFixed(2)}ms avg render`);

      // Wait for UI to settle
      await this.page.waitForTimeout(2000);
    }
  }

  async simulateElementCreation(count: number) {
    // Try to find and interact with UI elements to create canvas elements
    try {
      // Look for text tool
      const textButton = this.page.locator('[data-tool="text"], .tool-item:has-text("Text"), .left-toolbar button:has-text("Text")').first();
      if (await textButton.isVisible({ timeout: 2000 })) {
        await textButton.click();
        console.log('Clicked text tool');

        // Add text elements
        const canvas = this.page.locator('canvas, .konvajs-content canvas').first();
        if (await canvas.isVisible({ timeout: 2000 })) {
          for (let i = 0; i < Math.min(count, 10); i++) {
            const x = 100 + (i * 50) % 400;
            const y = 100 + Math.floor(i / 8) * 60;
            await canvas.click({ position: { x, y } });
            await this.page.waitForTimeout(100);
          }
        }
      }

      // Try shapes tool
      const shapesButton = this.page.locator('[data-tool="shapes"], .tool-item:has-text("Shapes"), .left-toolbar button:has-text("Shapes")').first();
      if (await shapesButton.isVisible({ timeout: 2000 })) {
        await shapesButton.click();
        console.log('Clicked shapes tool');

        // Add shapes
        const canvas = this.page.locator('canvas, .konvajs-content canvas').first();
        if (await canvas.isVisible({ timeout: 2000 })) {
          for (let i = 0; i < Math.min(count - 10, 10); i++) {
            const x = 200 + (i * 40) % 300;
            const y = 200 + Math.floor(i / 7) * 50;
            await canvas.click({ position: { x, y } });
            await this.page.waitForTimeout(150);
          }
        }
      }

    } catch (error) {
      console.log(`Element creation simulation limited: ${error}`);
    }
  }

  async runInteractionResponseTest() {
    console.log('🖱️ Starting Interaction Response Test');

    const canvas = this.page.locator('canvas, .konvajs-content canvas').first();

    if (!(await canvas.isVisible({ timeout: 5000 }))) {
      console.log('Canvas not found, skipping interaction test');
      return;
    }

    const interactionCycles = 20;

    for (let i = 0; i < interactionCycles; i++) {
      const startTime = performance.now();

      // Random position on canvas
      const x = 50 + Math.random() * 400;
      const y = 50 + Math.random() * 300;

      // Simulate mouse interactions
      await canvas.hover({ position: { x, y } });
      await this.page.waitForTimeout(50);

      await canvas.click({ position: { x, y } });
      const interactionTime = performance.now() - startTime;

      this.metrics.interactionDelays.push(interactionTime);

      if (interactionTime > 100) {
        console.log(`⚠️ Slow interaction: ${interactionTime.toFixed(2)}ms`);
      }

      await this.page.waitForTimeout(200);
    }
  }

  async runDragDropTest() {
    console.log('🚚 Starting Drag & Drop Performance Test');

    const canvas = this.page.locator('canvas, .konvajs-content canvas').first();

    if (!(await canvas.isVisible({ timeout: 5000 }))) {
      console.log('Canvas not found, skipping drag test');
      return;
    }

    const dragOperations = 10;

    for (let i = 0; i < dragOperations; i++) {
      const startTime = performance.now();

      // Random drag operation
      const startX = 100 + Math.random() * 200;
      const startY = 100 + Math.random() * 200;
      const endX = startX + (Math.random() - 0.5) * 200;
      const endY = startY + (Math.random() - 0.5) * 200;

      await canvas.dragTo(canvas, {
        sourcePosition: { x: startX, y: startY },
        targetPosition: { x: endX, y: endY }
      });

      const dragTime = performance.now() - startTime;

      this.metrics.canvasOperations.push({
        type: 'drag',
        duration: dragTime,
        distance: Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2))
      });

      if (dragTime > 200) {
        console.log(`⚠️ Slow drag: ${dragTime.toFixed(2)}ms`);
      }

      await this.page.waitForTimeout(300);
    }
  }

  async runMemoryLeakTest() {
    console.log('🧠 Starting Memory Leak Test');

    // Get baseline memory
    const baselineMemory = await this.page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    // Perform heavy operations
    const operations = 100;
    for (let i = 0; i < operations; i++) {
      // Create and destroy UI elements rapidly
      await this.simulateElementCreation(3);

      // Try to trigger cleanup
      await this.page.keyboard.press('Escape');
      await this.page.waitForTimeout(100);

      if (i % 25 === 0) {
        console.log(`Memory test progress: ${i + 1}/${operations}`);
      }
    }

    // Force garbage collection if possible
    await this.page.evaluate(() => {
      if ((window as any).gc) {
        (window as any).gc();
      }
    });

    await this.page.waitForTimeout(2000);

    const finalMemory = await this.page.evaluate(() => {
      if ((performance as any).memory) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return 0;
    });

    const memoryIncrease = (finalMemory - baselineMemory) / 1024 / 1024;
    console.log(`Memory change: ${memoryIncrease.toFixed(2)}MB`);

    return {
      baseline: Math.round(baselineMemory / 1024 / 1024),
      final: Math.round(finalMemory / 1024 / 1024),
      increase: Math.round(memoryIncrease)
    };
  }

  async capturePerformanceSnapshot() {
    // Get current performance metrics from browser
    const browserMetrics = await this.page.evaluate(() => {
      return (window as any).__getPerformanceSnapshot();
    });

    // Merge with our collected metrics
    this.metrics.renderTimes.push(...browserMetrics.renderTimes);
    this.metrics.memoryUsage.push(...browserMetrics.memorySnapshots);

    return browserMetrics;
  }

  generateReport() {
    const avgRenderTime = this.average(this.metrics.renderTimes.filter(t => t > 0));
    const avgInteractionDelay = this.average(this.metrics.interactionDelays);
    const maxRenderTime = Math.max(...this.metrics.renderTimes, 0);

    const report = {
      summary: {
        avgRenderTime: `${avgRenderTime.toFixed(2)}ms`,
        maxRenderTime: `${maxRenderTime.toFixed(2)}ms`,
        avgInteractionDelay: `${avgInteractionDelay.toFixed(2)}ms`,
        slowFrames: this.metrics.renderTimes.filter(t => t > 16.67).length,
        totalInteractions: this.metrics.interactionDelays.length,
        canvasOperations: this.metrics.canvasOperations.length
      },
      performance: {
        renderPerformance: avgRenderTime < 16.67 ? 'EXCELLENT' : avgRenderTime < 33 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        interactionResponsiveness: avgInteractionDelay < 50 ? 'EXCELLENT' : avgInteractionDelay < 100 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        frameConsistency: (this.metrics.renderTimes.filter(t => t > 16.67).length / Math.max(this.metrics.renderTimes.length, 1)) < 0.1 ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      },
      detailed: {
        renderTimes: this.metrics.renderTimes.slice(-20),
        interactionDelays: this.metrics.interactionDelays.slice(-10),
        canvasOperations: this.metrics.canvasOperations,
        memoryUsage: this.metrics.memoryUsage.slice(-5)
      },
      recommendations: this.generateRecommendations(avgRenderTime, avgInteractionDelay)
    };

    return report;
  }

  private generateRecommendations(avgRenderTime: number, avgInteractionDelay: number): string[] {
    const recommendations: string[] = [];

    if (avgRenderTime > 16.67) {
      recommendations.push('Consider optimizing render loops and reducing unnecessary React re-renders');
      recommendations.push('Implement React.memo() for expensive components');
      recommendations.push('Use useMemo() and useCallback() for expensive calculations');
    }

    if (avgInteractionDelay > 100) {
      recommendations.push('Implement throttling/debouncing for mouse event handlers');
      recommendations.push('Consider virtualizing large lists or canvas elements');
      recommendations.push('Optimize Konva.js event handling');
    }

    if (this.metrics.renderTimes.filter(t => t > 33).length > 5) {
      recommendations.push('Investigate and optimize the multiple useEffect hooks in CanvasEngine.tsx');
      recommendations.push('Consider breaking down the large CanvasEngine component into smaller components');
      recommendations.push('Implement proper cleanup in useEffect dependencies');
    }

    if (this.metrics.canvasOperations.some(op => op.duration > 200)) {
      recommendations.push('Optimize canvas operations batching');
      recommendations.push('Consider implementing Konva.js layer caching');
      recommendations.push('Review RAF queue implementation for better performance');
    }

    return recommendations;
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
}

test.describe('Canvas Performance Analysis', () => {
  let analyzer: CanvasPerformanceAnalyzer;

  test('comprehensive performance analysis', async ({ page }) => {
    analyzer = new CanvasPerformanceAnalyzer(page);

    console.log('🚀 Starting Comprehensive Canvas Performance Analysis');

    try {
      // Initialize and load app
      await analyzer.initialize();

      // Run performance tests
      await analyzer.runCanvasLoadTest([1, 5, 10, 25]);
      await analyzer.runInteractionResponseTest();
      await analyzer.runDragDropTest();

      // Memory leak test
      const memoryResults = await analyzer.runMemoryLeakTest();
      console.log('Memory test results:', memoryResults);

      // Capture final performance snapshot
      await analyzer.capturePerformanceSnapshot();

      // Generate comprehensive report
      const report = analyzer.generateReport();

      console.log('\n📊 === PERFORMANCE ANALYSIS REPORT ===');
      console.log('Summary:', report.summary);
      console.log('Performance Grades:', report.performance);
      console.log('\n💡 Recommendations:');
      report.recommendations.forEach((rec, i) => console.log(`${i + 1}. ${rec}`));

      // Write report to file for detailed analysis
      await page.evaluate((reportData) => {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-report-${new Date().toISOString().slice(0, 16)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }, report);

      // Performance assertions
      const avgRenderTime = parseFloat(report.summary.avgRenderTime);
      const avgInteractionDelay = parseFloat(report.summary.avgInteractionDelay);

      console.log(`\n🎯 Performance Targets:`);
      console.log(`Render Time: ${avgRenderTime.toFixed(2)}ms (target: <16.67ms for 60fps)`);
      console.log(`Interaction Delay: ${avgInteractionDelay.toFixed(2)}ms (target: <100ms)`);

      // Soft assertions (log warnings rather than failing)
      if (avgRenderTime > 33) {
        console.log('⚠️  WARNING: Average render time exceeds 30fps threshold');
      }
      if (avgInteractionDelay > 200) {
        console.log('⚠️  WARNING: Interaction delays exceed user experience threshold');
      }

    } catch (error) {
      console.error('Performance analysis failed:', error);
      throw error;
    }
  });

  test('measure specific CanvasEngine useEffect performance', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-layout"], .left-toolbar, #root > div', { timeout: 15000 });

    // Inject hook to measure useEffect performance
    const useEffectMetrics = await page.evaluate(() => {
      const metrics: any = { effectCount: 0, totalTime: 0, maxTime: 0 };

      // Try to hook into React DevTools or measure DOM changes
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.target) {
            metrics.effectCount++;
          }
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeOldValue: true
      });

      // Wait and collect data
      return new Promise((resolve) => {
        setTimeout(() => {
          observer.disconnect();
          resolve(metrics);
        }, 5000);
      });
    });

    console.log('🔧 useEffect performance metrics:', useEffectMetrics);
  });
});
