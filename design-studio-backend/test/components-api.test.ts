import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

/**
 * Comprehensive Test Suite for Components API
 * Tests all 12 Components API endpoints with database integration, version management, and MongoDB
 * 
 * API Endpoints Tested:
 * - POST /components (Create component)
 * - GET /components (List components with pagination/filters)
 * - GET /components/stats (Get component statistics)
 * - GET /components/:id (Get specific component)
 * - PUT /components/:id (Update component)
 * - DELETE /components/:id (Delete component)
 * - GET /components/:id/versions (Get component versions)
 * - POST /components/:id/versions (Create new component version)
 * - PUT /components/:id/versions/:version (Update specific version)
 * - GET /components/:id/usage (Get component usage statistics)
 * - GET /components/health/status (Health check)
 */

describe('Components API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mongoConnection: Connection;
  let authToken: string;
  let testUserId: string;
  let testComponentId: string;
  let testDefinitionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    prisma = app.get(PrismaService);
    mongoConnection = app.get(getConnectionToken());
    await app.init();

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    testUserId = 'test-user-components-api';
    authToken = 'Bearer mock-jwt-token';
  }

  async function cleanupTestData() {
    try {
      // Clean up PostgreSQL data
      await prisma.componentVersion.deleteMany({
        where: { componentId: testComponentId }
      });
      await prisma.component.deleteMany({
        where: { id: testComponentId }
      });

      // Clean up MongoDB data if testDefinitionId exists
      if (testDefinitionId && mongoConnection) {
        const ComponentDefinitionModel = mongoConnection.model('ComponentDefinitionDocument');
        await ComponentDefinitionModel.findByIdAndDelete(testDefinitionId);
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Health Check Endpoint', () => {
    it('GET /components/health/status should return service health', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/components/health/status')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Components API');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('mongodb');
    });
  });

  describe('Component CRUD Operations', () => {
    it('POST /components should create a new component', async () => {
      const createComponentDto = {
        name: 'Test Chart Component API',
        description: 'Advanced chart component for data visualization testing',
        type: 'CHART',
        category: 'data-visualization',
        template: {
          html: '<div class=\"test-chart-container\"><canvas id=\"chart\"></canvas></div>',
          svg: '<svg><rect width=\"100\" height=\"100\" fill=\"blue\"/></svg>',
          canvas: [
            { type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: 'blue' }
          ],
          styles: {
            '.test-chart-container': {
              width: '100%',
              height: '400px',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '8px'
            }
          }
        },
        propsSchema: {
          properties: {
            title: {
              type: 'string',
              default: 'Test Chart',
              required: true,
              description: 'Chart title'
            },
            color: {
              type: 'string',
              default: '#3498db',
              options: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12'],
              description: 'Primary chart color'
            },
            width: {
              type: 'number',
              default: 400,
              description: 'Chart width in pixels'
            },
            height: {
              type: 'number',
              default: 300,
              description: 'Chart height in pixels'
            },
            animated: {
              type: 'boolean',
              default: true,
              description: 'Enable chart animations'
            }
          },
          required: ['title', 'width', 'height']
        },
        rendering: {
          supportedFormats: ['PNG', 'SVG', 'PDF'],
          dependencies: ['chart.js', 'lodash'],
          performance: {
            complexity: 'medium',
            estimatedRenderTime: 750,
            memoryUsage: 2048
          }
        },
        defaultProps: {
          title: 'Sample Data Chart',
          color: '#3498db',
          width: 500,
          height: 350,
          animated: true,
          showLegend: true,
          gridLines: true
        },
        tags: ['chart', 'data', 'visualization', 'test'],
        dataBinding: {
          sources: ['api', 'database', 'csv'],
          transformations: {
            aggregate: 'sum',
            groupBy: 'category',
            timeRange: '30days'
          },
          validation: {
            required: ['value', 'label'],
            numeric: ['value'],
            dateFormat: 'YYYY-MM-DD'
          }
        },
        interactions: {
          events: ['click', 'hover', 'doubleclick', 'zoom'],
          actions: {
            click: 'drillDown',
            hover: 'highlight',
            doubleclick: 'expand',
            zoom: 'focus'
          }
        },
        isPublished: true
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/components')
        .set('Authorization', authToken)
        .send(createComponentDto)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(createComponentDto.name);
      expect(response.body.data.type).toBe('CHART');
      expect(response.body.data.category).toBe('data-visualization');
      expect(response.body.data.version).toBe(1);
      expect(response.body.data.isPublished).toBe(true);
      expect(response.body.data.tags).toEqual(createComponentDto.tags);
      
      testComponentId = response.body.data.id;
      testDefinitionId = response.body.data.definitionId;
    });

    it('GET /components should list components with pagination and filters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/components')
        .set('Authorization', authToken)
        .query({
          page: 1,
          limit: 10,
          type: 'CHART',
          category: 'data-visualization',
          tags: 'chart,data',
          isPublished: 'true'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 10);
      expect(response.body.pagination).toHaveProperty('total');
      
      // Verify filtering worked
      const component = response.body.data.find(c => c.id === testComponentId);
      expect(component).toBeDefined();
      expect(component.type).toBe('CHART');
    });

    it('GET /components/:id should return specific component with definition', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/components/${testComponentId}`)
        .set('Authorization', authToken)
        .query({ includeDefinition: 'true' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testComponentId);
      expect(response.body.data.name).toBe('Test Chart Component API');
      expect(response.body.data).toHaveProperty('template');
      expect(response.body.data).toHaveProperty('propsSchema');
      expect(response.body.data).toHaveProperty('rendering');
      expect(response.body.data).toHaveProperty('dataBinding');
      expect(response.body.data).toHaveProperty('interactions');
      
      // Verify template structure
      expect(response.body.data.template).toHaveProperty('html');
      expect(response.body.data.template).toHaveProperty('svg');
      expect(response.body.data.template).toHaveProperty('styles');
      
      // Verify props schema
      expect(response.body.data.propsSchema).toHaveProperty('properties');
      expect(response.body.data.propsSchema.properties).toHaveProperty('title');
      expect(response.body.data.propsSchema.properties).toHaveProperty('color');
    });

    it('PUT /components/:id should update component', async () => {
      const updateData = {
        name: 'Updated Test Chart Component',
        description: 'Updated advanced chart component with enhanced features',
        category: 'advanced-charts',
        defaultProps: {
          title: 'Enhanced Data Chart',
          color: '#e74c3c',
          width: 600,
          height: 400,
          animated: true,
          showLegend: true,
          gridLines: false,
          theme: 'dark'
        },
        tags: ['chart', 'data', 'visualization', 'updated', 'enhanced'],
        propsSchema: {
          properties: {
            title: {
              type: 'string',
              default: 'Enhanced Chart',
              required: true
            },
            theme: {
              type: 'string',
              default: 'light',
              options: ['light', 'dark', 'auto']
            }
          },
          required: ['title']
        },
        isPublished: true
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/components/${testComponentId}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Test Chart Component');
      expect(response.body.data.category).toBe('advanced-charts');
      expect(response.body.data.defaultProps.theme).toBe('dark');
      expect(response.body.data.tags).toContain('enhanced');
      expect(response.body.data.version).toBe(2); // Version should increment
    });
  });

  describe('Component Statistics', () => {
    it('GET /components/stats should return comprehensive statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/components/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalComponents');
      expect(response.body.data).toHaveProperty('publishedComponents');
      expect(response.body.data).toHaveProperty('systemComponents');
      expect(response.body.data).toHaveProperty('userComponents');
      expect(response.body.data).toHaveProperty('componentsByType');
      expect(response.body.data).toHaveProperty('mostPopular');
      expect(response.body.data).toHaveProperty('componentsByCategory');
      expect(response.body.data).toHaveProperty('averageUsagePerComponent');
      expect(response.body.data).toHaveProperty('totalVersions');
      expect(response.body.data).toHaveProperty('averageVersionsPerComponent');
      
      // Verify arrays structure
      expect(response.body.data.componentsByType).toBeInstanceOf(Array);
      expect(response.body.data.mostPopular).toBeInstanceOf(Array);
      expect(response.body.data.componentsByCategory).toBeInstanceOf(Array);
    });
  });

  describe('Version Management', () => {
    it('GET /components/:id/versions should list component versions', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/components/${testComponentId}/versions`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      
      // Verify version structure
      const version = response.body.data[0];
      expect(version).toHaveProperty('version');
      expect(version).toHaveProperty('componentId', testComponentId);
      expect(version).toHaveProperty('isStable');
      expect(version).toHaveProperty('createdAt');
    });

    it('POST /components/:id/versions should create new version', async () => {
      const versionData = {
        changeLog: 'Added dark theme support and enhanced animations',
        markStable: true
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/components/${testComponentId}/versions`)
        .set('Authorization', authToken)
        .send(versionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('version');
      expect(response.body.data.componentId).toBe(testComponentId);
      expect(response.body.data.changeLog).toBe(versionData.changeLog);
      expect(response.body.data.isStable).toBe(true);
    });

    it('PUT /components/:id/versions/:version should update specific version', async () => {
      const updateData = {
        changeLog: 'Updated: Added dark theme support, enhanced animations, and improved performance',
        isStable: true,
        isDeprecated: false
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/components/${testComponentId}/versions/1`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.changeLog).toBe(updateData.changeLog);
      expect(response.body.data.isStable).toBe(true);
      expect(response.body.data.isDeprecated).toBe(false);
    });
  });

  describe('Usage Analytics', () => {
    it('GET /components/:id/usage should return usage statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/components/${testComponentId}/usage`)
        .set('Authorization', authToken)
        .query({ timeRange: '30d' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('componentId', testComponentId);
      expect(response.body.data).toHaveProperty('totalUsage');
      expect(response.body.data).toHaveProperty('pagesUsed');
      expect(response.body.data).toHaveProperty('reportsUsed');
      expect(response.body.data).toHaveProperty('uniqueUsers');
      expect(response.body.data).toHaveProperty('usageByVersion');
      expect(response.body.data).toHaveProperty('recentUsage');
      expect(response.body.data).toHaveProperty('lastUsedAt');
      
      // Verify arrays
      expect(response.body.data.usageByVersion).toBeInstanceOf(Array);
      expect(response.body.data.recentUsage).toBeInstanceOf(Array);
    });
  });

  describe('Validation and Error Handling', () => {
    it('POST /components should fail with invalid data', async () => {
      const invalidData = {
        name: '', // Empty name should fail
        type: 'INVALID_TYPE', // Invalid enum value
        template: {
          html: '<script>alert("xss")</script>' // Should be sanitized/rejected
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/components')
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('validation');
    });

    it('GET /components/:id should return 404 for non-existent component', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/components/non-existent-component-id')
        .set('Authorization', authToken)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });

    it('PUT /components/:id should fail without authorization', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/components/${testComponentId}`)
        .send({ name: 'Unauthorized Update' })
        .expect(401);
    });

    it('POST /components/:id/versions should validate version constraints', async () => {
      const invalidVersionData = {
        changeLog: '', // Empty changelog should fail
        minVersion: '999.0.0', // Invalid version format
        maxVersion: '0.0.1' // Max less than min
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/components/${testComponentId}/versions`)
        .set('Authorization', authToken)
        .send(invalidVersionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Database Integration Tests', () => {
    it('should maintain consistency between PostgreSQL and MongoDB', async () => {
      // Check PostgreSQL data
      const pgComponent = await prisma.component.findUnique({
        where: { id: testComponentId },
        include: { versions: true }
      });

      expect(pgComponent).not.toBeNull();
      expect(pgComponent.definitionId).toBe(testDefinitionId);
      expect(pgComponent.versions.length).toBeGreaterThanOrEqual(1);

      // Check MongoDB data (if connection available)
      if (mongoConnection) {
        const ComponentDefinitionModel = mongoConnection.model('ComponentDefinitionDocument');
        const mongoDefinition = await ComponentDefinitionModel.findById(testDefinitionId);
        
        if (mongoDefinition) {
          expect(mongoDefinition.template).toBeDefined();
          expect(mongoDefinition.propsSchema).toBeDefined();
          expect(mongoDefinition.rendering).toBeDefined();
        }
      }
    });

    it('should handle complex component queries efficiently', async () => {
      const startTime = Date.now();
      
      const response = await request(app.getHttpServer())
        .get('/api/v1/components')
        .set('Authorization', authToken)
        .query({
          page: 1,
          limit: 50,
          search: 'chart',
          type: 'CHART',
          includeDefinition: 'true',
          sortBy: 'usageCount',
          sortOrder: 'desc'
        })
        .expect(200);

      const endTime = Date.now();
      const queryTime = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(queryTime).toBeLessThan(2000); // Should complete in under 2 seconds
    });

    it('should handle concurrent version creation', async () => {
      const versionPromises = Array.from({ length: 3 }, (_, i) => 
        request(app.getHttpServer())
          .post(`/api/v1/components/${testComponentId}/versions`)
          .set('Authorization', authToken)
          .send({
            changeLog: `Concurrent version ${i + 1}`,
            markStable: i === 2
          })
      );

      const responses = await Promise.allSettled(versionPromises);
      const successfulVersions = responses.filter(r => r.status === 'fulfilled').length;
      
      expect(successfulVersions).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Advanced Search and Filtering', () => {
    it('should support complex search queries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/components')
        .set('Authorization', authToken)
        .query({
          search: 'chart visualization',
          category: 'data-visualization,advanced-charts',
          tags: 'chart,data',
          isPublished: 'true',
          hasVersions: 'true',
          sortBy: 'createdAt',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should support usage-based filtering', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/components')
        .set('Authorization', authToken)
        .query({
          minUsage: '0',
          maxUsage: '1000',
          sortBy: 'usageCount',
          sortOrder: 'desc'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle bulk component operations', async () => {
      const bulkComponents = Array.from({ length: 3 }, (_, i) => ({
        name: `Bulk Component ${i + 1}`,
        description: `Bulk test component ${i + 1}`,
        type: 'TEXT',
        category: 'bulk-test',
        template: {
          html: `<p>Bulk Component ${i + 1}</p>`,
          styles: { p: { fontSize: '16px' } }
        },
        propsSchema: {
          properties: {
            text: { type: 'string', default: `Bulk ${i + 1}` }
          },
          required: ['text']
        },
        rendering: {
          supportedFormats: ['HTML'],
          performance: {
            complexity: 'low',
            estimatedRenderTime: 100,
            memoryUsage: 512
          }
        },
        defaultProps: { text: `Bulk Component ${i + 1}` },
        tags: ['bulk', 'test'],
        isPublished: true
      }));

      const createPromises = bulkComponents.map(componentData =>
        request(app.getHttpServer())
          .post('/api/v1/components')
          .set('Authorization', authToken)
          .send(componentData)
          .expect(201)
      );

      const responses = await Promise.all(createPromises);
      expect(responses).toHaveLength(3);
    });
  });

  describe('Cleanup Operations', () => {
    it('DELETE /components/:id should delete component and all versions', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/components/${testComponentId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Component deleted successfully');

      // Verify deletion
      await request(app.getHttpServer())
        .get(`/api/v1/components/${testComponentId}`)
        .set('Authorization', authToken)
        .expect(404);

      // Verify versions were also deleted
      const versions = await prisma.componentVersion.findMany({
        where: { componentId: testComponentId }
      });
      expect(versions).toHaveLength(0);
    });
  });
});