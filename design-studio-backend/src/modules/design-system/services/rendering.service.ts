import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ComponentService } from './component.service';
import { ReportService } from './report.service';
import { 
  ReportRenderingCache, 
  ReportRenderingCacheType,
  ComponentDefinitionDocument,
  ComponentDefinitionDocumentType,
  ReportPageDefinition,
  ReportPageDefinitionType,
} from '../../../database/mongodb/schemas';
import * as crypto from 'crypto';

export interface RenderingOptions {
  format: 'html' | 'pdf' | 'pptx' | 'svg';
  quality?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  includePages?: string[];
  theme?: string;
  responsive?: boolean;
  optimize?: boolean;
}

export interface RenderingResult {
  reportId: string;
  format: string;
  pages: Array<{
    pageId: string;
    content: any;
    assets: string[];
    metadata: any;
  }>;
  totalSize: number;
  renderTime: number;
  cacheHit: boolean;
  downloadUrl?: string;
}

export interface ComponentRenderContext {
  component: any;
  definition: any;
  props: Record<string, any>;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  theme?: any;
  responsive?: any;
}

@Injectable()
export class RenderingService {
  private readonly logger = new Logger(RenderingService.name);

  constructor(
    private prisma: PrismaService,
    private componentService: ComponentService,
    private reportService: ReportService,
    @InjectModel(ReportRenderingCache.name)
    private renderingCacheModel: Model<ReportRenderingCacheType>,
    @InjectModel(ComponentDefinitionDocument.name)
    private componentDefinitionModel: Model<ComponentDefinitionDocumentType>,
    @InjectModel(ReportPageDefinition.name)
    private pageDefinitionModel: Model<ReportPageDefinitionType>,
  ) {}

  /**
   * Render report to specified format
   */
  async renderReport(
    reportId: string,
    options: RenderingOptions,
    userId?: string
  ): Promise<RenderingResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Rendering report ${reportId} to ${options.format}`);

      // Get report with pages
      const report = await this.reportService.getReport(reportId, userId, true);
      if (!report) {
        throw new NotFoundException('Report not found');
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(reportId, report.version, options);
      
      // Check cache first
      const cachedResult = await this.getCachedRender(cacheKey);
      if (cachedResult) {
        this.logger.log(`Cache hit for render ${cacheKey}`);
        return {
          ...cachedResult,
          cacheHit: true,
          renderTime: Date.now() - startTime,
        };
      }

      // Filter pages if specified
      const pagesToRender = options.includePages
        ? report.pages.filter(page => options.includePages!.includes(page.id))
        : report.pages;

      // Render each page
      const renderedPages = await Promise.all(
        pagesToRender.map(page => this.renderPage(page, options, userId))
      );

      const result: RenderingResult = {
        reportId,
        format: options.format,
        pages: renderedPages,
        totalSize: renderedPages.reduce((sum, page) => sum + (page.metadata?.size || 0), 0),
        renderTime: Date.now() - startTime,
        cacheHit: false,
      };

      // Cache the result
      await this.cacheRenderResult(cacheKey, reportId, report.version, options, result);

      return result;
    } catch (error) {
      this.logger.error(`Failed to render report ${reportId}:`, error);
      throw error;
    }
  }

  /**
   * Render individual page
   */
  async renderPage(page: any, options: RenderingOptions, userId?: string) {
    try {
      // Get page definition from MongoDB
      const pageDefinition = await this.pageDefinitionModel.findOne({
        pageId: page.id,
        version: page.version,
      });

      if (!pageDefinition) {
        throw new NotFoundException(`Page definition not found for page ${page.id}`);
      }

      // Render components
      const renderedComponents = await Promise.all(
        pageDefinition.componentInstances.map(instance => 
          this.renderComponent(instance, options, userId)
        )
      );

      // Combine components based on format
      const pageContent = await this.combineComponents(
        renderedComponents,
        pageDefinition,
        options
      );

      return {
        pageId: page.id,
        content: pageContent,
        assets: this.extractAssetUrls(renderedComponents),
        metadata: {
          size: JSON.stringify(pageContent).length,
          componentCount: renderedComponents.length,
          layout: pageDefinition.layout,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to render page ${page.id}:`, error);
      throw error;
    }
  }

  /**
   * Render individual component
   */
  async renderComponent(
    instance: any,
    options: RenderingOptions,
    userId?: string
  ) {
    try {
      // Get component definition
      const componentDefinition = await this.componentDefinitionModel.findOne({
        componentId: instance.componentId,
        version: instance.componentVersion,
      });

      if (!componentDefinition) {
        throw new NotFoundException(
          `Component definition not found for ${instance.componentId} v${instance.componentVersion}`
        );
      }

      const renderContext: ComponentRenderContext = {
        component: componentDefinition,
        definition: componentDefinition.definition,
        props: { 
          // Extract default values from propsSchema
          ...Object.entries(componentDefinition.definition.propsSchema?.properties || {})
            .reduce((acc, [key, prop]) => ({ ...acc, [key]: prop.default }), {}),
          ...instance.props 
        },
        position: instance.position,
        theme: options.theme,
        responsive: instance.responsive,
      };

      // Render based on format
      switch (options.format) {
        case 'html':
          return this.renderComponentToHtml(renderContext);
        case 'svg':
          return this.renderComponentToSvg(renderContext);
        case 'pdf':
          return this.renderComponentToPdf(renderContext);
        case 'pptx':
          return this.renderComponentToPptx(renderContext);
        default:
          throw new Error(`Unsupported render format: ${options.format}`);
      }
    } catch (error) {
      this.logger.error(`Failed to render component ${instance.componentId}:`, error);
      throw error;
    }
  }

  /**
   * Render component to HTML
   */
  private async renderComponentToHtml(context: ComponentRenderContext) {
    const { definition, props, position } = context;
    
    let html = definition.template.html || '';
    
    // Replace template variables with prop values
    html = this.interpolateTemplate(html, props);
    
    // Apply positioning styles
    const positionStyles = `
      position: absolute;
      left: ${position.x}px;
      top: ${position.y}px;
      width: ${position.width}px;
      height: ${position.height}px;
      z-index: ${position.zIndex};
    `;
    
    // Wrap in positioned container
    const wrappedHtml = `
      <div class="component-container" style="${positionStyles}">
        ${html}
      </div>
    `;

    return {
      type: 'html',
      content: wrappedHtml,
      styles: definition.template.styles || {},
      dependencies: definition.rendering?.dependencies || [],
      metadata: {
        componentId: context.component.componentId,
        version: context.component.version,
        renderTime: Date.now(),
      },
    };
  }

  /**
   * Render component to SVG
   */
  private async renderComponentToSvg(context: ComponentRenderContext) {
    const { definition, props, position } = context;
    
    let svg = definition.template.svg || '';
    
    if (!svg && definition.template.html) {
      // Convert HTML to SVG (simplified conversion)
      svg = this.htmlToSvg(definition.template.html, props, position);
    }
    
    // Replace template variables
    svg = this.interpolateTemplate(svg, props);
    
    // Apply position transformation
    const transformedSvg = `
      <g transform="translate(${position.x}, ${position.y})">
        ${svg}
      </g>
    `;

    return {
      type: 'svg',
      content: transformedSvg,
      dependencies: definition.rendering?.dependencies || [],
      metadata: {
        componentId: context.component.componentId,
        version: context.component.version,
        dimensions: { width: position.width, height: position.height },
      },
    };
  }

  /**
   * Render component to PDF format (returns layout info)
   */
  private async renderComponentToPdf(context: ComponentRenderContext) {
    const { definition, props, position } = context;
    
    // For PDF, we return layout information that can be used by PDF generators
    return {
      type: 'pdf',
      content: {
        type: definition.type,
        position: {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height,
        },
        properties: props,
        template: definition.template,
        styles: definition.template.styles || {},
      },
      dependencies: definition.rendering?.dependencies || [],
      metadata: {
        componentId: context.component.componentId,
        version: context.component.version,
      },
    };
  }

  /**
   * Render component to PPTX format (returns slide element info)
   */
  private async renderComponentToPptx(context: ComponentRenderContext) {
    const { definition, props, position } = context;
    
    // For PPTX, return slide element configuration
    return {
      type: 'pptx',
      content: {
        elementType: this.mapComponentTypeToPptx(definition.type),
        position: {
          x: this.pixelsToPoints(position.x),
          y: this.pixelsToPoints(position.y),
          cx: this.pixelsToPoints(position.width),
          cy: this.pixelsToPoints(position.height),
        },
        properties: props,
        template: definition.template,
      },
      dependencies: definition.rendering?.dependencies || [],
      metadata: {
        componentId: context.component.componentId,
        version: context.component.version,
      },
    };
  }

  /**
   * Combine rendered components into page layout
   */
  private async combineComponents(
    components: any[],
    pageDefinition: any,
    options: RenderingOptions
  ) {
    switch (options.format) {
      case 'html':
        return this.combineHtmlComponents(components, pageDefinition, options);
      case 'svg':
        return this.combineSvgComponents(components, pageDefinition, options);
      case 'pdf':
        return this.combinePdfComponents(components, pageDefinition, options);
      case 'pptx':
        return this.combinePptxComponents(components, pageDefinition, options);
      default:
        throw new Error(`Unsupported format: ${options.format}`);
    }
  }

  /**
   * Combine HTML components into page
   */
  private combineHtmlComponents(components: any[], pageDefinition: any, options: RenderingOptions) {
    const pageStyles = this.generatePageStyles(pageDefinition, options);
    const componentHtml = components.map(comp => comp.content).join('\n');
    
    return {
      html: `
        <div class="report-page" style="${pageStyles}">
          ${componentHtml}
        </div>
      `,
      styles: this.mergeStyles(components.map(comp => comp.styles)),
      scripts: this.mergeScripts(components),
      metadata: {
        componentCount: components.length,
        totalSize: componentHtml.length,
      },
    };
  }

  /**
   * Combine SVG components into page
   */
  private combineSvgComponents(components: any[], pageDefinition: any, options: RenderingOptions) {
    const { width, height } = options.dimensions || { width: 1920, height: 1080 };
    const componentSvg = components.map(comp => comp.content).join('\n');
    
    return {
      svg: `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            ${this.generateSvgDefs(components)}
          </defs>
          ${componentSvg}
        </svg>
      `,
      metadata: {
        dimensions: { width, height },
        componentCount: components.length,
      },
    };
  }

  /**
   * Combine PDF components
   */
  private combinePdfComponents(components: any[], pageDefinition: any, options: RenderingOptions) {
    return {
      pageLayout: {
        size: options.dimensions || { width: 595.28, height: 841.89 }, // A4 in points
        margins: { top: 50, right: 50, bottom: 50, left: 50 },
        background: pageDefinition.pageSettings?.background,
      },
      elements: components.map(comp => comp.content),
      metadata: {
        componentCount: components.length,
        format: 'pdf',
      },
    };
  }

  /**
   * Combine PPTX components
   */
  private combinePptxComponents(components: any[], pageDefinition: any, options: RenderingOptions) {
    return {
      slide: {
        layout: pageDefinition.layout.type,
        background: pageDefinition.pageSettings?.background,
        elements: components.map(comp => comp.content),
      },
      metadata: {
        componentCount: components.length,
        format: 'pptx',
      },
    };
  }

  // Helper methods

  private generateCacheKey(reportId: string, version: number, options: RenderingOptions): string {
    const keyData = {
      reportId,
      version,
      format: options.format,
      quality: options.quality,
      dimensions: options.dimensions,
      includePages: options.includePages?.sort(),
      theme: options.theme,
    };
    
    return crypto.createHash('md5').update(JSON.stringify(keyData)).digest('hex');
  }

  private async getCachedRender(cacheKey: string): Promise<RenderingResult | null> {
    try {
      const cached = await this.renderingCacheModel.findOne({
        cacheKey,
        expiresAt: { $gt: new Date() }
      });

      if (cached) {
        return {
          reportId: cached.reportId,
          format: cached.format,
          pages: cached.renderedContent.pages.map(page => ({
            ...page,
            metadata: (page as any).metadata || {}
          })),
          totalSize: cached.renderedContent.metadata.totalSize,
          renderTime: cached.renderedContent.metadata.renderTime,
          cacheHit: true,
        };
      }
      return null;
    } catch (error) {
      this.logger.warn('Failed to get cached render:', error);
      return null;
    }
  }

  private async cacheRenderResult(
    cacheKey: string,
    reportId: string,
    version: number,
    options: RenderingOptions,
    result: RenderingResult
  ) {
    try {
      const contentHash = crypto.createHash('md5').update(JSON.stringify(result.pages)).digest('hex');
      
      await this.renderingCacheModel.create({
        reportId,
        version,
        format: options.format,
        renderingConfig: {
          quality: options.quality || 100,
          dimensions: options.dimensions,
          options: {
            includePages: options.includePages,
            theme: options.theme,
            responsive: options.responsive,
            optimize: options.optimize,
          },
        },
        cacheKey,
        renderedContent: {
          pages: result.pages,
          metadata: {
            totalPages: result.pages.length,
            totalSize: result.totalSize,
            renderTime: result.renderTime,
            dependencies: this.extractAllDependencies(result.pages),
          },
        },
        contentHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    } catch (error) {
      this.logger.warn('Failed to cache render result:', error);
    }
  }

  private interpolateTemplate(template: string, props: Record<string, any>): string {
    let result = template;
    
    Object.entries(props).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(placeholder, String(value));
    });
    
    return result;
  }

  private htmlToSvg(html: string, props: Record<string, any>, position: any): string {
    // Simplified HTML to SVG conversion
    // In a real implementation, this would be much more sophisticated
    const interpolated = this.interpolateTemplate(html, props);
    
    return `
      <foreignObject width="${position.width}" height="${position.height}">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${interpolated}
        </div>
      </foreignObject>
    `;
  }

  private mapComponentTypeToPptx(componentType: string): string {
    const mapping: Record<string, string> = {
      'text': 'textbox',
      'image': 'image',
      'chart': 'chart',
      'table': 'table',
      'shape': 'shape',
    };
    
    return mapping[componentType] || 'textbox';
  }

  private pixelsToPoints(pixels: number): number {
    return pixels * 0.75; // Approximate conversion
  }

  private generatePageStyles(pageDefinition: any, options: RenderingOptions): string {
    const styles = [];
    
    if (options.dimensions) {
      styles.push(`width: ${options.dimensions.width}px`);
      styles.push(`height: ${options.dimensions.height}px`);
    }
    
    styles.push('position: relative');
    styles.push('overflow: hidden');
    
    if (pageDefinition.pageSettings?.background?.color) {
      styles.push(`background-color: ${pageDefinition.pageSettings.background.color}`);
    }
    
    return styles.join('; ');
  }

  private mergeStyles(stylesList: any[]): Record<string, any> {
    return stylesList.reduce((merged, styles) => ({ ...merged, ...styles }), {});
  }

  private mergeScripts(components: any[]): string[] {
    const scripts = new Set<string>();
    components.forEach(comp => {
      (comp.scripts || []).forEach((script: string) => scripts.add(script));
    });
    return Array.from(scripts);
  }

  private generateSvgDefs(components: any[]): string {
    // Generate SVG definitions (gradients, patterns, etc.)
    return '';
  }

  private extractAssetUrls(components: any[]): string[] {
    const urls = new Set<string>();
    
    components.forEach(comp => {
      (comp.dependencies || []).forEach((dep: string) => {
        if (dep.startsWith('http') || dep.startsWith('/assets/')) {
          urls.add(dep);
        }
      });
    });
    
    return Array.from(urls);
  }

  private extractAllDependencies(pages: any[]): string[] {
    const deps = new Set<string>();
    
    pages.forEach(page => {
      (page.assets || []).forEach((asset: string) => deps.add(asset));
    });
    
    return Array.from(deps);
  }
}