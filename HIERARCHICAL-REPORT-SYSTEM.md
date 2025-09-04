# Hierarchical Report System Architecture

## Overview

This document describes the comprehensive backend architecture for the Design Studio's hierarchical report system. The system supports the core concepts of **Reports**, **Pages**, and **Components** with full version control, multi-format rendering, and reusable design elements.

## Core Concepts

### 1. Reports
- **Top-level container objects** that orchestrate content collection and rendering
- Own metadata (title, author, creation date, tags, categories)
- Composed of one or more ordered pages
- Support versioning and publication workflows
- Access control (public/private, published/draft)

### 2. Pages  
- **Structural units within reports** that define layout and content organization
- Each page has independent versioning to track changes over time
- Built from components placed at specific positions
- Define layout types (flexible, grid, fixed, responsive)
- Reference specific component versions for reproducibility

### 3. Components
- **Smallest reusable units** of the design system with independent lifecycles
- Examples: charts, text blocks, tables, images, shapes, forms, widgets
- Each component encapsulates logic, style, and rendering capabilities
- Version-controlled with atomic building block approach
- Support multiple export formats (PPTX, SVG, PDF, HTML, etc.)

## Database Architecture

### PostgreSQL Schema (Relational Data)

**Core Entities:**
```sql
-- Reports table
reports (
  id, title, description, author, tags[], category,
  version, is_published, is_public, user_id,
  created_at, updated_at, published_at
)

-- Pages table  
report_pages (
  id, report_id, title, description, order,
  layout_type, columns, width, height, version,
  created_at, updated_at
)

-- Components table
components (
  id, name, description, type, category,
  definition_id (MongoDB ref), default_props,
  supported_formats[], version, is_published,
  tags[], is_system, usage_count,
  created_by, created_at, updated_at
)

-- Component versions
component_versions (
  id, component_id, version, definition_id,
  change_log, props, is_stable, is_deprecated,
  min_version, max_version, created_by, created_at
)

-- Page components (instances)
page_components (
  id, page_id, component_id, component_version,
  x, y, width, height, rotation, z_index,
  props, is_visible, is_locked,
  created_at, updated_at
)

-- Component dependencies
component_dependencies (
  id, component_id, depends_on_id, dependency_type,
  min_version, max_version
)

-- Report exports
report_exports (
  id, report_id, format, quality, options,
  include_pages[], status, progress,
  output_url, file_size, error_message,
  user_id, created_at, updated_at, completed_at
)
```

### MongoDB Schema (Document Data)

**Component Definitions:**
```javascript
// ComponentDefinitionDocument
{
  componentId: string,
  version: number,
  createdBy: string,
  definition: {
    id, name, type,
    template: {
      html?: string,
      svg?: string, 
      canvas?: CanvasElement[],
      styles: {}
    },
    propsSchema: {
      properties: {},
      required: []
    },
    rendering: {
      supportedFormats: [],
      dependencies: [],
      performance: {}
    },
    dataBinding?: {},
    interactions?: {}
  },
  metadata: {},
  isActive: boolean,
  isStable: boolean
}
```

**Page Definitions:**
```javascript
// ReportPageDefinition
{
  pageId: string,
  reportId: string,
  version: number,
  layout: {
    type: 'flexible' | 'grid' | 'fixed' | 'responsive',
    columns: number,
    gridTemplate?: string,
    breakpoints?: {}
  },
  componentInstances: [{
    id, componentId, componentVersion,
    position: { x, y, width, height, zIndex },
    props: {},
    dataBindings?: {},
    responsive?: {}
  }],
  pageSettings: {
    background?: {},
    padding?: {},
    margin?: {}
  },
  interactions: {
    navigation?: {},
    animations?: [],
    events?: {}
  }
}
```

**Rendering Cache:**
```javascript  
// ReportRenderingCache
{
  reportId: string,
  version: number,
  format: 'html' | 'pdf' | 'pptx' | 'svg',
  renderingConfig: {},
  cacheKey: string,
  renderedContent: {
    pages: [],
    metadata: {}
  },
  contentHash: string,
  expiresAt: Date
}
```

## API Architecture

### Reports API (`/api/v1/reports`)
- `POST /` - Create new report
- `GET /` - List reports with filtering/pagination  
- `GET /stats` - Get user report statistics
- `GET /:id` - Get specific report (with optional pages)
- `PUT /:id` - Update report metadata
- `DELETE /:id` - Delete report and cascade pages
- `POST /:id/duplicate` - Duplicate report with new title
- `PUT /:id/publish` - Publish/unpublish report
- `PUT /:id/visibility` - Change public/private status

### Pages API (`/api/v1/pages`)
- `POST /` - Create page within report
- `GET /report/:reportId` - Get all pages for report
- `GET /:id` - Get specific page (with optional components)
- `PUT /:id` - Update page layout/metadata
- `DELETE /:id` - Delete page
- `POST /:id/duplicate` - Duplicate page
- `PUT /:id/reorder` - Change page order
- `POST /:id/components` - Add component to page
- `PUT /:id/components/:componentId` - Update component instance
- `DELETE /:id/components/:componentId` - Remove component from page

### Components API (`/api/v1/components`)
- `POST /` - Create new component
- `GET /` - List components with filtering
- `GET /categories` - Get component categories
- `GET /:id` - Get component details
- `GET /:id/versions` - Get component version history
- `PUT /:id` - Update component metadata
- `DELETE /:id` - Delete component
- `POST /:id/versions` - Create new component version
- `GET /:id/dependencies` - Get component dependencies
- `POST /:id/test` - Test component rendering

### Rendering API (`/api/v1/rendering`)
- `POST /reports/:id/render` - Render full report
- `POST /pages/:id/render` - Render single page
- `POST /components/:id/render` - Render component
- `GET /jobs/:id` - Get render job status
- `DELETE /jobs/:id` - Cancel render job
- `GET /capabilities` - Get rendering capabilities
- `POST /batch` - Batch render multiple items
- `GET /cache/:key` - Get cached render result

## Rendering Pipeline

### Multi-Format Support

**HTML Rendering:**
- Template interpolation with component props
- CSS generation from component styles  
- Interactive elements with event handlers
- Responsive layouts with breakpoints
- Print stylesheets for PDF conversion

**PDF Rendering:**
- HTML to PDF conversion with page breaks
- Custom page dimensions and margins
- Vector graphics preservation
- Font embedding and optimization
- Watermarks and headers/footers

**PPTX Rendering:**
- Template-based slide generation
- Component positioning with absolute layouts
- Master slide application
- Animation and transition support
- Chart and media embedding

**SVG Rendering:**
- Pure vector output for scalability
- Component to SVG element mapping
- Gradient and pattern support
- Text path optimization
- Interactive SVG with JavaScript

### Rendering Workflow

1. **Content Resolution**
   - Load report/page/component definitions
   - Resolve component versions and dependencies
   - Validate component compatibility

2. **Layout Calculation**  
   - Apply page layout rules (grid, flexible, etc.)
   - Position components with collision detection
   - Calculate responsive breakpoints
   - Apply Z-index ordering

3. **Component Rendering**
   - Interpolate templates with instance props
   - Apply styling with theme overrides
   - Generate format-specific output
   - Handle data binding and interactions

4. **Output Assembly**
   - Combine component outputs into pages
   - Apply page-level styling and layout
   - Generate navigation and metadata
   - Package final output with assets

5. **Caching & Optimization**
   - Cache rendered output by content hash
   - Optimize asset loading and embedding
   - Compress output for delivery
   - Generate preview thumbnails

## Version Control System

### Component Versioning
- **Semantic versioning** for component definitions
- **Immutable versions** - published versions cannot be modified
- **Dependency constraints** with min/max version ranges
- **Stability markers** (stable, beta, deprecated)
- **Breaking change detection** and migration guidance

### Page Versioning
- **Independent page versions** within reports
- **Component version pinning** for reproducibility
- **Layout version tracking** with change logs
- **Rollback capabilities** to previous versions

### Report Versioning  
- **Report metadata versioning** (title, description, etc.)
- **Page composition versioning** (which pages, in what order)
- **Publication versioning** with timestamp tracking
- **Export versioning** to maintain render consistency

## Security & Access Control

### Authentication
- **JWT-based authentication** for all API endpoints
- **User session management** with token refresh
- **Role-based permissions** (viewer, editor, admin)

### Authorization
- **Resource ownership validation** - users can only access their content
- **Public/private visibility controls** for reports
- **Component sharing permissions** for reusable elements
- **Organization-level access** for team plans

### Data Protection
- **Input validation and sanitization** for all API inputs  
- **SQL injection prevention** with parameterized queries
- **XSS protection** in rendered HTML output
- **File upload restrictions** for components and assets
- **Rate limiting** to prevent abuse

## Performance Optimization

### Caching Strategy
- **MongoDB caching** for frequently accessed component definitions
- **Rendered output caching** with content hash keys
- **CDN integration** for static asset delivery  
- **Redis caching** for user sessions and API responses

### Database Optimization
- **Proper indexing** on frequently queried fields
- **Query optimization** with efficient joins and aggregations
- **Connection pooling** for database scalability
- **Read replicas** for improved read performance

### Rendering Optimization
- **Background job processing** with Bull queues
- **Parallel component rendering** for complex pages
- **Incremental rendering** for large reports
- **Asset optimization** (image compression, font subsetting)

## Deployment & Scalability

### Infrastructure Requirements
- **Node.js 18+ runtime** environment
- **PostgreSQL 14+ database** for relational data
- **MongoDB 6+ database** for document storage  
- **Redis 7+ cache** for sessions and queuing
- **File storage** (AWS S3 or compatible)

### Container Deployment
```yaml
# docker-compose.yml example
services:
  api:
    image: design-studio-backend:latest
    environment:
      - DATABASE_URL=postgresql://...
      - MONGODB_URL=mongodb://...
      - REDIS_URL=redis://...
    depends_on: [postgres, mongodb, redis]
    
  postgres:
    image: postgres:14
    
  mongodb:
    image: mongo:6
    
  redis:
    image: redis:7
```

### Horizontal Scaling
- **Stateless API design** for load balancer compatibility
- **Database sharding** for large datasets
- **Microservice architecture** for component isolation
- **Event-driven communication** between services

## Integration Points

### Frontend Integration
- **Canvas element mapping** to component instances
- **Real-time preview** of component changes
- **Drag-and-drop** component placement
- **WYSIWYG editing** with live updates

### Third-Party Integrations
- **Design system libraries** (Ant Design, Material-UI)
- **Chart libraries** (Chart.js, D3.js, Recharts)
- **Data sources** (APIs, databases, files)
- **Export services** (PDF generators, Office APIs)

### Webhook Support
- **Render completion notifications**
- **Component update events**
- **Report publication events**
- **Error and failure alerts**

## Future Enhancements

### Advanced Features
- **AI-powered component suggestions** based on content
- **Collaborative editing** with real-time conflict resolution  
- **Advanced analytics** on component usage and performance
- **Template marketplace** for sharing component libraries

### Enterprise Features
- **SSO integration** with corporate identity providers
- **Advanced permission models** with fine-grained controls
- **Audit logging** for compliance requirements
- **White-label deployment** options

### Performance Improvements
- **Server-side rendering** for faster initial loads
- **WebSocket connections** for real-time collaboration
- **Progressive web app** capabilities
- **Edge computing** for global performance

This hierarchical report system provides a robust foundation for building complex, reusable design documents while maintaining the flexibility and performance needed for a modern design tool.