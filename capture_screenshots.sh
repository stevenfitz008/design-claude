#!/bin/bash

# Polotno Studio Screenshot Capture Script
# This script helps automate screenshot capture using BrowserMCP

echo "Polotno Studio Screenshot Capture Helper"
echo "========================================"
echo ""

# Check if BrowserMCP is running
echo "Checking if BrowserMCP server is running on port 9002..."
if ! lsof -i :9002 > /dev/null; then
    echo "❌ BrowserMCP server is not running on port 9002"
    echo "Please start it with: orunium-browser-mcp --port 8001"
    echo "(Note: It may still use port 9002 internally)"
    exit 1
else
    echo "✅ BrowserMCP server is running on port 9002"
fi

echo ""
echo "Directory Structure:"
echo "==================="
ls -la polotno-screenshots/

echo ""
echo "Screenshot Guide available at:"
echo "polotno-screenshots/SCREENSHOT_GUIDE.md"
echo ""

echo "Next Steps:"
echo "==========="
echo "1. Open your browser and navigate to https://studio.polotno.com"
echo "2. Follow the detailed screenshot guide in SCREENSHOT_GUIDE.md"
echo "3. Use your browser's built-in developer tools or extensions for automation"
echo "4. Save screenshots in the appropriate subdirectories"
echo ""

echo "Recommended Browser Automation Tools:"
echo "- Chrome DevTools Protocol"
echo "- Selenium WebDriver"
echo "- Puppeteer (if Node.js available)"
echo "- Manual capture with browser extensions"
echo ""

echo "Directory structure is ready for screenshots!"

# Function to create a simple screenshot index
create_index() {
    echo "Creating screenshot index..."
    find polotno-screenshots -name "*.png" -o -name "*.jpg" > polotno-screenshots/screenshot_index.txt
    echo "Screenshot index created at polotno-screenshots/screenshot_index.txt"
}

# Check if user wants to create an index
read -p "Would you like to create an index of existing screenshots? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    create_index
fi

echo ""
echo "Screenshot capture helper complete!"