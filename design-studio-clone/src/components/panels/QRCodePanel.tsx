import React, { useState, useCallback } from 'react';
import { Button, FormGroup, InputGroup, HTMLSelect, NumericInput, Switch, Divider, Card } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

// QR Code data types
const QR_DATA_TYPES = [
  { value: 'url', label: 'Website URL', placeholder: 'https://example.com', icon: 'link' },
  { value: 'text', label: 'Plain Text', placeholder: 'Enter your text here', icon: 'font' },
  { value: 'email', label: 'Email Address', placeholder: 'contact@example.com', icon: 'envelope' },
  { value: 'phone', label: 'Phone Number', placeholder: '+1234567890', icon: 'phone' },
  { value: 'sms', label: 'SMS Message', placeholder: 'Hello World', icon: 'chat' },
  { value: 'wifi', label: 'WiFi Network', placeholder: 'Network Name', icon: 'mobile-phone' },
  { value: 'vcard', label: 'Contact Card', placeholder: 'John Doe', icon: 'person' },
  { value: 'location', label: 'Location', placeholder: '40.7128, -74.0060', icon: 'map-marker' }
];

// Error correction levels
const ERROR_CORRECTION_LEVELS = [
  { value: 'L', label: 'Low (7%)', description: 'Suitable for clean environments' },
  { value: 'M', label: 'Medium (15%)', description: 'Balanced option' },
  { value: 'Q', label: 'Quartile (25%)', description: 'Good for outdoor use' },
  { value: 'H', label: 'High (30%)', description: 'Maximum error recovery' }
];

// QR Code styles/patterns
const QR_STYLES = [
  { value: 'square', label: 'Square', description: 'Classic square dots' },
  { value: 'circle', label: 'Circle', description: 'Rounded dots' },
  { value: 'rounded', label: 'Rounded Square', description: 'Rounded corner squares' }
];

// Generate QR code data URL (simplified implementation)
const generateQRCodeDataUrl = (
  text: string, 
  size: number = 256, 
  foreground: string = '#000000', 
  background: string = '#ffffff',
  errorCorrection: string = 'M'
): string => {
  // In a real implementation, you would use a QR code library like qrcode.js
  // For now, we'll create a simple placeholder SVG that represents a QR code pattern
  const gridSize = 25; // 25x25 grid for QR code
  const cellSize = size / gridSize;
  
  // Generate a pseudo-random pattern based on the input text
  const pattern = [];
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Create pattern based on hash
  for (let row = 0; row < gridSize; row++) {
    pattern[row] = [];
    for (let col = 0; col < gridSize; col++) {
      // Create finder patterns in corners (simplified)
      if ((row < 7 && col < 7) || (row < 7 && col >= gridSize - 7) || (row >= gridSize - 7 && col < 7)) {
        pattern[row][col] = (row + col) % 2 === 0;
      } else {
        // Use hash to generate pattern
        const cellHash = hash + row * gridSize + col;
        pattern[row][col] = Math.abs(cellHash) % 3 === 0;
      }
    }
  }
  
  // Generate SVG
  let svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${size}" height="${size}" fill="${background}"/>`;
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (pattern[row][col]) {
        const x = col * cellSize;
        const y = row * cellSize;
        svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${foreground}"/>`;
      }
    }
  }
  
  svg += '</svg>';
  
  return 'data:image/svg+xml;base64,' + btoa(svg);
};

export const QRCodePanel: React.FC = () => {
  const { theme } = useTheme();
  const { addElement } = useCanvasStore();
  
  const [selectedType, setSelectedType] = useState('url');
  const [qrText, setQrText] = useState('https://example.com');
  const [qrSize, setQrSize] = useState(200);
  const [foregroundColor, setForegroundColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [errorCorrection, setErrorCorrection] = useState('M');
  const [qrStyle, setQrStyle] = useState('square');
  const [includeMargin, setIncludeMargin] = useState(true);
  
  // WiFi specific fields
  const [wifiPassword, setWifiPassword] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState('WPA');
  const [wifiHidden, setWifiHidden] = useState(false);
  
  // VCard specific fields
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [vcardOrg, setVcardOrg] = useState('');

  // Get placeholder and format data based on type
  const getFormattedQRData = (): string => {
    switch (selectedType) {
      case 'url':
        return qrText.startsWith('http') ? qrText : `https://${qrText}`;
      case 'text':
        return qrText;
      case 'email':
        return `mailto:${qrText}`;
      case 'phone':
        return `tel:${qrText}`;
      case 'sms':
        return `sms:${qrText}`;
      case 'wifi':
        return `WIFI:T:${wifiSecurity};S:${qrText};P:${wifiPassword};H:${wifiHidden ? 'true' : 'false'};;`;
      case 'vcard':
        return `BEGIN:VCARD\nVERSION:3.0\nFN:${vcardName || qrText}\nTEL:${vcardPhone}\nEMAIL:${vcardEmail}\nORG:${vcardOrg}\nEND:VCARD`;
      case 'location':
        const coords = qrText.split(',').map(s => s.trim());
        if (coords.length === 2) {
          return `geo:${coords[0]},${coords[1]}`;
        }
        return qrText;
      default:
        return qrText;
    }
  };

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    
    // Set default values for different types
    const typeConfig = QR_DATA_TYPES.find(t => t.value === newType);
    if (typeConfig) {
      setQrText(typeConfig.placeholder);
    }
  };

  const generateQRCode = useCallback(() => {
    const formattedData = getFormattedQRData();
    
    if (!formattedData.trim()) {
      return;
    }
    
    // Generate QR code data URL
    const qrCodeDataUrl = generateQRCodeDataUrl(
      formattedData,
      qrSize,
      foregroundColor,
      backgroundColor,
      errorCorrection
    );
    
    // Create canvas element
    const element = {
      id: `qr_${Date.now()}`,
      type: 'image' as const,
      x: 100,
      y: 100,
      width: qrSize,
      height: qrSize,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      src: qrCodeDataUrl,
      originalWidth: qrSize,
      originalHeight: qrSize,
      fit: 'contain',
      isQRCode: true,
      qrData: formattedData,
      qrType: selectedType,
      qrSize: qrSize,
      qrForeground: foregroundColor,
      qrBackground: backgroundColor,
      qrErrorCorrection: errorCorrection
    };
    
    addElement(element);
  }, [
    selectedType, qrText, qrSize, foregroundColor, backgroundColor, 
    errorCorrection, wifiPassword, wifiSecurity, wifiHidden,
    vcardName, vcardPhone, vcardEmail, vcardOrg, addElement
  ]);

  const currentType = QR_DATA_TYPES.find(t => t.value === selectedType);
  const previewData = getFormattedQRData();
  const canGenerate = previewData.trim().length > 0;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* QR Code Type */}
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
          QR Code Type
        </div>

        <HTMLSelect
          value={selectedType}
          onChange={(e) => handleTypeChange(e.target.value)}
          fill
        >
          {QR_DATA_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </HTMLSelect>
      </div>

      {/* Content Settings */}
      <div style={{
        flex: 1,
        padding: '16px',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Basic Content Input */}
          <FormGroup label={currentType?.label || 'Content'}>
            <InputGroup
              value={qrText}
              onChange={(e) => setQrText(e.target.value)}
              placeholder={currentType?.placeholder}
              leftIcon={currentType?.icon as any}
            />
          </FormGroup>

          {/* WiFi Specific Fields */}
          {selectedType === 'wifi' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FormGroup label="Password">
                <InputGroup
                  value={wifiPassword}
                  onChange={(e) => setWifiPassword(e.target.value)}
                  placeholder="WiFi password"
                  type="password"
                />
              </FormGroup>
              
              <FormGroup label="Security">
                <HTMLSelect
                  value={wifiSecurity}
                  onChange={(e) => setWifiSecurity(e.target.value)}
                  fill
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">No Password</option>
                </HTMLSelect>
              </FormGroup>
              
              <Switch
                checked={wifiHidden}
                onChange={(e) => setWifiHidden((e.target as HTMLInputElement).checked)}
                label="Hidden network"
              />
            </div>
          )}

          {/* VCard Specific Fields */}
          {selectedType === 'vcard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <FormGroup label="Full Name">
                <InputGroup
                  value={vcardName}
                  onChange={(e) => setVcardName(e.target.value)}
                  placeholder="John Doe"
                />
              </FormGroup>
              
              <FormGroup label="Phone Number">
                <InputGroup
                  value={vcardPhone}
                  onChange={(e) => setVcardPhone(e.target.value)}
                  placeholder="+1234567890"
                />
              </FormGroup>
              
              <FormGroup label="Email">
                <InputGroup
                  value={vcardEmail}
                  onChange={(e) => setVcardEmail(e.target.value)}
                  placeholder="john@example.com"
                />
              </FormGroup>
              
              <FormGroup label="Organization">
                <InputGroup
                  value={vcardOrg}
                  onChange={(e) => setVcardOrg(e.target.value)}
                  placeholder="Company Name"
                />
              </FormGroup>
            </div>
          )}

          <Divider />

          {/* QR Code Settings */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: theme.colors?.textPrimary || '#f5f8fa',
              marginBottom: '12px'
            }}>
              QR Code Settings
            </div>

            {/* Size */}
            <FormGroup label="Size (pixels)">
              <NumericInput
                value={qrSize}
                onValueChange={(value) => setQrSize(value)}
                min={100}
                max={1000}
                stepSize={10}
                fill
              />
            </FormGroup>

            {/* Colors */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', margin: '12px 0' }}>
              <FormGroup label="Foreground">
                <input
                  type="color"
                  value={foregroundColor}
                  onChange={(e) => setForegroundColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '30px',
                    border: '1px solid #495563',
                    borderRadius: '3px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                />
              </FormGroup>
              
              <FormGroup label="Background">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  style={{
                    width: '100%',
                    height: '30px',
                    border: '1px solid #495563',
                    borderRadius: '3px',
                    backgroundColor: 'transparent',
                    cursor: 'pointer'
                  }}
                />
              </FormGroup>
            </div>

            {/* Error Correction */}
            <FormGroup label="Error Correction">
              <HTMLSelect
                value={errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value)}
                fill
              >
                {ERROR_CORRECTION_LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </HTMLSelect>
              <div style={{
                fontSize: '10px',
                color: theme.colors?.textSecondary || '#a7b6c2',
                marginTop: '4px'
              }}>
                {ERROR_CORRECTION_LEVELS.find(l => l.value === errorCorrection)?.description}
              </div>
            </FormGroup>

            {/* Options */}
            <div style={{ marginTop: '12px' }}>
              <Switch
                checked={includeMargin}
                onChange={(e) => setIncludeMargin((e.target as HTMLInputElement).checked)}
                label="Include margin"
              />
            </div>
          </div>

          <Divider />

          {/* Preview */}
          <div>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: theme.colors?.textPrimary || '#f5f8fa',
              marginBottom: '12px'
            }}>
              Preview Data
            </div>
            
            <Card style={{
              backgroundColor: theme.colors?.bg || '#30404d',
              border: `1px solid ${theme.colors?.border || '#495563'}`,
              padding: '12px'
            }}>
              <div style={{
                fontSize: '11px',
                color: theme.colors?.textSecondary || '#a7b6c2',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                lineHeight: 1.4,
                maxHeight: '80px',
                overflowY: 'auto'
              }}>
                {previewData || 'Enter content above'}
              </div>
            </Card>
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateQRCode}
            disabled={!canGenerate}
            fill
            large
            intent="primary"
            icon="barcode"
          >
            Generate QR Code
          </Button>
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
        QR codes will be added to your canvas as image elements
      </div>
    </div>
  );
};

QRCodePanel.displayName = 'QRCodePanel';