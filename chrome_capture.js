// Chrome automation script for Polotno Studio screenshots
// This script can be run in Chrome's developer console for manual screenshot capture

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function capturePolotnoScreenshots() {
    console.log('Starting Polotno Studio screenshot capture...');
    
    // Helper function to trigger screenshot (requires manual browser extension or dev tools)
    function triggerScreenshot(filename) {
        console.log(`📷 CAPTURE: ${filename}`);
        console.log('Use browser screenshot function or dev tools to save this view');
        return new Promise(resolve => {
            // Pause for manual screenshot
            setTimeout(() => {
                console.log(`✅ Ready for next step after capturing: ${filename}`);
                resolve();
            }, 3000);
        });
    }

    try {
        // Wait for page load
        await sleep(2000);
        
        // 1. Overview Screenshots
        console.log('=== OVERVIEW SCREENSHOTS ===');
        await triggerScreenshot('polotno-screenshots/Overview/01-main-interface-initial.png');
        
        // 2. Templates Functionality
        console.log('=== TEMPLATES SCREENSHOTS ===');
        
        // Try to click Templates tab
        const templatesTab = document.querySelector('[data-testid="templates-tab"], [title*="Template"], [aria-label*="Template"], .side-panel button:contains("Templates")');
        if (templatesTab) {
            templatesTab.click();
            await sleep(1000);
            await triggerScreenshot('polotno-screenshots/Templates/02-templates-panel-open.png');
        } else {
            console.log('❌ Templates tab not found - check selector');
        }
        
        // 3. Text Functionality  
        console.log('=== TEXT SCREENSHOTS ===');
        
        // Try to click Text tab
        const textTab = document.querySelector('[data-testid="text-tab"], [title*="Text"], [aria-label*="Text"], .side-panel button:contains("Text")');
        if (textTab) {
            textTab.click();
            await sleep(1000);
            await triggerScreenshot('polotno-screenshots/Text/02-text-panel-open.png');
        } else {
            console.log('❌ Text tab not found - check selector');
        }
        
        // 4. Try to add a text element
        const textElement = document.querySelector('.text-element, .add-text, [data-type="text"]');
        if (textElement) {
            console.log('🖱️ Text element found, simulate drag to canvas');
            // Manual instruction for drag-and-drop
            await triggerScreenshot('polotno-screenshots/Text/04-text-drag-in-progress.png');
        }
        
        console.log('📋 Screenshot capture sequence complete!');
        console.log('Check console logs for filename instructions');
        
    } catch (error) {
        console.error('Error during capture:', error);
    }
}

// Instructions for manual use
console.log(`
🎯 POLOTNO STUDIO SCREENSHOT AUTOMATION

1. Navigate to https://studio.polotno.com
2. Open Chrome Developer Console (F12)
3. Paste and run this script: capturePolotnoScreenshots()
4. Follow console prompts for each screenshot
5. Use browser screenshot tools or extensions to capture each view

Ready to start? Run: capturePolotnoScreenshots()
`);

// Auto-start if on Polotno domain
if (window.location.hostname.includes('polotno.com')) {
    console.log('🚀 Auto-starting on Polotno domain...');
    setTimeout(capturePolotnoScreenshots, 2000);
}