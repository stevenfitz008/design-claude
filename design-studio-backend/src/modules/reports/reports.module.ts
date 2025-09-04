import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../../auth/auth.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportPageDefinition, ReportPageDefinitionSchema } from '../../database/mongodb/schemas';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MongooseModule.forFeature([
      { name: ReportPageDefinition.name, schema: ReportPageDefinitionSchema },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}