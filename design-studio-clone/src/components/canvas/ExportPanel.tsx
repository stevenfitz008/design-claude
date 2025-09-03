import React, { useState, useCallback, useRef } from 'react';
import { observer } from 'mobx-react-lite';
import { 
  Button,
  ButtonGroup,
  Card,
  Divider,
  H5,
  H6,
  HTMLSelect,
  NumericInput,
  FormGroup,
  RadioGroup,
  Radio,
  Slider,
  Switch,
  ProgressBar,
  Callout,
  Intent
} from '@blueprintjs/core';
import { styled } from '@/styles/goober-setup';
import { useCanvasStore } from '@/stores/canvasStore';
import Konva from 'konva';

interface ExportPanelProps {
  stageRef: React.RefObject<Konva.Stage>;
  onClose?: () => void;
}

const PanelContainer = styled('div')`
  width: 350px;
  height: 100%;
  background: var(--panel-bg);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
`;

const PanelSection = styled('div')`
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
`;

const FormatGrid = styled('div')`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin: 12px 0;
`;

const PreviewContainer = styled('div')`
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 12px;
  text-align: center;
  margin: 12px 0;
  background: var(--surface-color);
`;

const QualitySection = styled('div')`
  margin: 16px 0;
`;

const exportFormats = [
  { value: 'png', label: 'PNG', description: 'Best for images with transparency' },
  { value: 'jpeg', label: 'JPEG', description: 'Best for photographs' },
  { value: 'svg', label: 'SVG', description: 'Vector format, scalable' },
  { value: 'pdf', label: 'PDF', description: 'Document format' },
  { value: 'webp', label: 'WebP', description: 'Modern web format' },
  { value: 'gif', label: 'GIF', description: 'Animated format' }
];

const exportSizes = [
  { label: 'Original Size', multiplier: 1 },
  { label: '2x (Retina)', multiplier: 2 },
  { label: '0.5x (Half)', multiplier: 0.5 },
  { label: 'Custom', multiplier: 0 }
];

const presentationModes = [
  { value: 'fullscreen', label: 'Fullscreen', description: 'Present in full browser window' },
  { value: 'windowed', label: 'Windowed', description: 'Present in a popup window' },
  { value: 'embed', label: 'Embed Code', description: 'Generate embeddable HTML' }
];

const ExportPanel: React.FC<ExportPanelProps> = observer(({ stageRef, onClose }) => {
  const { canvasSize, elements, backgroundColor } = useCanvasStore();
  const [activeTab, setActiveTab] = useState<'export' | 'presentation'>('export');
  
  // Export settings
  const [format, setFormat] = useState('png');
  const [sizeMultiplier, setSizeMultiplier] = useState(1);
  const [customWidth, setCustomWidth] = useState(canvasSize.width);
  const [customHeight, setCustomHeight] = useState(canvasSize.height);
  const [quality, setQuality] = useState(0.9);
  const [includeBackground, setIncludeBackground] = useState(true);
  const [exportSelection, setExportSelection] = useState(false);
  
  // Presentation settings
  const [presentationMode, setPresentationMode] = useState('fullscreen');
  const [autoplay, setAutoplay] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(1000);
  
  // State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportMessage, setExportMessage] = useState('');

  const downloadCanvasImage = useCallback((dataURL: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportCanvas = useCallback(async () => {
    if (!stageRef.current) return;

    setIsExporting(true);
    setExportProgress(0);
    setExportMessage('Preparing export...');

    try {
      const stage = stageRef.current;
      
      // Calculate export dimensions
      let exportWidth = canvasSize.width;
      let exportHeight = canvasSize.height;
      
      if (sizeMultiplier > 0) {
        exportWidth *= sizeMultiplier;
        exportHeight *= sizeMultiplier;
      } else {
        exportWidth = customWidth;
        exportHeight = customHeight;
      }

      setExportProgress(25);
      setExportMessage('Rendering canvas...');

      // Create export configuration
      const exportConfig: any = {
        width: exportWidth,
        height: exportHeight,
        pixelRatio: sizeMultiplier > 0 ? sizeMultiplier : customWidth / canvasSize.width
      };

      if (format === 'jpeg') {
        exportConfig.quality = quality;
      }

      setExportProgress(50);

      let dataURL: string;
      let filename = `canvas-export-${Date.now()}`;

      switch (format) {
        case 'png':
          dataURL = stage.toDataURL({ ...exportConfig, mimeType: 'image/png' });
          filename += '.png';
          break;
        
        case 'jpeg':
          dataURL = stage.toDataURL({ ...exportConfig, mimeType: 'image/jpeg' });
          filename += '.jpg';
          break;
        
        case 'webp':
          dataURL = stage.toDataURL({ ...exportConfig, mimeType: 'image/webp', quality });
          filename += '.webp';
          break;
        
        case 'svg':
          // For SVG, we would need to reconstruct the elements as SVG
          // This is a simplified implementation
          const svgString = await generateSVGFromCanvas(elements, canvasSize, includeBackground ? backgroundColor : undefined);
          const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
          dataURL = URL.createObjectURL(svgBlob);
          filename += '.svg';
          break;
        
        case 'pdf':
          // For PDF export, we would typically use a library like jsPDF
          // This is a placeholder implementation
          dataURL = stage.toDataURL({ ...exportConfig, mimeType: 'image/png' });
          filename += '.png'; // Fallback to PNG for now
          break;
        
        default:
          dataURL = stage.toDataURL(exportConfig);
          filename += '.png';
      }

      setExportProgress(75);
      setExportMessage('Downloading...');

      // Download the file
      downloadCanvasImage(dataURL, filename);

      setExportProgress(100);
      setExportMessage('Export complete!');
      
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage('');
      }, 2000);

    } catch (error) {
      console.error('Export failed:', error);
      setExportMessage('Export failed. Please try again.');
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
        setExportMessage('');
      }, 3000);
    }
  }, [stageRef, canvasSize, sizeMultiplier, customWidth, customHeight, format, quality, elements, includeBackground, backgroundColor, downloadCanvasImage]);

  const startPresentation = useCallback(() => {
    if (!stageRef.current) return;

    const stage = stageRef.current;
    const container = stage.container();

    switch (presentationMode) {
      case 'fullscreen':
        if (container.requestFullscreen) {
          container.requestFullscreen();
        }
        break;
      
      case 'windowed':
        const dataURL = stage.toDataURL();
        const newWindow = window.open('', '_blank', 'width=1200,height=800');
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head>
                <title>Canvas Presentation</title>
                <style>
                  body { margin: 0; padding: 20px; background: #000; display: flex; justify-content: center; align-items: center; }
                  img { max-width: 100%; max-height: 100%; object-fit: contain; }
                </style>
              </head>
              <body>
                <img src="${dataURL}" alt="Canvas Presentation" />
              </body>
            </html>
          `);
        }
        break;
      
      case 'embed':
        const embedCode = generateEmbedCode();
        navigator.clipboard.writeText(embedCode);
        alert('Embed code copied to clipboard!');
        break;
    }
  }, [stageRef, presentationMode]);

  const generateEmbedCode = useCallback(() => {
    if (!stageRef.current) return '';

    const dataURL = stageRef.current.toDataURL();
    return `<div style="text-align: center; padding: 20px;">
  <img src="${dataURL}" alt="Canvas Design" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />
</div>`;
  }, [stageRef]);

  // Simple SVG generation (would need more sophisticated implementation for production)
  const generateSVGFromCanvas = async (elements: any[], canvasSize: { width: number; height: number }, backgroundColor?: string): Promise<string> => {
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize.width}" height="${canvasSize.height}" viewBox="0 0 ${canvasSize.width} ${canvasSize.height}">`;
    
    if (backgroundColor) {
      svgContent += `<rect width="100%" height="100%" fill="${backgroundColor}"/>`;
    }
    
    // This would need to be implemented to convert Konva elements to SVG
    // For now, it's a placeholder
    svgContent += `<text x="50%" y="50%" text-anchor="middle" font-family="Arial" font-size="24" fill="#333">SVG Export Not Fully Implemented</text>`;
    
    svgContent += '</svg>';
    return svgContent;
  };

  const formatDescription = exportFormats.find(f => f.value === format)?.description || '';

  return (
    <PanelContainer>
      {/* Header */}
      <PanelSection>
        <H5>Export & Present</H5>
        <ButtonGroup fill>
          <Button
            text="Export"
            active={activeTab === 'export'}
            onClick={() => setActiveTab('export')}
          />
          <Button
            text="Present"
            active={activeTab === 'presentation'}
            onClick={() => setActiveTab('presentation')}
          />
        </ButtonGroup>
      </PanelSection>

      {activeTab === 'export' && (
        <>
          {/* Format Selection */}
          <PanelSection>
            <H6>Export Format</H6>
            <RadioGroup
              onChange={(e) => setFormat(e.currentTarget.value)}
              selectedValue={format}
            >
              {exportFormats.map(fmt => (
                <Radio key={fmt.value} label={fmt.label} value={fmt.value} />
              ))}
            </RadioGroup>
            <Callout intent="primary" style={{ marginTop: '8px', fontSize: '12px' }}>
              {formatDescription}
            </Callout>
          </PanelSection>

          {/* Size Settings */}
          <PanelSection>
            <H6>Export Size</H6>
            <RadioGroup
              onChange={(e) => setSizeMultiplier(parseFloat(e.currentTarget.value))}
              selectedValue={sizeMultiplier.toString()}
            >
              {exportSizes.map(size => (
                <Radio 
                  key={size.label} 
                  label={size.label} 
                  value={size.multiplier.toString()} 
                />
              ))}
            </RadioGroup>
            
            {sizeMultiplier === 0 && (
              <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <FormGroup label="Width">
                  <NumericInput
                    value={customWidth}
                    onValueChange={setCustomWidth}
                    min={1}
                    max={4000}
                  />
                </FormGroup>
                <FormGroup label="Height">
                  <NumericInput
                    value={customHeight}
                    onValueChange={setCustomHeight}
                    min={1}
                    max={4000}
                  />
                </FormGroup>
              </div>
            )}
          </PanelSection>

          {/* Quality Settings */}
          {(format === 'jpeg' || format === 'webp') && (
            <PanelSection>
              <QualitySection>
                <FormGroup label={`Quality: ${Math.round(quality * 100)}%`}>
                  <Slider
                    min={0.1}
                    max={1}
                    stepSize={0.05}
                    value={quality}
                    onChange={setQuality}
                    labelRenderer={false}
                  />
                </FormGroup>
              </QualitySection>
            </PanelSection>
          )}

          {/* Additional Options */}
          <PanelSection>
            <H6>Options</H6>
            <Switch
              checked={includeBackground}
              onChange={(e) => setIncludeBackground((e.target as HTMLInputElement).checked)}
              label="Include Background"
            />
            <Switch
              checked={exportSelection}
              onChange={(e) => setExportSelection((e.target as HTMLInputElement).checked)}
              label="Export Selection Only"
              style={{ marginTop: '8px' }}
              disabled // Not implemented yet
            />
          </PanelSection>

          {/* Preview */}
          <PanelSection>
            <H6>Preview</H6>
            <PreviewContainer>
              <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                {sizeMultiplier > 0 
                  ? `${canvasSize.width * sizeMultiplier} × ${canvasSize.height * sizeMultiplier}px`
                  : `${customWidth} × ${customHeight}px`
                }
              </div>
              <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-muted)' }}>
                {format.toUpperCase()} format
              </div>
            </PreviewContainer>
          </PanelSection>

          {/* Export Progress */}
          {isExporting && (
            <PanelSection>
              <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                {exportMessage}
              </div>
              <ProgressBar value={exportProgress / 100} />
            </PanelSection>
          )}

          {/* Export Button */}
          <PanelSection>
            <Button
              text={isExporting ? 'Exporting...' : 'Export Canvas'}
              intent="primary"
              fill
              loading={isExporting}
              onClick={exportCanvas}
              disabled={!stageRef.current}
            />
          </PanelSection>
        </>
      )}

      {activeTab === 'presentation' && (
        <>
          {/* Presentation Mode */}
          <PanelSection>
            <H6>Presentation Mode</H6>
            <RadioGroup
              onChange={(e) => setPresentationMode(e.currentTarget.value)}
              selectedValue={presentationMode}
            >
              {presentationModes.map(mode => (
                <Radio 
                  key={mode.value} 
                  label={mode.label} 
                  value={mode.value}
                />
              ))}
            </RadioGroup>
            <Callout style={{ marginTop: '8px', fontSize: '12px' }}>
              {presentationModes.find(m => m.value === presentationMode)?.description}
            </Callout>
          </PanelSection>

          {/* Presentation Settings */}
          <PanelSection>
            <H6>Settings</H6>
            <Switch
              checked={autoplay}
              onChange={(e) => setAutoplay((e.target as HTMLInputElement).checked)}
              label="Autoplay (if animated)"
            />
            
            <FormGroup label={`Transition Duration: ${transitionDuration}ms`} style={{ marginTop: '12px' }}>
              <Slider
                min={100}
                max={3000}
                stepSize={100}
                value={transitionDuration}
                onChange={setTransitionDuration}
                labelRenderer={false}
              />
            </FormGroup>
          </PanelSection>

          {/* Start Presentation */}
          <PanelSection>
            <Button
              text="Start Presentation"
              intent="success"
              fill
              icon="presentation"
              onClick={startPresentation}
              disabled={!stageRef.current}
            />
          </PanelSection>
        </>
      )}

      {/* Close Button */}
      {onClose && (
        <PanelSection style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
          <Button
            text="Close"
            fill
            onClick={onClose}
          />
        </PanelSection>
      )}
    </PanelContainer>
  );
});

ExportPanel.displayName = 'ExportPanel';

export default ExportPanel;