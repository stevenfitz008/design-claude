# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 4.1: Timeline and Animation System
  - Timeline, TimelineTrack, and Keyframe data models
  - Animation controller with full CRUD operations
  - Timeline export functionality (JSON and Lottie formats)
  - Preview frame generation with interpolation
  - Support for easing curves and keyframe animation
  - RequestAnimationFrame synchronization planning

- Phase 4.2: Multi-Format Export System (In Progress)
  - Enhanced export module architecture
  - Image export service with Sharp integration
  - Video export service with FFmpeg integration
  - Social media preset configurations
  - Support for PNG, JPEG, SVG, PDF, MP4, GIF, WEBM formats
  - Quality settings and optimization options
  - Export queue management system

### Changed
- Updated Prisma schema to include animation models
- Enhanced project structure with modular architecture
- Improved error handling and validation

### Technical Details
- **Backend Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Image Processing**: Sharp library for high-performance image manipulation
- **Video Processing**: FFmpeg integration for video/GIF generation
- **Queue Management**: Bull/Redis for background job processing
- **Authentication**: JWT-based auth with refresh tokens
- **API Documentation**: Swagger/OpenAPI integration

## [0.1.0] - 2025-09-02

### Added
- Initial project setup with NestJS backend
- User authentication and authorization system
- Project management with metadata storage
- Asset management for files, images, and videos
- Template library system
- Basic export functionality
- Multi-agent coordination system (Archon)
- Database schema with PostgreSQL
- Redis caching and session management
- Health monitoring and API usage tracking

### Infrastructure
- Docker containerization setup
- Environment configuration management
- Comprehensive error handling and logging
- Rate limiting and security middleware
- Database migrations and seeding
- Testing framework setup

### Database Schema
- User management with plans and preferences
- Project collaboration system
- Asset storage with S3 integration
- Export job tracking and status management
- System configuration management
- API usage analytics

### API Endpoints
- Authentication (`/auth`)
- User management (`/users`)
- Project operations (`/projects`)
- File uploads (`/uploads`)
- Template library (`/templates`)
- Photo/asset management (`/photos`)
- Font management (`/fonts`)
- Animation system (`/animations`)
- Export functionality (`/export`)

### Security Features
- JWT authentication with refresh tokens
- Rate limiting and throttling
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Environment variable protection