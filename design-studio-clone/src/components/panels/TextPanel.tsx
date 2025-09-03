import React, { useState, useMemo } from 'react';
import { observer } from "mobx-react-lite";
// we need observer to update component automatically on any store changes  
import { Tab, Tabs, Spinner } from '@blueprintjs/core';
import { styled } from 'goober';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

// Text template types
export interface TextTemplate {
  id: string;
  name: string;
  category: string;
  preview: string;
  style: {
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: 'left' | 'center' | 'right' | 'justify';
    lineHeight: number;
    letterSpacing: number;
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    textDecoration?: string;
  };
}

// Pre-designed text templates matching the reference image
const TEXT_TEMPLATES: TextTemplate[] = [
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
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.2,
      letterSpacing: 0.5,
      textTransform: 'none'
    }
  },
  {
    id: 'marketing-1',
    name: 'Marketing Proposal',
    category: 'Business',
    preview: 'MARKETING\nPROPOSAL',
    style: {
      fontSize: 24,
      fontFamily: 'Montserrat',
      fontWeight: '800',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.0,
      letterSpacing: 1,
      textTransform: 'uppercase'
    }
  },
  {
    id: 'operations-1',
    name: 'Operations Manager',
    category: 'Business',
    preview: 'OPERATIONS\nMANAGER',
    style: {
      fontSize: 20,
      fontFamily: 'Inter',
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.1,
      letterSpacing: 0.8,
      textTransform: 'uppercase'
    }
  },
  {
    id: 'sale-1',
    name: 'End of Season Sale',
    category: 'Promotional',
    preview: 'END OF SEASON\nSALE',
    style: {
      fontSize: 36,
      fontFamily: 'Oswald',
      fontWeight: '900',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.0,
      letterSpacing: 1.5,
      textTransform: 'uppercase'
    }
  },
  {
    id: 'minimalism-1',
    name: 'The Future of Design Minimalism',
    category: 'Editorial',
    preview: 'The Future of Design\nMINIMALISM',
    style: {
      fontSize: 22,
      fontFamily: 'Inter',
      fontWeight: '500',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.2,
      letterSpacing: 0.3,
      textTransform: 'none'
    }
  },
  {
    id: 'invitation-1',
    name: "You're Invited",
    category: 'Events',
    preview: "You're\nInvited",
    style: {
      fontSize: 32,
      fontFamily: 'Playfair Display',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'center',
      lineHeight: 1.1,
      letterSpacing: 0.8,
      textTransform: 'none'
    }
  },
  {
    id: 'price-list-1',
    name: 'Price List',
    category: 'Business',
    preview: 'PRICE LIST:\nPRICING PACKAGE\nMarketing Package\nAdvertising Package',
    style: {
      fontSize: 14,
      fontFamily: 'Inter',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.4,
      letterSpacing: 0,
      textTransform: 'none'
    }
  },
  {
    id: 'best-way-1',
    name: 'The Best Way To Get Started',
    category: 'Motivational',
    preview: '"The Best Way To\nGet Started Is To\nQuit Talking And\nBegin Doing."\n\n- Walt Disney',
    style: {
      fontSize: 16,
      fontFamily: 'Merriweather',
      fontWeight: '400',
      color: '#ffffff',
      textAlign: 'left',
      lineHeight: 1.5,
      letterSpacing: 0,
      textTransform: 'none'
    }
  }
];

// Extended template generator for infinite scrolling
const generateMoreTemplates = (page: number, existingTemplates: TextTemplate[]): TextTemplate[] => {
  const baseTemplates = TEXT_TEMPLATES;
  const categories = ['Headers', 'Body', 'Stylized', 'Business', 'Promotional', 'Editorial', 'Events', 'Motivational'];
  const fonts = ['Montserrat', 'Inter', 'Oswald', 'Dancing Script', 'Playfair Display', 'Merriweather', 'Roboto', 'Lato', 'Open Sans', 'Source Sans Pro'];
  const colors = ['#ffffff', '#000000', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6c5ce7', '#a29bfe'];
  const newTemplates: TextTemplate[] = [];

  for (let i = 0; i < 12; i++) {
    const templateIndex = (page - 1) * 12 + i;
    const baseTemplate = baseTemplates[templateIndex % baseTemplates.length];
    const font = fonts[templateIndex % fonts.length];
    const color = colors[templateIndex % colors.length];
    const category = categories[templateIndex % categories.length];

    newTemplates.push({
      ...baseTemplate,
      id: `generated-${templateIndex}-${page}`,
      name: `${category} Style ${templateIndex + 1}`,
      category: category,
      style: {
        ...baseTemplate.style,
        fontFamily: font,
        color: color,
        fontSize: baseTemplate.style.fontSize + (templateIndex % 3) * 4,
      }
    });
  }

  return newTemplates;
};

const PanelContainer = styled('div')`
  height: 100%;
  background: #2f343c;
  color: #f5f8fa;
  display: flex;
  flex-direction: column;
`;

const TabsContainer = styled('div')`
  .bp4-tabs {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .bp4-tab-list {
    background: #2f343c;
    border-bottom: 1px solid #495563;
    padding: 0 16px;
    margin: 0;
  }

  .bp4-tab {
    color: #8a9ba8;
    font-size: 14px;
    font-weight: 500;
    padding: 12px 16px;
    border-radius: 0;
    
    &[aria-selected="true"] {
      color: #48aff0;
      border-bottom: 2px solid #48aff0;
      background: transparent;
    }
    
    &:hover {
      color: #bfccd6;
      background: rgba(72, 175, 240, 0.1);
    }
  }

  .bp4-tab-panel {
    flex: 1;
    padding: 0;
    overflow: hidden;
  }
`;

const TemplateGrid = styled('div')`
  padding: 16px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  overflow-y: auto;
  height: 100%;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #2f343c;
  }

  &::-webkit-scrollbar-thumb {
    background: #495563;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #5c6b77;
  }
`;

const TemplateCard = styled('div')`
  background: #1c2127;
  border: 1px solid #495563;
  border-radius: 8px;
  padding: 16px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  text-align: center;

  &:hover {
    border-color: #48aff0;
    background: #262b33;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  }
`;

const TemplatePreview = styled('div')<{ template: TextTemplate }>`
  font-family: ${props => props.template.style.fontFamily};
  font-size: ${props => Math.min(props.template.style.fontSize * 0.3, 14)}px;
  font-weight: ${props => props.template.style.fontWeight};
  color: #f5f8fa;
  line-height: ${props => props.template.style.lineHeight};
  letter-spacing: ${props => props.template.style.letterSpacing}px;
  text-transform: ${props => props.template.style.textTransform || 'none'};
  text-align: ${props => props.template.style.textAlign};
  white-space: pre-line;
  margin-bottom: 8px;
  opacity: 0.9;
  overflow: hidden;
  max-height: 60px;
`;

const TemplateName = styled('div')`
  font-size: 12px;
  font-weight: 500;
  color: #8a9ba8;
  margin-top: auto;
  opacity: 0.8;
`;

const LoadingIndicator = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #8a9ba8;
  font-size: 14px;
  gap: 10px;

  .bp4-spinner {
    .bp4-spinner-svg-container {
      .bp4-spinner-track {
        stroke: #495563;
      }
      .bp4-spinner-head {
        stroke: #48aff0;
      }
    }
  }
`;

const MyFontsPanel = styled('div')`
  padding: 16px;
  color: #8a9ba8;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
`;

interface TextPanelProps {
  onTemplateSelect?: (template: TextTemplate) => void;
}

type TextPanelTab = 'text' | 'my-fonts';

export const TextPanel: React.FC<TextPanelProps> = observer(({ onTemplateSelect }) => {
  const [activeTab, setActiveTab] = useState<TextPanelTab>('text');

  // Initialize infinite scroll for templates
  const { 
    items: templates, 
    loading, 
    hasMore, 
    loadingRef 
  } = useInfiniteScroll({
    initialItems: TEXT_TEMPLATES,
    itemsPerPage: 12,
    generateItems: generateMoreTemplates,
    hasMore: true
  });

  const handleTemplateClick = (template: TextTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    }
  };

  const handleDragStart = (e: React.DragEvent, template: TextTemplate) => {
    const dragData = {
      type: 'text',
      text: template.preview,
      fontSize: template.style.fontSize,
      fontFamily: template.style.fontFamily,
      fontWeight: template.style.fontWeight,
      fontStyle: template.style.fontStyle,
      color: template.style.color,
      textAlign: template.style.textAlign,
      verticalAlign: 'top',
      lineHeight: template.style.lineHeight,
      letterSpacing: template.style.letterSpacing,
      textDecoration: template.style.textDecoration || 'none'
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <PanelContainer>
      <TabsContainer>
        <Tabs
          id="text-panel-tabs"
          selectedTabId={activeTab}
          onChange={(tabId: TextPanelTab) => setActiveTab(tabId)}
          animate={false}
        >
          <Tab
            id="text"
            title="Text"
            panel={
              <TemplateGrid>
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    draggable={true}
                    onClick={() => handleTemplateClick(template)}
                    onDragStart={(e) => handleDragStart(e, template)}
                  >
                    <TemplatePreview template={template}>
                      {template.preview}
                    </TemplatePreview>
                    <TemplateName>{template.name}</TemplateName>
                  </TemplateCard>
                ))}
                {hasMore && (
                  <div
                    ref={loadingRef}
                    style={{ gridColumn: '1 / -1' }}
                  >
                    {loading && (
                      <LoadingIndicator>
                        <Spinner size={20} />
                        Loading more templates...
                      </LoadingIndicator>
                    )}
                  </div>
                )}
              </TemplateGrid>
            }
          />
          <Tab
            id="my-fonts"
            title="My fonts"
            panel={
              <MyFontsPanel>
                <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>
                  Aa
                </div>
                <div style={{ fontSize: '16px', fontWeight: 500, marginBottom: '8px' }}>
                  Your Custom Fonts
                </div>
                <div style={{ fontSize: '14px', lineHeight: 1.4, maxWidth: '250px' }}>
                  Upload and manage your custom font files for use in designs
                </div>
              </MyFontsPanel>
            }
          />
        </Tabs>
      </TabsContainer>
    </PanelContainer>
  );
});

TextPanel.displayName = 'TextPanel';