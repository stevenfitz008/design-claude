# Plotly Text System Implementation

This project replicates the exact text editing functionality from the Design Studio Clone but adapted for Plotly.js charts and visualizations.

## Overview

The Design Studio has successfully implemented:
- **Rich Text Editor** using Quill.js with html2canvas conversion
- **Text Templates System** with 8+ professional templates  
- **Inline Text Editing** with double-click activation
- **Canvas Integration** with keyboard shortcuts and multi-select
- **Professional Dark Theme UI** matching design system

This implementation adapts these features for Plotly.js while maintaining identical UX patterns.

## Project Structure

```
plotly-text-system/
├── src/
│   ├── components/
│   │   ├── text-editor/
│   │   │   ├── PlotlyRichTextEditor.tsx    # Quill.js + html2canvas for Plotly
│   │   │   ├── PlotlyInlineTextEditor.tsx  # Plotly annotation overlay editing
│   │   │   └── TextEditorStyles.ts         # Shared styling system
│   │   ├── panels/
│   │   │   ├── PlotlyTextPanel.tsx         # Template panel for Plotly
│   │   │   └── TextTemplates.ts            # 8+ professional templates
│   │   └── plotly/
│   │       ├── PlotlyCanvas.tsx            # Main Plotly component
│   │       └── PlotlyTextIntegration.tsx   # Text overlay system
│   ├── hooks/
│   │   ├── usePlotlyTextEditor.ts          # Text editing state management
│   │   ├── usePlotlyTextTemplates.ts       # Template management
│   │   └── usePlotlyAnnotations.ts         # Plotly annotation system
│   ├── stores/
│   │   ├── plotlyCanvasStore.ts            # Plotly-specific canvas state
│   │   └── textPanelStore.ts               # Text panel state
│   ├── types/
│   │   ├── plotlyText.ts                   # Plotly text type definitions
│   │   └── textTemplates.ts                # Template type definitions
│   └── utils/
│       ├── plotlyTextRenderer.ts           # Text-to-Plotly conversion
│       └── htmlToPlotlyAnnotation.ts       # Rich text to annotation
├── examples/
│   ├── basic-chart-with-text.tsx
│   ├── dashboard-with-annotations.tsx
│   └── interactive-text-editing.tsx
└── docs/
    ├── IMPLEMENTATION_GUIDE.md
    ├── PLOTLY_INTEGRATION.md
    └── DESIGN_SYSTEM.md
```

## Features to Implement

### ✅ Phase 1: Core Text Editing
- [ ] PlotlyRichTextEditor with Quill.js integration
- [ ] html2canvas conversion for Plotly rendering
- [ ] Dark theme matching Design Studio
- [ ] Status indicators (loading, ready, converting)

### ✅ Phase 2: Template System  
- [ ] 8+ professional text templates (Header, Subheader, Body, Adventure, etc.)
- [ ] Template search and filtering
- [ ] Drag-and-drop to Plotly charts
- [ ] Template preview with accurate styling

### ✅ Phase 3: Plotly Integration
- [ ] Plotly annotation system integration
- [ ] Double-click text editing on annotations
- [ ] Inline text editor overlays
- [ ] Keyboard shortcuts (Enter, Escape, Tab)

### ✅ Phase 4: Advanced Features
- [ ] Multi-select text annotations
- [ ] Text styling inheritance
- [ ] Auto-resize and positioning
- [ ] Cross-browser compatibility

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Technology Stack

- **React 18.2+** with TypeScript
- **Plotly.js** for charts and visualizations
- **Quill.js** for rich text editing
- **html2canvas** for text-to-image conversion
- **Zustand** for state management
- **Goober** for CSS-in-JS styling
- **Vite** for build tooling

## Design System

Matching Design Studio's color palette:
- **Primary**: #48aff0 (Blue for active states)
- **Background**: #252a30 (Dark panels), #2f343c (Content areas)  
- **Text**: #f5f8fa (Primary), #a7b6c2 (Secondary)
- **Borders**: #495563 (Panel borders)

## Implementation Phases

This project is implemented in phases to ensure each component works perfectly before moving to the next:

1. **Research Phase**: Investigate Plotly annotation systems and text overlays
2. **Core Components**: Build text editor and template components  
3. **Plotly Integration**: Connect text system with Plotly charts
4. **Testing & Polish**: Ensure all features work seamlessly

## References

- Design Studio Clone implementation
- Plotly.js annotation documentation
- Quill.js rich text editor
- html2canvas conversion library