# Design Studio Backend - Project Overview

## Purpose
A comprehensive NestJS backend API for a design studio application with animation, export, and AI integration capabilities. This backend serves a Polotno Studio-inspired frontend design tool.

## Tech Stack
- **Framework**: NestJS 10.0+ with TypeScript 5.1.3
- **Database**: 
  - PostgreSQL (metadata, users, projects, assets)
  - MongoDB (canvas data, complex document storage)
  - Redis (caching and session management)
- **Authentication**: JWT with refresh tokens
- **File Processing**: Sharp (images), FFmpeg (videos)
- **External APIs**: Unsplash (photos), Google Fonts (fonts), AI services
- **Background Jobs**: Bull/Redis queue system
- **Containerization**: Docker with docker-compose

## Architecture Overview
- **Modular Structure**: Feature-based modules (auth, projects, photos, templates, animations, export)
- **Database Strategy**: Hybrid PostgreSQL/MongoDB for optimal data modeling
- **API Design**: RESTful endpoints with OpenAPI documentation
- **Security**: JWT auth, rate limiting, input validation, CORS
- **Performance**: Redis caching, Bull queues, Sharp image processing

## Current Implementation Status
- ✅ **Core Infrastructure**: NestJS app, database schemas, Docker setup
- ✅ **Authentication System**: JWT auth with refresh tokens
- ✅ **Photos Module**: Unsplash API integration with caching
- ✅ **Projects Module**: CRUD operations with MongoDB canvas storage
- ✅ **Templates Module**: Template library management
- ✅ **Animations Module**: Timeline and keyframe system
- 🚧 **Export Module**: Multi-format export system (in development)
- 📋 **AI Integration**: Planned for text-to-image generation

## Key Features Implemented
1. **Unsplash Photo Integration**: Search, trending, collections with Redis caching
2. **Animation System**: Timeline management with keyframes and easing
3. **Project Management**: Canvas data stored in MongoDB, metadata in PostgreSQL
4. **Template Library**: Reusable design templates with categorization
5. **Asset Management**: File upload with S3 storage and metadata tracking
6. **Rate Limiting**: Multi-tier throttling for API protection