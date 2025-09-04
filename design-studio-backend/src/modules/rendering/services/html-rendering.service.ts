import { Injectable, Logger } from '@nestjs/common';
import { RenderOptionsDto } from '../dto/render-request.dto';
import { ComponentDefinition } from '../../../database/mongodb/schemas';

@Injectable()
export class HtmlRenderingService {
  private readonly logger = new Logger(HtmlRenderingService.name);

  async renderComponent(
    componentDefinition: ComponentDefinition,
    props: Record<string, any>,
    dimensions: { width: number; height: number },
    options?: RenderOptionsDto,
  ): Promise<string> {
    try {
      this.logger.debug(`Rendering component ${componentDefinition.id} as HTML`);

      // Start with base HTML template
      let html = componentDefinition.template.html || '<div>Component template not available</div>';

      // Apply dimensions
      const containerStyles = `width: ${dimensions.width}px; height: ${dimensions.height}px;`;

      // Merge component styles with any theme overrides
      const styles = this.buildStyles(componentDefinition.template.styles, options?.theme);

      // Replace template variables with actual props
      html = this.interpolateTemplate(html, props);

      // Wrap in container with styles
      const renderedHtml = `
        <div style="${containerStyles}" class="component-container" data-component-id="${componentDefinition.id}">
          <style>${styles}</style>
          ${html}
        </div>
      `;

      // Add interactivity if requested
      if (options?.includeInteractivity && componentDefinition.interactions) {
        return this.addInteractivity(renderedHtml, componentDefinition.interactions, props);
      }

      return renderedHtml;
    } catch (error) {
      this.logger.error(`Failed to render component ${componentDefinition.id} as HTML:`, error);
      throw new Error(`HTML rendering failed: ${error.message}`);
    }
  }

  async renderPage(
    pageComponents: Array<{
      component: ComponentDefinition;
      instance: {
        x: number;
        y: number;
        width: number;
        height: number;
        props: Record<string, any>;
      };
    }>,
    pageSettings: any,
    options?: RenderOptionsDto,
  ): Promise<string> {
    try {
      this.logger.debug(`Rendering page with ${pageComponents.length} components as HTML`);

      const componentHtmlPromises = pageComponents.map(async ({ component, instance }) => {
        const componentHtml = await this.renderComponent(
          component,
          instance.props,
          { width: instance.width, height: instance.height },
          options,
        );

        // Position the component absolutely
        const positionStyles = `
          position: absolute;
          left: ${instance.x}px;
          top: ${instance.y}px;
          z-index: ${instance.props.zIndex || 1};
        `;

        return `<div style="${positionStyles}">${componentHtml}</div>`;
      });

      const componentHtmls = await Promise.all(componentHtmlPromises);

      // Build page container styles
      const pageStyles = this.buildPageStyles(pageSettings, options);

      const pageHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Report Page</title>
          <style>
            ${this.getBaseStyles()}
            ${pageStyles}
          </style>
        </head>
        <body>
          <div class="page-container">
            ${componentHtmls.join('\n')}
          </div>
          ${options?.includeInteractivity ? this.getInteractivityScripts() : ''}
        </body>
        </html>
      `;

      return pageHtml;
    } catch (error) {
      this.logger.error('Failed to render page as HTML:', error);
      throw new Error(`Page HTML rendering failed: ${error.message}`);
    }
  }

  async renderReport(
    pages: Array<{
      pageComponents: Array<{
        component: ComponentDefinition;
        instance: any;
      }>;
      pageSettings: any;
      pageInfo: { title: string; order: number };
    }>,
    reportInfo: { title: string; author: string },
    options?: RenderOptionsDto,
  ): Promise<string> {
    try {
      this.logger.debug(`Rendering report with ${pages.length} pages as HTML`);

      const pageHtmlPromises = pages.map(async (page, index) => {
        const pageHtml = await this.renderPage(
          page.pageComponents,
          page.pageSettings,
          options,
        );

        // Extract body content for multi-page report
        const bodyContent = this.extractBodyContent(pageHtml);

        return `
          <div class="report-page" data-page="${index + 1}" data-page-title="${page.pageInfo.title}">
            ${bodyContent}
          </div>
          ${index < pages.length - 1 ? '<div class="page-break"></div>' : ''}
        `;
      });

      const pageHtmls = await Promise.all(pageHtmlPromises);

      const reportHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${reportInfo.title}</title>
          <style>
            ${this.getBaseStyles()}
            ${this.getReportStyles()}
            .page-break { page-break-after: always; }
            @media print {
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <header class="report-header">
              <h1>${reportInfo.title}</h1>
              <p>By ${reportInfo.author}</p>
            </header>
            <main class="report-content">
              ${pageHtmls.join('\n')}
            </main>
          </div>
          ${options?.includeInteractivity ? this.getInteractivityScripts() : ''}
        </body>
        </html>
      `;

      return reportHtml;
    } catch (error) {
      this.logger.error('Failed to render report as HTML:', error);
      throw new Error(`Report HTML rendering failed: ${error.message}`);
    }
  }

  private interpolateTemplate(template: string, props: Record<string, any>): string {
    let interpolated = template;

    // Replace {{prop}} with actual values
    Object.keys(props).forEach(key => {
      const value = props[key];
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      interpolated = interpolated.replace(regex, String(value));
    });

    // Handle conditional rendering {{#if prop}}...{{/if}}
    interpolated = interpolated.replace(/\{\{#if\s+(\w+)\}\}(.*?)\{\{\/if\}\}/gs, (match, prop, content) => {
      return props[prop] ? content : '';
    });

    // Handle loops {{#each prop}}...{{/each}}
    interpolated = interpolated.replace(/\{\{#each\s+(\w+)\}\}(.*?)\{\{\/each\}\}/gs, (match, prop, content) => {
      const items = props[prop];
      if (Array.isArray(items)) {
        return items.map(item => {
          let itemContent = content;
          Object.keys(item).forEach(key => {
            itemContent = itemContent.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(item[key]));
          });
          return itemContent;
        }).join('');
      }
      return '';
    });

    return interpolated;
  }

  private buildStyles(componentStyles: Record<string, any>, theme?: Record<string, any>): string {
    let css = '';

    Object.keys(componentStyles).forEach(selector => {
      let styles = componentStyles[selector];

      // Apply theme overrides
      if (theme) {
        if (theme.primaryColor && styles.color) {
          styles = { ...styles, color: theme.primaryColor };
        }
        if (theme.fontFamily && styles.fontFamily) {
          styles = { ...styles, fontFamily: theme.fontFamily };
        }
      }

      css += `${selector} {\n`;
      Object.keys(styles).forEach(property => {
        const cssProperty = this.camelToCssProperty(property);
        css += `  ${cssProperty}: ${styles[property]};\n`;
      });
      css += '}\n';
    });

    return css;
  }

  private buildPageStyles(pageSettings: any, options?: RenderOptionsDto): string {
    let css = '';

    if (pageSettings?.background) {
      if (pageSettings.background.color) {
        css += `.page-container { background-color: ${pageSettings.background.color}; }\n`;
      }
      if (pageSettings.background.image) {
        css += `.page-container { background-image: url('${pageSettings.background.image}'); }\n`;
      }
      if (pageSettings.background.gradient) {
        css += `.page-container { background: ${pageSettings.background.gradient}; }\n`;
      }
    }

    if (pageSettings?.padding) {
      const { top, right, bottom, left } = pageSettings.padding;
      css += `.page-container { padding: ${top}px ${right}px ${bottom}px ${left}px; }\n`;
    }

    return css;
  }

  private addInteractivity(html: string, interactions: any, props: Record<string, any>): string {
    // Add data attributes for JavaScript interaction handlers
    let interactiveHtml = html;

    if (interactions.events) {
      interactions.events.forEach((event: string) => {
        if (interactions.actions[event]) {
          interactiveHtml = interactiveHtml.replace(
            '<div style=',
            `<div data-event-${event}="${interactions.actions[event]}" style=`
          );
        }
      });
    }

    return interactiveHtml;
  }

  private extractBodyContent(html: string): string {
    const match = html.match(/<body[^>]*>(.*)<\/body>/s);
    return match ? match[1] : html;
  }

  private camelToCssProperty(camelCase: string): string {
    return camelCase.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  private getBaseStyles(): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        color: #333;
      }
      
      .component-container {
        position: relative;
        overflow: hidden;
      }
      
      .page-container {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: 100vh;
      }
    `;
  }

  private getReportStyles(): string {
    return `
      .report-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      
      .report-header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 1px solid #eee;
      }
      
      .report-header h1 {
        font-size: 2.5em;
        font-weight: bold;
        margin-bottom: 10px;
      }
      
      .report-header p {
        color: #666;
        font-size: 1.1em;
      }
      
      .report-page {
        margin-bottom: 40px;
        position: relative;
      }
      
      @media print {
        .report-container {
          max-width: none;
          margin: 0;
          padding: 0;
        }
      }
    `;
  }

  private getInteractivityScripts(): string {
    return `
      <script>
        // Basic interactivity handler
        document.addEventListener('DOMContentLoaded', function() {
          // Handle click events
          document.querySelectorAll('[data-event-click]').forEach(element => {
            element.style.cursor = 'pointer';
            element.addEventListener('click', function(e) {
              const action = this.getAttribute('data-event-click');
              console.log('Component action:', action, e);
              // Custom action handling can be implemented here
            });
          });
          
          // Handle hover events
          document.querySelectorAll('[data-event-hover]').forEach(element => {
            element.addEventListener('mouseenter', function(e) {
              const action = this.getAttribute('data-event-hover');
              console.log('Component hover:', action, e);
              this.style.opacity = '0.8';
            });
            
            element.addEventListener('mouseleave', function(e) {
              this.style.opacity = '1';
            });
          });
        });
      </script>
    `;
  }
}