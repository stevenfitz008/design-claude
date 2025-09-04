import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

/**
 * Comprehensive Test Suite for Pages API
 * Tests all 11 Pages API endpoints with database integration, validation, and error handling
 * 
 * API Endpoints Tested:
 * - POST /pages (Create page)
 * - GET /pages (List pages with pagination/filters)
 * - GET /pages/stats (Get page statistics)
 * - GET /pages/:id (Get specific page)
 * - PUT /pages/:id (Update page)
 * - DELETE /pages/:id (Delete page)
 * - POST /pages/:id/duplicate (Duplicate page)
 * - PUT /pages/reports/:reportId/reorder (Reorder pages)
 * - POST /pages/:id/components (Add component to page)
 * - DELETE /pages/:id/components/:componentInstanceId (Remove component)
 * - GET /pages/health/status (Health check)
 */

describe('Pages API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testUserId: string;
  let testReportId: string;
  let testPageId: string;
  let testComponentId: string;
  let testComponentInstanceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    prisma = app.get(PrismaService);
    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create test user (simplified - in real tests you'd use proper auth setup)
    testUserId = 'test-user-pages-api';
    authToken = 'Bearer mock-jwt-token'; // Mock token for testing

    // Create test report for page relationships
    const reportData = await prisma.report.create({
      data: {
        id: 'test-report-pages-api',
        name: 'Test Report for Pages API',
        description: 'Test report for validating Pages API functionality',
        createdBy: testUserId,
        visibility: 'PRIVATE',
        status: 'DRAFT',
        tags: ['test', 'pages-api'],
        settings: {},
        canvas: {
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff'
        },
        metadata: {
          version: 1,
          totalPages: 0,
          estimatedSize: 0
        }
      }
    });
    testReportId = reportData.id;

    // Create test component for component-page relationships
    const componentData = await prisma.component.create({
      data: {
        id: 'test-component-pages-api',
        name: 'Test Component for Pages',
        description: 'Test component for Pages API validation',
        type: 'CHART',
        category: 'test-category',
        definitionId: 'mock-definition-id',
        defaultProps: { title: 'Test Chart' },
        supportedFormats: ['PNG', 'SVG'],
        createdBy: testUserId,
        version: 1,
        isPublished: true,
        tags: ['test'],
        isSystem: false,
        usageCount: 0
      }
    });
    testComponentId = componentData.id;
  }

  async function cleanupTestData() {
    try {
      // Clean up in reverse order of dependencies
      await prisma.reportPage.deleteMany({
        where: { reportId: testReportId }
      });
      await prisma.report.deleteMany({
        where: { id: testReportId }
      });
      await prisma.component.deleteMany({
        where: { id: testComponentId }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Health Check Endpoint', () => {
    it('GET /pages/health/status should return service health', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages/health/status')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Pages API');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
    });
  });

  describe('Page CRUD Operations', () => {
    it('POST /pages should create a new page', async () => {
      const createPageDto = {
        name: 'Test Page API',
        description: 'Test page created via API',
        reportId: testReportId,
        pageNumber: 1,
        canvas: {
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff',
          scale: 1.0
        },
        layout: {
          type: 'FREEFORM',
          grid: { enabled: false, size: 10 },
          margins: { top: 20, bottom: 20, left: 20, right: 20 }
        },
        settings: {
          isLocked: false,
          isVisible: true,
          allowComments: true
        },
        metadata: {
          version: 1,
          createdFrom: 'API_TEST'
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/pages')
        .set('Authorization', authToken)
        .send(createPageDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(createPageDto.name);
      expect(response.body.data.reportId).toBe(testReportId);
      expect(response.body.data.pageNumber).toBe(1);
      
      testPageId = response.body.data.id;
    });

    it('GET /pages should list pages with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages')
        .set('Authorization', authToken)
        .query({ reportId: testReportId, page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body.pagination).toHaveProperty('total');
    });

    it('GET /pages/:id should return specific page', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/pages/${testPageId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPageId);
      expect(response.body.data.name).toBe('Test Page API');
      expect(response.body.data).toHaveProperty('canvas');
      expect(response.body.data).toHaveProperty('layout');
      expect(response.body.data).toHaveProperty('componentInstances');
    });

    it('PUT /pages/:id should update page', async () => {
      const updateData = {
        name: 'Updated Test Page API',
        description: 'Updated description',
        canvas: {
          width: 1920,
          height: 1080,
          backgroundColor: '#f0f0f0',
          scale: 1.2
        },
        settings: {
          isLocked: true,
          isVisible: true,
          allowComments: false
        }
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/pages/${testPageId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Page API');
      expect(response.body.data.canvas.backgroundColor).toBe('#f0f0f0');
      expect(response.body.data.settings.isLocked).toBe(true);
    });

    it('POST /pages/:id/duplicate should duplicate page', async () => {
      const duplicateData = {
        name: 'Duplicated Test Page',
        targetReportId: testReportId
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${testPageId}/duplicate`)
        .set('Authorization', authToken)
        .send(duplicateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Duplicated Test Page');
      expect(response.body.data.reportId).toBe(testReportId);
      expect(response.body.data.id).not.toBe(testPageId);
    });
  });

  describe('Page Statistics', () => {
    it('GET /pages/stats should return page statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages/stats')
        .set('Authorization', authToken)
        .query({ reportId: testReportId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data).toHaveProperty('pagesByLayout');
      expect(response.body.data).toHaveProperty('averageComponentsPerPage');
      expect(response.body.data).toHaveProperty('mostUsedComponents');
    });
  });

  describe('Component Management on Pages', () => {
    it('POST /pages/:id/components should add component to page', async () => {
      const componentData = {
        componentId: testComponentId,
        componentVersion: 1,
        position: {
          x: 100,
          y: 100,
          width: 400,
          height: 300,
          zIndex: 1
        },
        props: {
          title: 'Test Chart Component',
          color: '#3498db'
        }
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${testPageId}/components`)
        .set('Authorization', authToken)
        .send(componentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('componentInstanceId');
      expect(response.body.message).toBe('Component added to page successfully');
      
      testComponentInstanceId = response.body.componentInstanceId;
    });

    it('DELETE /pages/:id/components/:componentInstanceId should remove component', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pages/${testPageId}/components/${testComponentInstanceId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Component removed from page successfully');
    });
  });

  describe('Page Reordering', () => {
    it('PUT /pages/reports/:reportId/reorder should reorder pages', async () => {
      // First create a second page for reordering test
      const secondPageDto = {
        name: 'Second Test Page',
        reportId: testReportId,
        pageNumber: 2,
        canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' }
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/pages')
        .set('Authorization', authToken)
        .send(secondPageDto)
        .expect(201);

      const secondPageId = createResponse.body.data.id;

      // Test reordering
      const reorderData = {
        pageOrders: [
          { pageId: secondPageId, pageNumber: 1 },
          { pageId: testPageId, pageNumber: 2 }
        ]
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/pages/reports/${testReportId}/reorder`)
        .set('Authorization', authToken)
        .send(reorderData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Pages reordered successfully');
    });
  });

  describe('Validation and Error Handling', () => {
    it('POST /pages should fail with invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail validation
        reportId: 'non-existent-report-id'
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/pages')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('GET /pages/:id should return 404 for non-existent page', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages/non-existent-page-id')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('PUT /pages/:id should fail without authorization', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/pages/${testPageId}`)
        .send({ name: 'Unauthorized Update' })
        .expect(401);
    });

    it('POST /pages/:id/components should fail with invalid component', async () => {
      const invalidComponentData = {
        componentId: 'non-existent-component',
        componentVersion: 1,
        position: { x: 0, y: 0, width: 100, height: 100 }
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${testPageId}/components`)
        .set('Authorization', authToken)
        .send(invalidComponentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Database Integration', () => {
    it('should maintain data consistency in PostgreSQL', async () => {
      const page = await prisma.reportPage.findUnique({
        where: { id: testPageId },
        include: {
          report: true
        }
      });

      expect(page).not.toBeNull();
      expect(page.reportId).toBe(testReportId);
      expect(page.report.id).toBe(testReportId);
    });

    it('should handle concurrent page updates', async () => {
      const updatePromises = Array.from({ length: 3 }, (_, i) => 
        request(app.getHttpServer())
          .put(`/api/v1/pages/${testPageId}`)
          .set('Authorization', authToken)
          .send({
            name: `Concurrent Update ${i + 1}`,
            settings: { version: i + 1 }
          })
      );

      const responses = await Promise.allSettled(updatePromises);
      const successfulUpdates = responses.filter(r => r.status === 'fulfilled').length;
      
      expect(successfulUpdates).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle bulk page creation efficiently', async () => {
      const startTime = Date.now();
      const bulkPages = Array.from({ length: 5 }, (_, i) => ({
        name: `Bulk Page ${i + 1}`,
        reportId: testReportId,
        pageNumber: i + 10,
        canvas: { width: 1920, height: 1080, backgroundColor: '#ffffff' }
      }));

      const createPromises = bulkPages.map(pageData => 
        request(app.getHttpServer())
          .post('/api/v1/pages')
          .set('Authorization', authToken)
          .send(pageData)
          .expect(201)
      );

      await Promise.all(createPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should paginate large result sets efficiently', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages')
        .set('Authorization', authToken)
        .query({ page: 1, limit: 100, reportId: testReportId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Cleanup Operations', () => {
    it('DELETE /pages/:id should delete page', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pages/${testPageId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Page deleted successfully');

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/v1/pages/${testPageId}`)
        .set('Authorization', authToken)
        .expect(404);
    });
  });
});