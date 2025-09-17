/**
 * Comprehensive Performance Test Suite for Design Studio Canvas
 * Tests canvas rendering performance, memory usage, and interaction responsiveness
 */

// Performance metrics collection
const performanceMetrics = {
  renderTimes: [],
  interactionDelays: [],
  memorySnapshots: [],
  canvasOperations: [],
  konvaOperations: []
};

// Test configuration
const TEST_CONFIG = {
  ELEMENT_COUNTS: [1, 5, 10, 25, 50, 100],
  INTERACTION_CYCLES: 50,
  MEMORY_SAMPLE_INTERVAL: 1000,
  RENDER_TIME_THRESHOLD: 16.67, // 60fps target
  MEMORY_LEAK_THRESHOLD: 50 // MB increase threshold
};

class PerformanceTester {
  constructor() {
    this.startTime = performance.now();
    this.memoryBaseline = this.getMemoryUsage();
    this.canvasRef = null;
    this.stageRef = null;
  }

  // Initialize performance monitoring
  init() {
    console.log('🚀 Starting Performance Test Suite');
    console.log('Baseline Memory:', this.memoryBaseline);

    // Find canvas elements
    this.findCanvasElements();

    // Start memory monitoring
    this.startMemoryMonitoring();

    // Hook into Konva performance events
    this.hookKonvaEvents();

    // Monitor React re-renders
    this.monitorReactRenders();

    return this;
  }

  findCanvasElements() {
    // Try to find canvas elements in the DOM
    const canvases = document.querySelectorAll('canvas');
    console.log(`Found ${canvases.length} canvas elements`);

    // Try to get Konva stage reference from global scope
    if (window.__konvaStage) {
      this.stageRef = window.__konvaStage;
      console.log('Found Konva stage reference');
    }

    if (canvases.length > 0) {
      this.canvasRef = canvases[0];
      console.log('Canvas dimensions:', {
        width: this.canvasRef.width,
        height: this.canvasRef.height
      });
    }
  }

  getMemoryUsage() {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };
    }
    return { used: 0, total: 0, limit: 0 };
  }

  startMemoryMonitoring() {
    setInterval(() => {
      const currentMemory = this.getMemoryUsage();
      const memoryIncrease = currentMemory.used - this.memoryBaseline.used;

      performanceMetrics.memorySnapshots.push({
        timestamp: performance.now() - this.startTime,
        ...currentMemory,
        increase: memoryIncrease
      });

      if (memoryIncrease > TEST_CONFIG.MEMORY_LEAK_THRESHOLD) {
        console.warn(`⚠️  Potential memory leak detected: +${memoryIncrease}MB`);
      }
    }, TEST_CONFIG.MEMORY_SAMPLE_INTERVAL);
  }

  hookKonvaEvents() {
    if (this.stageRef) {
      const originalDraw = this.stageRef.draw.bind(this.stageRef);
      const originalBatchDraw = this.stageRef.batchDraw.bind(this.stageRef);

      this.stageRef.draw = () => {
        const start = performance.now();
        originalDraw();
        const duration = performance.now() - start;

        performanceMetrics.konvaOperations.push({
          type: 'draw',
          duration,
          timestamp: performance.now() - this.startTime
        });

        if (duration > TEST_CONFIG.RENDER_TIME_THRESHOLD) {
          console.warn(`🐌 Slow Konva draw: ${duration.toFixed(2)}ms`);
        }
      };

      this.stageRef.batchDraw = () => {
        const start = performance.now();
        originalBatchDraw();
        const duration = performance.now() - start;

        performanceMetrics.konvaOperations.push({
          type: 'batchDraw',
          duration,
          timestamp: performance.now() - this.startTime
        });
      };
    }
  }

  monitorReactRenders() {
    // Monitor RAF frames
    let frameCount = 0;
    let lastFrameTime = performance.now();

    const countFrames = () => {
      const now = performance.now();
      const frameDuration = now - lastFrameTime;

      performanceMetrics.renderTimes.push(frameDuration);

      if (frameDuration > TEST_CONFIG.RENDER_TIME_THRESHOLD * 2) {
        console.warn(`🎭 Slow frame: ${frameDuration.toFixed(2)}ms`);
      }

      frameCount++;
      lastFrameTime = now;
      requestAnimationFrame(countFrames);
    };

    requestAnimationFrame(countFrames);
  }

  // Test canvas performance with different element counts
  async testCanvasLoad() {
    console.log('🎨 Testing Canvas Load Performance');

    for (const elementCount of TEST_CONFIG.ELEMENT_COUNTS) {
      console.log(`Testing with ${elementCount} elements...`);

      const loadStart = performance.now();
      await this.simulateElementLoad(elementCount);
      const loadDuration = performance.now() - loadStart;

      performanceMetrics.canvasOperations.push({
        type: 'load',
        elementCount,
        duration: loadDuration,
        memoryUsage: this.getMemoryUsage()
      });

      console.log(`${elementCount} elements loaded in ${loadDuration.toFixed(2)}ms`);

      // Wait for settling
      await this.wait(1000);
    }
  }

  // Simulate adding elements to canvas
  async simulateElementLoad(count) {
    if (!this.stageRef) {
      console.warn('No Konva stage found, skipping element simulation');
      return;
    }

    // Simulate adding shapes/images to canvas
    for (let i = 0; i < count; i++) {
      const start = performance.now();

      // Simulate element creation (would normally be done by React)
      const mockElement = {
        id: `test-element-${i}`,
        type: Math.random() > 0.5 ? 'shape' : 'image',
        x: Math.random() * 800,
        y: Math.random() * 600,
        width: 50 + Math.random() * 100,
        height: 50 + Math.random() * 100
      };

      const elementDuration = performance.now() - start;

      if (elementDuration > 5) {
        console.warn(`Slow element creation: ${elementDuration.toFixed(2)}ms`);
      }

      // Small delay to prevent overwhelming
      if (i % 10 === 0) {
        await this.wait(50);
      }
    }
  }

  // Test interaction responsiveness
  async testInteractionPerformance() {
    console.log('🖱️ Testing Mouse Interaction Performance');

    if (!this.canvasRef) {
      console.warn('No canvas found for interaction testing');
      return;
    }

    for (let i = 0; i < TEST_CONFIG.INTERACTION_CYCLES; i++) {
      const start = performance.now();

      // Simulate mouse events
      await this.simulateMouseInteraction();

      const interactionDelay = performance.now() - start;
      performanceMetrics.interactionDelays.push(interactionDelay);

      if (interactionDelay > 50) {
        console.warn(`Slow interaction: ${interactionDelay.toFixed(2)}ms`);
      }

      await this.wait(100); // Wait between interactions
    }
  }

  async simulateMouseInteraction() {
    if (!this.canvasRef) return;

    const rect = this.canvasRef.getBoundingClientRect();
    const x = rect.left + Math.random() * rect.width;
    const y = rect.top + Math.random() * rect.height;

    // Simulate mouse events
    const events = ['mousemove', 'mousedown', 'mouseup'];
    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        clientX: x,
        clientY: y,
        bubbles: true
      });

      this.canvasRef.dispatchEvent(event);
      await this.wait(10);
    }
  }

  // Test drag and drop performance
  async testDragDropPerformance() {
    console.log('🚚 Testing Drag & Drop Performance');

    if (!this.canvasRef) return;

    const dragOperations = 20;
    const rect = this.canvasRef.getBoundingClientRect();

    for (let i = 0; i < dragOperations; i++) {
      const start = performance.now();

      const startX = rect.left + Math.random() * rect.width * 0.5;
      const startY = rect.top + Math.random() * rect.height * 0.5;
      const endX = rect.left + Math.random() * rect.width;
      const endY = rect.top + Math.random() * rect.height;

      await this.simulateDragOperation(startX, startY, endX, endY);

      const dragDuration = performance.now() - start;
      performanceMetrics.canvasOperations.push({
        type: 'drag',
        duration: dragDuration,
        memoryUsage: this.getMemoryUsage()
      });

      if (dragDuration > 100) {
        console.warn(`Slow drag operation: ${dragDuration.toFixed(2)}ms`);
      }

      await this.wait(200);
    }
  }

  async simulateDragOperation(startX, startY, endX, endY) {
    if (!this.canvasRef) return;

    // Start drag
    this.canvasRef.dispatchEvent(new MouseEvent('mousedown', {
      clientX: startX,
      clientY: startY,
      bubbles: true
    }));

    // Simulate drag path with 10 steps
    const steps = 10;
    for (let step = 0; step <= steps; step++) {
      const progress = step / steps;
      const currentX = startX + (endX - startX) * progress;
      const currentY = startY + (endY - startY) * progress;

      this.canvasRef.dispatchEvent(new MouseEvent('mousemove', {
        clientX: currentX,
        clientY: currentY,
        bubbles: true
      }));

      await this.wait(16); // ~60fps
    }

    // End drag
    this.canvasRef.dispatchEvent(new MouseEvent('mouseup', {
      clientX: endX,
      clientY: endY,
      bubbles: true
    }));
  }

  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Generate performance report
  generateReport() {
    console.log('📊 Generating Performance Report');

    const avgRenderTime = this.average(performanceMetrics.renderTimes.slice(-100));
    const avgInteractionDelay = this.average(performanceMetrics.interactionDelays);
    const maxMemoryIncrease = Math.max(...performanceMetrics.memorySnapshots.map(s => s.increase));
    const currentMemory = this.getMemoryUsage();

    const report = {
      summary: {
        avgRenderTime: `${avgRenderTime.toFixed(2)}ms`,
        avgInteractionDelay: `${avgInteractionDelay.toFixed(2)}ms`,
        maxMemoryIncrease: `${maxMemoryIncrease}MB`,
        currentMemoryUsage: `${currentMemory.used}MB`,
        frameDrops: performanceMetrics.renderTimes.filter(t => t > TEST_CONFIG.RENDER_TIME_THRESHOLD * 2).length
      },
      performance: {
        renderPerformance: avgRenderTime < TEST_CONFIG.RENDER_TIME_THRESHOLD ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        interactionResponsiveness: avgInteractionDelay < 50 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
        memoryManagement: maxMemoryIncrease < TEST_CONFIG.MEMORY_LEAK_THRESHOLD ? 'GOOD' : 'NEEDS_IMPROVEMENT'
      },
      detailed: {
        renderTimes: performanceMetrics.renderTimes.slice(-20),
        interactionDelays: performanceMetrics.interactionDelays.slice(-10),
        memorySnapshots: performanceMetrics.memorySnapshots.slice(-5),
        konvaOperations: performanceMetrics.konvaOperations.slice(-10),
        canvasOperations: performanceMetrics.canvasOperations.slice(-10)
      },
      recommendations: []
    };

    // Generate recommendations
    if (avgRenderTime > TEST_CONFIG.RENDER_TIME_THRESHOLD) {
      report.recommendations.push('Consider optimizing render loop and reducing unnecessary re-renders');
    }

    if (avgInteractionDelay > 50) {
      report.recommendations.push('Optimize mouse event handlers and consider throttling/debouncing');
    }

    if (maxMemoryIncrease > TEST_CONFIG.MEMORY_LEAK_THRESHOLD) {
      report.recommendations.push('Investigate potential memory leaks in canvas element cleanup');
    }

    console.log('Performance Report:', report);
    return report;
  }

  average(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
}

// Auto-run performance tests when script loads
window.__performanceTester = new PerformanceTester();

// Make it available globally for manual testing
window.runPerformanceTest = async () => {
  const tester = window.__performanceTester.init();

  try {
    await tester.testCanvasLoad();
    await tester.testInteractionPerformance();
    await tester.testDragDropPerformance();

    // Wait for final memory settling
    await tester.wait(2000);

    return tester.generateReport();
  } catch (error) {
    console.error('Performance test failed:', error);
    return { error: error.message };
  }
};

console.log('Performance testing script loaded. Run window.runPerformanceTest() to start full test suite.');
console.log('Or access window.__performanceTester for individual tests.');