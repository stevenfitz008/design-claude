import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global configuration
  app.setGlobalPrefix(configService.get('API_PREFIX', 'api/v1'));

  // CORS configuration
  app.enableCors({
    origin: configService.get('CORS_ORIGINS', 'http://localhost:3000').split(','),
    methods: configService.get('CORS_METHODS', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS'),
    credentials: configService.get('CORS_CREDENTIALS', 'true') === 'true',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validateCustomDecorators: true,
    }),
  );

  // Swagger API documentation
  if (configService.get('NODE_ENV') === 'development') {
    const config = new DocumentBuilder()
      .setTitle('Design Studio API')
      .setDescription('Design Studio Clone - Backend API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          description: 'JWT Authorization header using the Bearer scheme.',
          name: 'Authorization',
          bearerFormat: 'JWT',
          scheme: 'Bearer',
          type: 'http',
          in: 'Header',
        },
        'access-token',
      )
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('projects', 'Project management')
      .addTag('uploads', 'File upload and storage')
      .addTag('templates', 'Template library')
      .addTag('photos', 'Unsplash photo integration')
      .addTag('fonts', 'Google Fonts integration')
      .addTag('export', 'Export and rendering services')
      .addTag('health', 'Health check endpoints')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Start the server
  const port = configService.get('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Design Studio Backend running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🌍 Environment: ${configService.get('NODE_ENV', 'development')}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start the application:', error);
  process.exit(1);
});