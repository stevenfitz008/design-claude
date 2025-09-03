# Design Studio Backend - Task Completion Workflow

## Pre-Implementation Checklist
1. **Read Project Memory**: Check `project_overview.md` and `code_style_conventions.md`
2. **Environment Setup**: Ensure database and Redis are running via `npm run docker:dev`
3. **Dependencies**: Verify all required packages are installed with `npm install`

## Development Workflow
1. **Branch Creation**: Create feature branch from main
2. **Schema Changes**: Update `prisma/schema.prisma` if needed
3. **Generate Client**: Run `npm run db:generate` after schema changes
4. **Migration**: Run `npm run db:migrate` for schema updates
5. **Implementation**: Follow NestJS module patterns and code conventions
6. **Testing**: Write unit tests alongside implementation

## Code Quality Gates (MANDATORY)
```bash
# 1. Linting - Fix all ESLint errors
npm run lint

# 2. Formatting - Apply Prettier formatting
npm run format

# 3. Type Checking - Ensure no TypeScript errors
npm run build

# 4. Unit Tests - Run and pass all tests
npm run test

# 5. Test Coverage - Maintain reasonable coverage
npm run test:cov
```

## Database Quality Gates
```bash
# Validate schema changes
npx prisma validate

# Check migration status
npx prisma migrate status

# Seed database for testing
npm run db:seed
```

## Integration Testing
```bash
# Start development server
npm run start:dev

# Test API endpoints manually or with Postman
# Verify database connections
# Test external API integrations (Unsplash, etc.)

# Run E2E tests
npm run test:e2e
```

## Pre-Commit Requirements
- [ ] All linting errors resolved (`npm run lint`)
- [ ] Code properly formatted (`npm run format`)
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Unit tests passing (`npm run test`)
- [ ] Database migrations applied (`npm run db:migrate`)
- [ ] No secrets in code (check .env usage)
- [ ] API endpoints tested manually
- [ ] Documentation updated if needed

## Production Readiness
- [ ] Environment variables configured
- [ ] Database migrations deployed
- [ ] Redis connection tested
- [ ] External API keys validated
- [ ] Error handling implemented
- [ ] Rate limiting configured
- [ ] Security headers set
- [ ] Logging implemented

## Post-Implementation
1. **Update Documentation**: Update relevant memory files if architecture changes
2. **Performance Testing**: Test with realistic data volumes
3. **Security Review**: Validate authentication and authorization
4. **Monitoring**: Ensure proper logging and error tracking