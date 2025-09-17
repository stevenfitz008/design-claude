// PlotlyRichTextEditor - Adapted from Design Studio's QuillRichTextEditor
// Original: /design-studio-clone/src/components/canvas/QuillRichTextEditor.tsx
// Adapted for: Plotly.js annotations with identical UX patterns

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { styled } from 'goober';
import type { PlotlyTextElement } from '../../types/plotlyText';

interface PlotlyRichTextEditorProps {
  textElement?: PlotlyTextElement;
  onTextUpdate?: (html: string, imageData?: string) => void;
  onClose?: () => void;
  initialContent?: string;
}

// Styled components - exactly matching Design Studio's theme
const EditorContainer = styled('div')`
  background: #2f343c;
  border: 1px solid #495563;
  border-radius: 8px;
  margin: 16px 0;
  overflow: hidden;
`;

const EditorHeader = styled('div')`
  background: #252a30;
  padding: 12px 16px;
  border-bottom: 1px solid #495563;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const EditorTitle = styled('h3')`
  color: #f5f8fa;
  font-size: 14px;
  font-weight: 500;
  margin: 0;
  flex: 1;
`;

const CloseButton = styled('button')`
  background: none;
  border: none;
  color: #a7b6c2;
  cursor: pointer;
  font-size: 18px;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #3a3f47;
    color: #f5f8fa;
  }
`;

const EditorContent = styled('div')`
  padding: 16px;
`;

const QuillContainer = styled('div')`
  background: #394b59;
  border-radius: 6px;
  overflow: hidden;

  .ql-toolbar {
    background: #252a30 !important;
    border: none !important;
    border-bottom: 1px solid #495563 !important;
    padding: 12px 16px !important;
  }

  .ql-toolbar .ql-stroke {
    fill: none;
    stroke: #a7b6c2 !important;
  }

  .ql-toolbar .ql-fill {
    fill: #a7b6c2 !important;
    stroke: none;
  }

  .ql-toolbar .ql-picker {
    color: #a7b6c2 !important;
  }

  .ql-toolbar .ql-picker-label {
    color: #a7b6c2 !important;
  }

  .ql-toolbar button:hover .ql-stroke,
  .ql-toolbar button:focus .ql-stroke,
  .ql-toolbar button.ql-active .ql-stroke {
    stroke: #48aff0 !important;
  }

  .ql-toolbar button:hover .ql-fill,
  .ql-toolbar button:focus .ql-fill,
  .ql-toolbar button.ql-active .ql-fill {
    fill: #48aff0 !important;
  }

  .ql-toolbar button:hover,
  .ql-toolbar button:focus,
  .ql-toolbar button.ql-active {
    color: #48aff0 !important;
  }

  .ql-editor {
    background: #394b59 !important;
    color: #f5f8fa !important;
    border: none !important;
    min-height: 120px;
    font-size: 16px;
    line-height: 1.4;
    padding: 16px !important;
  }

  .ql-editor.ql-blank::before {
    color: #8a9ba8 !important;
    font-style: normal;
    left: 16px;
  }

  .ql-editor p {
    margin-bottom: 8px;
  }

  .ql-editor h1, .ql-editor h2, .ql-editor h3 {
    margin: 12px 0 8px 0;
    color: #f5f8fa;
  }

  .ql-picker-options {
    background: #2f343c !important;
    border: 1px solid #495563 !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
  }

  .ql-picker-item {
    color: #a7b6c2 !important;
  }

  .ql-picker-item:hover {
    background: #48aff0 !important;
    color: white !important;
  }

  .ql-picker-item.ql-selected {
    background: #48aff0 !important;
    color: white !important;
  }

  .ql-color-picker, .ql-background {
    .ql-picker-item {
      border: 1px solid #495563 !important;
    }
  }
`;

const ActionButtons = styled('div')`
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: flex-end;
`;

const Button = styled('button')<{ $primary?: boolean }>`
  background: ${props => props.$primary ? '#48aff0' : 'transparent'};
  color: ${props => props.$primary ? 'white' : '#a7b6c2'};
  border: 1px solid ${props => props.$primary ? '#48aff0' : '#495563'};
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.$primary ? '#3a9dd9' : '#3a3f47'};
    color: ${props => props.$primary ? 'white' : '#f5f8fa'};
    transform: translateY(-1px);
  }
`;

const LoadingState = styled('div')`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 120px;
  color: #a7b6c2;
  font-size: 14px;
`;

const StatusIndicator = styled('div')<{ $status: 'loading' | 'ready' | 'converting' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 12px;
  background: ${props => {
    switch (props.$status) {
      case 'loading': return 'rgba(255, 193, 7, 0.1)';
      case 'ready': return 'rgba(40, 167, 69, 0.1)';
      case 'converting': return 'rgba(72, 175, 240, 0.1)';
      default: return 'transparent';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'loading': return '#ffc107';
      case 'ready': return '#28a745';
      case 'converting': return '#48aff0';
      default: return '#a7b6c2';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'loading': return 'rgba(255, 193, 7, 0.3)';
      case 'ready': return 'rgba(40, 167, 69, 0.3)';
      case 'converting': return 'rgba(72, 175, 240, 0.3)';
      default: return '#495563';
    }
  }};
`;

declare global {
  interface Window {
    Quill?: any;
    html2canvas?: any;
  }
}

export const PlotlyRichTextEditor: React.FC<PlotlyRichTextEditorProps> = ({
  textElement,
  onTextUpdate,
  onClose,
  initialContent = '<p>Start typing your rich text content...</p>'
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'converting'>('loading');
  const [quill, setQuill] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const loadScript = useCallback((src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }, []);

  const loadCSS = useCallback((href: string) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  }, []);

  const convertToImage = useCallback(async (editorElement: HTMLElement): Promise<string> => {
    if (!window.html2canvas) {
      throw new Error('html2canvas not loaded');
    }

    setStatus('converting');

    try {
      const canvas = await window.html2canvas(editorElement, {
        backgroundColor: 'rgba(0,0,0,0)',
        scale: window.devicePixelRatio || 1,
        useCORS: true,
        allowTaint: false,
        logging: false,
        height: editorElement.scrollHeight,
        width: editorElement.scrollWidth,
        scrollX: 0,
        scrollY: 0
      });

      setStatus('ready');
      return canvas.toDataURL('image/png');
    } catch (error) {
      console.error('Image conversion failed:', error);
      setStatus('ready');
      throw error;
    }
  }, []);

  const handleTextChange = useCallback(() => {
    if (!quill) return;

    // Clear previous timeout
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    // Debounced update
    updateTimeoutRef.current = setTimeout(async () => {
      try {
        const html = quill.root.innerHTML;
        const editorElement = quill.root;

        // Convert to image for Plotly annotation rendering
        const imageData = await convertToImage(editorElement);
        
        // Call update callback
        onTextUpdate?.(html, imageData);

        console.log('Plotly rich text updated:', { html, hasImageData: !!imageData });
      } catch (error) {
        console.error('Failed to update Plotly rich text:', error);
        // Still call update callback with HTML only
        const html = quill.root.innerHTML;
        onTextUpdate?.(html);
      }
    }, 500);
  }, [quill, onTextUpdate, convertToImage]);

  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setStatus('loading');
        
        // Load dependencies from CDN (same as Design Studio)
        await Promise.all([
          loadScript('https://cdn.quilljs.com/1.3.6/quill.js'),
          loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js')
        ]);

        loadCSS('https://cdn.quilljs.com/1.3.6/quill.snow.css');

        // Wait for CSS to load
        await new Promise(resolve => setTimeout(resolve, 200));

        if (editorRef.current && window.Quill) {
          const quillInstance = new window.Quill(editorRef.current, {
            theme: 'snow',
            placeholder: 'Enter rich text content for Plotly annotation...',
            modules: {
              toolbar: [
                [{ header: [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ color: [] }, { background: [] }],
                [{ font: [] }, { size: ['small', false, 'large', 'huge'] }],
                [{ align: [] }],
                [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
                ['blockquote', 'code-block'],
                ['link', 'image'],
                ['clean']
              ]
            }
          });

          // Set initial content
          const content = textElement?.html || textElement?.text || initialContent;
          if (content && content !== 'Enter rich text content for Plotly annotation...') {
            // Check if content is HTML or plain text
            if (content.includes('<') && content.includes('>')) {
              quillInstance.root.innerHTML = content;
            } else {
              quillInstance.setText(content);
            }
          }

          // Add event listeners
          quillInstance.on('text-change', handleTextChange);
          
          setQuill(quillInstance);
          setStatus('ready');
        }

      } catch (error) {
        console.error('Failed to initialize Plotly rich text editor:', error);
        setStatus('ready'); // Still show UI even if initialization fails
      }
    };

    initializeEditor();

    // Cleanup
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [textElement, initialContent, handleTextChange, loadScript, loadCSS]);

  const handleApply = useCallback(async () => {
    if (quill) {
      try {
        setStatus('converting');
        const html = quill.root.innerHTML;
        const editorElement = quill.root;
        const imageData = await convertToImage(editorElement);
        
        onTextUpdate?.(html, imageData);
        setStatus('ready');
        
        console.log('Applied Plotly rich text changes:', { html, hasImageData: !!imageData });
      } catch (error) {
        console.error('Apply Plotly text changes failed:', error);
        setStatus('ready');
      }
    }
  }, [quill, onTextUpdate, convertToImage]);

  const getStatusMessage = () => {
    switch (status) {
      case 'loading': return '⏳ Loading Plotly text editor...';
      case 'ready': return '✅ Editor ready for Plotly';
      case 'converting': return '🔄 Converting to Plotly annotation...';
      default: return '';
    }
  };

  if (status === 'loading') {
    return (
      <EditorContainer>
        <EditorHeader>
          <EditorTitle>Plotly Rich Text Editor</EditorTitle>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </EditorHeader>
        <EditorContent>
          <LoadingState>Loading Plotly text editor...</LoadingState>
        </EditorContent>
      </EditorContainer>
    );
  }

  return (
    <EditorContainer data-testid="plotly-rich-text-editor">
      <EditorHeader>
        <EditorTitle>Plotly Rich Text Editor</EditorTitle>
        {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
      </EditorHeader>
      <EditorContent>
        <StatusIndicator $status={status}>
          {getStatusMessage()}
        </StatusIndicator>
        
        <QuillContainer>
          <div ref={editorRef} />
        </QuillContainer>
        
        <ActionButtons>
          {onClose && (
            <Button onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button $primary onClick={handleApply} disabled={status === 'converting'}>
            {status === 'converting' ? 'Converting...' : 'Apply to Plotly'}
          </Button>
        </ActionButtons>
      </EditorContent>
    </EditorContainer>
  );
};