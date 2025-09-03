// Google Fonts service for dynamic font loading and management

interface GoogleFont {
  family: string;
  variants: string[];
  subsets: string[];
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  popularity?: number;
}

// Curated list of popular Google Fonts for design tools
export const POPULAR_GOOGLE_FONTS: GoogleFont[] = [
  { family: 'Inter', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 1 },
  { family: 'Roboto', variants: ['100', '300', '400', '500', '700', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 2 },
  { family: 'Open Sans', variants: ['300', '400', '500', '600', '700', '800'], subsets: ['latin'], category: 'sans-serif', popularity: 3 },
  { family: 'Montserrat', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 4 },
  { family: 'Lato', variants: ['100', '300', '400', '700', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 5 },
  { family: 'Poppins', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 6 },
  { family: 'Source Sans Pro', variants: ['200', '300', '400', '600', '700', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 7 },
  { family: 'Oswald', variants: ['200', '300', '400', '500', '600', '700'], subsets: ['latin'], category: 'sans-serif', popularity: 8 },
  { family: 'Raleway', variants: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 9 },
  { family: 'Nunito', variants: ['200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'sans-serif', popularity: 10 },
  
  // Serif fonts
  { family: 'Playfair Display', variants: ['400', '500', '600', '700', '800', '900'], subsets: ['latin'], category: 'serif', popularity: 11 },
  { family: 'Merriweather', variants: ['300', '400', '700', '900'], subsets: ['latin'], category: 'serif', popularity: 12 },
  { family: 'Lora', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'serif', popularity: 13 },
  { family: 'Crimson Text', variants: ['400', '600', '700'], subsets: ['latin'], category: 'serif', popularity: 14 },
  { family: 'PT Serif', variants: ['400', '700'], subsets: ['latin'], category: 'serif', popularity: 15 },
  
  // Display fonts
  { family: 'Dancing Script', variants: ['400', '500', '600', '700'], subsets: ['latin'], category: 'handwriting', popularity: 16 },
  { family: 'Pacifico', variants: ['400'], subsets: ['latin'], category: 'handwriting', popularity: 17 },
  { family: 'Lobster', variants: ['400'], subsets: ['latin'], category: 'display', popularity: 18 },
  { family: 'Bebas Neue', variants: ['400'], subsets: ['latin'], category: 'display', popularity: 19 },
  { family: 'Righteous', variants: ['400'], subsets: ['latin'], category: 'display', popularity: 20 },
  
  // Monospace
  { family: 'Fira Code', variants: ['300', '400', '500', '600', '700'], subsets: ['latin'], category: 'monospace', popularity: 21 },
  { family: 'JetBrains Mono', variants: ['100', '200', '300', '400', '500', '600', '700', '800'], subsets: ['latin'], category: 'monospace', popularity: 22 },
  { family: 'Source Code Pro', variants: ['200', '300', '400', '500', '600', '700', '900'], subsets: ['latin'], category: 'monospace', popularity: 23 },
];

class GoogleFontsService {
  private loadedFonts = new Set<string>();
  private pendingLoads = new Map<string, Promise<void>>();
  private fontLoadTimeout = 10000; // 10 seconds timeout

  /**
   * Load a Google Font dynamically
   */
  async loadFont(fontFamily: string, weights: string[] = ['400']): Promise<void> {
    const fontKey = `${fontFamily}-${weights.join(',')}`;
    
    // Return existing promise if font is already being loaded
    if (this.pendingLoads.has(fontKey)) {
      return this.pendingLoads.get(fontKey)!;
    }

    // Return immediately if font is already loaded
    if (this.loadedFonts.has(fontKey)) {
      return Promise.resolve();
    }

    const loadPromise = this.internalLoadFont(fontFamily, weights, fontKey);
    this.pendingLoads.set(fontKey, loadPromise);
    
    try {
      await loadPromise;
      this.loadedFonts.add(fontKey);
    } catch (error) {
      console.warn(`Failed to load font ${fontFamily}:`, error);
    } finally {
      this.pendingLoads.delete(fontKey);
    }
  }

  private async internalLoadFont(fontFamily: string, weights: string[], fontKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if font link already exists
      const existingLink = document.querySelector(
        `link[href*="fonts.googleapis.com"][href*="${fontFamily.replace(/\s+/g, '+')}"]`
      );

      if (existingLink) {
        resolve();
        return;
      }

      // Create the font URL with weights
      const weightString = weights.length > 1 ? `:wght@${weights.join(';')}` : weights[0] !== '400' ? `:wght@${weights[0]}` : '';
      const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}${weightString}&display=swap`;

      // Create and append the link element
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fontUrl;
      
      // Set up load handlers
      const timeout = setTimeout(() => {
        reject(new Error(`Font load timeout: ${fontFamily}`));
      }, this.fontLoadTimeout);

      link.onload = () => {
        clearTimeout(timeout);
        // Wait for the font to be actually available
        this.waitForFontLoad(fontFamily).then(resolve).catch(reject);
      };

      link.onerror = () => {
        clearTimeout(timeout);
        reject(new Error(`Failed to load font: ${fontFamily}`));
      };

      document.head.appendChild(link);
    });
  }

  /**
   * Wait for the font to be available in the document
   */
  private async waitForFontLoad(fontFamily: string): Promise<void> {
    if (!('fonts' in document)) {
      // Fallback for browsers without FontFace API
      return new Promise(resolve => setTimeout(resolve, 100));
    }

    try {
      await document.fonts.load(`16px "${fontFamily}"`);
      await document.fonts.ready;
    } catch (error) {
      console.warn(`Font loading check failed for ${fontFamily}:`, error);
    }
  }

  /**
   * Preload multiple fonts for better performance
   */
  async preloadFonts(fonts: Array<{ family: string; weights?: string[] }>): Promise<void> {
    const loadPromises = fonts.map(({ family, weights = ['400'] }) => 
      this.loadFont(family, weights)
    );
    
    await Promise.allSettled(loadPromises);
  }

  /**
   * Check if a font is loaded
   */
  isFontLoaded(fontFamily: string, weights: string[] = ['400']): boolean {
    const fontKey = `${fontFamily}-${weights.join(',')}`;
    return this.loadedFonts.has(fontKey);
  }

  /**
   * Get font suggestions based on category
   */
  getFontsByCategory(category: GoogleFont['category']): GoogleFont[] {
    return POPULAR_GOOGLE_FONTS
      .filter(font => font.category === category)
      .sort((a, b) => (a.popularity || 999) - (b.popularity || 999));
  }

  /**
   * Get font suggestions for pairing
   */
  getFontPairings(primaryFont: string): GoogleFont[] {
    const primary = POPULAR_GOOGLE_FONTS.find(f => f.family === primaryFont);
    if (!primary) return [];

    // Simple pairing logic: suggest fonts from different categories
    const complementaryCategories: Record<GoogleFont['category'], GoogleFont['category'][]> = {
      'sans-serif': ['serif', 'display'],
      'serif': ['sans-serif', 'display'],
      'display': ['sans-serif', 'serif'],
      'handwriting': ['sans-serif', 'serif'],
      'monospace': ['sans-serif', 'serif']
    };

    const suggestedCategories = complementaryCategories[primary.category] || ['sans-serif'];
    
    return POPULAR_GOOGLE_FONTS
      .filter(font => suggestedCategories.includes(font.category) && font.family !== primaryFont)
      .slice(0, 6)
      .sort((a, b) => (a.popularity || 999) - (b.popularity || 999));
  }

  /**
   * Search fonts by name
   */
  searchFonts(query: string): GoogleFont[] {
    const lowercaseQuery = query.toLowerCase();
    return POPULAR_GOOGLE_FONTS.filter(font => 
      font.family.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get CSS font-family string with fallbacks
   */
  getFontFamilyString(fontFamily: string): string {
    const font = POPULAR_GOOGLE_FONTS.find(f => f.family === fontFamily);
    if (!font) return fontFamily;

    const fallbacks: Record<GoogleFont['category'], string> = {
      'sans-serif': 'Arial, sans-serif',
      'serif': 'Times New Roman, serif',
      'display': 'Arial Black, sans-serif',
      'handwriting': 'cursive',
      'monospace': 'Consolas, monospace'
    };

    return `"${fontFamily}", ${fallbacks[font.category]}`;
  }
}

// Export singleton instance
export const googleFontsService = new GoogleFontsService();

// Helper function to preload essential fonts
export const preloadEssentialFonts = async (): Promise<void> => {
  const essentialFonts = [
    { family: 'Inter', weights: ['400', '500', '600', '700'] },
    { family: 'Montserrat', weights: ['400', '500', '600', '700', '800'] },
    { family: 'Playfair Display', weights: ['400', '600', '700'] },
    { family: 'Dancing Script', weights: ['400', '700'] }
  ];

  await googleFontsService.preloadFonts(essentialFonts);
};