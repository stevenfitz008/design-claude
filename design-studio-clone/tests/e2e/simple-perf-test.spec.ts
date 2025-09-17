import { test, expect, Page } from '@playwright/test';

test.describe('Simple Performance Analysis', () => {
  test('canvas rendering and memory analysis', async ({ page }) => {
    console.log('🚀 Starting Simple Performance Analysis');

    // Navigate to app
    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-layout"], .left-toolbar, #root > div', { timeout: 15000 });

    // Get initial memory
    const initialMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
      }
      return 0;
    });
    console.log(`Initial memory usage: ${initialMemory}MB`);

    // Measure initial render time
    const renderMetrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const startTime = performance.now();
        let frameCount = 0;
        const frameTimes: number[] = [];

        function measureFrame() {
          const now = performance.now();
          frameCount++;

          if (frameCount > 1) {
            frameTimes.push(now - lastFrame);
          }

          if (frameCount < 30) { // Measure 30 frames
            lastFrame = now;
            requestAnimationFrame(measureFrame);
          } else {
            resolve({
              avgFrameTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
              maxFrameTime: Math.max(...frameTimes),
              minFrameTime: Math.min(...frameTimes),
              slowFrames: frameTimes.filter(t => t > 16.67).length
            });
          }
        }

        let lastFrame = startTime;
        requestAnimationFrame(measureFrame);
      });
    });

    console.log('Initial render performance:', renderMetrics);

    // Test interaction with existing elements
    await page.waitForTimeout(2000); // Wait for initial render

    // Try to click on different UI elements to test responsiveness
    const interactionTimes: number[] = [];

    // Test left toolbar interactions
    const tools = ['Text', 'Shapes', 'Photos', 'Templates'];
    for (const tool of tools) {
      const startTime = Date.now();
      try {
        const button = page.locator(`.left-toolbar button:has-text("${tool}"), [data-tool="${tool.toLowerCase()}"]`).first();
        if (await button.isVisible({ timeout: 2000 })) {
          await button.click();
          const interactionTime = Date.now() - startTime;
          interactionTimes.push(interactionTime);
          console.log(`${tool} tool clicked in ${interactionTime}ms`);
          await page.waitForTimeout(500); // Wait for panel to load
        }
      } catch (e) {
        console.log(`Could not interact with ${tool} tool`);
      }
    }

    // Test canvas interactions if canvas is visible
    const canvas = page.locator('canvas').first();
    if (await canvas.isVisible({ timeout: 2000 })) {
      console.log('Canvas found, testing interactions...');

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        await canvas.click({ position: { x: 200 + i * 50, y: 200 + i * 30 } });
        const clickTime = Date.now() - startTime;
        interactionTimes.push(clickTime);
        await page.waitForTimeout(200);
      }
    }

    // Final memory measurement
    const finalMemory = await page.evaluate(() => {
      if ((performance as any).memory) {
        return Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024);
      }
      return 0;
    });

    const memoryIncrease = finalMemory - initialMemory;
    console.log(`Final memory usage: ${finalMemory}MB (increase: ${memoryIncrease}MB)`);

    // Performance report
    const avgInteractionTime = interactionTimes.length > 0
      ? interactionTimes.reduce((a, b) => a + b, 0) / interactionTimes.length
      : 0;

    const performanceReport = {
      rendering: renderMetrics,
      interactions: {
        averageTime: avgInteractionTime,
        maxTime: Math.max(...interactionTimes, 0),
        slowInteractions: interactionTimes.filter(t => t > 100).length
      },
      memory: {
        initial: initialMemory,
        final: finalMemory,
        increase: memoryIncrease
      }
    };

    console.log('\n📊 === PERFORMANCE REPORT ===');
    console.log(JSON.stringify(performanceReport, null, 2));

    // Performance thresholds (soft assertions)
    console.log('\n🎯 Performance Analysis:');

    if (renderMetrics.avgFrameTime > 16.67) {
      console.log(`⚠️  Average frame time (${renderMetrics.avgFrameTime.toFixed(2)}ms) exceeds 60fps target`);
    } else {
      console.log(`✅ Good frame rate performance: ${renderMetrics.avgFrameTime.toFixed(2)}ms avg`);
    }

    if (avgInteractionTime > 100) {
      console.log(`⚠️  Average interaction time (${avgInteractionTime.toFixed(2)}ms) may feel sluggish`);
    } else {
      console.log(`✅ Good interaction responsiveness: ${avgInteractionTime.toFixed(2)}ms avg`);
    }

    if (memoryIncrease > 20) {
      console.log(`⚠️  Memory increase (${memoryIncrease}MB) suggests potential memory issues`);
    } else {
      console.log(`✅ Memory usage looks stable: +${memoryIncrease}MB`);
    }

    // Take screenshot for visual reference
    await page.screenshot({ path: 'performance-test-final-state.png', fullPage: true });

    expect(performanceReport.rendering.avgFrameTime).toBeLessThan(50); // Allow up to 20fps minimum
    expect(avgInteractionTime).toBeLessThan(500); // Allow up to 500ms for interactions
  });

  test('measure useEffect performance impact', async ({ page }) => {
    console.log('🔧 Measuring useEffect Performance Impact');

    await page.goto('http://localhost:3000');
    await page.waitForSelector('[data-testid="app-layout"], .left-toolbar, #root > div', { timeout: 15000 });

    // Inject observer to measure DOM mutations (proxy for useEffect activity)
    const effectMetrics = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        let mutationCount = 0;
        let attributeChanges = 0;
        let nodeAdditions = 0;
        let nodeRemovals = 0;
        const startTime = performance.now();

        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutationCount++;
            if (mutation.type === 'attributes') {
              attributeChanges++;
            } else if (mutation.type === 'childList') {
              nodeAdditions += mutation.addedNodes.length;
              nodeRemovals += mutation.removedNodes.length;
            }
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true
        });

        // Let the app run for a few seconds and measure mutations
        setTimeout(() => {
          observer.disconnect();
          const endTime = performance.now();
          resolve({
            duration: endTime - startTime,
            totalMutations: mutationCount,
            attributeChanges,
            nodeAdditions,
            nodeRemovals,
            mutationsPerSecond: mutationCount / ((endTime - startTime) / 1000)
          });
        }, 5000);
      });
    });

    console.log('DOM Mutation Analysis (useEffect proxy):', effectMetrics);

    // Trigger some interactions to see effect activity
    await page.click('.left-toolbar button:nth-child(1)');
    await page.waitForTimeout(1000);
    await page.click('.left-toolbar button:nth-child(3)');
    await page.waitForTimeout(1000);

    const interactionMutations = await page.evaluate(() => {
      return new Promise<any>((resolve) => {
        let mutationCount = 0;
        const startTime = performance.now();

        const observer = new MutationObserver((mutations) => {
          mutationCount += mutations.length;
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true,
          attributes: true
        });

        setTimeout(() => {
          observer.disconnect();
          resolve({
            interactionMutations: mutationCount,
            duration: performance.now() - startTime
          });
        }, 2000);
      });
    });

    console.log('Interaction-triggered mutations:', interactionMutations);
  });
});