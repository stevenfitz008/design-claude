import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from './prisma.service';
import { MongoDbModule } from './mongodb/mongodb.module';

@Global()
@Module({
  imports: [
    // MongoDB configuration
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get('MONGODB_URL'),
        retryAttempts: 3,
        retryDelay: 3000,
        connectionFactory: (connection) => {
          connection.on('connected', () => {
            console.log('✅ MongoDB connected successfully');
          });
          connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
          });
          connection.on('disconnected', () => {
            console.log('🔌 MongoDB disconnected');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    
    // MongoDB schemas module
    MongoDbModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService, MongoDbModule],
})
export class DatabaseModule {}