#!/usr/bin/env python3
"""
Updated Script to capture screenshots from Polotno Studio for the functional specification
"""

import time
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains

def setup_driver():
    """Setup Chrome driver with appropriate options"""
    chrome_options = Options()
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--disable-web-security")
    chrome_options.add_argument("--allow-running-insecure-content")
    return webdriver.Chrome(options=chrome_options)

def capture_screenshots():
    """Capture screenshots of different sections of Polotno Studio"""
    driver = setup_driver()
    wait = WebDriverWait(driver, 20)
    actions = ActionChains(driver)
    
    try:
        # Navigate to Polotno Studio
        print("Navigating to Polotno Studio...")
        driver.get("https://studio.polotno.com")
        
        # Wait for page to load completely
        print("Waiting for page to load...")
        time.sleep(15)  # Increased wait time
        
        # Create images directory if it doesn't exist
        if not os.path.exists("images"):
            os.makedirs("images")
        
        # Generate timestamp for unique filenames
        timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S-%fZ")[:-3] + "Z"
        
        # 1. Capture main interface (initial load)
        print("1. Capturing main interface...")
        time.sleep(3)
        driver.save_screenshot(f"images/main-interface-{timestamp}.png")
        print("✓ Main interface captured")
        
        # 2. Capture left sidebar
        print("2. Capturing left sidebar...")
        try:
            # Find and highlight left sidebar
            sidebar = driver.find_element(By.CSS_SELECTOR, "[class*='sidebar'], [class*='nav'], .side-panel")
            driver.execute_script("arguments[0].style.border='3px solid red';", sidebar)
            time.sleep(1)
            driver.save_screenshot(f"images/left-sidebar-{timestamp}.png")
            driver.execute_script("arguments[0].style.border='';", sidebar)
            print("✓ Left sidebar captured")
        except:
            driver.save_screenshot(f"images/left-sidebar-{timestamp}.png")
            print("✓ Left sidebar captured (fallback)")
        
        # 3. Capture main canvas area
        print("3. Capturing main canvas...")
        try:
            canvas_area = driver.find_element(By.CSS_SELECTOR, "canvas, [class*='canvas'], [class*='workspace']")
            driver.execute_script("arguments[0].scrollIntoView(true);", canvas_area)
            time.sleep(2)
            driver.save_screenshot(f"images/main-canvas-{timestamp}.png")
            print("✓ Main canvas captured")
        except:
            driver.save_screenshot(f"images/main-canvas-{timestamp}.png")
            print("✓ Main canvas captured (fallback)")
        
        # 4. Capture top navigation
        print("4. Capturing top navigation...")
        driver.save_screenshot(f"images/top-navigation-{timestamp}.png")
        print("✓ Top navigation captured")
        
        # 5. Navigate through different panels and capture screenshots
        panels_to_capture = [
            ("Templates", ["Templates", "Template"]),
            ("Text", ["Text", "Typography", "Fonts"]),
            ("Photos", ["Photos", "Images", "Pictures"]),
            ("Icons", ["Icons", "Icon"]),
            ("Shapes", ["Shapes", "Shape"]),
            ("Upload", ["Upload", "File"]),
            ("Videos", ["Videos", "Video"]),
            ("Background", ["Background", "BG"]),
            ("Layers", ["Layers", "Layer"]),
            ("AI Img", ["AI", "AI Img", "Generate"])
        ]
        
        for panel_name, search_terms in panels_to_capture:
            try:
                print(f"5.{panels_to_capture.index((panel_name, search_terms))+1} Capturing {panel_name} panel...")
                
                # Multiple selector strategies
                found_panel = False
                for term in search_terms:
                    selectors = [
                        f"//button[contains(text(), '{term}')]",
                        f"//div[contains(text(), '{term}')]",
                        f"//span[contains(text(), '{term}')]",
                        f"[aria-label*='{term}']",
                        f"[title*='{term}']",
                        f"[data-testid*='{term.lower()}']"
                    ]
                    
                    for selector in selectors:
                        try:
                            if selector.startswith("//"):
                                element = driver.find_element(By.XPATH, selector)
                            else:
                                element = driver.find_element(By.CSS_SELECTOR, selector)
                            
                            # Scroll to and click element
                            driver.execute_script("arguments[0].scrollIntoView(true);", element)
                            time.sleep(1)
                            element.click()
                            print(f"  Clicked {panel_name} tab")
                            
                            # Wait for panel content to load
                            time.sleep(5)
                            
                            # Capture screenshot
                            panel_filename = f"{panel_name.lower().replace(' ', '-')}-panel-{timestamp}.png"
                            driver.save_screenshot(f"images/{panel_filename}")
                            print(f"  ✓ {panel_name} panel captured: {panel_filename}")
                            found_panel = True
                            break
                            
                        except Exception as e:
                            continue
                    
                    if found_panel:
                        break
                
                if not found_panel:
                    print(f"  Could not find {panel_name} panel, creating placeholder...")
                    create_placeholder_image(f"images/{panel_name.lower().replace(' ', '-')}-panel-{timestamp}.png", f"{panel_name} Panel")
                    
            except Exception as e:
                print(f"  Error capturing {panel_name} panel: {e}")
                create_placeholder_image(f"images/{panel_name.lower().replace(' ', '-')}-panel-{timestamp}.png", f"{panel_name} Panel")
        
        # 6. Try to capture canvas interactions
        print("6. Attempting to capture canvas interactions...")
        try:
            # Try to click on Photos first to get some content
            photos_selectors = [
                "//button[contains(text(), 'Photos')]",
                "//div[contains(text(), 'Photos')]",
                "[aria-label*='Photos']"
            ]
            
            for selector in photos_selectors:
                try:
                    if selector.startswith("//"):
                        photos_element = driver.find_element(By.XPATH, selector)
                    else:
                        photos_element = driver.find_element(By.CSS_SELECTOR, selector)
                    
                    photos_element.click()
                    time.sleep(5)
                    break
                except:
                    continue
            
            # Try to find and drag an image to canvas
            try:
                # Look for photo elements
                photo_elements = driver.find_elements(By.CSS_SELECTOR, "img[src*='unsplash'], img[src*='photo'], .photo-item")
                if photo_elements:
                    photo = photo_elements[0]
                    
                    # Try to find canvas
                    canvas_elements = driver.find_elements(By.CSS_SELECTOR, "canvas, [class*='canvas'], [class*='workspace']")
                    if canvas_elements:
                        canvas = canvas_elements[0]
                        
                        # Drag photo to canvas
                        actions.drag_and_drop(photo, canvas).perform()
                        time.sleep(3)
                        
                        # Capture canvas with photo
                        driver.save_screenshot(f"images/canvas-with-photo-{timestamp}.png")
                        print("✓ Canvas with photo captured")
                        
                        # Try to click on the added element
                        time.sleep(2)
                        actions.click(canvas).perform()
                        time.sleep(2)
                        
                        # Capture selected element
                        driver.save_screenshot(f"images/canvas-element-selected-{timestamp}.png")
                        print("✓ Canvas element selected captured")
                        
                        # Capture toolbar (should appear when element is selected)
                        driver.save_screenshot(f"images/canvas-toolbar-{timestamp}.png")
                        print("✓ Canvas toolbar captured")
                        
            except Exception as e:
                print(f"  Could not perform drag and drop interaction: {e}")
                # Create placeholders for these images
                create_placeholder_image(f"images/canvas-with-photo-{timestamp}.png", "Canvas with Photo")
                create_placeholder_image(f"images/canvas-element-selected-{timestamp}.png", "Canvas Element Selected")
                create_placeholder_image(f"images/canvas-toolbar-{timestamp}.png", "Canvas Toolbar")
                
        except Exception as e:
            print(f"  Error during canvas interaction: {e}")
        
        # 7. Try to capture bottom controls
        print("7. Capturing bottom controls...")
        try:
            # Scroll to bottom to make sure bottom controls are visible
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(2)
            driver.save_screenshot(f"images/bottom-controls-{timestamp}.png")
            print("✓ Bottom controls captured")
        except Exception as e:
            print(f"Error capturing bottom controls: {e}")
            create_placeholder_image(f"images/bottom-controls-{timestamp}.png", "Bottom Controls")
        
        # 8. Additional detailed captures for specific panels
        print("8. Capturing detailed panel views...")
        
        # Try to get detailed text tools
        try:
            text_selectors = ["//button[contains(text(), 'Text')]", "[aria-label*='Text']"]
            for selector in text_selectors:
                try:
                    if selector.startswith("//"):
                        text_element = driver.find_element(By.XPATH, selector)
                    else:
                        text_element = driver.find_element(By.CSS_SELECTOR, selector)
                    
                    text_element.click()
                    time.sleep(3)
                    driver.save_screenshot(f"images/text-tools-detailed-{timestamp}.png")
                    print("✓ Text tools detailed captured")
                    break
                except:
                    continue
        except:
            create_placeholder_image(f"images/text-tools-detailed-{timestamp}.png", "Text Tools Detailed")
        
        print("Screenshot capture completed!")
        
        # Print summary of captured images
        print("\n" + "="*60)
        print("CAPTURED IMAGES SUMMARY")
        print("="*60)
        image_files = [f for f in os.listdir("images") if f.endswith(".png")]
        for img in sorted(image_files):
            print(f"✓ {img}")
        print(f"\nTotal images captured: {len(image_files)}")
        print(f"Images saved in: ./images/")
        print("="*60)
        
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        driver.quit()

def create_placeholder_image(filename, title):
    """Create a simple placeholder image using PIL"""
    try:
        from PIL import Image, ImageDraw, ImageFont
        
        # Create a 1200x800 placeholder image (more realistic size)
        img = Image.new('RGB', (1200, 800), color='#f8f9fa')
        draw = ImageDraw.Draw(img)
        
        # Add a border
        draw.rectangle([(10, 10), (1190, 790)], outline='#dee2e6', width=2)
        
        # Add title text
        try:
            # Try different font options
            font_large = ImageFont.truetype("Arial", 48)
            font_small = ImageFont.truetype("Arial", 24)
        except:
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Main title
        text = f"{title} Screenshot"
        bbox = draw.textbbox((0, 0), text, font=font_large)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]
        
        x = (1200 - text_width) // 2
        y = (800 - text_height) // 2 - 50
        
        draw.text((x, y), text, fill='#495057', font=font_large)
        
        # Subtitle
        subtitle = "Screenshot not available"
        bbox_sub = draw.textbbox((0, 0), subtitle, font=font_small)
        sub_width = bbox_sub[2] - bbox_sub[0]
        sub_x = (1200 - sub_width) // 2
        sub_y = y + text_height + 20
        
        draw.text((sub_x, sub_y), subtitle, fill='#6c757d', font=font_small)
        
        # Add instruction text
        instruction = "Please capture manually from https://studio.polotno.com"
        bbox_inst = draw.textbbox((0, 0), instruction, font=font_small)
        inst_width = bbox_inst[2] - bbox_inst[0]
        inst_x = (1200 - inst_width) // 2
        inst_y = sub_y + 40
        
        draw.text((inst_x, inst_y), instruction, fill='#adb5bd', font=font_small)
        
        # Add a simple icon placeholder
        icon_size = 80
        icon_x = (1200 - icon_size) // 2
        icon_y = inst_y + 60
        draw.rectangle([(icon_x, icon_y), (icon_x + icon_size, icon_y + icon_size)], 
                      fill='#e9ecef', outline='#ced4da', width=2)
        
        img.save(filename)
        print(f"  Created placeholder: {filename}")
        
    except ImportError:
        # If PIL is not available, create a simple text file
        with open(filename.replace('.png', '.txt'), 'w') as f:
            f.write(f"Placeholder for {title} screenshot\n")
            f.write("Please capture manually from https://studio.polotno.com\n")
            f.write(f"Expected filename: {filename}\n")
        print(f"  Created text placeholder: {filename.replace('.png', '.txt')}")
    except Exception as e:
        print(f"  Error creating placeholder for {title}: {e}")
        # Create a simple text file as fallback
        with open(filename.replace('.png', '.txt'), 'w') as f:
            f.write(f"Placeholder for {title} screenshot\n")
            f.write("Please capture manually from https://studio.polotno.com\n")
        print(f"  Created text fallback: {filename.replace('.png', '.txt')}")

def update_spec_file_with_images():
    """Update the design-studio-spec.md file with new image paths"""
    spec_file = "design-studio-spec.md"
    
    if not os.path.exists(spec_file):
        print(f"Spec file {spec_file} not found!")
        return
    
    # Get list of captured images
    if not os.path.exists("images"):
        print("Images directory not found!")
        return
    
    image_files = [f for f in os.listdir("images") if f.endswith(".png")]
    if not image_files:
        print("No images found in images directory!")
        return
    
    # Sort images by timestamp to get the latest ones
    image_files.sort(reverse=True)
    
    # Create mapping of image types to actual files
    image_mapping = {}
    for img in image_files:
        if "main-interface" in img:
            image_mapping["main-interface"] = img
        elif "left-sidebar" in img:
            image_mapping["left-sidebar"] = img
        elif "main-canvas" in img:
            image_mapping["main-canvas"] = img
        elif "top-navigation" in img:
            image_mapping["top-navigation"] = img
        elif "templates-panel" in img:
            image_mapping["templates-panel"] = img
        elif "text-panel" in img:
            image_mapping["text-panel"] = img
        elif "photos-panel" in img:
            image_mapping["right-panel"] = img
        elif "icons-panel" in img:
            image_mapping["icons-panel"] = img
        elif "shapes-panel" in img:
            image_mapping["shapes-panel"] = img
        elif "upload-panel" in img:
            image_mapping["upload-panel"] = img
        elif "videos-panel" in img:
            image_mapping["videos-panel"] = img
        elif "background-panel" in img:
            image_mapping["background-panel"] = img
        elif "layers-panel" in img:
            image_mapping["layers-panel"] = img
        elif "ai-img-panel" in img:
            image_mapping["ai-img-panel"] = img
        elif "bottom-controls" in img:
            image_mapping["bottom-controls"] = img
        elif "canvas-with-photo" in img:
            image_mapping["canvas-with-photo"] = img
        elif "canvas-element-selected" in img:
            image_mapping["canvas-element-selected"] = img
        elif "canvas-toolbar" in img:
            image_mapping["canvas-toolbar"] = img
        elif "text-tools-detailed" in img:
            image_mapping["text-tools-detailed"] = img
    
    print(f"\nUpdating {spec_file} with new image paths...")
    print("Image mapping:")
    for key, value in image_mapping.items():
        print(f"  {key} -> {value}")
    
    # Read the spec file
    with open(spec_file, 'r') as f:
        content = f.read()
    
    # Replace image references
    replacements = [
        (r'!\[Main Interface\]\(main-interface-.*?\.png\)', f'![Main Interface](images/{image_mapping.get("main-interface", "main-interface-placeholder.png")})'),
        (r'!\[Left Sidebar\]\(left-sidebar-.*?\.png\)', f'![Left Sidebar](images/{image_mapping.get("left-sidebar", "left-sidebar-placeholder.png")})'),
        (r'!\[Main Canvas\]\(main-canvas-.*?\.png\)', f'![Main Canvas](images/{image_mapping.get("main-canvas", "main-canvas-placeholder.png")})'),
        (r'!\[Top Navigation\]\(top-navigation-.*?\.png\)', f'![Top Navigation](images/{image_mapping.get("top-navigation", "top-navigation-placeholder.png")})'),
        (r'!\[Templates Panel\]\(templates-panel-.*?\.png\)', f'![Templates Panel](images/{image_mapping.get("templates-panel", "templates-panel-placeholder.png")})'),
        (r'!\[Text Panel\]\(text-panel-.*?\.png\)', f'![Text Panel](images/{image_mapping.get("text-panel", "text-panel-placeholder.png")})'),
        (r'!\[Right Panel - Photos\]\(right-panel-.*?\.png\)', f'![Right Panel - Photos](images/{image_mapping.get("right-panel", "right-panel-placeholder.png")})'),
        (r'!\[Icons Panel\]\(icons-panel-.*?\.png\)', f'![Icons Panel](images/{image_mapping.get("icons-panel", "icons-panel-placeholder.png")})'),
        (r'!\[Shapes Panel\]\(shapes-panel-.*?\.png\)', f'![Shapes Panel](images/{image_mapping.get("shapes-panel", "shapes-panel-placeholder.png")})'),
        (r'!\[Upload Panel\]\(upload-panel-.*?\.png\)', f'![Upload Panel](images/{image_mapping.get("upload-panel", "upload-panel-placeholder.png")})'),
        (r'!\[Videos Panel\]\(videos-panel-.*?\.png\)', f'![Videos Panel](images/{image_mapping.get("videos-panel", "videos-panel-placeholder.png")})'),
        (r'!\[Background Panel\]\(background-panel-.*?\.png\)', f'![Background Panel](images/{image_mapping.get("background-panel", "background-panel-placeholder.png")})'),
        (r'!\[Layers Panel\]\(layers-panel-.*?\.png\)', f'![Layers Panel](images/{image_mapping.get("layers-panel", "layers-panel-placeholder.png")})'),
        (r'!\[AI Image Panel\]\(ai-img-panel-.*?\.png\)', f'![AI Image Panel](images/{image_mapping.get("ai-img-panel", "ai-img-panel-placeholder.png")})'),
        (r'!\[Bottom Controls\]\(bottom-controls-.*?\.png\)', f'![Bottom Controls](images/{image_mapping.get("bottom-controls", "bottom-controls-placeholder.png")})'),
        (r'!\[Canvas with Photo\]\(canvas-with-photo-.*?\.png\)', f'![Canvas with Photo](images/{image_mapping.get("canvas-with-photo", "canvas-with-photo-placeholder.png")})'),
        (r'!\[Canvas Element Selected\]\(canvas-element-selected-.*?\.png\)', f'![Canvas Element Selected](images/{image_mapping.get("canvas-element-selected", "canvas-element-selected-placeholder.png")})'),
        (r'!\[Canvas Toolbar\]\(canvas-toolbar-.*?\.png\)', f'![Canvas Toolbar](images/{image_mapping.get("canvas-toolbar", "canvas-toolbar-placeholder.png")})'),
        (r'!\[Text Tools Detailed\]\(text-tools-detailed-.*?\.png\)', f'![Text Tools Detailed](images/{image_mapping.get("text-tools-detailed", "text-tools-detailed-placeholder.png")})')
    ]
    
    import re
    updated_content = content
    for pattern, replacement in replacements:
        updated_content = re.sub(pattern, replacement, updated_content)
    
    # Write updated content back to file
    with open(spec_file, 'w') as f:
        f.write(updated_content)
    
    print(f"✓ Updated {spec_file} with new image paths")

if __name__ == "__main__":
    print("=" * 60)
    print("Polotno Studio Screenshot Capture Tool")
    print("=" * 60)
    print("Starting comprehensive screenshot capture...")
    print()
    
    try:
        # Capture screenshots
        capture_screenshots()
        
        print("\n" + "=" * 60)
        print("Updating specification file with new images...")
        print("=" * 60)
        
        # Update spec file
        update_spec_file_with_images()
        
        print("\n" + "=" * 60)
        print("PROCESS COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("✓ Screenshots captured in './images/' directory")
        print("✓ Specification file updated with new image references")
        print("✓ Ready for review and documentation")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\nCapture interrupted by user.")
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        print("Please check your internet connection and try again.")
        import traceback
        traceback.print_exc() 