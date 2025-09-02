import { Injectable, BadRequestException, InternalServerErrorException, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FontQueryDto } from './dto/font-query.dto';
import { FontResponseDto, FontListResponseDto, FontCategoriesResponseDto, FontVariantDto } from './dto/font-response.dto';

@Injectable()
export class FontsService implements OnModuleInit {
  private readonly googleFontsApiUrl = 'https://www.googleapis.com/webfonts/v1/webfonts';
  private readonly apiKey: string;
  private readonly popularityMap = new Map<string, number>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKey = this.configService.get<string>('GOOGLE_FONTS_API_KEY');
    if (!this.apiKey) {
      console.warn('GOOGLE_FONTS_API_KEY not configured, using fallback font data');
    }
  }

  async onModuleInit() {
    // Initialize font cache on startup
    await this.updateFontsCache();
    await this.initializePopularityMap();
  }

  async getAllFonts(page: number = 1, per_page: number = 50): Promise<FontListResponseDto> {
    const cacheKey = 'fonts:all';
    let allFonts = await this.cacheManager.get<FontResponseDto[]>(cacheKey);

    if (!allFonts) {
      allFonts = await this.fetchAndCacheFonts();
    }

    const startIndex = (page - 1) * per_page;
    const endIndex = startIndex + per_page;
    const paginatedFonts = allFonts.slice(startIndex, endIndex);

    return {
      total: allFonts.length,
      page,
      per_page,
      items: paginatedFonts,
    };
  }

  async searchFonts(queryDto: FontQueryDto): Promise<FontListResponseDto> {
    const { family, category, sort, subset } = queryDto;
    
    const cacheKey = `fonts:search:${JSON.stringify(queryDto)}`;
    let cached = await this.cacheManager.get<FontListResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    let allFonts = await this.cacheManager.get<FontResponseDto[]>('fonts:all');
    if (!allFonts) {
      allFonts = await this.fetchAndCacheFonts();
    }

    // Apply filters
    let filteredFonts = allFonts;

    if (family) {
      const searchTerm = family.toLowerCase();
      filteredFonts = filteredFonts.filter(font => 
        font.family.toLowerCase().includes(searchTerm)
      );
    }

    if (category) {
      filteredFonts = filteredFonts.filter(font => font.category === category);
    }

    if (subset && subset.length > 0) {
      filteredFonts = filteredFonts.filter(font => 
        subset.some(s => font.subsets.includes(s))
      );
    }

    // Apply sorting
    if (sort) {
      filteredFonts = this.sortFonts(filteredFonts, sort);
    }

    const result: FontListResponseDto = {
      total: filteredFonts.length,
      page: 1,
      per_page: filteredFonts.length,
      items: filteredFonts,
    };

    // Cache search results for 1 hour
    await this.cacheManager.set(cacheKey, result, 3600000);

    return result;
  }

  async getFontByFamily(family: string, includeVariants: boolean = false): Promise<FontResponseDto> {
    if (!family) {
      throw new BadRequestException('Font family name is required');
    }

    const cacheKey = `fonts:family:${family}:${includeVariants}`;
    let cached = await this.cacheManager.get<FontResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    let allFonts = await this.cacheManager.get<FontResponseDto[]>('fonts:all');
    if (!allFonts) {
      allFonts = await this.fetchAndCacheFonts();
    }

    const font = allFonts.find(f => 
      f.family.toLowerCase() === family.toLowerCase()
    );

    if (!font) {
      throw new BadRequestException('Font family not found');
    }

    if (includeVariants && !font.detailed_variants) {
      font.detailed_variants = await this.getFontVariants(family);
    }

    // Cache for 2 hours
    await this.cacheManager.set(cacheKey, font, 7200000);

    return font;
  }

  async getCategories(): Promise<FontCategoriesResponseDto> {
    const cacheKey = 'fonts:categories';
    let cached = await this.cacheManager.get<FontCategoriesResponseDto>(cacheKey);
    if (cached) {
      return cached;
    }

    let allFonts = await this.cacheManager.get<FontResponseDto[]>('fonts:all');
    if (!allFonts) {
      allFonts = await this.fetchAndCacheFonts();
    }

    const categoryCounts = new Map<string, number>();
    allFonts.forEach(font => {
      const count = categoryCounts.get(font.category) || 0;
      categoryCounts.set(font.category, count + 1);
    });

    const categories = Array.from(categoryCounts.entries()).map(([name, count]) => ({
      name,
      count,
      description: this.getCategoryDescription(name),
    }));

    const result = { categories };

    // Cache for 4 hours
    await this.cacheManager.set(cacheKey, result, 14400000);

    return result;
  }

  async getTrendingFonts(limit: number = 20): Promise<FontResponseDto[]> {
    const cacheKey = `fonts:trending:${limit}`;
    let cached = await this.cacheManager.get<FontResponseDto[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let allFonts = await this.cacheManager.get<FontResponseDto[]>('fonts:all');
    if (!allFonts) {
      allFonts = await this.fetchAndCacheFonts();
    }

    // Calculate trending score based on popularity and recency
    const fontsWithTrending = allFonts.map(font => ({
      ...font,
      trending: this.calculateTrendingScore(font),
    }));

    const trending = fontsWithTrending
      .sort((a, b) => (b.trending || 0) - (a.trending || 0))
      .slice(0, limit);

    // Cache for 30 minutes
    await this.cacheManager.set(cacheKey, trending, 1800000);

    return trending;
  }

  private async fetchAndCacheFonts(): Promise<FontResponseDto[]> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(this.googleFontsApiUrl, {
          params: {
            key: this.apiKey,
            sort: 'popularity',
          },
          timeout: 15000,
        }),
      );

      const fonts: FontResponseDto[] = response.data.items.map((font: any, index: number) => ({
        family: font.family,
        category: font.category,
        variants: font.variants,
        subsets: font.subsets,
        version: font.version,
        lastModified: font.lastModified,
        css_url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}:wght@${font.variants.filter((v: string) => /^\d+$/.test(v)).join(';')}&display=swap`,
        preview_url: `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family)}&text=The%20quick%20brown%20fox%20jumps%20over%20the%20lazy%20dog&display=swap`,
        popularity: index + 1,
      }));

      // Cache for 24 hours
      await this.cacheManager.set('fonts:all', fonts, 86400000);
      
      return fonts;
    } catch (error) {
      console.error('Google Fonts API error:', error.response?.data || error.message);
      
      // Return fallback popular fonts if API fails
      return this.getFallbackFonts();
    }
  }

  private async getFontVariants(family: string): Promise<FontVariantDto[]> {
    try {
      // For now, return basic variants. In a full implementation,
      // you would fetch detailed font files from Google Fonts API
      const response = await firstValueFrom(
        this.httpService.get(`https://fonts.googleapis.com/css2`, {
          params: {
            family: `${family}:wght@300;400;500;600;700`,
            display: 'swap',
          },
          timeout: 10000,
        }),
      );

      // Parse CSS to extract font URLs (simplified)
      const cssText = response.data;
      const variants: FontVariantDto[] = [
        {
          variant: '300',
          weight: 300,
          style: 'normal',
          files: {
            woff2: `https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s+/g, '')}/v1/${family.toLowerCase().replace(/\s+/g, '')}-light.woff2`,
          },
        },
        {
          variant: '400',
          weight: 400,
          style: 'normal',
          files: {
            woff2: `https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s+/g, '')}/v1/${family.toLowerCase().replace(/\s+/g, '')}-regular.woff2`,
          },
        },
        {
          variant: '700',
          weight: 700,
          style: 'normal',
          files: {
            woff2: `https://fonts.gstatic.com/s/${family.toLowerCase().replace(/\s+/g, '')}/v1/${family.toLowerCase().replace(/\s+/g, '')}-bold.woff2`,
          },
        },
      ];

      return variants;
    } catch (error) {
      console.error('Error fetching font variants:', error.message);
      return [];
    }
  }

  private sortFonts(fonts: FontResponseDto[], sortBy: string): FontResponseDto[] {
    switch (sortBy) {
      case 'alpha':
        return fonts.sort((a, b) => a.family.localeCompare(b.family));
      case 'popularity':
        return fonts.sort((a, b) => (a.popularity || 999999) - (b.popularity || 999999));
      case 'trending':
        return fonts.sort((a, b) => (b.trending || 0) - (a.trending || 0));
      case 'date':
        return fonts.sort((a, b) => 
          new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
        );
      default:
        return fonts;
    }
  }

  private calculateTrendingScore(font: FontResponseDto): number {
    const popularityScore = font.popularity ? 1000 - font.popularity : 0;
    const recentnessScore = font.lastModified ? 
      Math.max(0, 100 - Math.floor((Date.now() - new Date(font.lastModified).getTime()) / (1000 * 60 * 60 * 24))) : 0;
    
    return popularityScore + recentnessScore * 2;
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      'serif': 'Classic fonts with small decorative strokes',
      'sans-serif': 'Clean, modern fonts without decorative strokes',
      'display': 'Decorative fonts for headlines and emphasis',
      'handwriting': 'Fonts that mimic handwritten text',
      'monospace': 'Fixed-width fonts for code and technical text',
    };
    return descriptions[category] || 'Font category';
  }

  private async initializePopularityMap(): Promise<void> {
    // Initialize with some popular fonts
    const popularFonts = [
      'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Source Sans Pro',
      'Raleway', 'PT Sans', 'Lora', 'Nunito', 'Poppins'
    ];
    
    popularFonts.forEach((font, index) => {
      this.popularityMap.set(font, index + 1);
    });
  }

  private getFallbackFonts(): FontResponseDto[] {
    return [
      {
        family: 'Roboto',
        category: 'sans-serif',
        variants: ['300', '400', '500', '700'],
        subsets: ['latin', 'latin-ext'],
        css_url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap',
        preview_url: 'https://fonts.googleapis.com/css2?family=Roboto&text=The%20quick%20brown%20fox&display=swap',
        popularity: 1,
      },
      {
        family: 'Open Sans',
        category: 'sans-serif',
        variants: ['300', '400', '600', '700'],
        subsets: ['latin', 'latin-ext'],
        css_url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap',
        preview_url: 'https://fonts.googleapis.com/css2?family=Open+Sans&text=The%20quick%20brown%20fox&display=swap',
        popularity: 2,
      },
      // Add more fallback fonts as needed
    ];
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async updateFontsCache(): Promise<void> {
    console.log('Updating fonts cache...');
    try {
      await this.fetchAndCacheFonts();
      console.log('Fonts cache updated successfully');
    } catch (error) {
      console.error('Failed to update fonts cache:', error.message);
    }
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const cached = await this.cacheManager.get('fonts:all');
      return !!cached;
    } catch {
      return false;
    }
  }
}