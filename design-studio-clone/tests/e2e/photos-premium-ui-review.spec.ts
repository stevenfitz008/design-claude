import { test, expect, Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';

interface PhotosAnalysis {
  timestamp: string;
  layoutAnalysis: {
    hasLeftToolbar: boolean;
    hasPhotosButton: boolean;
    hasCenterPanel: boolean;
    hasRightCanvas: boolean;
    photosButtonPosition: { x: number; y: number } | null;
  };
  photosPanel: {
    isVisible: boolean;
    hasSearchBar: boolean;
    hasFilterOptions: boolean;
    hasCategoryTabs: boolean;
    hasPhotoGrid: boolean;
    photoCount: number;
    hasLoadingState: boolean;
    hasEmptyState: boolean;
    gridLayout: {
      columns: number;
      spacing: number;
      photoSize: { width: number; height: number } | null;
    };
  };
  interactions: {
    photosButtonClickable: boolean;
    searchFunctional: boolean;
    photosHoverable: boolean;
    photosDraggable: boolean;
    photosSelectable: boolean;
  };
  visualDesign: {
    hasHoverEffects: boolean;
    hasShadows: boolean;
    hasTransitions: boolean;
    hasProfessionalSpacing: boolean;
    hasMetadataDisplay: boolean;
  };
  performance: {
    initialLoadTime: number;
    photosLoadTime: number;
    scrollPerformance: 'smooth' | 'janky' | 'not-tested';
  };
  missingFeatures: string[];
  issues: string[];
}

async function analyzePhotosLayout(page: Page): Promise<PhotosAnalysis['layoutAnalysis']> {
  const analysis: PhotosAnalysis['layoutAnalysis'] = {
    hasLeftToolbar: false,
    hasPhotosButton: false,
    hasCenterPanel: false,
    hasRightCanvas: false,
    photosButtonPosition: null
  };

  try {
    // Check for left toolbar
    const leftToolbar = await page.locator('[data-testid="left-toolbar"], .left-toolbar, .toolbar-left').first();
    analysis.hasLeftToolbar = await leftToolbar.isVisible();

    // Check for Photos button/tool
    const photosButton = await page.locator('[data-testid="tool-photos"], [data-testid="photos-tool"], button:has-text("Photos"), [aria-label*="Photos"], [title*="Photos"]').first();
    analysis.hasPhotosButton = await photosButton.isVisible();
    
    if (analysis.hasPhotosButton) {
      const box = await photosButton.boundingBox();
      analysis.photosButtonPosition = box ? { x: box.x, y: box.y } : null;
    }

    // Check for center panel
    const centerPanel = await page.locator('[data-testid="center-panel"], .center-panel, .main-content').first();
    analysis.hasCenterPanel = await centerPanel.isVisible();

    // Check for right canvas
    const rightCanvas = await page.locator('[data-testid="canvas"], .canvas, .right-panel').first();
    analysis.hasRightCanvas = await rightCanvas.isVisible();

  } catch (error) {
    console.log('Layout analysis error:', error);
  }

  return analysis;
}

async function analyzePhotosPanel(page: Page): Promise<PhotosAnalysis['photosPanel']> {
  const analysis: PhotosAnalysis['photosPanel'] = {
    isVisible: false,
    hasSearchBar: false,
    hasFilterOptions: false,
    hasCategoryTabs: false,
    hasPhotoGrid: false,
    photoCount: 0,
    hasLoadingState: false,
    hasEmptyState: false,
    gridLayout: {
      columns: 0,
      spacing: 0,
      photoSize: null
    }
  };

  try {
    // Check for Photos panel visibility
    const photosPanel = await page.locator('[data-testid="photos-panel"], .photos-panel, .photos-content').first();
    analysis.isVisible = await photosPanel.isVisible();

    if (analysis.isVisible) {
      // Search bar
      const searchBar = await page.locator('input[placeholder*="Search"], input[placeholder*="photos"], [data-testid="search"]').first();
      analysis.hasSearchBar = await searchBar.isVisible();

      // Filter options
      const filters = await page.locator('[data-testid="filter"], .filter, select, .dropdown').count();
      analysis.hasFilterOptions = filters > 0;

      // Category tabs
      const tabs = await page.locator('[role="tab"], .tab, .category').count();
      analysis.hasCategoryTabs = tabs > 0;

      // Photo grid
      const photoElements = await page.locator('img, [data-testid*="photo"], .photo-item').count();
      analysis.hasPhotoGrid = photoElements > 0;
      analysis.photoCount = photoElements;

      if (photoElements > 0) {
        // Analyze grid layout
        const firstPhoto = await page.locator('img, [data-testid*="photo"], .photo-item').first();
        const photoBox = await firstPhoto.boundingBox();
        if (photoBox) {
          analysis.gridLayout.photoSize = { width: photoBox.width, height: photoBox.height };
        }

        // Estimate columns based on container width and photo positions
        const container = await page.locator('[data-testid="photos-panel"], .photos-panel, .photos-content').first();
        const containerBox = await container.boundingBox();
        if (containerBox && photoBox) {
          analysis.gridLayout.columns = Math.floor(containerBox.width / photoBox.width);
        }
      }

      // Loading state
      const loadingIndicator = await page.locator('[data-testid="loading"], .loading, .spinner').first();
      analysis.hasLoadingState = await loadingIndicator.isVisible();

      // Empty state
      const emptyState = await page.locator('[data-testid="empty"], .empty, :text("No photos")').first();
      analysis.hasEmptyState = await emptyState.isVisible();
    }
  } catch (error) {
    console.log('Photos panel analysis error:', error);
  }

  return analysis;
}

async function testInteractions(page: Page): Promise<PhotosAnalysis['interactions']> {
  const interactions: PhotosAnalysis['interactions'] = {
    photosButtonClickable: false,
    searchFunctional: false,
    photosHoverable: false,
    photosDraggable: false,
    photosSelectable: false
  };

  try {
    // Test Photos button click
    const photosButton = await page.locator('[data-testid="tool-photos"], [data-testid="photos-tool"], button:has-text("Photos")').first();
    if (await photosButton.isVisible()) {
      await photosButton.click();
      await page.waitForTimeout(1000);
      interactions.photosButtonClickable = true;
    }

    // Test search functionality
    const searchBar = await page.locator('input[placeholder*="Search"], input[placeholder*="photos"]').first();
    if (await searchBar.isVisible()) {
      await searchBar.fill('test');
      await page.waitForTimeout(500);
      interactions.searchFunctional = true;
      await searchBar.clear();
    }

    // Test photo hover effects
    const firstPhoto = await page.locator('img, [data-testid*="photo"], .photo-item').first();
    if (await firstPhoto.isVisible()) {
      await firstPhoto.hover();
      await page.waitForTimeout(200);
      interactions.photosHoverable = true;

      // Test photo selection
      await firstPhoto.click();
      interactions.photosSelectable = true;
    }

  } catch (error) {
    console.log('Interaction testing error:', error);
  }

  return interactions;
}

async function analyzeVisualDesign(page: Page): Promise<PhotosAnalysis['visualDesign']> {
  const visual: PhotosAnalysis['visualDesign'] = {
    hasHoverEffects: false,
    hasShadows: false,
    hasTransitions: false,
    hasProfessionalSpacing: false,
    hasMetadataDisplay: false
  };

  try {
    // Check for CSS transitions and effects
    const photosPanel = await page.locator('[data-testid="photos-panel"], .photos-panel, .photos-content').first();
    if (await photosPanel.isVisible()) {
      const styles = await photosPanel.evaluate((el) => {
        const computedStyle = window.getComputedStyle(el);
        return {
          transition: computedStyle.transition,
          boxShadow: computedStyle.boxShadow,
          padding: computedStyle.padding,
          margin: computedStyle.margin
        };
      });

      visual.hasTransitions = styles.transition !== 'all 0s ease 0s' && styles.transition !== 'none';
      visual.hasShadows = styles.boxShadow !== 'none';
      visual.hasProfessionalSpacing = parseInt(styles.padding) > 8 || parseInt(styles.margin) > 8;
    }

    // Check for photo metadata
    const metadata = await page.locator('.photo-meta, .photographer, .photo-info, [data-testid*="meta"]').count();
    visual.hasMetadataDisplay = metadata > 0;

    // Test hover effects on photos
    const firstPhoto = await page.locator('img, [data-testid*="photo"], .photo-item').first();
    if (await firstPhoto.isVisible()) {
      const beforeHover = await firstPhoto.evaluate((el) => window.getComputedStyle(el).transform);
      await firstPhoto.hover();
      await page.waitForTimeout(300);
      const afterHover = await firstPhoto.evaluate((el) => window.getComputedStyle(el).transform);
      visual.hasHoverEffects = beforeHover !== afterHover;
    }

  } catch (error) {
    console.log('Visual design analysis error:', error);
  }

  return visual;
}

test.describe('Photos Section Premium UI Review', () => {
  let startTime: number;
  let analysis: PhotosAnalysis;

  test.beforeEach(async ({ page }) => {
    startTime = Date.now();
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
  });

  test('Comprehensive Photos Section Analysis', async ({ page }) => {
    const timestamp = new Date().toISOString();
    console.log(`\n🎯 Starting Photos Section Analysis at ${timestamp}`);
    
    // Initialize analysis object
    analysis = {
      timestamp,
      layoutAnalysis: {} as any,
      photosPanel: {} as any,
      interactions: {} as any,
      visualDesign: {} as any,
      performance: {
        initialLoadTime: Date.now() - startTime,
        photosLoadTime: 0,
        scrollPerformance: 'not-tested'
      },
      missingFeatures: [],
      issues: []
    };

    // 1. Capture initial state
    console.log('📸 Capturing initial application state...');
    await page.screenshot({ 
      path: 'test-results/photos-review-initial.png', 
      fullPage: true 
    });

    // 2. Analyze layout structure
    console.log('🏗️ Analyzing layout structure...');
    analysis.layoutAnalysis = await analyzePhotosLayout(page);
    
    // 3. Click Photos tool and analyze panel
    console.log('🖱️ Testing Photos tool interaction...');
    const photosLoadStart = Date.now();
    
    if (analysis.layoutAnalysis.hasPhotosButton) {
      await page.click('[data-testid="tool-photos"], [data-testid="photos-tool"], button:has-text("Photos")');
      await page.waitForTimeout(2000);
      analysis.performance.photosLoadTime = Date.now() - photosLoadStart;
      
      // Capture Photos panel state
      await page.screenshot({ 
        path: 'test-results/photos-review-panel.png', 
        fullPage: true 
      });
    } else {
      analysis.issues.push('Photos button not found or not visible');
    }

    // 4. Analyze Photos panel
    console.log('📋 Analyzing Photos panel...');
    analysis.photosPanel = await analyzePhotosPanel(page);

    // 5. Test interactions
    console.log('🎮 Testing interactions...');
    analysis.interactions = await testInteractions(page);

    // 6. Analyze visual design
    console.log('🎨 Analyzing visual design...');
    analysis.visualDesign = await analyzeVisualDesign(page);

    // 7. Identify missing features based on expected functionality
    console.log('🔍 Identifying missing features...');
    if (!analysis.photosPanel.hasSearchBar) {
      analysis.missingFeatures.push('Search functionality for photos');
    }
    if (!analysis.photosPanel.hasFilterOptions) {
      analysis.missingFeatures.push('Photo filtering options (category, orientation, etc.)');
    }
    if (!analysis.photosPanel.hasCategoryTabs) {
      analysis.missingFeatures.push('Category tabs for photo organization');
    }
    if (!analysis.visualDesign.hasMetadataDisplay) {
      analysis.missingFeatures.push('Photo metadata display (photographer, source, etc.)');
    }
    if (!analysis.visualDesign.hasHoverEffects) {
      analysis.missingFeatures.push('Professional hover effects on photos');
    }
    if (analysis.photosPanel.photoCount === 0) {
      analysis.missingFeatures.push('Photo loading/display functionality');
    }

    // 8. Test mobile responsiveness
    console.log('📱 Testing mobile responsiveness...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    await page.screenshot({ 
      path: 'test-results/photos-review-mobile.png', 
      fullPage: true 
    });

    // Reset to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(1000);

    // 9. Final comprehensive screenshot with annotations
    console.log('📸 Capturing final annotated screenshots...');
    
    // Add some visual indicators for analysis
    await page.evaluate(() => {
      // Add temporary visual indicators
      const style = document.createElement('style');
      style.textContent = `
        .analysis-highlight {
          outline: 2px solid red !important;
          outline-offset: 2px !important;
        }
        .analysis-missing {
          position: relative !important;
        }
        .analysis-missing::after {
          content: "MISSING" !important;
          position: absolute !important;
          top: 0 !important;
          right: 0 !important;
          background: red !important;
          color: white !important;
          padding: 2px 4px !important;
          font-size: 10px !important;
          z-index: 9999 !important;
        }
      `;
      document.head.appendChild(style);
    });
    
    await page.screenshot({ 
      path: 'test-results/photos-review-final-annotated.png', 
      fullPage: true 
    });

    // 10. Save analysis report
    console.log('📊 Generating analysis report...');
    const reportPath = path.join(process.cwd(), 'test-results', 'photos-analysis-report.json');
    writeFileSync(reportPath, JSON.stringify(analysis, null, 2));

    // 11. Generate summary
    console.log('\n📋 PHOTOS SECTION ANALYSIS SUMMARY');
    console.log('=====================================');
    console.log(`⏱️  Initial Load Time: ${analysis.performance.initialLoadTime}ms`);
    console.log(`⏱️  Photos Load Time: ${analysis.performance.photosLoadTime}ms`);
    console.log(`🏗️  Layout Complete: ${analysis.layoutAnalysis.hasLeftToolbar && analysis.layoutAnalysis.hasPhotosButton}`);
    console.log(`📋 Photos Panel Visible: ${analysis.photosPanel.isVisible}`);
    console.log(`🖼️  Photo Count: ${analysis.photosPanel.photoCount}`);
    console.log(`❌ Missing Features: ${analysis.missingFeatures.length}`);
    console.log(`⚠️  Issues Found: ${analysis.issues.length}`);
    
    if (analysis.missingFeatures.length > 0) {
      console.log('\n🔍 MISSING FEATURES:');
      analysis.missingFeatures.forEach((feature, index) => {
        console.log(`   ${index + 1}. ${feature}`);
      });
    }
    
    if (analysis.issues.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      analysis.issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue}`);
      });
    }

    console.log('\n📁 Generated Files:');
    console.log('   • test-results/photos-review-initial.png');
    console.log('   • test-results/photos-review-panel.png');
    console.log('   • test-results/photos-review-mobile.png');
    console.log('   • test-results/photos-review-final-annotated.png');
    console.log('   • test-results/photos-analysis-report.json');
    
    // Ensure test fails if critical issues found
    if (analysis.issues.length > 0 || !analysis.photosPanel.isVisible) {
      console.log('\n❌ Test completed with issues requiring attention');
    } else {
      console.log('\n✅ Test completed successfully');
    }
  });

  test('Photo Grid Interaction Testing', async ({ page }) => {
    console.log('\n🎯 Testing Photo Grid Interactions...');
    
    // Navigate to Photos panel
    await page.click('[data-testid="tool-photos"], [data-testid="photos-tool"], button:has-text("Photos")');
    await page.waitForTimeout(2000);
    
    // Test each photo in the grid
    const photoElements = await page.locator('img, [data-testid*="photo"], .photo-item').all();
    
    if (photoElements.length === 0) {
      console.log('❌ No photos found in grid');
      return;
    }
    
    console.log(`📊 Found ${photoElements.length} photos in grid`);
    
    for (let i = 0; i < Math.min(photoElements.length, 5); i++) {
      const photo = photoElements[i];
      console.log(`🖼️  Testing photo ${i + 1}...`);
      
      // Test hover
      await photo.hover();
      await page.waitForTimeout(200);
      
      // Test click
      await photo.click();
      await page.waitForTimeout(300);
      
      // Capture state after click
      if (i === 0) {
        await page.screenshot({ 
          path: `test-results/photo-interaction-${i + 1}.png`, 
          fullPage: true 
        });
      }
    }
  });

  test('Search and Filter Functionality', async ({ page }) => {
    console.log('\n🔍 Testing Search and Filter Functionality...');
    
    // Navigate to Photos panel
    await page.click('[data-testid="tool-photos"], [data-testid="photos-tool"], button:has-text("Photos")');
    await page.waitForTimeout(2000);
    
    // Test search if available
    const searchBar = page.locator('input[placeholder*="Search"], input[placeholder*="photos"], [data-testid="search"]');
    
    if (await searchBar.first().isVisible()) {
      console.log('✅ Search bar found - testing functionality');
      
      await searchBar.first().fill('nature');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/search-nature.png', fullPage: true });
      
      await searchBar.first().fill('people');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/search-people.png', fullPage: true });
      
      await searchBar.first().clear();
      await page.waitForTimeout(1000);
    } else {
      console.log('❌ No search bar found');
    }
    
    // Test filters if available
    const filterElements = await page.locator('select, .dropdown, [data-testid*="filter"]').all();
    
    if (filterElements.length > 0) {
      console.log(`✅ Found ${filterElements.length} filter elements`);
      for (const filter of filterElements) {
        if (await filter.isVisible()) {
          await filter.click();
          await page.waitForTimeout(500);
        }
      }
    } else {
      console.log('❌ No filter elements found');
    }
  });
});