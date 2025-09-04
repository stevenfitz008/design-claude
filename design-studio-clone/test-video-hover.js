/**
 * Manual test script for Videos Panel hover overlay functionality
 * Run this in the browser console to test hover behavior
 */

(function testVideoHoverOverlay() {
  console.log('🎬 Starting Video Panel Hover Overlay Test');
  
  const results = {
    panelFound: false,
    videosFound: 0,
    overlaysFound: 0,
    hoverTestsPassed: 0,
    issues: []
  };

  // Step 1: Check if Videos Panel exists
  const videosPanel = document.querySelector('[id="videos-scroll-container"]');
  if (!videosPanel) {
    results.issues.push('Videos panel not found - make sure Videos tool is selected');
    console.error('❌ Videos panel not found');
    return results;
  }
  
  results.panelFound = true;
  console.log('✅ Videos panel found');

  // Step 2: Find all video cards
  const videoCards = videosPanel.querySelectorAll('[draggable="true"]');
  results.videosFound = videoCards.length;
  console.log(`📹 Found ${videoCards.length} video cards`);

  if (videoCards.length === 0) {
    results.issues.push('No video cards found - videos may not have loaded yet');
    return results;
  }

  // Step 3: Check each video card for overlay elements
  videoCards.forEach((card, index) => {
    const overlay = card.querySelector('.video-overlay');
    if (overlay) {
      results.overlaysFound++;
      console.log(`✅ Video ${index + 1}: Overlay element found`);
      
      // Test initial state
      const initialOpacity = window.getComputedStyle(overlay).opacity;
      if (initialOpacity !== '0') {
        results.issues.push(`Video ${index + 1}: Overlay should start hidden (opacity: 0), but found opacity: ${initialOpacity}`);
      }

      // Test hover functionality
      try {
        // Simulate mouse enter
        const mouseEnterEvent = new MouseEvent('mouseenter', { bubbles: true });
        card.dispatchEvent(mouseEnterEvent);
        
        // Check if overlay becomes visible
        setTimeout(() => {
          const hoverOpacity = window.getComputedStyle(overlay).opacity;
          if (hoverOpacity === '1') {
            results.hoverTestsPassed++;
            console.log(`✅ Video ${index + 1}: Hover overlay working correctly`);
          } else {
            results.issues.push(`Video ${index + 1}: Overlay not showing on hover (opacity: ${hoverOpacity})`);
          }

          // Simulate mouse leave
          const mouseLeaveEvent = new MouseEvent('mouseleave', { bubbles: true });
          card.dispatchEvent(mouseLeaveEvent);
          
          // Check if overlay hides again
          setTimeout(() => {
            const leaveOpacity = window.getComputedStyle(overlay).opacity;
            if (leaveOpacity !== '0') {
              results.issues.push(`Video ${index + 1}: Overlay not hiding on mouse leave (opacity: ${leaveOpacity})`);
            }
          }, 250); // Wait for transition
          
        }, 50); // Small delay for hover effect
        
      } catch (error) {
        results.issues.push(`Video ${index + 1}: Error testing hover - ${error.message}`);
      }
    } else {
      results.issues.push(`Video ${index + 1}: No overlay element found`);
    }
  });

  // Step 4: Check overlay content
  const firstOverlay = document.querySelector('.video-overlay');
  if (firstOverlay) {
    const authorName = firstOverlay.textContent;
    if (authorName.includes('Pexels')) {
      console.log('✅ Overlay contains "Pexels" attribution');
    } else {
      results.issues.push('Overlay should contain "Pexels" attribution');
    }
  }

  // Report results
  setTimeout(() => {
    console.log('\n🎬 VIDEO HOVER TEST RESULTS:');
    console.log('================================');
    console.log(`Panel Found: ${results.panelFound ? '✅' : '❌'}`);
    console.log(`Videos Found: ${results.videosFound}`);
    console.log(`Overlays Found: ${results.overlaysFound}/${results.videosFound}`);
    console.log(`Hover Tests Passed: ${results.hoverTestsPassed}/${results.overlaysFound}`);
    
    if (results.issues.length > 0) {
      console.log('\n🚨 ISSUES FOUND:');
      results.issues.forEach(issue => console.log(`  • ${issue}`));
    } else {
      console.log('\n🎉 ALL TESTS PASSED! Video hover overlays are working correctly.');
    }
    
    console.log('\n📝 Test completed');
    return results;
  }, 1000); // Wait for all async operations
  
  return results;
})();

// Also provide manual testing instructions
console.log(`
🎬 MANUAL VIDEO HOVER TEST INSTRUCTIONS:
========================================
1. Make sure you're on http://localhost:3000
2. Click the Videos tool in the left toolbar (video camera icon)
3. Wait for videos to load (should see video thumbnails)
4. Hover over any video card
5. You should see author name and "Pexels" appear at the bottom
6. Move mouse away - overlay should disappear
7. Test multiple video cards to ensure consistency

Expected behavior:
• Smooth fade in/out transition (0.2s ease)
• Author name + "Pexels" attribution
• Dark gradient background from transparent to black
• Overlay positioned at bottom of video card
`);