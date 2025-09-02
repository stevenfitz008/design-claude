# Design Studio Clone - Backend Architecture Plan

## Executive Summary

This document provides a comprehensive backend architecture plan for the Design Studio Clone project, a Polotno-style canvas editor. The backend will support a complex React SPA with real-time collaboration, cloud storage, third-party integrations, and advanced export capabilities.

**Current Project Status:**
- ✅ Frontend Phase 3.1-3.4: Panel system development in progress
- ✅ Complete TypeScript API interfaces (400+ lines)
- ✅ Empty service directories ready for implementation
- ❌ No backend infrastructure exists yet
- ❌ Missing Python agent system for task management

## Technology Stack Overview

### Core Backend Technologies
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: NestJS (recommended) or Express.js
- **Databases**: 
  - PostgreSQL (primary relational data)
  - MongoDB (canvas state documents)
  - Redis (caching & sessions)
- **Message Queue**: RabbitMQ or AWS SQS
- **File Storage**: AWS S3 or compatible
- **Authentication**: JWT with refresh tokens
- **API**: RESTful with WebSocket support
- **Validation**: Zod schemas
- **ORM**: Prisma (PostgreSQL) + Mongoose (MongoDB)

## Database Architecture Design

### PostgreSQL Schema (Primary Database)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  preferences JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{
    "maxProjects": 10,
    "maxStorageSize": 104857600,
    "maxExportsPerMonth": 50,
    "hasAIFeatures": false,
    "hasAdvancedExport": false,
    "hasCollaboration": false
  }'
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  thumbnail_url VARCHAR(500),
  canvas_width INTEGER NOT NULL DEFAULT 800,
  canvas_height INTEGER NOT NULL DEFAULT 600,
  is_public BOOLEAN DEFAULT FALSE,
  tags TEXT[] DEFAULT '{}',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- MongoDB reference for canvas data
  mongodb_document_id VARCHAR(24) UNIQUE,
  
  INDEX idx_projects_user_id (user_id),
  INDEX idx_projects_public (is_public) WHERE is_public = TRUE,
  INDEX idx_projects_updated (updated_at DESC)
);
```

#### Assets Table
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  storage_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  width INTEGER,
  height INTEGER,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_assets_user_id (user_id),
  INDEX idx_assets_type (mime_type)
);
```

#### Templates Table
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  thumbnail_url VARCHAR(500) NOT NULL,
  canvas_width INTEGER NOT NULL,
  canvas_height INTEGER NOT NULL,
  tags TEXT[] DEFAULT '{}',
  premium BOOLEAN DEFAULT FALSE,
  downloads INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- MongoDB reference for template data
  mongodb_document_id VARCHAR(24) UNIQUE,
  
  INDEX idx_templates_category (category),
  INDEX idx_templates_popular (downloads DESC),
  INDEX idx_templates_premium (premium)
);
```

#### Export Jobs Table
```sql
CREATE TABLE export_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  format VARCHAR(10) NOT NULL CHECK (format IN ('png', 'jpg', 'pdf', 'svg', 'gif', 'mp4')),
  quality INTEGER DEFAULT 100,
  width INTEGER,
  height INTEGER,
  status VARCHAR(20) DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  result_url VARCHAR(500),
  error_message TEXT,
  estimated_time INTEGER,
  options JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  
  INDEX idx_export_jobs_user_id (user_id),
  INDEX idx_export_jobs_status (status),
  INDEX idx_export_jobs_created (created_at DESC)
);
```

### MongoDB Schema (Document Storage)

#### Canvas Documents Collection
```javascript
{
  _id: ObjectId,
  projectId: String, // UUID from PostgreSQL
  elements: [
    {
      id: String,
      type: String, // 'text', 'image', 'shape', 'video', 'group'
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      rotation: Number,
      scaleX: Number,
      scaleY: Number,
      opacity: Number,
      visible: Boolean,
      locked: Boolean,
      
      // Type-specific properties
      text: String, // for text elements
      fontSize: Number,
      fontFamily: String,
      fill: String,
      
      src: String, // for image/video elements
      cropX: Number,
      cropY: Number,
      cropWidth: Number,
      cropHeight: Number,
      
      // Animation/timeline data
      keyframes: [
        {
          frame: Number,
          properties: Object
        }
      ]
    }
  ],
  timeline: {
    duration: Number,
    fps: Number,
    currentFrame: Number
  },
  version: Number,
  lastModified: Date,
  
  // Collaboration data
  collaborators: [
    {
      userId: String,
      lastSeen: Date,
      cursor: { x: Number, y: Number },
      selection: [String] // element IDs
    }
  ]
}
```

#### Template Documents Collection
```javascript
{
  _id: ObjectId,
  templateId: String, // UUID from PostgreSQL
  elements: [/* same structure as canvas elements */],
  placeholders: [
    {
      elementId: String,
      type: String, // 'text', 'image'
      label: String,
      required: Boolean
    }
  ],
  version: Number,
  createdAt: Date
}
```

### Redis Schema (Caching)

#### Cache Keys Structure
```
user:session:{userId} -> User session data
project:recent:{userId} -> Recently accessed projects
templates:category:{category} -> Cached templates by category
fonts:google -> Google Fonts API response
unsplash:search:{query}:{page} -> Unsplash search results
ai:job:{jobId} -> AI generation job status
export:job:{jobId} -> Export job progress
collaboration:project:{projectId} -> Active collaborators
```

## API Endpoint Specifications

### Authentication Endpoints
```typescript
// POST /api/auth/register
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

// POST /api/auth/login  
interface LoginRequest {
  email: string;
  password: string;
}

// POST /api/auth/refresh
interface RefreshRequest {
  refreshToken: string;
}

// POST /api/auth/logout
// DELETE /api/auth/account
```

### Project Management Endpoints
```typescript
// GET /api/projects
interface GetProjectsQuery {
  page?: number;
  limit?: number;
  search?: string;
  tags?: string[];
  sortBy?: 'updatedAt' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

// POST /api/projects
interface CreateProjectRequest {
  name: string;
  canvasSize: { width: number; height: number };
  templateId?: string;
  isPublic?: boolean;
  tags?: string[];
}

// GET /api/projects/:id
// PUT /api/projects/:id
// DELETE /api/projects/:id
// POST /api/projects/:id/duplicate
// GET /api/projects/:id/versions
// POST /api/projects/:id/versions
```

### Asset Management Endpoints
```typescript
// GET /api/assets
interface GetAssetsQuery {
  page?: number;
  limit?: number;
  type?: string;
  tags?: string[];
  search?: string;
}

// POST /api/assets/upload
interface UploadAssetRequest {
  file: File; // multipart/form-data
  tags?: string[];
  folder?: string;
}

// GET /api/assets/:id
// DELETE /api/assets/:id
// PUT /api/assets/:id/tags
```

### Third-Party Integration Endpoints
```typescript
// GET /api/integrations/unsplash/search
interface UnsplashSearchQuery {
  query: string;
  page?: number;
  per_page?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  color?: string;
}

// GET /api/integrations/unsplash/photos/:id
// POST /api/integrations/unsplash/photos/:id/download

// GET /api/integrations/fonts/google
interface GoogleFontsQuery {
  sort?: 'alpha' | 'date' | 'popularity' | 'style' | 'trending';
  subset?: string;
  category?: string;
}

// POST /api/integrations/ai/generate-image
interface AIGenerateImageRequest {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  style?: string;
  steps?: number;
  guidance?: number;
}

// GET /api/integrations/ai/jobs/:id
```

### Export Endpoints
```typescript
// POST /api/export
interface ExportRequest {
  projectId: string;
  format: 'png' | 'jpg' | 'pdf' | 'svg' | 'gif' | 'mp4';
  quality: number;
  width?: number;
  height?: number;
  transparent?: boolean;
  animation?: {
    duration: number;
    fps: number;
    loop: boolean;
  };
}

// GET /api/export/jobs/:id
// GET /api/export/jobs/:id/download
```

## Service Layer Architecture

### Core Services Structure

```typescript
// src/services/user/user.service.ts
@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private bcrypt: BcryptService,
    private jwt: JwtService
  ) {}

  async createUser(data: RegisterRequest): Promise<User> {
    const hashedPassword = await this.bcrypt.hash(data.password);
    return this.prisma.user.create({
      data: {
        ...data,
        passwordHash: hashedPassword
      }
    });
  }

  async authenticateUser(email: string, password: string): Promise<AuthResponse> {
    // Implementation
  }

  async updateUserPreferences(userId: string, preferences: UserPreferences): Promise<User> {
    // Implementation
  }
}
```

```typescript
// src/services/project/project.service.ts
@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private mongodb: MongoService,
    private redis: RedisService
  ) {}

  async createProject(userId: string, data: CreateProjectRequest): Promise<ProjectData> {
    // 1. Create project record in PostgreSQL
    const project = await this.prisma.project.create({
      data: {
        userId,
        name: data.name,
        canvasWidth: data.canvasSize.width,
        canvasHeight: data.canvasSize.height,
        isPublic: data.isPublic || false,
        tags: data.tags || []
      }
    });

    // 2. Create canvas document in MongoDB
    const canvasDoc = await this.mongodb.collection('canvases').insertOne({
      projectId: project.id,
      elements: [],
      timeline: { duration: 5000, fps: 30, currentFrame: 0 },
      version: 1,
      lastModified: new Date(),
      collaborators: []
    });

    // 3. Update project with MongoDB reference
    await this.prisma.project.update({
      where: { id: project.id },
      data: { mongodbDocumentId: canvasDoc.insertedId.toString() }
    });

    // 4. Invalidate user's project cache
    await this.redis.del(`project:recent:${userId}`);

    return this.getProjectWithCanvas(project.id);
  }

  async updateProjectCanvas(projectId: string, elements: any[], version: number): Promise<void> {
    // Atomic update with version check
    const result = await this.mongodb.collection('canvases').updateOne(
      { projectId, version: version - 1 },
      {
        $set: {
          elements,
          version,
          lastModified: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new ConflictException('Canvas version conflict');
    }
  }
}
```

```typescript
// src/services/asset/asset.service.ts
@Injectable()
export class AssetService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private imageProcessor: ImageProcessingService
  ) {}

  async uploadAsset(userId: string, file: Express.Multer.File, metadata: AssetMetadata): Promise<CloudStorageFile> {
    // 1. Validate file type and size
    this.validateFileUpload(file);

    // 2. Generate unique filename
    const filename = `${userId}/${Date.now()}-${file.originalname}`;

    // 3. Process image (resize, optimize)
    const processedFile = await this.imageProcessor.optimizeForWeb(file.buffer);

    // 4. Upload to S3
    const uploadResult = await this.s3.upload(filename, processedFile);

    // 5. Generate thumbnail if image
    let thumbnailUrl: string | undefined;
    if (file.mimetype.startsWith('image/')) {
      const thumbnail = await this.imageProcessor.generateThumbnail(file.buffer, 200, 200);
      const thumbnailResult = await this.s3.upload(`thumbnails/${filename}`, thumbnail);
      thumbnailUrl = thumbnailResult.url;
    }

    // 6. Save to database
    const asset = await this.prisma.asset.create({
      data: {
        userId,
        filename,
        originalName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageUrl: uploadResult.url,
        thumbnailUrl,
        tags: metadata.tags || [],
        width: metadata.width,
        height: metadata.height
      }
    });

    return this.mapToCloudStorageFile(asset);
  }
}
```

### Third-Party Integration Services

```typescript
// src/services/integrations/unsplash.service.ts
@Injectable()
export class UnsplashService {
  private readonly baseURL = 'https://api.unsplash.com';
  
  constructor(
    private http: HttpService,
    private redis: RedisService,
    private config: ConfigService
  ) {}

  async searchPhotos(params: UnsplashSearchParams): Promise<UnsplashPhoto[]> {
    const cacheKey = `unsplash:search:${JSON.stringify(params)}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const response = await this.http.get('/search/photos', {
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Client-ID ${this.config.get('UNSPLASH_ACCESS_KEY')}`
      },
      params
    }).toPromise();

    const photos = response.data.results;
    
    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(photos));
    
    return photos;
  }

  async downloadPhoto(photoId: string): Promise<Blob> {
    // Track download with Unsplash
    await this.trackDownload(photoId);
    
    const photo = await this.getPhoto(photoId);
    const response = await this.http.get(photo.urls.regular, {
      responseType: 'arraybuffer'
    }).toPromise();
    
    return new Blob([response.data]);
  }

  private async trackDownload(photoId: string): Promise<void> {
    await this.http.get(`/photos/${photoId}/download`, {
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Client-ID ${this.config.get('UNSPLASH_ACCESS_KEY')}`
      }
    }).toPromise();
  }
}
```

```typescript
// src/services/integrations/ai-image.service.ts
@Injectable()
export class AIImageService {
  constructor(
    private redis: RedisService,
    private queue: QueueService,
    private config: ConfigService
  ) {}

  async generateImage(request: AIImageRequest): Promise<AIImageResponse> {
    const jobId = uuid();
    
    // Create initial job record
    const job: AIImageResponse = {
      id: jobId,
      status: 'pending',
      prompt: request.prompt,
      images: [],
      createdAt: new Date().toISOString()
    };

    // Store job status in Redis
    await this.redis.setex(`ai:job:${jobId}`, 3600, JSON.stringify(job));

    // Queue for processing
    await this.queue.add('generate-image', {
      jobId,
      request
    });

    return job;
  }

  async processImageGeneration(jobId: string, request: AIImageRequest): Promise<void> {
    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing');

      // Call AI service (Stability AI, OpenAI, etc.)
      const images = await this.callAIService(request);

      // Update with results
      const job: Partial<AIImageResponse> = {
        status: 'completed',
        images,
        completedAt: new Date().toISOString()
      };

      await this.updateJobStatus(jobId, 'completed', job);
    } catch (error) {
      await this.updateJobStatus(jobId, 'failed', {
        error: error.message
      });
    }
  }

  private async callAIService(request: AIImageRequest): Promise<AIGeneratedImage[]> {
    // Implement actual AI service integration
    // e.g., Stability AI, OpenAI DALL-E, Midjourney API
    const response = await this.http.post('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      text_prompts: [{ text: request.prompt }],
      cfg_scale: request.guidance || 7,
      height: request.height,
      width: request.width,
      samples: 1,
      steps: request.steps || 30
    }, {
      headers: {
        'Authorization': `Bearer ${this.config.get('STABILITY_API_KEY')}`,
        'Content-Type': 'application/json'
      }
    }).toPromise();

    return response.data.artifacts.map(artifact => ({
      url: `data:image/png;base64,${artifact.base64}`,
      seed: artifact.seed,
      width: request.width,
      height: request.height,
      steps: request.steps || 30,
      guidance: request.guidance || 7
    }));
  }
}
```

### Export Processing Service

```typescript
// src/services/export/export.service.ts
@Injectable()
export class ExportService {
  constructor(
    private prisma: PrismaService,
    private mongodb: MongoService,
    private s3: S3Service,
    private queue: QueueService
  ) {}

  async createExportJob(userId: string, request: ExportRequest): Promise<ExportResponse> {
    // Create job record
    const job = await this.prisma.exportJob.create({
      data: {
        userId,
        projectId: request.projectId,
        format: request.format,
        quality: request.quality,
        width: request.width,
        height: request.height,
        options: request.animation || {}
      }
    });

    // Queue for processing
    await this.queue.add('export-project', {
      jobId: job.id,
      request
    });

    return {
      id: job.id,
      status: 'processing',
      progress: 0
    };
  }

  async processExport(jobId: string, request: ExportRequest): Promise<void> {
    try {
      await this.updateJobProgress(jobId, 10, 'Loading project data');

      // Get project canvas data
      const project = await this.prisma.project.findUnique({
        where: { id: request.projectId }
      });

      const canvasData = await this.mongodb.collection('canvases').findOne({
        projectId: request.projectId
      });

      await this.updateJobProgress(jobId, 30, 'Rendering canvas');

      // Render based on format
      let resultBuffer: Buffer;
      switch (request.format) {
        case 'png':
          resultBuffer = await this.renderToPNG(canvasData, request);
          break;
        case 'pdf':
          resultBuffer = await this.renderToPDF(canvasData, request);
          break;
        case 'mp4':
          resultBuffer = await this.renderToMP4(canvasData, request);
          break;
        default:
          throw new Error(`Unsupported format: ${request.format}`);
      }

      await this.updateJobProgress(jobId, 80, 'Uploading file');

      // Upload result to S3
      const filename = `exports/${jobId}.${request.format}`;
      const uploadResult = await this.s3.upload(filename, resultBuffer);

      await this.updateJobProgress(jobId, 100, 'Complete');

      // Update job with result
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          progress: 100,
          resultUrl: uploadResult.url,
          completedAt: new Date()
        }
      });

    } catch (error) {
      await this.prisma.exportJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: error.message
        }
      });
    }
  }

  private async renderToPNG(canvasData: any, request: ExportRequest): Promise<Buffer> {
    // Use canvas rendering library (fabric.js server-side, puppeteer, or custom renderer)
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(request.width || canvasData.width, request.height || canvasData.height);
    const ctx = canvas.getContext('2d');

    // Render each element
    for (const element of canvasData.elements) {
      await this.renderElement(ctx, element);
    }

    return canvas.toBuffer('image/png');
  }
}
```

## WebSocket Real-Time Collaboration

```typescript
// src/gateways/collaboration.gateway.ts
@WebSocketGateway({
  cors: {
    origin: "*"
  }
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private redis: RedisService,
    private jwt: JwtService
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      const payload = await this.jwt.verifyAsync(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  @SubscribeMessage('join_project')
  async handleJoinProject(client: Socket, projectId: string) {
    const userId = client.data.userId;
    await client.join(projectId);
    
    // Track active collaborator
    await this.redis.sadd(`collaboration:project:${projectId}:users`, userId);
    
    // Notify other users
    client.to(projectId).emit('user_joined', {
      userId,
      timestamp: Date.now()
    });
  }

  @SubscribeMessage('canvas_update')
  async handleCanvasUpdate(client: Socket, data: any) {
    const { projectId, elements, version } = data;
    
    // Broadcast to other collaborators
    client.to(projectId).emit('canvas_updated', {
      elements,
      version,
      userId: client.data.userId,
      timestamp: Date.now()
    });

    // Debounced save to database
    await this.debounceCanvasSave(projectId, elements, version);
  }

  @SubscribeMessage('cursor_move')
  async handleCursorMove(client: Socket, data: any) {
    const { projectId, position } = data;
    
    client.to(projectId).emit('user_cursor', {
      userId: client.data.userId,
      position,
      timestamp: Date.now()
    });
  }

  async handleDisconnect(client: Socket) {
    // Remove from all project rooms and notify
    const projectRooms = Array.from(client.rooms).filter(room => room !== client.id);
    
    for (const projectId of projectRooms) {
      await this.redis.srem(`collaboration:project:${projectId}:users`, client.data.userId);
      client.to(projectId).emit('user_left', {
        userId: client.data.userId,
        timestamp: Date.now()
      });
    }
  }
}
```

## Security Implementation

### Authentication & Authorization
```typescript
// src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET')
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      plan: payload.plan
    };
  }
}

// src/auth/guards/premium.guard.ts
@Injectable()
export class PremiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return user && ['pro', 'team'].includes(user.plan);
  }
}
```

### Input Validation & Sanitization
```typescript
// src/pipes/validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: any) {
    try {
      return this.schema.parse(value);
    } catch (error) {
      throw new BadRequestException('Validation failed');
    }
  }
}

// Usage in controllers
@Post()
@UsePipes(new ZodValidationPipe(CreateProjectSchema))
async createProject(@Body() data: CreateProjectRequest) {
  // Implementation
}
```

### Rate Limiting
```typescript
// src/common/decorators/rate-limit.decorator.ts
export const RateLimit = (requests: number, windowMs: number = 60000) =>
  applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle(requests, windowMs)
  );

// Usage
@RateLimit(100, 60000) // 100 requests per minute
@Post('/api/integrations/unsplash/search')
async searchUnsplash(@Query() query: UnsplashSearchParams) {
  // Implementation
}
```

## Caching Strategy

### Multi-Level Caching
```typescript
// src/services/cache/cache.service.ts
@Injectable()
export class CacheService {
  constructor(
    private redis: RedisService,
    private config: ConfigService
  ) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.redis.setex(key, ttl, JSON.stringify(value));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Specific cache methods
  async cacheUserSession(userId: string, data: any): Promise<void> {
    await this.set(`user:session:${userId}`, data, 86400); // 24 hours
  }

  async cacheProjectList(userId: string, projects: any[]): Promise<void> {
    await this.set(`project:recent:${userId}`, projects, 3600); // 1 hour
  }

  async cacheGoogleFonts(fonts: GoogleFont[]): Promise<void> {
    await this.set('fonts:google', fonts, 86400); // 24 hours
  }
}
```

## Development Phases & Implementation Roadmap

### Phase 1: Foundation Backend (Weeks 1-2)
**Priority: Critical - Supports current frontend Phase 3**

#### Week 1: Core Infrastructure
- [ ] **Database Setup**
  - PostgreSQL database creation with all tables
  - MongoDB setup with collections and indexes
  - Redis configuration for caching
  - Prisma schema and migrations
  - Mongoose models and schemas

- [ ] **Authentication System**
  - JWT-based authentication service
  - User registration and login endpoints
  - Password hashing and validation
  - Refresh token mechanism
  - Basic authorization guards

#### Week 2: Project & Asset Management
- [ ] **Project Management API**
  - CRUD operations for projects
  - PostgreSQL + MongoDB integration
  - Project versioning system
  - Project sharing and permissions

- [ ] **Asset Management System**
  - File upload handling (multer)
  - S3 storage integration
  - Image processing and thumbnails
  - Asset metadata management

### Phase 2: Third-Party Integrations (Weeks 3-4)
**Priority: High - Required for panel functionality**

#### Week 3: External APIs
- [ ] **Unsplash Integration**
  - Photo search and download API
  - Rate limiting and caching
  - Image proxy for CORS handling
  - Download tracking compliance

- [ ] **Google Fonts Integration**
  - Font list caching service
  - Font file serving proxy
  - Font metadata management

#### Week 4: AI Services
- [ ] **AI Image Generation**
  - Stability AI or OpenAI integration
  - Job queue system for async processing
  - Job status tracking and updates
  - Generated image storage

- [ ] **QR Code Generation**
  - QR code creation service
  - Custom styling options
  - SVG and PNG export formats

### Phase 3: Advanced Features (Weeks 5-6)
**Priority: Medium - Enhances user experience**

#### Week 5: Export System
- [ ] **Export Processing**
  - Canvas-to-image rendering
  - PDF generation service
  - Video export (if timeline exists)
  - Export job queue management

- [ ] **Template System**
  - Template CRUD operations
  - Template categorization
  - Template search and filtering
  - Premium template handling

#### Week 6: Real-Time Features
- [ ] **WebSocket Implementation**
  - Real-time collaboration gateway
  - User presence tracking
  - Canvas sync mechanisms
  - Conflict resolution system

### Phase 4: Performance & Scaling (Weeks 7-8)
**Priority: Medium - Production readiness**

#### Week 7: Optimization
- [ ] **Performance Improvements**
  - Database query optimization
  - Caching strategy implementation
  - CDN integration for assets
  - Image optimization pipeline

- [ ] **Monitoring & Logging**
  - Application performance monitoring
  - Error tracking and logging
  - Health check endpoints
  - Metrics collection

#### Week 8: Security & Compliance
- [ ] **Security Hardening**
  - Input validation and sanitization
  - Rate limiting implementation
  - CORS configuration
  - Security headers and CSP

- [ ] **Data Privacy**
  - User data anonymization
  - GDPR compliance features
  - Data retention policies
  - Audit logging

## Immediate Next Steps (Current Sprint)

### Critical Path Items (Next 2 Weeks)

1. **Setup Development Environment**
   ```bash
   # Backend directory structure
   mkdir design-studio-backend
   cd design-studio-backend
   
   # Initialize NestJS project
   npm i -g @nestjs/cli
   nest new . --skip-git
   
   # Add essential dependencies
   npm install @prisma/client prisma
   npm install mongoose redis
   npm install @nestjs/passport @nestjs/jwt passport-jwt
   npm install multer @nestjs/platform-socket.io
   ```

2. **Database Schema Implementation**
   ```bash
   # Initialize Prisma
   npx prisma init
   
   # Apply migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma client
   npx prisma generate
   ```

3. **Core API Endpoints (Match Frontend Types)**
   - Implement endpoints matching existing TypeScript interfaces
   - Focus on project management and asset handling first
   - Add authentication endpoints for user management

4. **Integration Points**
   - Unsplash API proxy (for PhotosPanel component)
   - Google Fonts API caching (for TextToolsPanel)
   - File upload handling (for UploadPanel)

## Code Examples & Implementation Patterns

### Environment Configuration
```typescript
// .env.example
DATABASE_URL="postgresql://username:password@localhost:5432/design_studio"
MONGODB_URL="mongodb://localhost:27017/design_studio"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="1d"
REFRESH_TOKEN_SECRET="your-refresh-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"
AWS_ACCESS_KEY_ID="your-aws-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="design-studio-assets"
UNSPLASH_ACCESS_KEY="your-unsplash-key"
GOOGLE_FONTS_API_KEY="your-google-fonts-key"
STABILITY_API_KEY="your-stability-api-key"
```

### Docker Configuration
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "start:prod"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - mongodb
      - redis

  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: design_studio
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  mongodb:
    image: mongo:7
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
```

This comprehensive backend architecture plan provides a complete roadmap for implementing a production-ready server infrastructure that perfectly complements the existing frontend TypeScript definitions and supports all the advanced features planned for the Design Studio Clone.

The implementation prioritizes the immediate needs of the current frontend development phase while building a scalable foundation for future enhancements. The modular service architecture ensures maintainability, and the hybrid database approach optimizes for both relational data integrity and flexible document storage needs.