# Design Studio Backend - Code Style & Conventions

## TypeScript Standards
- **Strict Mode**: Full TypeScript strict mode enabled
- **Type Annotations**: Explicit return types for public methods
- **Interfaces**: Prefer interfaces over types for object shapes
- **Enums**: Use string enums for better debugging and serialization
- **Naming**: PascalCase for classes/interfaces, camelCase for variables/methods

## NestJS Architecture Patterns
- **Modules**: Feature-based module organization
- **Controllers**: Thin controllers, business logic in services
- **Services**: Injectable services with dependency injection
- **DTOs**: Class-based DTOs with class-validator decorators
- **Guards**: Authentication and authorization guards
- **Interceptors**: Response transformation and logging
- **Pipes**: Input validation and transformation

## Database Conventions
- **Schema**: Snake_case for database columns, camelCase in TypeScript
- **Relations**: Explicit foreign key naming (`user_id`, `project_id`)
- **Timestamps**: Always include `created_at`, `updated_at`
- **Soft Deletes**: Use `deleted_at` for soft deletion when needed
- **Indexes**: Explicit indexes for foreign keys and query fields

## API Design Standards
- **REST**: RESTful resource-based URLs (`/projects/:id/assets`)
- **HTTP Status**: Proper HTTP status codes (200, 201, 400, 404, 500)
- **Validation**: Class-validator decorators on DTOs
- **Error Handling**: Structured error responses with proper HTTP codes
- **Pagination**: Consistent pagination with `page`, `per_page`, `total`
- **OpenAPI**: Swagger decorators for API documentation

## File Organization
```
src/
├── auth/                 # Authentication module
├── common/              # Shared utilities, guards, pipes
├── database/            # Database configuration
├── modules/             # Feature modules
│   ├── [feature]/
│   │   ├── dto/         # Data transfer objects
│   │   ├── entities/    # Database entities (if using TypeORM)
│   │   ├── [feature].controller.ts
│   │   ├── [feature].service.ts
│   │   └── [feature].module.ts
└── main.ts
```

## Error Handling
- **HTTP Exceptions**: Use NestJS HTTP exceptions
- **Try-Catch**: Wrap external API calls in try-catch
- **Logging**: Use NestJS logger for structured logging
- **Validation**: Let class-validator handle input validation

## Security Practices
- **Environment Variables**: Never commit secrets, use .env
- **Input Validation**: Validate all inputs with class-validator
- **SQL Injection**: Use Prisma ORM parameterized queries
- **Rate Limiting**: Apply throttling to prevent abuse
- **CORS**: Configure CORS for frontend domains only

## Performance Guidelines
- **Caching**: Use Redis for frequently accessed data
- **Pagination**: Always paginate large result sets
- **N+1 Queries**: Use Prisma includes/selects to prevent N+1
- **Background Jobs**: Use Bull queues for heavy processing
- **Image Processing**: Use Sharp for efficient image operations