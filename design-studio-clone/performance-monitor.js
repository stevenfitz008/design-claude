/**
 * Canvas Performance Monitor - Fix 2 Validation
 * Run this script in the browser console to monitor React.memo and useCallback improvements
 */

class CanvasPerformanceMonitor {
  constructor() {
    this.metrics = {
      frameRate: 0,
      renderTime: [],
      renderCount: 0,
      memoryUsage: 0,
      domMutations: 0,
      interactions: 0
    };

    this.isRunning = false;
    this.startTime = null;
    this.frameCount = 0;
    this.lastFrameTime = performance.now();
    this.observers = [];

    this.bindMethods();
    this.setupStyles();
  }

  bindMethods() {
    this.measureFrame = this.measureFrame.bind(this);
    this.logMetrics = this.logMetrics.bind(this);
  }

  setupStyles() {
    // Inject CSS for performance overlay
    const style = document.createElement('style');
    style.textContent = `
      #performance-overlay {
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(37, 42, 48, 0.95);
        color: #f5f8fa;
        padding: 15px;
        border-radius: 8px;
        font-family: Monaco, 'Ubuntu Mono', monospace;
        font-size: 12px;
        z-index: 10000;
        border: 1px solid #495563;
        min-width: 280px;
        backdrop-filter: blur(5px);
      }

      #performance-overlay h4 {
        margin: 0 0 10px 0;
        color: #48aff0;
        font-size: 14px;
      }

      .metric-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        padding: 3px 0;
      }

      .metric-label {
        color: #a7b6c2;
      }

      .metric-value {
        color: #f5f8fa;
        font-weight: bold;
      }

      .metric-good { color: #0cd46b; }
      .metric-warning { color: #ffa500; }
      .metric-bad { color: #ff6b6b; }

      .metric-controls {
        margin-top: 10px;
        padding-top: 10px;
        border-top: 1px solid #495563;
      }

      .metric-controls button {
        background: #48aff0;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 4px;
        margin-right: 5px;
        cursor: pointer;
        font-size: 11px;
      }

      .metric-controls button:hover {
        background: #357ab8;
      }

      .metric-controls button:disabled {
        background: #495563;
        cursor: not-allowed;
      }
    `;
    document.head.appendChild(style);
  }

  createOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'performance-overlay';
    overlay.innerHTML = `
      <h4>🚀 Canvas Performance Monitor</h4>
      <div class="metric-row">
        <span class="metric-label">Frame Rate:</span>
        <span class="metric-value" id="fps-display">0 FPS</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Avg Render Time:</span>
        <span class="metric-value" id="render-display">0ms</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Memory Usage:</span>
        <span class="metric-value" id="memory-display">0MB</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">React Renders:</span>
        <span class="metric-value" id="renders-display">0</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">DOM Mutations:</span>
        <span class="metric-value" id="mutations-display">0/sec</span>
      </div>
      <div class="metric-row">
        <span class="metric-label">Canvas Elements:</span>
        <span class="metric-value" id="elements-display">0</span>
      </div>
      <div class="metric-controls">
        <button onclick="window.perfMonitor.start()">Start</button>
        <button onclick="window.perfMonitor.stop()">Stop</button>
        <button onclick="window.perfMonitor.reset()">Reset</button>
        <button onclick="window.perfMonitor.addTestElements()">Add Elements</button>
        <button onclick="window.perfMonitor.remove()">Close</button>
      </div>
      <div style="margin-top: 10px; font-size: 11px; color: #a7b6c2;">
        Fix 2 Target: 20-30% FPS improvement
      </div>
    `;

    document.body.appendChild(overlay);
    return overlay;
  }

  measureFrame() {
    if (!this.isRunning) return;

    const now = performance.now();
    this.frameCount++;

    // Measure frame rate every second
    if (now - this.lastFrameTime >= 1000) {
      this.metrics.frameRate = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
      this.frameCount = 0;
      this.lastFrameTime = now;
    }

    // Measure memory if available
    if (performance.memory) {
      this.metrics.memoryUsage = Math.round(performance.memory.usedJSHeapSize / 1048576);
    }

    this.updateDisplay();
    requestAnimationFrame(this.measureFrame);
  }

  startRenderTimeMonitoring() {
    // Hook into React DevTools or use MutationObserver as fallback
    const observer = new MutationObserver((mutations) => {
      const startTime = performance.now();

      // Count React-related mutations
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' &&
            (mutation.target.id === 'canvas-container' ||
             mutation.target.classList.contains('canvas'))) {
          this.metrics.renderCount++;
        }
      });

      const endTime = performance.now();
      this.metrics.renderTime.push(endTime - startTime);

      // Keep only last 60 measurements
      if (this.metrics.renderTime.length > 60) {
        this.metrics.renderTime.shift();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    this.observers.push(observer);
  }

  startDOMMonitoring() {
    let mutationCount = 0;

    const observer = new MutationObserver(() => {
      mutationCount++;
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    setInterval(() => {
      this.metrics.domMutations = mutationCount;
      mutationCount = 0;
    }, 1000);

    this.observers.push(observer);
  }

  countCanvasElements() {
    // Try to count canvas elements from the store or DOM
    try {
      // If canvas store is available globally
      if (window.canvasStore) {
        return window.canvasStore.elements?.length || 0;
      }

      // Count Konva elements
      const canvasElements = document.querySelectorAll('canvas');
      let totalElements = 0;

      canvasElements.forEach(canvas => {
        // This is a rough estimate - in practice you'd hook into Konva directly
        const konvaLayers = canvas.parentElement?.querySelectorAll('.konvajs-node');
        totalElements += konvaLayers?.length || 0;
      });

      return totalElements;
    } catch (e) {
      return 0;
    }
  }

  updateDisplay() {
    const fpsMeterClass = this.metrics.frameRate >= 25 ? 'metric-good' :
                         this.metrics.frameRate >= 15 ? 'metric-warning' : 'metric-bad';

    const avgRenderTime = this.metrics.renderTime.length > 0 ?
      this.metrics.renderTime.reduce((a, b) => a + b, 0) / this.metrics.renderTime.length : 0;

    const renderMeterClass = avgRenderTime < 16.67 ? 'metric-good' :
                            avgRenderTime < 33 ? 'metric-warning' : 'metric-bad';

    document.getElementById('fps-display').innerHTML =
      `<span class="${fpsMeterClass}">${this.metrics.frameRate} FPS</span>`;

    document.getElementById('render-display').innerHTML =
      `<span class="${renderMeterClass}">${avgRenderTime.toFixed(1)}ms</span>`;

    document.getElementById('memory-display').innerHTML =
      `<span class="metric-value">${this.metrics.memoryUsage}MB</span>`;

    document.getElementById('renders-display').innerHTML =
      `<span class="metric-value">${this.metrics.renderCount}</span>`;

    document.getElementById('mutations-display').innerHTML =
      `<span class="metric-value">${this.metrics.domMutations}</span>`;

    document.getElementById('elements-display').innerHTML =
      `<span class="metric-value">${this.countCanvasElements()}</span>`;
  }

  addTestElements() {
    console.log('🧪 Adding test elements...');

    // Try to add elements via canvas store
    try {
      if (window.canvasStore && window.canvasStore.addElement) {
        const testElements = [
          {
            id: `test-text-${Date.now()}-1`,
            type: 'text',
            text: 'Performance Test Text 1',
            x: 100,
            y: 100,
            width: 200,
            height: 50,
            fontSize: 16,
            fontFamily: 'Arial',
            fill: '#ffffff'
          },
          {
            id: `test-text-${Date.now()}-2`,
            type: 'text',
            text: 'Performance Test Text 2',
            x: 200,
            y: 200,
            width: 200,
            height: 50,
            fontSize: 18,
            fontFamily: 'Arial',
            fill: '#48aff0'
          }
        ];

        testElements.forEach(element => {
          window.canvasStore.addElement(element);
        });

        console.log('✅ Added test elements via canvas store');
      } else {
        console.log('⚠️ Canvas store not available. Add elements manually in the UI.');
      }
    } catch (error) {
      console.log('❌ Error adding test elements:', error.message);
      console.log('💡 Please add text and image elements manually using the left toolbar.');
    }
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Performance monitor already running');
      return;
    }

    console.log('🚀 Starting Canvas Performance Monitor - Fix 2 Validation');
    console.log('🎯 Expected: 20-30% frame rate improvement from React.memo + useCallback optimizations');

    this.isRunning = true;
    this.startTime = performance.now();
    this.frameCount = 0;
    this.lastFrameTime = performance.now();

    // Reset metrics
    this.metrics = {
      frameRate: 0,
      renderTime: [],
      renderCount: 0,
      memoryUsage: 0,
      domMutations: 0,
      interactions: 0
    };

    if (!document.getElementById('performance-overlay')) {
      this.createOverlay();
    }

    this.startRenderTimeMonitoring();
    this.startDOMMonitoring();
    requestAnimationFrame(this.measureFrame);

    console.log('✅ Performance monitoring active');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Performance monitor not running');
      return;
    }

    this.isRunning = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];

    const duration = (performance.now() - this.startTime) / 1000;
    console.log(`📊 Performance Test Results (${duration.toFixed(1)}s):`);
    console.log(`   Frame Rate: ${this.metrics.frameRate} FPS`);
    console.log(`   Memory Peak: ${this.metrics.memoryUsage} MB`);
    console.log(`   React Renders: ${this.metrics.renderCount}`);
    console.log(`   DOM Mutations: ${this.metrics.domMutations}/sec`);

    // Analyze results
    if (this.metrics.frameRate >= 9) {
      console.log('✅ Frame rate improvement achieved! Target met.');
    } else if (this.metrics.frameRate > 7) {
      console.log('🔄 Some improvement detected, but below target.');
    } else {
      console.log('❌ No significant improvement detected.');
    }
  }

  reset() {
    this.metrics = {
      frameRate: 0,
      renderTime: [],
      renderCount: 0,
      memoryUsage: 0,
      domMutations: 0,
      interactions: 0
    };
    this.updateDisplay();
    console.log('🧹 Performance metrics reset');
  }

  remove() {
    this.stop();
    const overlay = document.getElementById('performance-overlay');
    if (overlay) {
      overlay.remove();
    }
    console.log('👋 Performance monitor removed');
  }

  logMetrics() {
    console.log('📊 Current Performance Metrics:');
    console.log(`   Frame Rate: ${this.metrics.frameRate} FPS`);
    console.log(`   Avg Render Time: ${this.metrics.renderTime.length > 0 ?
      (this.metrics.renderTime.reduce((a,b) => a+b,0) / this.metrics.renderTime.length).toFixed(2) : 0}ms`);
    console.log(`   Memory Usage: ${this.metrics.memoryUsage} MB`);
    console.log(`   React Renders: ${this.metrics.renderCount}`);
    console.log(`   DOM Mutations: ${this.metrics.domMutations}/sec`);
    console.log(`   Canvas Elements: ${this.countCanvasElements()}`);
  }
}

// Initialize global performance monitor
window.perfMonitor = new CanvasPerformanceMonitor();

console.log(`
🎯 Canvas Performance Monitor - Fix 2 Validation Ready!

Usage:
  window.perfMonitor.start()     - Start monitoring
  window.perfMonitor.stop()      - Stop and show results
  window.perfMonitor.reset()     - Reset metrics
  window.perfMonitor.logMetrics()- Show current metrics
  window.perfMonitor.addTestElements() - Add test elements

Expected Results (Fix 2):
  ✅ Frame rate: 20-30% improvement from 7 FPS baseline (target: ~9-10 FPS)
  ✅ Reduced React render count (React.memo working)
  ✅ Stable event handler performance (useCallback working)
  ✅ Lower DOM mutation rate during interactions

Run perfMonitor.start() to begin testing!
`);

// Auto-start if desired
// window.perfMonitor.start();