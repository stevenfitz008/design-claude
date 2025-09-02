# Design Studio Clone - Backend Implementation Roadmap

## Current Status Analysis

**Frontend Progress**: Phase 3.1-3.4 (Panel System Development)
- ✅ Complete TypeScript API interfaces (400+ lines in `src/types/api.ts`)
- ✅ Empty service directories ready for implementation
- ✅ Project structure established with Vite + React 18.2+
- ❌ **Missing**: Backend infrastructure, API endpoints, database

**Critical Gap**: The frontend is ready to consume APIs, but no backend exists to serve them.

## Immediate Implementation Priority

### Critical Path: Support Current Frontend Development

The frontend panels are being developed and need backend support **NOW**:

1. **PhotosPanel.tsx** → Requires Unsplash API proxy
2. **TextToolsPanel.tsx** → Requires Google Fonts API
3. **UploadPanel.tsx** → Requires file upload endpoints
4. **ProjectManager** → Requires project CRUD operations
5. **AssetManager** → Requires asset storage and retrieval

## Sprint 1: Foundation Backend (Week 1-2)

### Day 1-2: Project Setup & Database Design

#### 1. Initialize Backend Project
```bash
# Create backend directory
mkdir design-studio-backend
cd design-studio-backend

# Initialize NestJS project (recommended for TypeScript integration)
npm i -g @nestjs/cli
nest new . --skip-git --package-manager npm

# Essential dependencies
npm install @prisma/client prisma
npm install mongoose @types/mongoose
npm install redis ioredis
npm install @nestjs/passport @nestjs/jwt passport-jwt
npm install @nestjs/platform-express multer @types/multer
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install aws-sdk @aws-sdk/client-s3
npm install zod class-validator class-transformer
npm install axios @nestjs/axios
```

#### 2. Database Setup Files

**Prisma Schema** (`prisma/schema.prisma`):
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String   @map("password_hash")
  name          String
  avatarUrl     String?  @map("avatar_url")
  plan          UserPlan @default(FREE)
  preferences   Json     @default("{}")
  limits        Json     @default("{}")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  projects      Project[]
  assets        Asset[]
  exportJobs    ExportJob[] @relation("UserExportJobs")
  
  @@map("users")
}

model Project {
  id                 String   @id @default(cuid())
  name               String
  userId             String   @map("user_id")
  thumbnailUrl       String?  @map("thumbnail_url")
  canvasWidth        Int      @default(800) @map("canvas_width")
  canvasHeight       Int      @default(600) @map("canvas_height")
  isPublic           Boolean  @default(false) @map("is_public")
  tags               String[] @default([])
  version            Int      @default(1)
  mongodbDocumentId  String?  @unique @map("mongodb_document_id")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")
  
  user       User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  exportJobs ExportJob[] @relation("ProjectExportJobs")
  
  @@index([userId])
  @@index([updatedAt])
  @@map("projects")
}

model Asset {
  id           String   @id @default(cuid())
  userId       String   @map("user_id")
  filename     String
  originalName String   @map("original_name")
  fileSize     BigInt   @map("file_size")
  mimeType     String   @map("mime_type")
  storageUrl   String   @map("storage_url")
  thumbnailUrl String?  @map("thumbnail_url")
  width        Int?
  height       Int?
  tags         String[] @default([])
  metadata     Json     @default("{}")
  createdAt    DateTime @default(now()) @map("created_at")
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([mimeType])
  @@map("assets")
}

model Template {
  id                String   @id @default(cuid())
  name              String
  category          String
  thumbnailUrl      String   @map("thumbnail_url")
  canvasWidth       Int      @map("canvas_width")
  canvasHeight      Int      @map("canvas_height")
  tags              String[] @default([])
  premium           Boolean  @default(false)
  downloads         Int      @default(0)
  mongodbDocumentId String?  @unique @map("mongodb_document_id")
  createdAt         DateTime @default(now()) @map("created_at")
  
  @@index([category])
  @@index([downloads])
  @@map("templates")
}

model ExportJob {
  id            String       @id @default(cuid())
  projectId     String       @map("project_id")
  userId        String       @map("user_id")
  format        ExportFormat
  quality       Int          @default(100)
  width         Int?
  height        Int?
  status        JobStatus    @default(PROCESSING)
  progress      Int          @default(0)
  resultUrl     String?      @map("result_url")
  errorMessage  String?      @map("error_message")
  estimatedTime Int?         @map("estimated_time")
  options       Json         @default("{}")
  createdAt     DateTime     @default(now()) @map("created_at")
  completedAt   DateTime?    @map("completed_at")
  
  project Project @relation("ProjectExportJobs", fields: [projectId], references: [id], onDelete: Cascade)
  user    User    @relation("UserExportJobs", fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([status])
  @@map("export_jobs")
}

enum UserPlan {
  FREE
  PRO
  TEAM
}

enum ExportFormat {
  PNG
  JPG
  PDF
  SVG
  GIF
  MP4
}

enum JobStatus {
  PROCESSING
  COMPLETED
  FAILED
}
```

#### 3. MongoDB Schemas

**Canvas Document Schema** (`src/schemas/canvas.schema.ts`):
```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CanvasDocument = Canvas & Document;

@Schema({ timestamps: true })
export class Canvas {
  @Prop({ required: true, unique: true })
  projectId: string;

  @Prop({ type: Array, default: [] })
  elements: CanvasElement[];

  @Prop({
    type: {
      duration: { type: Number, default: 5000 },
      fps: { type: Number, default: 30 },
      currentFrame: { type: Number, default: 0 }
    },
    default: {}
  })
  timeline: TimelineData;

  @Prop({ default: 1 })
  version: number;

  @Prop({ type: Array, default: [] })
  collaborators: Collaborator[];
}

export const CanvasSchema = SchemaFactory.createForClass(Canvas);

export interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'video' | 'group';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  opacity: number;
  visible: boolean;
  locked: boolean;
  
  // Type-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  src?: string;
  cropX?: number;
  cropY?: number;
  cropWidth?: number;
  cropHeight?: number;
  
  // Animation data
  keyframes?: Keyframe[];
}

export interface TimelineData {
  duration: number;
  fps: number;
  currentFrame: number;
}

export interface Collaborator {
  userId: string;
  lastSeen: Date;
  cursor: { x: number; y: number };
  selection: string[];
}

export interface Keyframe {
  frame: number;
  properties: Record<string, any>;
}
```

### Day 3-4: Core Services Implementation

#### 1. Authentication Service

**Auth Module** (`src/auth/auth.module.ts`):
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    UserModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

**Auth Service** (`src/auth/auth.service.ts`):
```typescript
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { RegisterRequest, LoginRequest, AuthResponse } from '../types/api.types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.userService.findByEmail(registerData.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(registerData.password, saltRounds);

    // Create user
    const user = await this.userService.create({
      ...registerData,
      passwordHash,
    });

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.userService.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Find user
    const user = await this.userService.findByEmail(loginData.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    return {
      user: this.userService.sanitizeUser(user),
      ...tokens,
    };
  }

  private generateTokens(user: any): { token: string; refreshToken: string; expiresAt: number } {
    const payload = { 
      sub: user.id, 
      email: user.email, 
      plan: user.plan 
    };

    const token = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours

    return { token, refreshToken, expiresAt };
  }

  async validateUser(payload: any): Promise<any> {
    return this.userService.findById(payload.sub);
  }
}
```

#### 2. Project Service

**Project Service** (`src/project/project.service.ts`):
```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MongoService } from '../mongo/mongo.service';
import { CacheService } from '../cache/cache.service';
import { CreateProjectRequest, UpdateProjectRequest, ProjectData } from '../types/api.types';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private mongo: MongoService,
    private cache: CacheService,
  ) {}

  async create(userId: string, data: CreateProjectRequest): Promise<ProjectData> {
    // Create project record in PostgreSQL
    const project = await this.prisma.project.create({
      data: {
        userId,
        name: data.name,
        canvasWidth: data.canvasSize.width,
        canvasHeight: data.canvasSize.height,
        isPublic: data.isPublic || false,
        tags: data.tags || [],
      },
    });

    // Create canvas document in MongoDB
    const canvasDoc = await this.mongo.canvas.create({
      projectId: project.id,
      elements: [],
      timeline: {
        duration: 5000,
        fps: 30,
        currentFrame: 0,
      },
      version: 1,
      collaborators: [],
    });

    // Update project with MongoDB reference
    const updatedProject = await this.prisma.project.update({
      where: { id: project.id },
      data: { mongodbDocumentId: canvasDoc._id.toString() },
    });

    // Clear user's project cache
    await this.cache.invalidatePattern(`projects:user:${userId}:*`);

    return this.formatProjectData(updatedProject, canvasDoc);
  }

  async findById(projectId: string, userId?: string): Promise<ProjectData> {
    // Get project from PostgreSQL
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check permissions
    if (!project.isPublic && project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Get canvas data from MongoDB
    const canvasDoc = await this.mongo.canvas.findOne({ projectId });

    return this.formatProjectData(project, canvasDoc);
  }

  async update(projectId: string, userId: string, data: UpdateProjectRequest): Promise<ProjectData> {
    // Verify ownership
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Update project metadata
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        name: data.name,
        isPublic: data.isPublic,
        tags: data.tags,
        thumbnailUrl: data.thumbnail,
      },
    });

    // Update canvas if elements provided
    let canvasDoc = null;
    if (data.elements || data.timeline) {
      canvasDoc = await this.mongo.canvas.findOneAndUpdate(
        { projectId },
        {
          $set: {
            ...(data.elements && { elements: data.elements }),
            ...(data.timeline && { timeline: data.timeline }),
            version: project.version + 1,
          },
        },
        { new: true },
      );

      // Update version in PostgreSQL
      await this.prisma.project.update({
        where: { id: projectId },
        data: { version: project.version + 1 },
      });
    } else {
      canvasDoc = await this.mongo.canvas.findOne({ projectId });
    }

    // Clear cache
    await this.cache.invalidatePattern(`projects:user:${userId}:*`);
    await this.cache.del(`project:${projectId}`);

    return this.formatProjectData(updatedProject, canvasDoc);
  }

  async findUserProjects(
    userId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<{ projects: ProjectData[]; total: number; totalPages: number }> {
    const cacheKey = `projects:user:${userId}:page:${page}:limit:${limit}:search:${search || ''}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    const where = {
      userId,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ],
      }),
    };

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    // Get canvas data for each project (lightweight - no elements)
    const projectsWithCanvas = await Promise.all(
      projects.map(async (project) => {
        const canvas = await this.mongo.canvas.findOne(
          { projectId: project.id },
          { elements: 0 }, // Exclude elements for list view
        );
        return this.formatProjectData(project, canvas);
      }),
    );

    const result = {
      projects: projectsWithCanvas,
      total,
      totalPages: Math.ceil(total / limit),
    };

    // Cache for 5 minutes
    await this.cache.set(cacheKey, result, 300);

    return result;
  }

  private formatProjectData(project: any, canvas: any): ProjectData {
    return {
      id: project.id,
      name: project.name,
      thumbnail: project.thumbnailUrl,
      canvasSize: {
        width: project.canvasWidth,
        height: project.canvasHeight,
      },
      elements: canvas?.elements || [],
      timeline: canvas?.timeline,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      userId: project.userId,
      isPublic: project.isPublic,
      tags: project.tags,
      version: project.version,
    };
  }
}
```

### Day 5-7: Third-Party API Integration

#### 1. Unsplash Service (Critical for PhotosPanel)

**Unsplash Service** (`src/integrations/unsplash/unsplash.service.ts`):
```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { UnsplashSearchParams, UnsplashPhoto } from '../../types/api.types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UnsplashService {
  private readonly baseURL = 'https://api.unsplash.com';
  private readonly accessKey: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private cache: CacheService,
  ) {
    this.accessKey = this.config.get<string>('UNSPLASH_ACCESS_KEY');
  }

  async searchPhotos(params: UnsplashSearchParams): Promise<{
    photos: UnsplashPhoto[];
    total: number;
    totalPages: number;
  }> {
    const cacheKey = `unsplash:search:${JSON.stringify(params)}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.http.get('/search/photos', {
          baseURL: this.baseURL,
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
          params: {
            query: params.query,
            page: params.page || 1,
            per_page: params.per_page || 20,
            order_by: params.order_by || 'relevant',
            orientation: params.orientation,
            color: params.color,
            content_filter: params.content_filter || 'high',
          },
        }),
      );

      const result = {
        photos: response.data.results,
        total: response.data.total,
        totalPages: response.data.total_pages,
      };

      // Cache for 1 hour
      await this.cache.set(cacheKey, result, 3600);

      return result;
    } catch (error) {
      throw new HttpException(
        'Failed to search photos',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getPhoto(photoId: string): Promise<UnsplashPhoto> {
    const cacheKey = `unsplash:photo:${photoId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.http.get(`/photos/${photoId}`, {
          baseURL: this.baseURL,
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
        }),
      );

      const photo = response.data;

      // Cache for 24 hours
      await this.cache.set(cacheKey, photo, 86400);

      return photo;
    } catch (error) {
      throw new HttpException('Photo not found', HttpStatus.NOT_FOUND);
    }
  }

  async downloadPhoto(photoId: string): Promise<{ downloadUrl: string }> {
    try {
      // Track download with Unsplash
      const response = await firstValueFrom(
        this.http.get(`/photos/${photoId}/download`, {
          baseURL: this.baseURL,
          headers: {
            'Authorization': `Client-ID ${this.accessKey}`,
          },
        }),
      );

      return { downloadUrl: response.data.url };
    } catch (error) {
      throw new HttpException(
        'Failed to get download URL',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
```

**Unsplash Controller** (`src/integrations/unsplash/unsplash.controller.ts`):
```typescript
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RateLimit } from '../../common/decorators/rate-limit.decorator';
import { UnsplashService } from './unsplash.service';
import { UnsplashSearchParams } from '../../types/api.types';

@Controller('api/integrations/unsplash')
@UseGuards(JwtAuthGuard)
export class UnsplashController {
  constructor(private unsplashService: UnsplashService) {}

  @Get('search')
  @RateLimit(100, 60000) // 100 requests per minute
  async searchPhotos(@Query() query: UnsplashSearchParams) {
    return this.unsplashService.searchPhotos(query);
  }

  @Get('photos/:id')
  @RateLimit(200, 60000) // 200 requests per minute
  async getPhoto(@Param('id') photoId: string) {
    return this.unsplashService.getPhoto(photoId);
  }

  @Get('photos/:id/download')
  @RateLimit(50, 60000) // 50 downloads per minute
  async downloadPhoto(@Param('id') photoId: string) {
    return this.unsplashService.downloadPhoto(photoId);
  }
}
```

#### 2. Google Fonts Service (Critical for TextToolsPanel)

**Google Fonts Service** (`src/integrations/google-fonts/google-fonts.service.ts`):
```typescript
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { GoogleFont, GoogleFontsResponse } from '../../types/api.types';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GoogleFontsService {
  private readonly baseURL = 'https://www.googleapis.com/webfonts/v1';
  private readonly apiKey: string;

  constructor(
    private http: HttpService,
    private config: ConfigService,
    private cache: CacheService,
  ) {
    this.apiKey = this.config.get<string>('GOOGLE_FONTS_API_KEY');
  }

  async getAllFonts(): Promise<GoogleFont[]> {
    const cacheKey = 'google:fonts:all';
    const cached = await this.cache.get<GoogleFont[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.http.get('/webfonts', {
          baseURL: this.baseURL,
          params: {
            key: this.apiKey,
            sort: 'popularity',
          },
        }),
      );

      const fonts = response.data.items;

      // Cache for 24 hours (fonts don't change often)
      await this.cache.set(cacheKey, fonts, 86400);

      return fonts;
    } catch (error) {
      throw new HttpException(
        'Failed to fetch Google Fonts',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getFontsByCategory(category: string): Promise<GoogleFont[]> {
    const cacheKey = `google:fonts:category:${category}`;
    const cached = await this.cache.get<GoogleFont[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const allFonts = await this.getAllFonts();
    const filteredFonts = allFonts.filter(font => font.category === category);

    // Cache for 24 hours
    await this.cache.set(cacheKey, filteredFonts, 86400);

    return filteredFonts;
  }

  async searchFonts(query: string): Promise<GoogleFont[]> {
    const allFonts = await this.getAllFonts();
    const searchTerm = query.toLowerCase();

    return allFonts.filter(font =>
      font.family.toLowerCase().includes(searchTerm),
    );
  }

  // Generate CSS URL for font loading
  generateFontUrl(fontFamily: string, variants: string[] = ['400']): string {
    const family = fontFamily.replace(/\s+/g, '+');
    const variantString = variants.join(',');
    return `https://fonts.googleapis.com/css2?family=${family}:wght@${variantString}&display=swap`;
  }
}
```

### Sprint 2: Asset Management & File Upload (Week 3-4)

#### 1. File Upload Service (Critical for UploadPanel)

**Asset Service** (`src/asset/asset.service.ts`):
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../storage/s3.service';
import { ImageProcessingService } from '../processing/image-processing.service';
import { CloudStorageFile, CloudUploadRequest } from '../types/api.types';

@Injectable()
export class AssetService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
    private imageProcessor: ImageProcessingService,
  ) {}

  async uploadAsset(
    userId: string,
    file: Express.Multer.File,
    metadata: Partial<CloudUploadRequest>,
  ): Promise<CloudStorageFile> {
    // Validate file
    this.validateFileUpload(file);

    // Generate unique filename
    const filename = `users/${userId}/${Date.now()}-${file.originalname}`;
    const folder = metadata.folder || 'uploads';

    try {
      // Process image if applicable
      let processedBuffer = file.buffer;
      let width: number | undefined;
      let height: number | undefined;

      if (file.mimetype.startsWith('image/')) {
        const processed = await this.imageProcessor.optimizeForWeb(file.buffer);
        processedBuffer = processed.buffer;
        width = processed.width;
        height = processed.height;
      }

      // Upload to S3
      const uploadResult = await this.s3.upload(
        `${folder}/${filename}`,
        processedBuffer,
        file.mimetype,
      );

      // Generate thumbnail for images
      let thumbnailUrl: string | undefined;
      if (file.mimetype.startsWith('image/')) {
        const thumbnailBuffer = await this.imageProcessor.generateThumbnail(
          file.buffer,
          300,
          300,
        );
        const thumbnailResult = await this.s3.upload(
          `thumbnails/${filename}`,
          thumbnailBuffer,
          'image/jpeg',
        );
        thumbnailUrl = thumbnailResult.url;
      }

      // Save to database
      const asset = await this.prisma.asset.create({
        data: {
          userId,
          filename,
          originalName: file.originalname,
          fileSize: BigInt(file.size),
          mimeType: file.mimetype,
          storageUrl: uploadResult.url,
          thumbnailUrl,
          width,
          height,
          tags: metadata.tags || [],
          metadata: {
            folder,
            public: metadata.public || false,
          },
        },
      });

      return this.formatAssetResponse(asset);
    } catch (error) {
      throw new BadRequestException('Failed to upload file');
    }
  }

  async getUserAssets(
    userId: string,
    page: number = 1,
    limit: number = 50,
    type?: string,
  ): Promise<{
    assets: CloudStorageFile[];
    total: number;
    totalPages: number;
  }> {
    const where = {
      userId,
      ...(type && { mimeType: { startsWith: type } }),
    };

    const [assets, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.asset.count({ where }),
    ]);

    return {
      assets: assets.map(this.formatAssetResponse),
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  private validateFileUpload(file: Express.Multer.File): void {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'video/mp4',
      'video/webm',
      'application/pdf',
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} not allowed`);
    }

    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 50MB limit');
    }
  }

  private formatAssetResponse(asset: any): CloudStorageFile {
    return {
      id: asset.id,
      name: asset.originalName,
      size: Number(asset.fileSize),
      type: asset.mimeType,
      url: asset.storageUrl,
      thumbnailUrl: asset.thumbnailUrl,
      uploadedAt: asset.createdAt.toISOString(),
      userId: asset.userId,
      tags: asset.tags,
    };
  }
}
```

**Asset Controller** (`src/asset/asset.controller.ts`):
```typescript
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Request,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { AssetService } from './asset.service';
import { CloudUploadRequest } from '../types/api.types';

@Controller('api/assets')
@UseGuards(JwtAuthGuard)
export class AssetController {
  constructor(private assetService: AssetService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @RateLimit(20, 60000) // 20 uploads per minute
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|gif|webp|svg|mp4|webm|pdf)$/,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() metadata: Partial<CloudUploadRequest>,
    @Request() req: any,
  ) {
    return this.assetService.uploadAsset(req.user.userId, file, metadata);
  }

  @Get()
  async getAssets(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '50',
    @Query('type') type?: string,
    @Request() req: any,
  ) {
    return this.assetService.getUserAssets(
      req.user.userId,
      parseInt(page),
      parseInt(limit),
      type,
    );
  }

  @Delete(':id')
  async deleteAsset(@Param('id') assetId: string, @Request() req: any) {
    return this.assetService.deleteAsset(assetId, req.user.userId);
  }
}
```

## Critical Configuration Files

### Environment Variables (.env)
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/design_studio"
MONGODB_URL="mongodb://localhost:27017/design_studio"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_SECRET="your-refresh-token-secret"
REFRESH_TOKEN_EXPIRES_IN="7d"

# AWS S3
AWS_ACCESS_KEY_ID="your-aws-access-key"
AWS_SECRET_ACCESS_KEY="your-aws-secret-key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="design-studio-assets"

# Third-party APIs
UNSPLASH_ACCESS_KEY="your-unsplash-access-key"
GOOGLE_FONTS_API_KEY="your-google-fonts-api-key"
STABILITY_API_KEY="your-stability-ai-key"

# Server
PORT=3001
NODE_ENV=development
```

### Docker Setup
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    restart: always
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
    restart: always
    volumes:
      - mongodb_data:/data/db
    ports:
      - "27017:27017"

  redis:
    image: redis:7-alpine
    restart: always
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  mongodb_data:
  redis_data:
```

## Next Week Action Items

### Week 1 Deliverables (Days 1-7)
- [ ] **Complete backend project setup**
- [ ] **Database schemas implemented and migrated**
- [ ] **Authentication system functional**
- [ ] **Project CRUD operations working**
- [ ] **Unsplash API integration complete**
- [ ] **Google Fonts API integration complete**
- [ ] **File upload system functional**

### Week 2 Deliverables (Days 8-14)
- [ ] **Asset management system complete**
- [ ] **Template system implementation**
- [ ] **Export job queue system**
- [ ] **WebSocket collaboration foundation**
- [ ] **API rate limiting and caching**
- [ ] **Error handling and logging**
- [ ] **Integration tests for all endpoints**

## Success Metrics

### Technical Metrics
- **API Response Time**: < 200ms for cached requests, < 500ms for database queries
- **File Upload Speed**: Support up to 50MB files with progress tracking
- **Third-party API Cache**: 95%+ cache hit rate for fonts and photo searches
- **Database Performance**: < 100ms for project queries, < 50ms for user authentication

### Functional Requirements
- **PhotosPanel**: Fully functional Unsplash integration with search, pagination, and download
- **TextToolsPanel**: Google Fonts loading and preview capabilities
- **UploadPanel**: Drag-and-drop file upload with progress indication
- **Project Management**: Complete CRUD operations matching frontend expectations
- **Authentication**: Secure JWT-based auth with refresh tokens

This roadmap provides a clear, actionable path to implement the backend infrastructure that directly supports the current frontend development phase while building a solid foundation for advanced features.