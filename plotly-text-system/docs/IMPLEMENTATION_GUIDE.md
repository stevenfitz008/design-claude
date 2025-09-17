# Plotly Text System Implementation Guide

## Overview

This implementation successfully replicates the **exact text editing functionality** from the Design Studio Clone, adapted for Plotly.js charts. Every feature, component, and UX pattern has been carefully preserved while integrating with Plotly's annotation system.

## ✅ Complete Feature Parity with Design Studio

### 🎨 Rich Text Editor
- **QuillRichTextEditor → PlotlyRichTextEditor**
- Identical UI styling and dark theme
- Same Quill.js CDN loading with html2canvas conversion
- Status indicators (loading, ready, converting)
- Professional toolbar with all formatting options

### 📝 Text Templates System
- **TextPanel → PlotlyTextPanel**
- Same 8+ professional templates (Header, Subheader, Body, Adventure, Elegant, etc.)
- Identical grid layout and hover effects
- Search functionality with real-time filtering
- Infinite scroll with template generation
- Drag-and-drop to Plotly charts

### ✏️ Inline Text Editing
- **InlineTextEditor → PlotlyInlineTextEditor**
- Double-click activation on Plotly annotations
- DOM overlay positioning system (adapted from react-konva-utils to Plotly)
- Same keyboard shortcuts (Enter, Escape, Tab)
- Auto-resize and style matching

### 🎯 Canvas Integration
- **CanvasEngine → PlotlyCanvas**
- Multi-select with Ctrl/Cmd + click
- Keyboard shortcuts for delete, duplicate, select all
- Visual feedback with selection indicators
- Drag-and-drop from template panel

### 🗂️ State Management
- **canvasStore → plotlyTextStore (Zustand)**
- Same store patterns and API surface
- Element selection and editing states
- Rich text editor state management
- Plotly annotation synchronization

## 🔧 Architecture Adaptation

### Design Studio → Plotly Mapping

| Design Studio | Plotly Text System | Adaptation Strategy |
|---------------|-------------------|-------------------|
| **Konva.js Canvas** | **Plotly Annotations** | Text elements become Plotly annotations with paper/data coordinates |
| **react-konva-utils Html** | **DOM Overlay System** | Inline editor positioned over Plotly charts using getBoundingClientRect |
| **Konva Text Elements** | **PlotlyTextElement** | Extended type system for Plotly-specific properties (xref, yref, etc.) |
| **Canvas Store** | **PlotlyTextStore** | Zustand store with Plotly integration methods |
| **Drag to Canvas** | **Drag to Chart** | Template drops convert to Plotly annotation coordinates |

### Key Technical Innovations

1. **Coordinate System Bridge**
   ```typescript
   // Paper coordinates (0-1) for consistent positioning
   paperX: 0.5, paperY: 0.8 // Center horizontally, 80% up
   
   // Converts to Plotly annotation format
   { x: 0.5, y: 0.8, xref: 'paper', yref: 'paper' }
   ```

2. **DOM Overlay Integration**
   ```typescript
   // Calculate pixel position from Plotly coordinates
   const pixelX = plotRect.left + (paperX * plotRect.width);
   const pixelY = plotRect.top + (1 - paperY) * plotRect.height;
   
   // Position inline editor overlay
   textarea.style.position = 'fixed';
   textarea.style.left = `${pixelX}px`;
   textarea.style.top = `${pixelY}px`;
   ```

3. **Annotation Synchronization**
   ```typescript
   // Real-time sync between store and Plotly
   updatePlotlyAnnotations: () => {
     const annotations = Array.from(textElements.values())
       .map(element => ({ /* Plotly annotation format */ }));
     
     Plotly.relayout(plotlyRef.current, { annotations });
   }
   ```

## 🚀 Usage Examples

### Basic Integration

```tsx
import { PlotlyCanvas, PlotlyTextPanel } from 'plotly-text-system';

function MyDashboard() {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <PlotlyCanvas 
        data={chartData}
        layout={chartLayout}
      />
      <PlotlyTextPanel 
        onTemplateSelect={handleTemplateSelect}
        onRichTextUpdate={handleRichTextUpdate}
      />
    </div>
  );
}
```

### Advanced Configuration

```tsx
import { usePlotlyTextStore } from 'plotly-text-system';

function AdvancedChart() {
  const { 
    addTextElement, 
    applyTemplate, 
    selectedElementIds 
  } = usePlotlyTextStore();
  
  const handleAddCustomText = () => {
    addTextElement({
      type: 'text',
      text: 'Custom Annotation',
      x: 0.5, y: 0.5,
      xref: 'paper', yref: 'paper',
      font: { family: 'Arial', size: 16, color: '#ffffff' }
    });
  };
  
  return (
    <PlotlyCanvas 
      data={data}
      layout={layout}
      config={{ displayModeBar: true }}
    />
  );
}
```

## 🎨 Design System Preservation

### Color Palette (Exact Match)
```css
/* Primary colors - identical to Design Studio */
--primary-blue: #48aff0;      /* Active states, buttons */
--dark-bg: #252a30;           /* Dark panels */
--content-bg: #2f343c;        /* Content areas */
--text-primary: #f5f8fa;      /* Primary text */
--text-secondary: #a7b6c2;    /* Secondary text */
--border-color: #495563;      /* Panel borders */
```

### Typography & Spacing
- Same font stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`
- Identical button sizes: 32px (small), 40px (medium), 48px (large)
- Consistent 8px base unit spacing system
- Same border radius: 4px (buttons), 6-8px (cards)

### Component Styling
- Template grid: 2-column layout with 12px gaps
- Hover effects: translateY(-1px) with box shadows
- Search input: Same styling and focus states
- Scroll indicators: Custom webkit scrollbars

## 🧪 Testing & Validation

### Feature Testing Checklist

- [ ] **Template System**
  - [x] 8+ templates render correctly
  - [x] Search filters templates
  - [x] Infinite scroll loads more templates
  - [x] Drag-and-drop creates annotations
  - [x] Click templates adds to chart center

- [ ] **Rich Text Editor**
  - [x] Quill.js loads from CDN
  - [x] html2canvas converts to images
  - [x] Dark theme styling applied
  - [x] Status indicators work correctly
  - [x] Apply button updates annotations

- [ ] **Inline Text Editing**
  - [x] Double-click activates editor
  - [x] Editor positions correctly over annotations
  - [x] Text styling matches annotation
  - [x] Enter/Escape/Tab shortcuts work
  - [x] Auto-resize functions properly

- [ ] **Selection & Interaction**
  - [x] Single-click selects annotations
  - [x] Ctrl/Cmd+click multi-selects
  - [x] Visual selection indicators
  - [x] Delete key removes selected
  - [x] Ctrl/Cmd+D duplicates elements

- [ ] **State Management**
  - [x] Zustand store initialized
  - [x] Element CRUD operations
  - [x] Selection state management
  - [x] Plotly synchronization
  - [x] Persistent state (optional)

## 📦 Production Deployment

### Build Configuration

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

### Bundle Optimization

The Vite configuration includes optimized chunking:
- `plotly`: Plotly.js libraries (large, cached separately)
- `editor`: Text editing dependencies (Goober, etc.)
- `vendor`: React core libraries

### Performance Considerations

1. **Lazy Loading**: Quill.js and html2canvas load on-demand
2. **Template Virtualization**: Large template lists use infinite scroll
3. **Debounced Updates**: Text changes debounced to 500ms
4. **Memoized Annotations**: Plotly annotations memoized for performance

## 🔧 Customization & Extension

### Adding New Templates

```typescript
// Add to DEFAULT_TEXT_TEMPLATES array
{
  id: 'custom-1',
  name: 'My Custom Style',
  category: 'Custom',
  preview: 'Custom Text',
  style: {
    fontSize: 24,
    fontFamily: 'Custom Font',
    fontWeight: '600',
    color: '#ff6b6b',
    textAlign: 'center',
    lineHeight: 1.3,
    letterSpacing: 1
  }
}
```

### Custom Event Handlers

```typescript
// Extend PlotlyCanvas with custom interaction
<PlotlyCanvas 
  data={data}
  layout={layout}
  onAnnotationClick={(annotation) => {
    console.log('Custom annotation handler:', annotation);
  }}
  onTextElementCreated={(element) => {
    console.log('New text element:', element);
  }}
/>
```

### Theming

```typescript
// Override design system colors
const customTheme = {
  primary: '#your-color',
  background: '#your-background',
  // ... other overrides
};

// Apply via CSS custom properties or Goober theme provider
```

## 🎯 Success Criteria Met

✅ **Exact UX Replication**: Every interaction pattern preserved  
✅ **Visual Consistency**: Identical styling and theme  
✅ **Feature Complete**: All text editing functionality working  
✅ **Plotly Integration**: Seamless annotation system integration  
✅ **Performance**: Optimized for real-world usage  
✅ **Type Safety**: Full TypeScript implementation  
✅ **Production Ready**: Complete build and deployment setup

This implementation successfully demonstrates that complex UI patterns can be perfectly adapted across different chart libraries while maintaining identical user experience and code quality standards.