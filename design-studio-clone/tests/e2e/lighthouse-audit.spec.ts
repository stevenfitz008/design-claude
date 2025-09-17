import { test, expect, chromium } from '@playwright/test';

test('Lighthouse Performance Audit', async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Running Lighthouse Performance Audit');

  // Navigate to app
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // Wait for app to be fully loaded
  await page.waitForSelector('[data-testid="app-layout"], .left-toolbar, #root > div', { timeout: 15000 });
  await page.waitForTimeout(3000);

  // Basic performance metrics collection
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');

    return {
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    };
  });

  // Calculate Lighthouse-style scores
  const lighthouseEquivalent = {
    performance: {
      firstContentfulPaint: performanceMetrics.firstContentfulPaint,
      largestContentfulPaint: 'Not measured',
      speedIndex: 'Not measured',
      totalBlockingTime: 'Not measured',
      cumulativeLayoutShift: 'Not measured'
    },
    accessibility: 'Not measured (requires lighthouse)',
    bestPractices: 'Not measured (requires lighthouse)',
    seo: 'Not measured (requires lighthouse)'
  };

  console.log('\n📊 === LIGHTHOUSE-STYLE PERFORMANCE REPORT ===');
  console.log('Core Web Vitals Equivalent:');
  console.log(`• First Contentful Paint: ${performanceMetrics.firstContentfulPaint.toFixed(2)}ms`);
  console.log(`• Load Time: ${performanceMetrics.loadTime.toFixed(2)}ms`);
  console.log(`• DOM Content Loaded: ${performanceMetrics.domContentLoaded.toFixed(2)}ms`);

  if (performanceMetrics.memory) {
    console.log(`• Memory Usage: ${performanceMetrics.memory.used}MB / ${performanceMetrics.memory.total}MB`);
  }

  // Performance scoring (simplified Lighthouse-style)
  let performanceScore = 100;

  // First Contentful Paint scoring
  if (performanceMetrics.firstContentfulPaint > 3000) {
    performanceScore -= 40;
    console.log('❌ First Contentful Paint too slow (>3s)');
  } else if (performanceMetrics.firstContentfulPaint > 1800) {
    performanceScore -= 20;
    console.log('⚠️  First Contentful Paint needs improvement (>1.8s)');
  } else {
    console.log('✅ First Contentful Paint is good (<1.8s)');
  }

  // Load time scoring
  if (performanceMetrics.loadTime > 5000) {
    performanceScore -= 30;
    console.log('❌ Load time too slow (>5s)');
  } else if (performanceMetrics.loadTime > 3000) {
    performanceScore -= 15;
    console.log('⚠️  Load time needs improvement (>3s)');
  } else {
    console.log('✅ Load time is good (<3s)');
  }

  // Memory usage scoring
  if (performanceMetrics.memory) {
    if (performanceMetrics.memory.used > 100) {
      performanceScore -= 20;
      console.log('❌ High memory usage (>100MB)');
    } else if (performanceMetrics.memory.used > 50) {
      performanceScore -= 10;
      console.log('⚠️  Moderate memory usage (>50MB)');
    } else {
      console.log('✅ Memory usage is good (<50MB)');
    }
  }

  console.log(`\n🎯 Estimated Performance Score: ${Math.max(0, performanceScore)}/100`);

  // Network analysis
  const resourceMetrics = await page.evaluate(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    const jsResources = resources.filter(r => r.name.endsWith('.js'));
    const cssResources = resources.filter(r => r.name.endsWith('.css'));
    const imageResources = resources.filter(r => r.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i));

    return {
      totalResources: resources.length,
      jsCount: jsResources.length,
      cssCount: cssResources.length,
      imageCount: imageResources.length,
      largestJS: jsResources.reduce((max, r) => r.transferSize > max.transferSize ? r : max, { transferSize: 0, name: 'none' }),
      totalJSSize: jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalCSSSize: cssResources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
      totalImageSize: imageResources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
    };
  });

  console.log('\n📦 Resource Analysis:');
  console.log(`• Total Resources: ${resourceMetrics.totalResources}`);
  console.log(`• JavaScript: ${resourceMetrics.jsCount} files, ${Math.round(resourceMetrics.totalJSSize / 1024)}KB`);
  console.log(`• CSS: ${resourceMetrics.cssCount} files, ${Math.round(resourceMetrics.totalCSSSize / 1024)}KB`);
  console.log(`• Images: ${resourceMetrics.imageCount} files, ${Math.round(resourceMetrics.totalImageSize / 1024)}KB`);
  console.log(`• Largest JS: ${resourceMetrics.largestJS.name} (${Math.round(resourceMetrics.largestJS.transferSize / 1024)}KB)`);

  // Bundle size analysis
  const totalBundleSize = resourceMetrics.totalJSSize + resourceMetrics.totalCSSSize;
  console.log(`• Total Bundle Size: ${Math.round(totalBundleSize / 1024)}KB`);

  if (totalBundleSize > 2000000) { // 2MB
    console.log('❌ Bundle size is very large (>2MB)');
    performanceScore -= 20;
  } else if (totalBundleSize > 1000000) { // 1MB
    console.log('⚠️  Bundle size is large (>1MB)');
    performanceScore -= 10;
  } else {
    console.log('✅ Bundle size is reasonable (<1MB)');
  }

  console.log(`\n🏆 Final Performance Score: ${Math.max(0, performanceScore)}/100`);

  // Recommendations based on analysis
  console.log('\n💡 Performance Recommendations:');

  if (performanceMetrics.firstContentfulPaint > 1800) {
    console.log('• Optimize critical rendering path');
    console.log('• Consider code splitting and lazy loading');
  }

  if (resourceMetrics.totalJSSize > 1000000) {
    console.log('• Implement JavaScript code splitting');
    console.log('• Use tree shaking to remove unused code');
  }

  if (performanceMetrics.memory?.used > 50) {
    console.log('• Investigate memory usage and potential leaks');
    console.log('• Implement proper cleanup in useEffect hooks');
  }

  console.log('• Remove console.log statements in production');
  console.log('• Optimize useEffect dependencies');
  console.log('• Implement React.memo for canvas components');

  await browser.close();

  // Soft assertions (don't fail test, just warn)
  expect(performanceMetrics.firstContentfulPaint).toBeLessThan(5000);
  expect(performanceMetrics.loadTime).toBeLessThan(10000);
  expect(totalBundleSize).toBeLessThan(5000000); // 5MB max
});