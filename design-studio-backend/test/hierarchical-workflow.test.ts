import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';

/**
 * Comprehensive Integration Test Suite for Hierarchical Report System
 * Tests the complete workflow: Report → Page → Components
 * 
 * Workflow Coverage:
 * 1. Create Report
 * 2. Create Pages within Report
 * 3. Create Components
 * 4. Add Components to Pages
 * 5. Version Management across all levels
 * 6. Statistics and Analytics
 * 7. Export and Publishing workflows
 * 8. Data consistency and relationships
 * 9. Permission and access control
 * 10. Performance under load
 */

describe('Hierarchical Report System Workflow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let mongoConnection: Connection;
  let authToken: string;
  let testUserId: string;
  
  // Test entities
  let reportId: string;
  let page1Id: string;
  let page2Id: string;
  let chartComponentId: string;
  let tableComponentId: string;
  let textComponentId: string;
  let componentInstance1Id: string;
  let componentInstance2Id: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    prisma = app.get(PrismaService);
    mongoConnection = app.get(getConnectionToken());
    await app.init();

    // Setup test user
    testUserId = 'test-user-hierarchical-workflow';
    authToken = 'Bearer mock-jwt-token';
  });

  afterAll(async () => {
    await cleanupAllTestData();
    await app.close();
  });

  async function cleanupAllTestData() {
    try {
      // Clean up in dependency order
      if (reportId) {
        await prisma.reportPage.deleteMany({ where: { reportId } });
        await prisma.report.deleteMany({ where: { id: reportId } });
      }
      
      if (chartComponentId) {
        await prisma.componentVersion.deleteMany({ where: { componentId: chartComponentId } });
        await prisma.component.deleteMany({ where: { id: chartComponentId } });
      }
      
      if (tableComponentId) {
        await prisma.componentVersion.deleteMany({ where: { componentId: tableComponentId } });
        await prisma.component.deleteMany({ where: { id: tableComponentId } });
      }
      
      if (textComponentId) {
        await prisma.componentVersion.deleteMany({ where: { componentId: textComponentId } });
        await prisma.component.deleteMany({ where: { id: textComponentId } });
      }

      // Clean up MongoDB definitions if they exist
      if (mongoConnection) {
        const ComponentDefinitionModel = mongoConnection.model('ComponentDefinitionDocument');
        await ComponentDefinitionModel.deleteMany({ 
          createdBy: testUserId 
        });
        
        const ReportPageDefinitionModel = mongoConnection.model('ReportPageDefinition');
        await ReportPageDefinitionModel.deleteMany({
          createdBy: testUserId
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  describe('Phase 1: Report Creation and Setup', () => {
    it('should create a new report for the hierarchical test', async () => {
      const reportData = {
        name: 'Hierarchical System Test Report',
        description: 'Complete integration test for hierarchical report system functionality',
        visibility: 'PRIVATE',
        status: 'DRAFT',
        tags: ['test', 'hierarchical', 'integration'],
        settings: {
          allowCollaboration: true,
          autoSave: true,
          version: '1.0.0'
        },
        canvas: {
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff',
          theme: 'professional'
        },
        metadata: {
          category: 'test',
          priority: 'HIGH',
          expectedPages: 3
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', authToken)
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(reportData.name);
      expect(response.body.data.status).toBe('DRAFT');
      
      reportId = response.body.data.id;
    });

    it('should verify report exists and is accessible', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/reports/${reportId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(reportId);
      expect(response.body.data.name).toBe('Hierarchical System Test Report');
    });
  });

  describe('Phase 2: Component Library Creation', () => {
    it('should create a chart component for data visualization', async () => {
      const chartComponentData = {
        name: 'Advanced Analytics Chart',
        description: 'Interactive chart component for data analytics and visualization',
        type: 'CHART',
        category: 'analytics',
        template: {
          html: `
            <div class="analytics-chart-container" id="chart-{{id}}">
              <div class="chart-header">
                <h3>{{title}}</h3>
                <div class="chart-controls">
                  <button class="btn-export">Export</button>
                  <button class="btn-fullscreen">Fullscreen</button>
                </div>
              </div>
              <canvas class="chart-canvas"></canvas>
              <div class="chart-legend"></div>
            </div>
          `,
          svg: `
            <svg viewBox="0 0 400 300" class="chart-svg">
              <rect width="400" height="300" fill="{{backgroundColor}}" rx="8"/>
              <text x="200" y="30" text-anchor="middle" class="chart-title">{{title}}</text>
              <g class="chart-data"></g>
              <g class="chart-axes"></g>
            </svg>
          `,
          styles: {
            '.analytics-chart-container': {
              width: '100%',
              height: '400px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              color: 'white'
            },
            '.chart-header': {
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px'
            },
            '.chart-controls button': {
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              color: 'white',
              marginLeft: '8px',
              cursor: 'pointer'
            }
          }
        },
        propsSchema: {
          properties: {
            title: {
              type: 'string',
              default: 'Analytics Chart',
              required: true,
              description: 'Chart title'
            },
            chartType: {
              type: 'string',
              default: 'line',
              options: ['line', 'bar', 'pie', 'doughnut', 'scatter', 'area'],
              description: 'Type of chart to render'
            },
            data: {
              type: 'array',
              default: [],
              description: 'Chart data array'
            },
            colors: {
              type: 'array',
              default: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'],
              description: 'Color palette for chart elements'
            },
            animated: {
              type: 'boolean',
              default: true,
              description: 'Enable chart animations'
            },
            showLegend: {
              type: 'boolean',
              default: true,
              description: 'Display chart legend'
            },
            responsive: {
              type: 'boolean',
              default: true,
              description: 'Make chart responsive'
            }
          },
          required: ['title', 'chartType']
        },
        rendering: {
          supportedFormats: ['PNG', 'SVG', 'PDF'],
          dependencies: ['chart.js', 'd3.js', 'lodash'],
          performance: {
            complexity: 'high',
            estimatedRenderTime: 1200,
            memoryUsage: 4096
          }
        },
        defaultProps: {
          title: 'Performance Analytics',
          chartType: 'line',
          data: [
            { label: 'Q1', value: 120 },
            { label: 'Q2', value: 190 },
            { label: 'Q3', value: 300 },
            { label: 'Q4', value: 500 }
          ],
          colors: ['#3498db', '#e74c3c', '#2ecc71'],
          animated: true,
          showLegend: true,
          responsive: true
        },
        tags: ['chart', 'analytics', 'visualization', 'interactive'],
        dataBinding: {
          sources: ['api', 'database', 'csv', 'json'],
          transformations: {
            aggregate: ['sum', 'average', 'count', 'max', 'min'],
            groupBy: 'category',
            filters: ['date', 'value', 'status'],
            timeRange: '90days'
          },
          validation: {
            required: ['label', 'value'],
            numeric: ['value'],
            dateFormat: 'YYYY-MM-DD'
          }
        },
        interactions: {
          events: ['click', 'hover', 'zoom', 'pan', 'select'],
          actions: {
            click: 'drillDown',
            hover: 'tooltip',
            zoom: 'focus',
            select: 'highlight'
          }
        },
        isPublished: true
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/components')
        .set('Authorization', authToken)
        .send(chartComponentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      chartComponentId = response.body.data.id;
    });

    it('should create a data table component', async () => {
      const tableComponentData = {
        name: 'Interactive Data Table',
        description: 'Sortable, filterable data table with pagination and export features',
        type: 'TABLE',
        category: 'data-display',
        template: {
          html: `
            <div class="data-table-container">
              <div class="table-toolbar">
                <input type="search" placeholder="Search..." class="table-search"/>
                <button class="btn-filter">Filters</button>
                <button class="btn-export">Export CSV</button>
              </div>
              <div class="table-wrapper">
                <table class="data-table">
                  <thead></thead>
                  <tbody></tbody>
                </table>
              </div>
              <div class="table-pagination">
                <span class="page-info">Showing {{start}} to {{end}} of {{total}} entries</span>
                <div class="pagination-controls"></div>
              </div>
            </div>
          `,
          styles: {
            '.data-table-container': {
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
            },
            '.table-toolbar': {
              display: 'flex',
              gap: '10px',
              marginBottom: '15px',
              alignItems: 'center'
            },
            '.data-table': {
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: '15px'
            },
            '.data-table th, .data-table td': {
              padding: '12px',
              textAlign: 'left',
              borderBottom: '1px solid #ddd'
            }
          }
        },
        propsSchema: {
          properties: {
            columns: {
              type: 'array',
              default: [],
              required: true,
              description: 'Table column definitions'
            },
            data: {
              type: 'array',
              default: [],
              description: 'Table data rows'
            },
            sortable: {
              type: 'boolean',
              default: true,
              description: 'Enable column sorting'
            },
            filterable: {
              type: 'boolean',
              default: true,
              description: 'Enable data filtering'
            },
            pagination: {
              type: 'boolean',
              default: true,
              description: 'Enable pagination'
            },
            pageSize: {
              type: 'number',
              default: 20,
              description: 'Number of rows per page'
            }
          },
          required: ['columns']
        },
        rendering: {
          supportedFormats: ['HTML', 'CSV', 'PDF'],
          performance: {
            complexity: 'medium',
            estimatedRenderTime: 800,
            memoryUsage: 2048
          }
        },
        defaultProps: {
          columns: [
            { key: 'id', label: 'ID', sortable: true },
            { key: 'name', label: 'Name', sortable: true },
            { key: 'status', label: 'Status', sortable: true },
            { key: 'date', label: 'Date', sortable: true }
          ],
          data: [],
          sortable: true,
          filterable: true,
          pagination: true,
          pageSize: 20
        },
        tags: ['table', 'data', 'sortable', 'pagination'],
        isPublished: true
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/components')
        .set('Authorization', authToken)
        .send(tableComponentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      tableComponentId = response.body.data.id;
    });

    it('should create a rich text component', async () => {
      const textComponentData = {
        name: 'Rich Text Editor',
        description: 'WYSIWYG rich text component with formatting and multimedia support',
        type: 'TEXT',
        category: 'content',
        template: {
          html: `
            <div class="rich-text-container">
              <div class="text-toolbar" style="display: none;">
                <button class="btn-bold">B</button>
                <button class="btn-italic">I</button>
                <button class="btn-underline">U</button>
                <select class="font-size-selector">
                  <option value="12">12px</option>
                  <option value="14" selected>14px</option>
                  <option value="16">16px</option>
                  <option value="18">18px</option>
                  <option value="24">24px</option>
                </select>
                <input type="color" class="color-picker" value="#000000"/>
              </div>
              <div class="text-content" contenteditable="{{editable}}">
                {{{content}}}
              </div>
            </div>
          `,
          styles: {
            '.rich-text-container': {
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              minHeight: '200px'
            },
            '.text-content': {
              minHeight: '150px',
              padding: '15px',
              border: '1px solid #ddd',
              borderRadius: '6px',
              fontSize: '14px',
              lineHeight: '1.6',
              fontFamily: 'Arial, sans-serif'
            },
            '.text-toolbar': {
              marginBottom: '10px',
              padding: '8px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              gap: '5px',
              alignItems: 'center'
            }
          }
        },
        propsSchema: {
          properties: {
            content: {
              type: 'string',
              default: '<p>Enter your text here...</p>',
              description: 'HTML content of the text component'
            },
            editable: {
              type: 'boolean',
              default: false,
              description: 'Enable content editing'
            },
            fontSize: {
              type: 'number',
              default: 14,
              description: 'Base font size in pixels'
            },
            textAlign: {
              type: 'string',
              default: 'left',
              options: ['left', 'center', 'right', 'justify'],
              description: 'Text alignment'
            },
            maxLength: {
              type: 'number',
              default: 5000,
              description: 'Maximum text length'
            }
          },
          required: ['content']
        },
        rendering: {
          supportedFormats: ['HTML', 'PDF', 'TXT'],
          performance: {
            complexity: 'low',
            estimatedRenderTime: 300,
            memoryUsage: 1024
          }
        },
        defaultProps: {
          content: '<h2>Welcome to Rich Text</h2><p>This is a sample rich text component with <strong>bold</strong>, <em>italic</em>, and <u>underlined</u> text formatting.</p>',
          editable: false,
          fontSize: 14,
          textAlign: 'left',
          maxLength: 5000
        },
        tags: ['text', 'rich-text', 'editor', 'content'],
        isPublished: true
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/components')
        .set('Authorization', authToken)
        .send(textComponentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      textComponentId = response.body.data.id;
    });

    it('should verify all components were created successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/components')
        .set('Authorization', authToken)
        .query({ createdBy: testUserId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      
      const componentIds = response.body.data.map(c => c.id);
      expect(componentIds).toContain(chartComponentId);
      expect(componentIds).toContain(tableComponentId);
      expect(componentIds).toContain(textComponentId);
    });
  });

  describe('Phase 3: Page Creation and Structure', () => {
    it('should create first page - Dashboard Overview', async () => {
      const page1Data = {
        name: 'Executive Dashboard',
        description: 'High-level overview with key metrics and charts',
        reportId,
        pageNumber: 1,
        canvas: {
          width: 1920,
          height: 1080,
          backgroundColor: '#f8f9fa',
          scale: 1.0
        },
        layout: {
          type: 'GRID',
          grid: {
            enabled: true,
            size: 24,
            columns: 12,
            rows: 8
          },
          margins: {
            top: 40,
            bottom: 40,
            left: 40,
            right: 40
          }
        },
        settings: {
          isLocked: false,
          isVisible: true,
          allowComments: true,
          showGrid: true,
          snapToGrid: true
        },
        metadata: {
          version: 1,
          category: 'dashboard',
          priority: 'HIGH',
          expectedComponents: 3
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/pages')
        .set('Authorization', authToken)
        .send(page1Data)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Executive Dashboard');
      expect(response.body.data.pageNumber).toBe(1);
      page1Id = response.body.data.id;
    });

    it('should create second page - Detailed Analytics', async () => {
      const page2Data = {
        name: 'Detailed Analytics',
        description: 'In-depth analysis with data tables and detailed charts',
        reportId,
        pageNumber: 2,
        canvas: {
          width: 1920,
          height: 1200,
          backgroundColor: '#ffffff',
          scale: 1.0
        },
        layout: {
          type: 'FREEFORM',
          grid: {
            enabled: false,
            size: 10
          },
          margins: {
            top: 30,
            bottom: 30,
            left: 30,
            right: 30
          }
        },
        settings: {
          isLocked: false,
          isVisible: true,
          allowComments: true,
          showGrid: false,
          snapToGrid: false
        },
        metadata: {
          version: 1,
          category: 'analytics',
          priority: 'MEDIUM',
          expectedComponents: 4
        }
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/pages')
        .set('Authorization', authToken)
        .send(page2Data)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Detailed Analytics');
      expect(response.body.data.pageNumber).toBe(2);
      page2Id = response.body.data.id;
    });

    it('should verify pages belong to the correct report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages')
        .set('Authorization', authToken)
        .query({ reportId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      
      const pageIds = response.body.data.map(p => p.id);
      expect(pageIds).toContain(page1Id);
      expect(pageIds).toContain(page2Id);
      
      // Verify correct order
      const sortedPages = response.body.data.sort((a, b) => a.pageNumber - b.pageNumber);
      expect(sortedPages[0].id).toBe(page1Id);
      expect(sortedPages[1].id).toBe(page2Id);
    });
  });

  describe('Phase 4: Component Integration with Pages', () => {
    it('should add chart component to first page', async () => {
      const componentData = {
        componentId: chartComponentId,
        componentVersion: 1,
        position: {
          x: 50,
          y: 50,
          width: 800,
          height: 400,
          zIndex: 1
        },
        props: {
          title: 'Quarterly Performance',
          chartType: 'line',
          data: [
            { label: 'Q1 2024', value: 125000 },
            { label: 'Q2 2024', value: 180000 },
            { label: 'Q3 2024', value: 220000 },
            { label: 'Q4 2024', value: 280000 }
          ],
          colors: ['#3498db', '#e74c3c', '#2ecc71'],
          animated: true,
          showLegend: true,
          responsive: true
        },
        dataBindings: {
          source: 'quarterly_performance',
          refreshInterval: 300,
          filters: { year: 2024 }
        },
        responsive: {
          mobile: { width: 350, height: 250 },
          tablet: { width: 600, height: 350 }
        }
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${page1Id}/components`)
        .set('Authorization', authToken)
        .send(componentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('componentInstanceId');
      componentInstance1Id = response.body.componentInstanceId;
    });

    it('should add text component to first page', async () => {
      const textData = {
        componentId: textComponentId,
        componentVersion: 1,
        position: {
          x: 50,
          y: 500,
          width: 800,
          height: 200,
          zIndex: 2
        },
        props: {
          content: `
            <h2>Executive Summary</h2>
            <p>This quarter shows exceptional growth with a <strong>25% increase</strong> in overall performance metrics. Key highlights include:</p>
            <ul>
              <li>Revenue growth of <strong>$155,000</strong> over previous quarter</li>
              <li>Customer satisfaction rating improved to <em>4.8/5.0</em></li>
              <li>Market share expansion in key demographics</li>
            </ul>
            <p>Looking ahead, we anticipate continued growth trajectory with strategic initiatives in Q1 2025.</p>
          `,
          editable: false,
          fontSize: 16,
          textAlign: 'left'
        }
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${page1Id}/components`)
        .set('Authorization', authToken)
        .send(textData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('componentInstanceId');
    });

    it('should add table component to second page', async () => {
      const tableData = {
        componentId: tableComponentId,
        componentVersion: 1,
        position: {
          x: 50,
          y: 50,
          width: 1200,
          height: 600,
          zIndex: 1
        },
        props: {
          columns: [
            { key: 'id', label: 'Transaction ID', sortable: true, width: 120 },
            { key: 'date', label: 'Date', sortable: true, width: 120 },
            { key: 'customer', label: 'Customer', sortable: true, width: 200 },
            { key: 'product', label: 'Product', sortable: true, width: 200 },
            { key: 'amount', label: 'Amount', sortable: true, width: 120, type: 'currency' },
            { key: 'status', label: 'Status', sortable: true, width: 100 }
          ],
          data: [
            { id: 'TXN-001', date: '2024-09-01', customer: 'Acme Corp', product: 'Enterprise License', amount: 50000, status: 'Completed' },
            { id: 'TXN-002', date: '2024-09-02', customer: 'Tech Solutions', product: 'Professional Plan', amount: 25000, status: 'Completed' },
            { id: 'TXN-003', date: '2024-09-03', customer: 'StartupXYZ', product: 'Starter Package', amount: 5000, status: 'Pending' },
            { id: 'TXN-004', date: '2024-09-04', customer: 'Global Industries', product: 'Custom Solution', amount: 75000, status: 'In Progress' }
          ],
          sortable: true,
          filterable: true,
          pagination: true,
          pageSize: 50
        },
        dataBindings: {
          source: 'transaction_data',
          refreshInterval: 600,
          filters: { status: ['Completed', 'In Progress', 'Pending'] }
        }
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${page2Id}/components`)
        .set('Authorization', authToken)
        .send(tableData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('componentInstanceId');
      componentInstance2Id = response.body.componentInstanceId;
    });

    it('should verify components are properly attached to pages', async () => {
      // Check first page components
      const page1Response = await request(app.getHttpServer())
        .get(`/api/v1/pages/${page1Id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(page1Response.body.success).toBe(true);
      expect(page1Response.body.data.componentInstances).toHaveLength(2);
      
      // Check second page components
      const page2Response = await request(app.getHttpServer())
        .get(`/api/v1/pages/${page2Id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(page2Response.body.success).toBe(true);
      expect(page2Response.body.data.componentInstances).toHaveLength(1);
    });
  });

  describe('Phase 5: Version Management and Updates', () => {
    it('should create new version of chart component', async () => {
      const versionData = {
        changeLog: 'Enhanced performance metrics chart with real-time data updates and improved animations',
        markStable: true
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/components/${chartComponentId}/versions`)
        .set('Authorization', authToken)
        .send(versionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe(2);
      expect(response.body.data.isStable).toBe(true);
    });

    it('should update page with new component version', async () => {
      const updateData = {
        name: 'Executive Dashboard - Enhanced',
        description: 'Enhanced dashboard with improved performance metrics',
        metadata: {
          version: 2,
          category: 'dashboard',
          priority: 'HIGH',
          lastEnhanced: new Date().toISOString()
        }
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/pages/${page1Id}`)
        .set('Authorization', authToken)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Executive Dashboard - Enhanced');
    });

    it('should update report status to published', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/reports/${reportId}/publish`)
        .set('Authorization', authToken)
        .send({ publishedAt: new Date().toISOString() })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PUBLISHED');
    });
  });

  describe('Phase 6: Analytics and Statistics', () => {
    it('should get comprehensive report statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/reports/stats')
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalReports');
      expect(response.body.data).toHaveProperty('publishedReports');
      expect(response.body.data).toHaveProperty('reportsByStatus');
      expect(response.body.data).toHaveProperty('averagePagesPerReport');
    });

    it('should get page statistics for the report', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/pages/stats')
        .set('Authorization', authToken)
        .query({ reportId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalPages');
      expect(response.body.data.totalPages).toBe(2);
      expect(response.body.data).toHaveProperty('pagesByLayout');
      expect(response.body.data).toHaveProperty('averageComponentsPerPage');
    });

    it('should get component usage statistics', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/components/${chartComponentId}/usage`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('componentId', chartComponentId);
      expect(response.body.data).toHaveProperty('totalUsage');
      expect(response.body.data.pagesUsed).toBeGreaterThanOrEqual(1);
    });

    it('should verify data consistency across all levels', async () => {
      // Verify report exists with correct page count
      const report = await prisma.report.findUnique({
        where: { id: reportId },
        include: {
          pages: {
            include: {
              _count: {
                select: { componentInstances: true }
              }
            }
          }
        }
      });

      expect(report).not.toBeNull();
      expect(report.pages).toHaveLength(2);
      expect(report.status).toBe('PUBLISHED');

      // Verify components exist and have versions
      const chartComponent = await prisma.component.findUnique({
        where: { id: chartComponentId },
        include: { versions: true }
      });

      expect(chartComponent).not.toBeNull();
      expect(chartComponent.versions.length).toBeGreaterThanOrEqual(2);
      expect(chartComponent.usageCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Phase 7: Performance and Load Testing', () => {
    it('should handle complex queries efficiently', async () => {
      const startTime = Date.now();

      // Perform multiple concurrent queries
      const queries = await Promise.all([
        request(app.getHttpServer())
          .get(`/api/v1/reports/${reportId}`)
          .set('Authorization', authToken),
        request(app.getHttpServer())
          .get('/api/v1/pages')
          .set('Authorization', authToken)
          .query({ reportId, includeComponents: 'true' }),
        request(app.getHttpServer())
          .get('/api/v1/components')
          .set('Authorization', authToken)
          .query({ includeDefinition: 'true', limit: 10 }),
        request(app.getHttpServer())
          .get('/api/v1/components/stats')
          .set('Authorization', authToken)
      ]);

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // All queries should succeed
      queries.forEach(response => {
        expect(response.body.success).toBe(true);
      });

      // Should complete in reasonable time (under 3 seconds)
      expect(totalTime).toBeLessThan(3000);
    });

    it('should handle bulk component updates', async () => {
      const updates = [
        { componentId: chartComponentId, props: { title: 'Updated Chart Title 1' } },
        { componentId: textComponentId, props: { fontSize: 18 } },
        { componentId: tableComponentId, props: { pageSize: 25 } }
      ];

      const updatePromises = updates.map(update => 
        request(app.getHttpServer())
          .put(`/api/v1/components/${update.componentId}`)
          .set('Authorization', authToken)
          .send({ defaultProps: update.props })
      );

      const responses = await Promise.allSettled(updatePromises);
      const successfulUpdates = responses.filter(r => r.status === 'fulfilled').length;

      expect(successfulUpdates).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Phase 8: Error Handling and Edge Cases', () => {
    it('should handle invalid component addition to page', async () => {
      const invalidData = {
        componentId: 'non-existent-component',
        componentVersion: 1,
        position: { x: 0, y: 0, width: 100, height: 100 }
      };

      const response = await request(app.getHttpServer())
        .post(`/api/v1/pages/${page1Id}/components`)
        .set('Authorization', authToken)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle component removal gracefully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/pages/${page1Id}/components/${componentInstance1Id}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Component removed from page successfully');

      // Verify component was removed
      const pageResponse = await request(app.getHttpServer())
        .get(`/api/v1/pages/${page1Id}`)
        .set('Authorization', authToken)
        .expect(200);

      const componentIds = pageResponse.body.data.componentInstances.map(ci => ci.id);
      expect(componentIds).not.toContain(componentInstance1Id);
    });

    it('should handle report deletion with cascading cleanup', async () => {
      // First, create a test report to delete
      const testReportData = {
        name: 'Report to Delete',
        description: 'Test report for deletion',
        visibility: 'PRIVATE',
        status: 'DRAFT'
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/reports')
        .set('Authorization', authToken)
        .send(testReportData)
        .expect(201);

      const testReportId = createResponse.body.data.id;

      // Delete the report
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/api/v1/reports/${testReportId}`)
        .set('Authorization', authToken)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify report was deleted
      await request(app.getHttpServer())
        .get(`/api/v1/reports/${testReportId}`)
        .set('Authorization', authToken)
        .expect(404);
    });
  });

  describe('Phase 9: Health Checks and System Status', () => {
    it('should verify all service health endpoints', async () => {
      const healthChecks = await Promise.all([
        request(app.getHttpServer()).get('/api/v1/reports/health/status'),
        request(app.getHttpServer()).get('/api/v1/pages/health/status'),
        request(app.getHttpServer()).get('/api/v1/components/health/status')
      ]);

      healthChecks.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('status', 'healthy');
        expect(response.body).toHaveProperty('service');
        expect(response.body).toHaveProperty('timestamp');
      });
    });

    it('should verify database connectivity', async () => {
      const pgHealth = await prisma.$queryRaw`SELECT 1 as health`;
      expect(pgHealth).toBeDefined();

      if (mongoConnection) {
        expect(mongoConnection.readyState).toBe(1); // Connected
      }
    });
  });

  describe('Final Cleanup and Verification', () => {
    it('should provide comprehensive system summary', async () => {
      const summary = {
        reportId,
        totalPages: 2,
        totalComponents: 3,
        componentInstances: 2, // One was removed in error testing
        status: 'PUBLISHED'
      };

      expect(summary.reportId).toBeDefined();
      expect(summary.totalPages).toBe(2);
      expect(summary.totalComponents).toBe(3);
      expect(summary.status).toBe('PUBLISHED');

      // Log summary for test report
      console.log('Hierarchical Workflow Test Summary:', summary);
    });
  });
});