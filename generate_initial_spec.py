#!/usr/bin/env python3
"""
Generate initial.md specification using Pydantic models to structure 
the Application and Technical specification content.
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from pathlib import Path
import os

class TechnicalStack(BaseModel):
    frontend_framework: str = Field(description="Primary frontend framework")
    build_system: str = Field(description="Build and development system")
    ui_components: str = Field(description="UI component library")
    canvas_frameworks: List[str] = Field(description="Canvas and rendering frameworks")
    styling_system: str = Field(description="CSS and styling approach")
    state_management: str = Field(description="State management solution")
    database: str = Field(description="Database technologies")
    additional_technologies: List[str] = Field(default_factory=list)

class InterfaceComponent(BaseModel):
    name: str = Field(description="Component name")
    location: str = Field(description="Where component is positioned")
    width: Optional[str] = Field(None, description="Component width specification")
    primary_functions: List[str] = Field(description="Main functions provided")
    technical_details: List[str] = Field(default_factory=list)

class PanelContent(BaseModel):
    panel_type: str = Field(description="Type of panel content")
    description: str = Field(description="Detailed panel description")
    functionality: List[str] = Field(description="Key functionality provided")
    technical_info: List[str] = Field(default_factory=list)
    api_integrations: List[str] = Field(default_factory=list)

class CanvasFeature(BaseModel):
    feature_name: str = Field(description="Feature name")
    description: str = Field(description="Feature description")
    controls: List[str] = Field(description="Available controls")
    technical_specs: List[str] = Field(default_factory=list)

class PerformanceMetric(BaseModel):
    metric_name: str = Field(description="Performance metric name")
    target_value: str = Field(description="Target performance value")
    description: str = Field(description="Metric description")

class SecurityFeature(BaseModel):
    feature_name: str = Field(description="Security feature name")
    implementation: str = Field(description="How feature is implemented")
    compliance: List[str] = Field(default_factory=list)

class ApplicationSpecification(BaseModel):
    """Complete application specification using Pydantic structure"""
    
    # Basic Info
    application_name: str = Field(description="Application name")
    application_url: str = Field(description="Application URL")
    application_type: str = Field(description="Type of application")
    
    # Technical Architecture
    technical_stack: TechnicalStack = Field(description="Complete technical stack")
    
    # Interface Structure
    main_layout: Dict[str, str] = Field(description="Main layout structure")
    interface_components: List[InterfaceComponent] = Field(description="All interface components")
    
    # Panel System
    panel_contents: List[PanelContent] = Field(description="All panel types and content")
    
    # Canvas Features
    canvas_features: List[CanvasFeature] = Field(description="Canvas functionality")
    
    # Performance & Security
    performance_metrics: List[PerformanceMetric] = Field(description="Performance targets")
    security_features: List[SecurityFeature] = Field(description="Security implementation")
    
    # Additional Features
    collaboration_features: List[str] = Field(default_factory=list)
    export_formats: List[str] = Field(default_factory=list)
    accessibility_features: List[str] = Field(default_factory=list)
    
    # Business Model
    subscription_tiers: List[Dict[str, Any]] = Field(default_factory=list)
    developer_ecosystem: List[str] = Field(default_factory=list)

def create_application_spec() -> ApplicationSpecification:
    """Create the application specification from the documentation"""
    
    technical_stack = TechnicalStack(
        frontend_framework="React 18.2+ with Blueprint.js components",
        build_system="Vite",
        ui_components="Blueprint.js UI components with dark theme",
        canvas_frameworks=["Konva.js", "HTML5 Canvas", "WebGL", "Three.js"],
        styling_system="Goober CSS-in-JS with auto-generated class names",
        state_management="Zustand + React Context (primary), MobX (data flows)",
        database="PostgreSQL (primary) + MobX (caching) + MongoDB (documents)",
        additional_technologies=[
            "Google Fonts API",
            "Unsplash API integration",
            "AI image generation APIs",
            "WebAssembly for video processing"
        ]
    )
    
    interface_components = [
        InterfaceComponent(
            name="Left Sidebar - Tool Navigation",
            location="Left side of application",
            width="72px minimum, expandable",
            primary_functions=[
                "Primary navigation hub with 14 tool categories",
                "Progressive disclosure for tool controls",
                "SVG icon system with descriptive labels"
            ],
            technical_details=[
                "React functional components with hooks",
                "SVG sprite system with 24x24px viewBox",
                "ARIA support with keyboard navigation"
            ]
        ),
        InterfaceComponent(
            name="Main Canvas Area",
            location="Center of application",
            width="Flexible width",
            primary_functions=[
                "Interactive design workspace",
                "Infinite zoom capabilities",
                "Multi-page support with timeline",
                "Element manipulation controls"
            ],
            technical_details=[
                "HTML5 Canvas with WebGL acceleration",
                "Immutable state trees with 100+ undo/redo operations",
                "RAF-based animation loops",
                "Custom event delegation system"
            ]
        ),
        InterfaceComponent(
            name="Right Panel - Context Tools",
            location="Right side of application",
            width="350px, collapsible",
            primary_functions=[
                "Context-sensitive tool panels",
                "Content libraries and search",
                "Dynamic content based on left sidebar selection"
            ],
            technical_details=[
                "Dynamic panel switching system",
                "API integrations for content libraries",
                "Progressive loading with skeleton screens"
            ]
        )
    ]
    
    panel_contents = [
        PanelContent(
            panel_type="Templates Panel",
            description="Curated collection of professionally designed layouts organized by category",
            functionality=[
                "Responsive grid with hover previews",
                "Search and filtering capabilities",
                "Premium template badges",
                "Drag-and-drop template application"
            ],
            technical_info=[
                "RESTful template service with CDN thumbnails",
                "Service worker caching with 24-hour TTL",
                "Elasticsearch-powered search"
            ],
            api_integrations=["Template service API", "CDN delivery"]
        ),
        PanelContent(
            panel_type="Photos Panel",
            description="Unsplash API integration providing 3M+ high-quality stock photographs",
            functionality=[
                "Intelligent search with keyword suggestions",
                "Masonry grid layout",
                "Proper attribution and licensing",
                "Infinite scroll with lazy loading"
            ],
            technical_info=[
                "Unsplash API v1 with rate limiting",
                "Progressive JPEG loading",
                "IndexedDB for offline capability"
            ],
            api_integrations=["Unsplash API v1", "Attribution tracking"]
        ),
        PanelContent(
            panel_type="AI Image Generation",
            description="AI-powered custom image creation from text prompts",
            functionality=[
                "Natural language prompts",
                "Style presets and parameters",
                "Batch generation with variations",
                "Negative prompts for content exclusion"
            ],
            technical_info=[
                "REST API integration with AI models",
                "Asynchronous processing with job tracking",
                "Content filtering and safety checks"
            ],
            api_integrations=["Stable Diffusion API", "DALL-E API"]
        )
    ]
    
    canvas_features = [
        CanvasFeature(
            feature_name="Element Transform System",
            description="Comprehensive element manipulation with on-canvas controls",
            controls=[
                "8-point bounding box for resize",
                "Rotation handle with snap angles",
                "Corner and edge resize controls",
                "Multi-selection with lasso tool"
            ],
            technical_specs=[
                "Real-time transform feedback",
                "Constraint-based resizing",
                "Smart alignment guides"
            ]
        ),
        CanvasFeature(
            feature_name="Animation Timeline",
            description="Frame-accurate animation system with keyframe editing",
            controls=[
                "Duration control (0.1s to 30s)",
                "Keyframe editor with drag-and-drop",
                "Easing curve editor",
                "Multi-layer timeline tracks"
            ],
            technical_specs=[
                "RequestAnimationFrame synchronization",
                "Hardware acceleration where available",
                "Audio synchronization support"
            ]
        )
    ]
    
    performance_metrics = [
        PerformanceMetric(
            metric_name="Initial Load Time",
            target_value="<3 seconds on 3G connection",
            description="Time to display usable interface"
        ),
        PerformanceMetric(
            metric_name="Time to Interactive",
            target_value="<5 seconds for full functionality",
            description="Time until all features are responsive"
        ),
        PerformanceMetric(
            metric_name="Canvas Rendering",
            target_value="60fps for smooth interactions",
            description="Maintained framerate during manipulation"
        ),
        PerformanceMetric(
            metric_name="Memory Usage",
            target_value="<500MB for typical projects",
            description="Memory consumption for standard designs"
        )
    ]
    
    security_features = [
        SecurityFeature(
            feature_name="Content Security Policy",
            implementation="Strict nonce-based script execution",
            compliance=["CSP Level 3"]
        ),
        SecurityFeature(
            feature_name="Data Encryption",
            implementation="AES-256 encryption for data at rest and in transit",
            compliance=["GDPR", "CCPA"]
        ),
        SecurityFeature(
            feature_name="Image Proxy Service",
            implementation="Prevent SSRF attacks from external content",
            compliance=["OWASP security guidelines"]
        )
    ]
    
    return ApplicationSpecification(
        application_name="Design Studio - Polotno Clone",
        application_url="https://studio.polotno.com (reference)",
        application_type="Single Page Application (SPA)",
        technical_stack=technical_stack,
        main_layout={
            "type": "Three-panel layout",
            "left_panel": "Tool navigation (72px min)",
            "center_panel": "Canvas workspace (flexible)",
            "right_panel": "Context tools (350px)",
            "theme": "Dark mode with Blueprint.js components"
        },
        interface_components=interface_components,
        panel_contents=panel_contents,
        canvas_features=canvas_features,
        performance_metrics=performance_metrics,
        security_features=security_features,
        collaboration_features=[
            "Real-time multi-user editing",
            "Live comments on elements",
            "Version history with rollback",
            "Permission management (owner/editor/viewer)"
        ],
        export_formats=[
            "PNG (with transparency)",
            "JPEG (quality settings)", 
            "SVG (with CSS/inline styles)",
            "PDF (print-ready)",
            "MP4/WebM (animated)",
            "GIF (optimized)"
        ],
        accessibility_features=[
            "WCAG 2.1 AA compliance",
            "Keyboard navigation support",
            "High contrast design (4.5:1 ratio)",
            "Screen reader compatibility",
            "Scalable interface up to 200%"
        ],
        subscription_tiers=[
            {
                "tier": "Free",
                "features": ["Limited templates", "Basic exports", "Watermarked downloads"]
            },
            {
                "tier": "Pro", 
                "features": ["Full template library", "Unlimited exports", "Premium support"]
            },
            {
                "tier": "Team",
                "features": ["Collaboration features", "Brand management", "Analytics"]
            },
            {
                "tier": "Enterprise",
                "features": ["White-label solutions", "API access", "Custom integrations"]
            }
        ],
        developer_ecosystem=[
            "RESTful API for integrations",
            "Embeddable editor components",
            "Plugin marketplace support",
            "White-label solutions"
        ]
    )

def generate_initial_md(spec: ApplicationSpecification) -> str:
    """Generate the initial.md content using Pydantic structured data"""
    
    content = f"""# {spec.application_name} - Initial Specification

*Generated using Pydantic models to structure application requirements*

## Project Overview

**Application Type:** {spec.application_type}  
**Reference URL:** {spec.application_url}  

This specification consolidates the Application and Technical specification documents into a structured, Pydantic-validated format that can guide development planning and task management.

## Technical Architecture

### Core Stack
- **Frontend:** {spec.technical_stack.frontend_framework}
- **Build System:** {spec.technical_stack.build_system}
- **UI Components:** {spec.technical_stack.ui_components}
- **Canvas/Rendering:** {', '.join(spec.technical_stack.canvas_frameworks)}
- **Styling:** {spec.technical_stack.styling_system}
- **State Management:** {spec.technical_stack.state_management}
- **Database:** {spec.technical_stack.database}

### Additional Technologies
{chr(10).join(f"- {tech}" for tech in spec.technical_stack.additional_technologies)}

## Interface Architecture

### Main Layout Structure
- **Layout Type:** {spec.main_layout['type']}
- **Left Panel:** {spec.main_layout['left_panel']}
- **Center Panel:** {spec.main_layout['center_panel']}
- **Right Panel:** {spec.main_layout['right_panel']}
- **Theme:** {spec.main_layout['theme']}

### Key Interface Components

"""
    
    for component in spec.interface_components:
        content += f"""#### {component.name}
**Location:** {component.location}"""
        if component.width:
            content += f"""  
**Width:** {component.width}"""
        
        content += f"""

**Primary Functions:**
{chr(10).join(f"- {func}" for func in component.primary_functions)}

**Technical Implementation:**
{chr(10).join(f"- {detail}" for detail in component.technical_details)}

"""
    
    content += """## Panel System Overview

The right panel provides context-sensitive tools that change based on left sidebar selection:

"""
    
    for panel in spec.panel_contents:
        content += f"""### {panel.panel_type}

{panel.description}

**Key Functionality:**
{chr(10).join(f"- {func}" for func in panel.functionality)}

**Technical Details:**
{chr(10).join(f"- {info}" for info in panel.technical_info)}

**API Integrations:**
{chr(10).join(f"- {api}" for api in panel.api_integrations)}

"""
    
    content += """## Canvas Features & Interactions

"""
    
    for feature in spec.canvas_features:
        content += f"""### {feature.feature_name}

{feature.description}

**Available Controls:**
{chr(10).join(f"- {control}" for control in feature.controls)}

**Technical Specifications:**
{chr(10).join(f"- {spec}" for spec in feature.technical_specs)}

"""
    
    content += """## Performance Requirements

"""
    
    for metric in spec.performance_metrics:
        content += f"""- **{metric.metric_name}:** {metric.target_value}  
  *{metric.description}*

"""
    
    content += """## Security Implementation

"""
    
    for security in spec.security_features:
        content += f"""### {security.feature_name}
- **Implementation:** {security.implementation}
- **Compliance:** {', '.join(security.compliance)}

"""
    
    content += """## Feature Categories

### Collaboration Features
"""
    content += chr(10).join(f"- {feature}" for feature in spec.collaboration_features)
    
    content += """

### Export Capabilities
"""
    content += chr(10).join(f"- {format}" for format in spec.export_formats)
    
    content += """

### Accessibility Support
"""
    content += chr(10).join(f"- {feature}" for feature in spec.accessibility_features)
    
    content += """

## Business Model

### Subscription Tiers
"""
    
    for tier in spec.subscription_tiers:
        content += f"""
**{tier['tier']} Tier:**
{chr(10).join(f"- {feature}" for feature in tier['features'])}
"""
    
    content += """

### Developer Ecosystem
"""
    content += chr(10).join(f"- {feature}" for feature in spec.developer_ecosystem)
    
    content += """

## Development Priorities

Based on the specification analysis, key development phases should include:

1. **Foundation Phase**
   - Set up React 18.2+ with Vite build system
   - Implement Blueprint.js dark theme
   - Create three-panel layout structure
   - Establish Goober CSS-in-JS styling system

2. **Canvas System Phase**
   - Implement Konva.js canvas engine
   - Create element transform system
   - Build selection and manipulation controls
   - Add undo/redo state management

3. **Panel System Phase**
   - Build dynamic panel switching
   - Implement template library integration
   - Create photo search with Unsplash API
   - Add AI image generation integration

4. **Advanced Features Phase**
   - Build animation timeline system
   - Implement collaborative editing
   - Add export functionality
   - Performance optimization

5. **Polish Phase**
   - Accessibility compliance (WCAG 2.1 AA)
   - Security implementation
   - Performance tuning
   - Testing and validation

## Next Steps

This specification provides a structured foundation for:
- Creating detailed development tasks
- Planning sprint/milestone objectives
- Technical architecture decisions
- API integration planning
- Performance testing criteria

The Pydantic models ensure type safety and validation for any programmatic access to specification data, supporting automated task generation, progress tracking, and requirement validation.
"""
    
    return content

def main():
    """Generate the initial.md specification file"""
    
    # Create the specification using Pydantic models
    spec = create_application_spec()
    
    # Validate the model (Pydantic will raise errors if invalid)
    try:
        # Generate markdown content
        markdown_content = generate_initial_md(spec)
        
        # Write to PRPs directory
        prps_dir = Path(__file__).parent / "PRPs"
        prps_dir.mkdir(exist_ok=True)
        
        initial_md_path = prps_dir / "initial.md"
        
        with open(initial_md_path, 'w', encoding='utf-8') as f:
            f.write(markdown_content)
        
        print(f"✅ Generated initial.md at: {initial_md_path}")
        print(f"📄 Content length: {len(markdown_content)} characters")
        print("🔍 Specification validated with Pydantic models")
        
        # Also save the raw Pydantic model data as JSON for programmatic access
        json_path = prps_dir / "specification_model.json"
        with open(json_path, 'w', encoding='utf-8') as f:
            f.write(spec.model_dump_json(indent=2))
        
        print(f"💾 Saved structured data at: {json_path}")
        
    except Exception as e:
        print(f"❌ Error generating specification: {e}")
        raise

if __name__ == "__main__":
    main()