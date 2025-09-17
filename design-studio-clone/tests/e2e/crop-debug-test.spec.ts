import { test, expect } from '@playwright/test';

test.describe('Crop Debug Test', () => {
  test('Debug crop functionality with console logs', async ({ page }) => {
    console.log('🔧 Starting crop debug test...');
    
    // Capture all console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      console.log(`📋 Console: [${msg.type()}] ${text}`);
    });
    
    // Go to the main app
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);
    
    console.log('📱 App loaded, looking for elements...');
    
    // Take initial screenshot
    await page.screenshot({ path: 'tests/screenshots/app-initial.png', fullPage: true });
    
    // Check if Photos panel is available
    try {
      const photosButton = page.locator('button:has-text("Photos"), [data-testid="photos-tool"]').first();
      await photosButton.waitFor({ timeout: 5000 });
      await photosButton.click();
      console.log('✅ Photos panel opened');
      await page.waitForTimeout(2000);
    } catch (error) {
      console.log('❌ Could not open Photos panel:', error.message);
    }
    
    // Take screenshot after opening photos
    await page.screenshot({ path: 'tests/screenshots/app-photos-panel.png', fullPage: true });
    
    // Instead of trying to add an image, let's manually add one via JavaScript
    console.log('🖼️ Adding test image via JavaScript...');
    
    await page.evaluate(() => {
      // Add a test image element directly to the canvas
      const testImageUrl = 'https://images.unsplash.com/photo-1588899357441-7f613216191b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3wzMjM4NDZ8MHwxfHJhbmRvbXx8fHx8fHx8fDE2OTU2NTM2NDh8&ixlib=rb-4.0.3&q=80&w=600';
      
      // Try to use the canvas store to add an image
      if (window.useCanvasStore && window.useCanvasStore.getState) {
        const canvasStore = window.useCanvasStore.getState();
        console.log('🏪 Canvas store found:', Object.keys(canvasStore));
        
        // Try to add an image element
        if (canvasStore.addElement) {
          const imageElement = {
            id: 'test-image-' + Date.now(),
            type: 'image',
            x: 100,
            y: 100,
            width: 200,
            height: 150,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: 1,
            src: testImageUrl,
            originalWidth: 600,
            originalHeight: 400,
            fit: 'cover',
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          
          canvasStore.addElement(imageElement);
          console.log('✅ Test image added to canvas store');
          
          // Select the image
          if (canvasStore.selectElement) {
            canvasStore.selectElement(imageElement.id);
            console.log('✅ Test image selected');
          }
        }
      } else {
        console.log('❌ Canvas store not found on window');
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Take screenshot after adding image
    await page.screenshot({ path: 'tests/screenshots/app-with-image.png', fullPage: true });
    
    // Now try to test crop functionality
    console.log('🌾 Testing crop functionality...');
    
    // Look for crop controls
    try {
      const cropButton = page.locator('button[title*="crop"], button:has([icon="crop"])').first();
      await cropButton.waitFor({ timeout: 5000 });
      console.log('✅ Crop button found');
      
      const cropDropdown = page.locator('select').first();
      await cropDropdown.waitFor({ timeout: 5000 });
      console.log('✅ Crop dropdown found');
      
      // Test different crop positions
      const positions = ['left-top', 'center-top', 'right-top', 'center-middle'];
      
      for (const position of positions) {
        console.log(`🔍 Testing crop position: ${position}`);
        
        // Clear console logs for this test
        const startingLogCount = consoleLogs.length;
        
        // Select position
        await cropDropdown.selectOption(position);
        await page.waitForTimeout(300);
        
        // Click crop button
        await cropButton.click();
        await page.waitForTimeout(1000);
        
        // Check for new console logs
        const newLogs = consoleLogs.slice(startingLogCount);
        console.log(`📋 New logs for ${position}:`, newLogs.length);
        newLogs.forEach(log => console.log(`   ${log}`));
        
        // Take screenshot
        await page.screenshot({ path: `tests/screenshots/app-crop-${position}.png`, fullPage: true });
      }
      
    } catch (error) {
      console.log('❌ Could not find crop controls:', error.message);
    }
    
    // Log all console output
    console.log('\n📋 ALL CONSOLE LOGS:');
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}: ${log}`);
    });
    
    // Filter crop-related logs
    const cropLogs = consoleLogs.filter(log => 
      log.includes('crop') || log.includes('🌾') || log.includes('🔍') || 
      log.includes('Applied') || log.includes('getCrop')
    );
    
    console.log('\n🌾 CROP-RELATED LOGS:');
    cropLogs.forEach(log => console.log(`   ${log}`));
    
    console.log('✅ Crop debug test completed');
    console.log(`📊 Total console logs: ${consoleLogs.length}`);
    console.log(`📊 Crop-related logs: ${cropLogs.length}`);
  });
});