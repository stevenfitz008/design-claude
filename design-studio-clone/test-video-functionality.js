// Simple test to verify video functionality
console.log('🎬 Testing Video Panel Functionality');

// Test 1: Check if Videos button exists
const testVideoButton = () => {
  const videoButton = document.querySelector('[data-testid="tool-videos"]');
  console.log('✅ Videos button found:', videoButton ? 'Yes' : 'No');
  return videoButton;
};

// Test 2: Click Videos button and check panel
const testVideoPanelSwitch = () => {
  const videoButton = testVideoButton();
  if (videoButton) {
    videoButton.click();
    console.log('✅ Clicked Videos button');
    
    // Check if video panel appears
    setTimeout(() => {
      const videoPanel = document.querySelector('#videos-scroll-container');
      console.log('✅ Video panel visible:', videoPanel ? 'Yes' : 'No');
      
      if (videoPanel) {
        const videoElements = videoPanel.querySelectorAll('video');
        console.log('✅ Video elements found:', videoElements.length);
        
        const imgElements = videoPanel.querySelectorAll('img');
        console.log('✅ Thumbnail images found:', imgElements.length);
      }
    }, 500);
  }
};

// Test 3: Test video hover functionality
const testVideoHover = () => {
  setTimeout(() => {
    const firstVideoContainer = document.querySelector('#videos-scroll-container [draggable="true"]');
    if (firstVideoContainer) {
      console.log('✅ Found video container, testing hover...');
      
      // Simulate mouse enter
      const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
      firstVideoContainer.dispatchEvent(mouseEnterEvent);
      console.log('✅ Dispatched mouseenter event');
      
      // Check if video plays
      setTimeout(() => {
        const video = firstVideoContainer.querySelector('video');
        if (video) {
          console.log('✅ Video element:', video.src);
          console.log('✅ Video paused:', video.paused);
          console.log('✅ Video display:', getComputedStyle(video).display);
        }
      }, 1000);
    }
  }, 1000);
};

// Run tests when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      testVideoPanelSwitch();
      testVideoHover();
    }, 2000);
  });
} else {
  setTimeout(() => {
    testVideoPanelSwitch();
    testVideoHover();
  }, 2000);
}