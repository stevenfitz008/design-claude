import React, { useState } from 'react';
import { Button, FormGroup, InputGroup, HTMLSelect, NumericInput, TextArea, Card, Spinner, Alert } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

// AI Image styles/models
const AI_STYLES = [
  { value: 'realistic', label: 'Realistic', description: 'Photorealistic images' },
  { value: 'artistic', label: 'Artistic', description: 'Painterly and artistic style' },
  { value: 'digital-art', label: 'Digital Art', description: 'Modern digital artwork' },
  { value: 'anime', label: 'Anime', description: 'Anime and manga style' },
  { value: 'cartoon', label: 'Cartoon', description: 'Cartoon and illustration style' },
  { value: 'sketch', label: 'Sketch', description: 'Hand-drawn sketch style' },
  { value: 'abstract', label: 'Abstract', description: 'Abstract and conceptual art' },
  { value: '3d-render', label: '3D Render', description: '3D rendered imagery' }
];

// Image aspect ratios
const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)', width: 512, height: 512 },
  { value: '16:9', label: 'Landscape (16:9)', width: 768, height: 432 },
  { value: '9:16', label: 'Portrait (9:16)', width: 432, height: 768 },
  { value: '4:3', label: 'Standard (4:3)', width: 640, height: 480 },
  { value: '3:4', label: 'Portrait (3:4)', width: 480, height: 640 },
  { value: '21:9', label: 'Ultrawide (21:9)', width: 896, height: 384 }
];

// Quality/size presets
const QUALITY_PRESETS = [
  { value: 'draft', label: 'Draft', description: 'Fast generation, lower quality', size: 256 },
  { value: 'standard', label: 'Standard', description: 'Balanced quality and speed', size: 512 },
  { value: 'high', label: 'High', description: 'High quality, slower generation', size: 768 },
  { value: 'ultra', label: 'Ultra', description: 'Maximum quality, slowest', size: 1024 }
];

// Prompt suggestions by category
const PROMPT_SUGGESTIONS = [
  {
    category: 'Nature',
    prompts: [
      'A serene mountain landscape at sunset',
      'Dense forest with rays of sunlight filtering through trees',
      'Ocean waves crashing against rocky cliffs',
      'Field of wildflowers in spring',
      'Northern lights dancing in the night sky'
    ]
  },
  {
    category: 'Technology',
    prompts: [
      'Futuristic cityscape with flying cars',
      'Advanced AI robot in a laboratory',
      'Holographic interface floating in space',
      'Cyberpunk neon-lit street scene',
      'Sleek spacecraft orbiting a planet'
    ]
  },
  {
    category: 'Abstract',
    prompts: [
      'Flowing liquid colors blending together',
      'Geometric patterns with vibrant gradients',
      'Swirling energy vortex',
      'Crystalline structures in space',
      'Ethereal light forms dancing'
    ]
  },
  {
    category: 'Business',
    prompts: [
      'Modern office space with natural lighting',
      'Business team collaboration meeting',
      'Minimalist workspace with laptop',
      'Professional handshake agreement',
      'Corporate building architecture'
    ]
  }
];

// Generate placeholder AI image (since we don't have actual AI integration)
const generatePlaceholderAIImage = (
  prompt: string,
  style: string,
  width: number,
  height: number
): string => {
  // Create an SVG placeholder that represents the AI-generated concept
  const colors = {
    realistic: ['#8B4513', '#228B22', '#4169E1', '#FFD700'],
    artistic: ['#FF6347', '#4169E1', '#32CD32', '#FFD700'],
    'digital-art': ['#FF1493', '#00CED1', '#9370DB', '#FF4500'],
    anime: ['#FF69B4', '#00BFFF', '#98FB98', '#FFA500'],
    cartoon: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    sketch: ['#2C3E50', '#7F8C8D', '#BDC3C7', '#ECF0F1'],
    abstract: ['#E74C3C', '#9B59B6', '#3498DB', '#E67E22'],
    '3d-render': ['#34495E', '#2ECC71', '#E74C3C', '#F39C12']
  };
  
  const styleColors = colors[style as keyof typeof colors] || colors.realistic;
  const bgColor = styleColors[0];
  const accentColor = styleColors[1];
  
  // Create a simple abstract representation based on the prompt
  let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="${width}" height="${height}" fill="${bgColor}"/>`;
  
  // Add some geometric shapes based on prompt keywords
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes('landscape') || promptLower.includes('mountain')) {
    // Mountain silhouette
    svg += `<polygon points="0,${height*0.7} ${width*0.3},${height*0.4} ${width*0.6},${height*0.5} ${width},${height*0.6} ${width},${height} 0,${height}" fill="${accentColor}"/>`;
  } else if (promptLower.includes('city') || promptLower.includes('building')) {
    // City skyline
    for (let i = 0; i < 5; i++) {
      const x = i * (width / 5);
      const buildingHeight = height * (0.3 + Math.random() * 0.4);
      svg += `<rect x="${x}" y="${height - buildingHeight}" width="${width/5}" height="${buildingHeight}" fill="${styleColors[i % styleColors.length]}"/>`;
    }
  } else if (promptLower.includes('abstract') || promptLower.includes('flowing')) {
    // Abstract flowing shapes
    svg += `<path d="M 0,${height/2} Q ${width/3},${height/4} ${width*2/3},${height/2} T ${width},${height/3}" stroke="${accentColor}" stroke-width="20" fill="none"/>`;
    svg += `<path d="M 0,${height*2/3} Q ${width/2},${height*3/4} ${width},${height/2}" stroke="${styleColors[2]}" stroke-width="15" fill="none"/>`;
  } else {
    // Default: circles and shapes
    svg += `<circle cx="${width/3}" cy="${height/3}" r="${Math.min(width, height)/8}" fill="${accentColor}" opacity="0.8"/>`;
    svg += `<circle cx="${width*2/3}" cy="${height*2/3}" r="${Math.min(width, height)/10}" fill="${styleColors[2]}" opacity="0.7"/>`;
  }
  
  // Add a subtle texture overlay
  svg += `<rect width="${width}" height="${height}" fill="url(#noise)" opacity="0.1"/>`;
  svg += `<defs><filter id="noise"><feTurbulence baseFrequency="0.9" numOctaves="1" result="noise"/><feColorMatrix in="noise" type="saturate" values="0"/></filter></defs>`;
  
  svg += '</svg>';
  
  return 'data:image/svg+xml;base64,' + btoa(svg);
};

export const AIImagePanel: React.FC = () => {
  const { theme } = useTheme();
  const { addElement } = useCanvasStore();
  
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('realistic');
  const [selectedRatio, setSelectedRatio] = useState('1:1');
  const [selectedQuality, setSelectedQuality] = useState('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedSuggestionCategory, setSelectedSuggestionCategory] = useState('Nature');

  const currentRatio = ASPECT_RATIOS.find(r => r.value === selectedRatio);
  const currentQuality = QUALITY_PRESETS.find(q => q.value === selectedQuality);
  const currentStyle = AI_STYLES.find(s => s.value === selectedStyle);

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setGenerationError('Please enter a prompt to generate an image');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Simulate AI generation delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate placeholder AI image
      const aiImageUrl = generatePlaceholderAIImage(
        prompt,
        selectedStyle,
        currentRatio?.width || 512,
        currentRatio?.height || 512
      );
      
      setGeneratedImages(prev => [aiImageUrl, ...prev.slice(0, 7)]); // Keep last 8 images
    } catch (error) {
      setGenerationError('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddImageToCanvas = (imageUrl: string) => {
    const element = {
      id: `ai_image_${Date.now()}`,
      type: 'image' as const,
      x: 100,
      y: 100,
      width: currentRatio?.width || 512,
      height: currentRatio?.height || 512,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      src: imageUrl,
      originalWidth: currentRatio?.width || 512,
      originalHeight: currentRatio?.height || 512,
      fit: 'contain',
      isAIGenerated: true,
      aiPrompt: prompt,
      aiStyle: selectedStyle,
      aiQuality: selectedQuality
    };
    
    addElement(element);
  };

  const handlePromptSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const currentSuggestions = PROMPT_SUGGESTIONS.find(s => s.category === selectedSuggestionCategory)?.prompts || [];

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Prompt Input */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <div style={{
          fontSize: '12px',
          fontWeight: 600,
          color: theme.colors?.textPrimary || '#f5f8fa',
          marginBottom: '12px'
        }}>
          AI Image Generation
        </div>

        <FormGroup label="Prompt" labelFor="prompt-input">
          <TextArea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            fill
            rows={3}
            style={{ resize: 'none' }}
          />
        </FormGroup>

        <FormGroup label="Negative Prompt (Optional)" labelFor="negative-prompt">
          <InputGroup
            id="negative-prompt"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to avoid in the image..."
          />
        </FormGroup>
      </div>

      {/* Settings */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Style */}
          <FormGroup label="Art Style">
            <HTMLSelect
              value={selectedStyle}
              onChange={(e) => setSelectedStyle(e.target.value)}
              fill
            >
              {AI_STYLES.map(style => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </HTMLSelect>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              marginTop: '4px'
            }}>
              {currentStyle?.description}
            </div>
          </FormGroup>

          {/* Aspect Ratio and Quality */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <FormGroup label="Aspect Ratio">
              <HTMLSelect
                value={selectedRatio}
                onChange={(e) => setSelectedRatio(e.target.value)}
                fill
              >
                {ASPECT_RATIOS.map(ratio => (
                  <option key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
            
            <FormGroup label="Quality">
              <HTMLSelect
                value={selectedQuality}
                onChange={(e) => setSelectedQuality(e.target.value)}
                fill
              >
                {QUALITY_PRESETS.map(preset => (
                  <option key={preset.value} value={preset.value}>
                    {preset.label}
                  </option>
                ))}
              </HTMLSelect>
            </FormGroup>
          </div>

          {/* Generation Info */}
          <div style={{
            fontSize: '10px',
            color: theme.colors?.textSecondary || '#a7b6c2',
            backgroundColor: theme.colors?.cardBg || '#394b59',
            padding: '8px',
            borderRadius: '4px',
            border: `1px solid ${theme.colors?.border || '#495563'}`
          }}>
            Size: {currentRatio?.width} × {currentRatio?.height} • {currentQuality?.description}
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div style={{
        padding: '16px',
        borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
      }}>
        <Button
          onClick={handleGenerateImage}
          disabled={!prompt.trim() || isGenerating}
          fill
          large
          intent="primary"
          icon={isGenerating ? undefined : 'lightbulb'}
        >
          {isGenerating ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Spinner size={16} />
              Generating Image...
            </div>
          ) : (
            'Generate AI Image'
          )}
        </Button>

        {generationError && (
          <Alert
            intent="danger"
            onClose={() => setGenerationError(null)}
            style={{ marginTop: '12px' }}
          >
            {generationError}
          </Alert>
        )}
      </div>

      {/* Content Area */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Generated Images */}
        {generatedImages.length > 0 && (
          <div style={{
            padding: '16px',
            borderBottom: `1px solid ${theme.colors?.border || '#495563'}`
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: theme.colors?.textPrimary || '#f5f8fa',
              marginBottom: '12px'
            }}>
              Recent Generations
            </div>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {generatedImages.map((imageUrl, index) => (
                <div
                  key={index}
                  onClick={() => handleAddImageToCanvas(imageUrl)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: `1px solid ${theme.colors?.border || '#495563'}`,
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.colors?.primary || '#48aff0';
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.colors?.border || '#495563';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <img
                    src={imageUrl}
                    alt={`Generated image ${index + 1}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prompt Suggestions */}
        <div style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: theme.colors?.textPrimary || '#f5f8fa',
            marginBottom: '12px'
          }}>
            Prompt Suggestions
          </div>

          {/* Category Selector */}
          <div style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {PROMPT_SUGGESTIONS.map(category => (
              <Button
                key={category.category}
                text={category.category}
                small
                minimal
                active={selectedSuggestionCategory === category.category}
                onClick={() => setSelectedSuggestionCategory(category.category)}
                style={{
                  whiteSpace: 'nowrap',
                  minWidth: 'auto'
                }}
              />
            ))}
          </div>

          {/* Suggestions List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {currentSuggestions.map((suggestion, index) => (
              <Card
                key={index}
                interactive
                onClick={() => handlePromptSuggestion(suggestion)}
                style={{
                  padding: '12px',
                  cursor: 'pointer',
                  backgroundColor: theme.colors?.cardBg || '#394b59',
                  border: `1px solid ${theme.colors?.border || '#495563'}`,
                  transition: 'all 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = theme.colors?.primary || '#48aff0';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = theme.colors?.border || '#495563';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{
                  fontSize: '12px',
                  color: theme.colors?.textPrimary || '#f5f8fa',
                  lineHeight: '1.4'
                }}>
                  {suggestion}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '16px',
        borderTop: `1px solid ${theme.colors?.border || '#495563'}`,
        fontSize: '10px',
        color: theme.colors?.textSecondary || '#a7b6c2',
        textAlign: 'center'
      }}>
        ✨ AI-generated images will be added to your canvas
      </div>
    </div>
  );
};

AIImagePanel.displayName = 'AIImagePanel';