import React, { useRef, useEffect, useState, useCallback } from 'react';
import { styled } from '../../styles/goober-setup';
import { useCanvasStore } from '../../stores/canvasStore';
import type { TextElement } from '../../types/canvas';

interface QuillRichTextEditorProps {
  textElement?: TextElement;
  onTextUpdate?: (html: string, imageData?: string) => void;
  onClose?: () => void;
  initialContent?: string;
}

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

  /* Custom toolbar button styles */
  .ql-text-shadow,
  .ql-gradient,
  .ql-line-height,
  .ql-letter-spacing {
    background: none !important;
    border: 1px solid transparent !important;
    border-radius: 3px !important;
    cursor: pointer !important;
    display: inline-block !important;
    float: left !important;
    height: 24px !important;
    padding: 3px 5px !important;
    width: 28px !important;
    text-align: center !important;
    line-height: 16px !important;
    font-size: 12px !important;
    transition: all 0.2s ease !important;
  }

  .ql-text-shadow:hover,
  .ql-gradient:hover,
  .ql-line-height:hover,
  .ql-letter-spacing:hover {
    background: rgba(72, 175, 240, 0.1) !important;
    border-color: #48aff0 !important;
    color: #48aff0 !important;
  }

  .ql-text-shadow.ql-active,
  .ql-gradient.ql-active,
  .ql-line-height.ql-active,
  .ql-letter-spacing.ql-active {
    background: #48aff0 !important;
    color: white !important;
  }

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

export const QuillRichTextEditor: React.FC<QuillRichTextEditorProps> = ({
  textElement,
  onTextUpdate,
  onClose,
  initialContent = '<p>Start typing your rich text content...</p>'
}) => {
  const [status, setStatus] = useState<'loading' | 'ready' | 'converting'>('loading');
  const [quill, setQuill] = useState<any>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { updateElement } = useCanvasStore();
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

        // Convert to image for canvas rendering
        const imageData = await convertToImage(editorElement);
        
        // Call update callback
        onTextUpdate?.(html, imageData);

        // Update canvas store if textElement exists
        if (textElement) {
          updateElement(textElement.id, {
            ...textElement,
            content: html,
            richText: true,
            imageData
          });
        }
      } catch (error) {
        console.error('Failed to update rich text:', error);
        // Still call update callback with HTML only
        const html = quill.root.innerHTML;
        onTextUpdate?.(html);
      }
    }, 500);
  }, [quill, onTextUpdate, textElement, updateElement, convertToImage]);

  useEffect(() => {
    const initializeEditor = async () => {
      try {
        setStatus('loading');
        
        // Load dependencies
        await Promise.all([
          loadScript('https://cdn.quilljs.com/1.3.6/quill.js'),
          loadScript('https://html2canvas.hertzen.com/dist/html2canvas.min.js')
        ]);

        loadCSS('https://cdn.quilljs.com/1.3.6/quill.snow.css');

        // Wait for CSS to load
        await new Promise(resolve => setTimeout(resolve, 200));

        if (editorRef.current && window.Quill) {
          // Register custom formats for advanced features
          const registerCustomFormats = () => {
            const Inline = window.Quill.import('blots/inline');
            const Block = window.Quill.import('blots/block');
            
            // Custom text shadow format
            class TextShadow extends Inline {
              static create(value) {
                const node = super.create();
                node.style.textShadow = value;
                return node;
              }
              static formats(node) {
                return node.style.textShadow || undefined;
              }
            }
            TextShadow.blotName = 'text-shadow';
            TextShadow.tagName = 'span';
            
            // Custom gradient text format
            class GradientText extends Inline {
              static create(value) {
                const node = super.create();
                node.style.background = value;
                node.style.webkitBackgroundClip = 'text';
                node.style.webkitTextFillColor = 'transparent';
                node.style.backgroundClip = 'text';
                return node;
              }
              static formats(node) {
                return node.style.background || undefined;
              }
            }
            GradientText.blotName = 'gradient';
            GradientText.tagName = 'span';
            
            // Custom line height format
            class LineHeight extends Inline {
              static create(value) {
                const node = super.create();
                node.style.lineHeight = value;
                return node;
              }
              static formats(node) {
                return node.style.lineHeight || undefined;
              }
            }
            LineHeight.blotName = 'line-height';
            LineHeight.tagName = 'span';
            
            // Custom letter spacing format
            class LetterSpacing extends Inline {
              static create(value) {
                const node = super.create();
                node.style.letterSpacing = value;
                return node;
              }
              static formats(node) {
                return node.style.letterSpacing || undefined;
              }
            }
            LetterSpacing.blotName = 'letter-spacing';
            LetterSpacing.tagName = 'span';
            
            try {
              window.Quill.register(TextShadow);
              window.Quill.register(GradientText);
              window.Quill.register(LineHeight);
              window.Quill.register(LetterSpacing);
            } catch (e) {
              console.log('Custom formats already registered');
            }
          };
          
          registerCustomFormats();
          
          const quillInstance = new window.Quill(editorRef.current, {
            theme: 'snow',
            placeholder: 'Enter rich text content...',
            modules: {
              toolbar: {
                container: [
                  [{ header: [1, 2, 3, 4, 5, 6, false] }],
                  [{ font: ['serif', 'monospace', 'arial', 'helvetica', 'times', 'courier'] }],
                  [{ size: ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '64px', '72px', '96px'] }],
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ script: 'sub' }, { script: 'super' }],
                  [{ color: [] }, { background: [] }],
                  [{ align: [] }],
                  [{ list: 'ordered' }, { list: 'bullet' }, { list: 'check' }],
                  [{ indent: '-1' }, { indent: '+1' }],
                  [{ direction: 'rtl' }],
                  ['blockquote', 'code-block'],
                  ['link', 'image', 'video', 'formula'],
                  ['clean']
                ],
                handlers: {
                  'text-shadow': function() {
                    const range = this.quill.getSelection();
                    if (range) {
                      const shadow = prompt('Enter text shadow (e.g., 2px 2px 4px rgba(0,0,0,0.5))');
                      if (shadow) {
                        this.quill.format('text-shadow', shadow);
                      }
                    }
                  },
                  'gradient': function() {
                    const range = this.quill.getSelection();
                    if (range) {
                      const gradient = prompt('Enter gradient (e.g., linear-gradient(45deg, #ff0000, #0000ff))');
                      if (gradient) {
                        this.quill.format('gradient', gradient);
                      }
                    }
                  },
                  'line-height': function() {
                    const range = this.quill.getSelection();
                    if (range) {
                      const lineHeight = prompt('Enter line height (e.g., 1.5, 2, 2.5)');
                      if (lineHeight) {
                        this.quill.format('line-height', lineHeight);
                      }
                    }
                  },
                  'letter-spacing': function() {
                    const range = this.quill.getSelection();
                    if (range) {
                      const letterSpacing = prompt('Enter letter spacing (e.g., 1px, 2px, 0.1em)');
                      if (letterSpacing) {
                        this.quill.format('letter-spacing', letterSpacing);
                      }
                    }
                  }
                }
              },
              history: {
                delay: 2000,
                maxStack: 500,
                userOnly: true
              },
              clipboard: {
                matchVisual: false
              }
            },
            formats: [
              'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike',
              'script', 'color', 'background', 'align', 'list', 'indent', 'direction',
              'blockquote', 'code-block', 'link', 'image', 'video', 'formula',
              'text-shadow', 'gradient', 'line-height', 'letter-spacing'
            ]
          });

          // Set initial content
          const content = textElement?.content || initialContent;
          if (content && content !== 'Enter rich text content...') {
            // Check if content is HTML or plain text
            if (content.includes('<') && content.includes('>')) {
              quillInstance.root.innerHTML = content;
            } else {
              quillInstance.setText(content);
            }
          }

          // Add custom toolbar buttons for advanced features
          const toolbarContainer = editorRef.current?.querySelector('.ql-toolbar');
          if (toolbarContainer) {
            // Create custom button group
            const customGroup = document.createElement('span');
            customGroup.className = 'ql-formats';
            
            // Text Shadow Button
            const shadowBtn = document.createElement('button');
            shadowBtn.className = 'ql-text-shadow';
            shadowBtn.innerHTML = '🌟';
            shadowBtn.title = 'Text Shadow';
            shadowBtn.addEventListener('click', () => {
              const range = quillInstance.getSelection();
              if (range) {
                const shadow = prompt('Enter text shadow (e.g., 2px 2px 4px rgba(0,0,0,0.5))', '2px 2px 4px rgba(0,0,0,0.3)');
                if (shadow) {
                  quillInstance.format('text-shadow', shadow);
                }
              }
            });
            
            // Gradient Text Button
            const gradientBtn = document.createElement('button');
            gradientBtn.className = 'ql-gradient';
            gradientBtn.innerHTML = '🎨';
            gradientBtn.title = 'Gradient Text';
            gradientBtn.addEventListener('click', () => {
              const range = quillInstance.getSelection();
              if (range) {
                const gradient = prompt('Enter gradient (e.g., linear-gradient(45deg, #ff0000, #0000ff))', 'linear-gradient(45deg, #48aff0, #ff6b6b)');
                if (gradient) {
                  quillInstance.format('gradient', gradient);
                }
              }
            });
            
            // Line Height Button
            const lineHeightBtn = document.createElement('button');
            lineHeightBtn.className = 'ql-line-height';
            lineHeightBtn.innerHTML = '📏';
            lineHeightBtn.title = 'Line Height';
            lineHeightBtn.addEventListener('click', () => {
              const range = quillInstance.getSelection();
              if (range) {
                const lineHeight = prompt('Enter line height (e.g., 1.5, 2, 2.5)', '1.5');
                if (lineHeight) {
                  quillInstance.format('line-height', lineHeight);
                }
              }
            });
            
            // Letter Spacing Button
            const letterSpacingBtn = document.createElement('button');
            letterSpacingBtn.className = 'ql-letter-spacing';
            letterSpacingBtn.innerHTML = '↔️';
            letterSpacingBtn.title = 'Letter Spacing';
            letterSpacingBtn.addEventListener('click', () => {
              const range = quillInstance.getSelection();
              if (range) {
                const letterSpacing = prompt('Enter letter spacing (e.g., 1px, 2px, 0.1em)', '1px');
                if (letterSpacing) {
                  quillInstance.format('letter-spacing', letterSpacing);
                }
              }
            });
            
            // Add buttons to custom group
            customGroup.appendChild(shadowBtn);
            customGroup.appendChild(gradientBtn);
            customGroup.appendChild(lineHeightBtn);
            customGroup.appendChild(letterSpacingBtn);
            
            // Insert custom group into toolbar
            toolbarContainer.appendChild(customGroup);
            
            // Add keyboard shortcuts
            if (quillInstance.keyboard) {
              quillInstance.keyboard.addBinding({ key: 'B', ctrlKey: true, shiftKey: true }, () => {
                const range = quillInstance.getSelection();
                if (range) {
                  quillInstance.format('text-shadow', '2px 2px 4px rgba(0,0,0,0.3)');
                }
              });
              
              quillInstance.keyboard.addBinding({ key: 'G', ctrlKey: true, shiftKey: true }, () => {
                const range = quillInstance.getSelection();
                if (range) {
                  quillInstance.format('gradient', 'linear-gradient(45deg, #48aff0, #ff6b6b)');
                }
              });
            }
          }

          // Add event listeners
          quillInstance.on('text-change', handleTextChange);
          
          setQuill(quillInstance);
          setStatus('ready');
        }

      } catch (error) {
        console.error('Failed to initialize rich text editor:', error);
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
        
        if (textElement) {
          updateElement(textElement.id, {
            ...textElement,
            content: html,
            richText: true,
            imageData
          });
        }
        
        setStatus('ready');
      } catch (error) {
        console.error('Apply changes failed:', error);
        setStatus('ready');
      }
    }
  }, [quill, onTextUpdate, textElement, updateElement, convertToImage]);

  const getStatusMessage = () => {
    switch (status) {
      case 'loading': return '⏳ Loading rich text editor...';
      case 'ready': return '✅ Editor ready';
      case 'converting': return '🔄 Converting to canvas image...';
      default: return '';
    }
  };

  if (status === 'loading') {
    return (
      <EditorContainer>
        <EditorHeader>
          <EditorTitle>Rich Text Editor</EditorTitle>
          {onClose && <CloseButton onClick={onClose}>×</CloseButton>}
        </EditorHeader>
        <EditorContent>
          <LoadingState>Loading rich text editor...</LoadingState>
        </EditorContent>
      </EditorContainer>
    );
  }

  return (
    <EditorContainer data-testid="rich-text-editor">
      <EditorHeader>
        <EditorTitle>Rich Text Editor</EditorTitle>
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
            {status === 'converting' ? 'Converting...' : 'Apply Changes'}
          </Button>
        </ActionButtons>
      </EditorContent>
    </EditorContainer>
  );
};