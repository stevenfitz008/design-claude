import React, { useState } from 'react';
import { Button, Card, Divider } from '@blueprintjs/core';
import { styled } from 'goober';
import { TextPanel } from '../panels/TextPanel';
import { TextFormatting } from './TextFormatting';
import { FontPicker } from './FontPicker';
import { ColorPicker } from './ColorPicker';
import { TextEffects, DEFAULT_EFFECTS, type TextEffectsState } from './TextEffects';
import { useTextEditor } from '@/hooks/useTextEditor';
import { useCanvasStore } from '@/stores/canvasStore';
import type { TextTemplate } from '../panels/TextPanel';

const DemoContainer = styled('div')`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  padding: 20px;
  background: #1c2127;
  min-height: 100vh;
`;

const DemoSection = styled(Card)`
  background: #2f343c;
  color: #f5f8fa;
  padding: 16px;

  .bp4-card {
    background: #2f343c;
    color: #f5f8fa;
  }
`;

const SectionTitle = styled('h3')`
  color: #48aff0;
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
`;

const PreviewArea = styled('div')`
  background: #1c2127;
  border: 1px solid #495563;
  border-radius: 6px;
  padding: 20px;
  margin: 16px 0;
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const FeatureGrid = styled('div')`
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
`;

const ComponentDemo = styled('div')`
  border: 1px solid #495563;
  border-radius: 4px;
  padding: 16px;
  background: #262b33;
`;

export const TextDemo: React.FC = () => {
  const { createTextFromTemplate, createEmptyText } = useTextEditor();
  const { elements } = useCanvasStore();
  const [selectedFont, setSelectedFont] = useState('Inter');
  const [selectedColor, setSelectedColor] = useState('#48aff0');
  const [effects, setEffects] = useState<TextEffectsState>(DEFAULT_EFFECTS);

  // Handle template selection
  const handleTemplateSelect = async (template: TextTemplate) => {
    try {
      await createTextFromTemplate(template, 100, 100);
      console.log('Text created from template:', template.name);
    } catch (error) {
      console.error('Failed to create text:', error);
    }
  };

  // Handle empty text creation
  const handleCreateEmptyText = async () => {
    try {
      await createEmptyText(150, 150, 'Sample Text');
      console.log('Empty text created');
    } catch (error) {
      console.error('Failed to create empty text:', error);
    }
  };

  const textElements = elements.filter(el => el.type === 'text');

  return (
    <DemoContainer>
      {/* Left Column - Components */}
      <div>
        <DemoSection>
          <SectionTitle>Text Panel (Template Gallery)</SectionTitle>
          <ComponentDemo>
            <TextPanel onTemplateSelect={handleTemplateSelect} />
          </ComponentDemo>
        </DemoSection>

        <DemoSection>
          <SectionTitle>Font Picker</SectionTitle>
          <ComponentDemo>
            <FontPicker
              selectedFont={selectedFont}
              onFontSelect={setSelectedFont}
              showPreview={true}
              maxHeight={300}
            />
          </ComponentDemo>
          <PreviewArea style={{ fontFamily: selectedFont, fontSize: '24px', fontWeight: '600' }}>
            The quick brown fox jumps over the lazy dog
          </PreviewArea>
        </DemoSection>

        <DemoSection>
          <SectionTitle>Color Picker</SectionTitle>
          <ComponentDemo>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>Selected Color:</span>
              <ColorPicker
                color={selectedColor}
                onChange={setSelectedColor}
                showGradients={true}
              />
            </div>
          </ComponentDemo>
          <PreviewArea style={{ color: selectedColor, fontSize: '24px', fontWeight: '600' }}>
            Colored Text Preview
          </PreviewArea>
        </DemoSection>
      </div>

      {/* Right Column - Advanced Features */}
      <div>
        <DemoSection>
          <SectionTitle>Text Effects</SectionTitle>
          <ComponentDemo>
            <TextEffects
              effects={effects}
              onChange={setEffects}
              showPreview={true}
            />
          </ComponentDemo>
        </DemoSection>

        <DemoSection>
          <SectionTitle>Text Formatting Panel</SectionTitle>
          <ComponentDemo>
            <TextFormatting />
          </ComponentDemo>
        </DemoSection>

        <DemoSection>
          <SectionTitle>Canvas Integration</SectionTitle>
          <FeatureGrid>
            <div>
              <Button
                onClick={handleCreateEmptyText}
                intent="primary"
                large
                fill
              >
                Create Empty Text
              </Button>
            </div>
            
            <div>
              <strong>Text Elements on Canvas:</strong> {textElements.length}
            </div>
            
            {textElements.length > 0 && (
              <div>
                <strong>Recent Text Elements:</strong>
                {textElements.slice(-3).map((element, index) => (
                  <div key={element.id} style={{ 
                    fontSize: '12px', 
                    color: '#8a9ba8',
                    padding: '4px 0',
                    borderBottom: index < 2 ? '1px solid #495563' : 'none'
                  }}>
                    "{(element as any).text}" - {(element as any).fontFamily}
                  </div>
                ))}
              </div>
            )}
          </FeatureGrid>
        </DemoSection>

        <DemoSection>
          <SectionTitle>Premium Features</SectionTitle>
          <FeatureGrid>
            <div>
              <strong>✅ Features Implemented:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px', color: '#8a9ba8' }}>
                <li>Template-based text creation</li>
                <li>Google Fonts integration</li>
                <li>Advanced color picker with gradients</li>
                <li>Text effects (shadows, glow, outline)</li>
                <li>Real-time font preview</li>
                <li>Typography controls</li>
                <li>Konva.js canvas integration</li>
                <li>Double-click editing</li>
                <li>Premium UI design</li>
              </ul>
            </div>
            
            <div>
              <strong>🎨 Design Patterns:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', fontSize: '14px', color: '#8a9ba8' }}>
                <li>Professional dark theme</li>
                <li>Smooth micro-interactions</li>
                <li>Consistent spacing & typography</li>
                <li>Accessible color contrasts</li>
                <li>Premium visual hierarchy</li>
                <li>Responsive layouts</li>
              </ul>
            </div>
          </FeatureGrid>
        </DemoSection>
      </div>
    </DemoContainer>
  );
};

TextDemo.displayName = 'TextDemo';