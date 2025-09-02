# Design Studio Backend

> A comprehensive NestJS backend API for a design studio application with animation, export, and AI integration capabilities.

[![Version](https://img.shields.io/badge/version-0.2.0--alpha.1-blue.svg)](https://github.com/yourusername/design-studio-backend)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.1.3-blue.svg)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/nestjs-10.0.0-red.svg)](https://nestjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🚀 Features

### Core Functionality
- **User Authentication**: JWT-based auth with refresh tokens and role management
- **Project Management**: Create, edit, and collaborate on design projects
- **Asset Management**: Upload, organize, and manage images, videos, and fonts
- **Template Library**: Reusable design templates with categorization

### ✨ Advanced Features (v0.2.0+)

#### 🎬 Animation System (Phase 4.1) ✅
- **Timeline Management**: Create and manage animation timelines
- **Keyframe Animation**: Advanced keyframe system with easing curves
- **Multi-track Support**: Animate multiple properties simultaneously
- **Export Options**: Export animations as JSON or Lottie format
- **Preview Generation**: Generate preview frames with interpolation

#### 🎨 Multi-Format Export (Phase 4.2) 🚧
- **Image Formats**: PNG, JPEG, SVG, WebP with quality settings
- **Video Formats**: MP4, WebM, GIF with customizable bitrates
- **Document Formats**: PDF with print-ready settings
- **Social Media Presets**: Instagram, Facebook, Twitter, LinkedIn ready formats
- **Batch Processing**: Export multiple formats simultaneously

#### 🤖 AI Integration (Phase 4.3) 📋
- **Text-to-Image**: AI-powered image generation
- **Style Transfer**: Apply artistic styles to designs
- **Smart Suggestions**: AI-powered design recommendations
- **Content Optimization**: Automatic image enhancement

## 🏗️ Architecture

```
src/
├── auth/                 # Authentication & authorization
├── common/              # Shared utilities & middleware
├── database/            # Database configuration & services
├── modules/
│   ├── animations/      # Timeline & animation system
│   ├── export/         # Multi-format export system
│   ├── projects/       # Project management
│   ├── users/          # User management
│   ├── uploads/        # File upload handling
│   ├── templates/      # Template library
│   ├── photos/         # Photo/asset management
│   └── fonts/          # Font management
└── main.ts             # Application entry point
```

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **PostgreSQL** >= 14.0
- **Redis** >= 6.0
- **FFmpeg** >= 4.0 (for video exports)

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/design-studio-backend.git
cd design-studio-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 4. Database setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

### 5. Start development server
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## 🗄️ Database Schema

### Core Entities
- **Users**: Authentication, profiles, and preferences
- **Projects**: Design projects with canvas data
- **Assets**: File uploads and media management
- **Templates**: Reusable design templates

### Animation System
- **Timelines**: Animation timeline containers
- **TimelineTracks**: Individual animation tracks
- **Keyframes**: Animation keyframe data

### Export System
- **Exports**: Export job tracking and results

## 🛠️ API Endpoints

### Authentication
```
POST   /auth/login           # User login
POST   /auth/register        # User registration
POST   /auth/refresh         # Refresh access token
POST   /auth/logout          # User logout
```

### Projects
```
GET    /projects             # List user projects
POST   /projects             # Create new project
GET    /projects/:id         # Get project details
PUT    /projects/:id         # Update project
DELETE /projects/:id         # Delete project
```

### Animation System
```
POST   /animations/timelines                    # Create timeline
GET    /animations/timelines/project/:id        # Get project timelines
GET    /animations/timelines/:id                # Get timeline details
PUT    /animations/timelines/:id                # Update timeline
DELETE /animations/timelines/:id                # Delete timeline
POST   /animations/timelines/:id/tracks         # Add track to timeline
PUT    /animations/tracks/:id                   # Update track
DELETE /animations/tracks/:id                   # Delete track
GET    /animations/timelines/:id/export         # Export timeline
POST   /animations/timelines/:id/preview        # Generate preview
```

### Export System
```
POST   /export/create        # Create export job
POST   /export/batch         # Batch export
GET    /export/jobs/:id      # Get job status
GET    /export/stats         # Export statistics
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 Deployment

### Docker
```bash
# Build and run with Docker Compose
npm run docker:dev

# Production deployment
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/design_studio"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# AWS S3 (for file storage)
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_S3_BUCKET="your-bucket-name"
AWS_REGION="us-east-1"

# Export settings
EXPORT_OUTPUT_DIR="./exports"
TEMP_DIR="./temp"
```

## 🔧 Development

### Code Quality
```bash
# Linting
npm run lint

# Formatting
npm run format

# Type checking
npm run build
```

### Database Operations
```bash
# Generate Prisma client after schema changes
npm run db:generate

# Create and apply migration
npm run db:migrate

# Reset database
npx prisma migrate reset
```

## 📊 Performance

- **Image Processing**: Sharp library for high-performance image operations
- **Video Processing**: FFmpeg integration with hardware acceleration support
- **Caching**: Redis-based caching for frequently accessed data
- **Queue System**: Bull/Redis for background job processing
- **Database**: Optimized PostgreSQL queries with proper indexing

## 🔒 Security

- JWT authentication with refresh token rotation
- Rate limiting and request throttling
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- CORS configuration
- Environment variable protection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a detailed history of changes.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [NestJS](https://nestjs.com/) - Progressive Node.js framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [FFmpeg](https://ffmpeg.org/) - Multimedia processing framework
- [Bull](https://github.com/OptimalBits/bull) - Redis-based queue system

## 📞 Support

- 📫 Email: support@example.com
- 💬 Discord: [Join our community](https://discord.gg/example)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/design-studio-backend/issues)
- 📖 Documentation: [Wiki](https://github.com/yourusername/design-studio-backend/wiki)

---

<p align="center">Made with ❤️ for the design community</p>