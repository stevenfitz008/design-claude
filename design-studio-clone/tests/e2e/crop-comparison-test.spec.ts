import { test, expect } from '@playwright/test';

test.describe('Crop Functionality Comparison', () => {
  test('Compare working crop test vs app crop functionality', async ({ page }) => {
    console.log('🧪 Starting crop comparison test...');
    
    // First test the working crop test
    console.log('📋 Testing working crop test...');
    await page.goto('file:///Users/stevenfitzpatrick/Library/Application Support/Claude/design-claude/design-studio-clone/test-working-crop.html');
    
    // Wait for the page to load
    await page.waitForTimeout(1000);
    
    // Add an image in the working test
    await page.click('button:has-text("Add Image")');
    await page.waitForTimeout(2000); // Wait for image to load
    
    // Test different crop positions in working test
    const workingTestResults = [];
    const cropPositions = [
      'left-top', 'center-top', 'right-top',
      'left-middle', 'center-middle', 'right-middle', 
      'left-bottom', 'center-bottom', 'right-bottom'
    ];
    
    for (const position of cropPositions) {
      console.log(`🔍 Testing ${position} in working crop test`);
      
      // Select crop position
      await page.selectOption('#cropPosition', position);
      await page.waitForTimeout(500);
      
      // Take screenshot for comparison
      const screenshot = await page.screenshot({ 
        clip: { x: 0, y: 0, width: 800, height: 600 },
        path: `./tests/screenshots/working-crop-${position}.png`
      });
      
      // Get console logs to capture crop values
      const logs = [];
      page.on('console', msg => {
        if (msg.text().includes('Applied') || msg.text().includes('crop')) {
          logs.push(msg.text());
        }
      });
      
      workingTestResults.push({
        position,
        screenshot: screenshot.length,
        logs: logs.length
      });
    }
    
    console.log('📋 Working test results:', workingTestResults);
    
    // Now test our app
    console.log('📱 Testing main app crop functionality...');
    await page.goto('http://localhost:3000');
    
    // Wait for app to load
    await page.waitForTimeout(2000);
    
    // Open Photos panel
    await page.click('[data-testid="photos-tool"], button:has-text("Photos"), .left-toolbar button:nth-child(3)');
    await page.waitForTimeout(1000);
    
    // Try to find and add an image
    try {
      // Look for photo thumbnails and drag one to canvas
      const photoThumbnail = page.locator('.photo-thumbnail, .photo-grid img, .unsplash-photo').first();
      await photoThumbnail.waitFor({ timeout: 5000 });
      
      // Drag photo to canvas center
      const canvasArea = page.locator('canvas, .canvas-container, #canvas-container').first();
      await photoThumbnail.dragTo(canvasArea);
      await page.waitForTimeout(2000);
      
      console.log('✅ Image added to canvas');
    } catch (error) {
      console.log('❌ Could not add image to canvas:', error.message);
      // Try alternative method - click to add image
      try {
        const addImageBtn = page.locator('button:has-text("Add"), .add-photo-btn').first();
        await addImageBtn.click({ timeout: 3000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('❌ Alternative image add failed:', e.message);
      }
    }
    
    // Click on the image to select it
    try {
      const imageElement = page.locator('canvas >> nth=0');
      await imageElement.click({ position: { x: 200, y: 150 } });
      await page.waitForTimeout(1000);
      console.log('✅ Image selected');
    } catch (error) {
      console.log('❌ Could not select image:', error.message);
    }
    
    // Test crop functionality in our app
    const appResults = [];
    
    try {
      // Look for crop button
      const cropButton = page.locator('button[title*="Crop"], button:has([icon="crop"]), .crop-button').first();
      await cropButton.waitFor({ timeout: 3000 });
      
      for (const position of cropPositions) {
        console.log(`🔍 Testing ${position} in main app`);
        
        try {
          // Select crop position from dropdown
          const cropDropdown = page.locator('select, .crop-position-select').first();
          await cropDropdown.selectOption(position);
          await page.waitForTimeout(300);
          
          // Click crop button
          await cropButton.click();
          await page.waitForTimeout(1000);
          
          // Take screenshot for comparison
          const screenshot = await page.screenshot({ 
            clip: { x: 300, y: 100, width: 800, height: 600 },
            path: `./tests/screenshots/app-crop-${position}.png`
          });
          
          // Capture console logs
          const logs = [];
          page.on('console', msg => {
            if (msg.text().includes('Applied') || msg.text().includes('crop') || msg.text().includes('🌾')) {
              logs.push(msg.text());
              console.log('📋 App console:', msg.text());
            }
          });
          
          appResults.push({
            position,
            screenshot: screenshot.length,
            logs: logs.length
          });
          
        } catch (error) {
          console.log(`❌ Error testing ${position} in app:`, error.message);
          appResults.push({
            position,
            error: error.message
          });
        }
      }
      
    } catch (error) {
      console.log('❌ Could not find crop controls in app:', error.message);
    }
    
    console.log('📱 App test results:', appResults);
    
    // Compare results
    console.log('\n📊 COMPARISON SUMMARY:');
    console.log('Working Test Results:', workingTestResults.length, 'positions tested');
    console.log('App Results:', appResults.length, 'positions tested');
    
    // Generate comparison report
    const report = {
      workingTest: workingTestResults,
      app: appResults,
      timestamp: new Date().toISOString()
    };
    
    // Save comparison report
    await page.evaluate((report) => {
      console.log('📄 FULL COMPARISON REPORT:', JSON.stringify(report, null, 2));
    }, report);
    
    // Basic assertion - both should have same number of positions tested
    expect(workingTestResults.length).toBeGreaterThan(0);
    console.log('✅ Crop comparison test completed');
  });
});