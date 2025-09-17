// Text Template Types - Adapted from Design Studio Clone
// Based on: /design-studio-clone/src/components/panels/TextPanel.tsx

export interface TextTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  style: TextStyle;
}

export interface TextStyle {
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  textDecoration?: string;
}

export interface TextTemplateCategory {
  id: string;
  name: string;
  templates: TextTemplate[];
}

// Template search and filtering
export interface TextTemplateSearchResult {
  templates: TextTemplate[];
  hasMore: boolean;
  totalCount: number;
}

export interface TextTemplateSearchParams {
  query?: string;
  category?: string;
  page?: number;
  perPage?: number;
}

// Professional text templates matching Design Studio
export const DEFAULT_TEXT_TEMPLATES: TextTemplate[] = [
  {
    id: 'header-1',
    name: 'Create header',
    category: 'Headers',
    preview: 'Header Text',
    style: {
      fontSize: 48,
      fontFamily: 'Montserrat',
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: -0.5,
      textTransform: 'none'
    }
  },
  {
    id: 'subheader-1',
    name: 'Create sub header',
    category: 'Headers',
    preview: 'Subheader Text',
    style: {
      fontSize: 32,
      fontFamily: 'Montserrat',
      fontWeight: '600',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.3,
      letterSpacing: -0.3,
      textTransform: 'none'
    }
  },
  {
    id: 'body-1',
    name: 'Create body text',
    category: 'Body',
    preview: 'Body text goes here',
    style: {
      fontSize: 16,
      fontFamily: 'Inter',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none'
    }
  },
  {
    id: 'adventure-1',
    name: 'Adventure',
    category: 'Stylized',
    preview: 'ADVENTURE',
    style: {
      fontSize: 36,
      fontFamily: 'Oswald',
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.1,
      letterSpacing: 2,
      textTransform: 'uppercase'
    }
  },
  {
    id: 'congratulations-1',
    name: 'Congratulations',
    category: 'Stylized',
    preview: 'Congratulations!',
    style: {
      fontSize: 28,
      fontFamily: 'Dancing Script',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.4,
      letterSpacing: 0,
      textTransform: 'none'
    }
  },
  {
    id: 'elegant-1',
    name: 'Elegant',
    category: 'Stylized',
    preview: 'Elegant',
    style: {
      fontSize: 32,
      fontFamily: 'Playfair Display',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 1,
      textTransform: 'none'
    }
  },
  {
    id: 'quote-1',
    name: 'Quote text',
    category: 'Quotes',
    preview: '"Inspiring quote"',
    style: {
      fontSize: 24,
      fontFamily: 'Georgia',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none'
    }
  },
  {
    id: 'modern-1',
    name: 'Modern',
    category: 'Modern',
    preview: 'MODERN',
    style: {
      fontSize: 40,
      fontFamily: 'Roboto',
      fontWeight: '900',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.0,
      letterSpacing: 3,
      textTransform: 'uppercase'
    }
  }
];

export const TEMPLATE_CATEGORIES = [
  'Headers',
  'Body', 
  'Stylized',
  'Quotes',
  'Modern'
] as const;

export type TemplateCategory = typeof TEMPLATE_CATEGORIES[number];