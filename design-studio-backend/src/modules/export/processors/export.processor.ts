import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Injectable, Logger } from '@nestjs/common';
import { ExportService } from '../export.service';

@Injectable()
@Processor('export')
export class ExportProcessor {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(private exportService: ExportService) {}

  @Process('process-export')
  async processExport(job: Job) {
    const { exportId, userId } = job.data;
    
    this.logger.log(`Processing export ${exportId} for user ${userId}`);

    try {
      const result = await this.exportService.processExport(exportId);
      
      this.logger.log(`Export ${exportId} completed successfully`);
      return result;
    } catch (error) {
      this.logger.error(`Export ${exportId} failed: ${error.message}`);
      throw error;
    }
  }
}