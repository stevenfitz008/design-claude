import React, { useState, useCallback, useRef } from 'react';
import { Button, FormGroup, Label, FileInput, Alert, ProgressBar } from '@blueprintjs/core';
import { useTheme } from '@/contexts/ThemeProvider';
import { useCanvasStore } from '@/stores/canvasStore';

// Supported file types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg'];
const SUPPORTED_AUDIO_TYPES = ['audio/mp3', 'audio/wav', 'audio/ogg'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  success: string | null;
}

export const UploadPanel: React.FC = () => {
  const { theme } = useTheme();
  const { addElement } = useCanvasStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    success: null
  });
  
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File "${file.name}" is too large. Maximum size is 10MB.`;
    }

    // Check file type
    const allSupportedTypes = [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_AUDIO_TYPES];
    if (!allSupportedTypes.includes(file.type)) {
      return `File type "${file.type}" is not supported.`;
    }

    return null;
  };

  const processFile = async (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Create canvas element based on file type
        if (SUPPORTED_IMAGE_TYPES.includes(file.type)) {
          const img = new Image();
          img.onload = () => {
            const element = {
              id: `image_${Date.now()}`,
              type: 'image' as const,
              x: 100,
              y: 100,
              width: Math.min(img.width, 400),
              height: Math.min(img.height, 300),
              rotation: 0,
              scaleX: 1,
              scaleY: 1,
              opacity: 1,
              visible: true,
              locked: false,
              zIndex: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              src: result,
              originalWidth: img.width,
              originalHeight: img.height,
              fit: 'contain',
              fileName: file.name,
              fileSize: file.size
            };
            
            addElement(element);
            resolve();
          };
          img.onerror = () => reject(new Error('Failed to load image'));
          img.src = result;
        } else if (SUPPORTED_VIDEO_TYPES.includes(file.type)) {
          // For video files, create a video element
          const element = {
            id: `video_${Date.now()}`,
            type: 'video' as const,
            x: 100,
            y: 100,
            width: 320,
            height: 240,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            src: result,
            fileName: file.name,
            fileSize: file.size,
            autoplay: false,
            controls: true,
            muted: false
          };
          
          addElement(element);
          resolve();
        } else if (SUPPORTED_AUDIO_TYPES.includes(file.type)) {
          // For audio files, create an audio element
          const element = {
            id: `audio_${Date.now()}`,
            type: 'audio' as const,
            x: 100,
            y: 100,
            width: 300,
            height: 60,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
            visible: true,
            locked: false,
            zIndex: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            src: result,
            fileName: file.name,
            fileSize: file.size,
            autoplay: false,
            controls: true,
            muted: false
          };
          
          addElement(element);
          resolve();
        } else {
          reject(new Error('Unsupported file type'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Limit number of files
    if (fileArray.length > MAX_FILES) {
      setUploadState(prev => ({
        ...prev,
        error: `Too many files. Maximum ${MAX_FILES} files allowed.`
      }));
      return;
    }

    // Validate all files first
    for (const file of fileArray) {
      const error = validateFile(file);
      if (error) {
        setUploadState(prev => ({ ...prev, error }));
        return;
      }
    }

    // Process files
    setUploadState({ uploading: true, progress: 0, error: null, success: null });
    
    try {
      let completed = 0;
      
      for (const file of fileArray) {
        await processFile(file);
        completed++;
        setUploadState(prev => ({
          ...prev,
          progress: (completed / fileArray.length) * 100
        }));
      }
      
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        success: `Successfully uploaded ${fileArray.length} file${fileArray.length > 1 ? 's' : ''}`
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setUploadState(prev => ({ ...prev, success: null, progress: 0 }));
      }, 3000);
      
    } catch (error) {
      setUploadState({
        uploading: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Upload failed',
        success: null
      });
    }
  };

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  }, []);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      {/* Upload Area */}
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
          Upload Media
        </div>

        {/* Drag and Drop Area */}
        <div
          style={{
            border: `2px dashed ${isDragOver ? theme.colors?.primary || '#48aff0' : theme.colors?.border || '#495563'}`,
            borderRadius: '8px',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor: isDragOver ? 'rgba(72, 175, 240, 0.1)' : 'transparent',
            marginBottom: '16px'
          }}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
          role="button"
          tabIndex={0}
          aria-label="Upload files"
        >
          <div style={{
            fontSize: '16px',
            color: theme.colors?.textPrimary || '#f5f8fa',
            marginBottom: '8px'
          }}>
            📁
          </div>
          <div style={{
            fontSize: '13px',
            color: theme.colors?.textPrimary || '#f5f8fa',
            marginBottom: '4px',
            fontWeight: 500
          }}>
            {isDragOver ? 'Drop files here' : 'Drag files here or click to browse'}
          </div>
          <div style={{
            fontSize: '11px',
            color: theme.colors?.textSecondary || '#a7b6c2'
          }}>
            Images, Videos, Audio • Max {formatFileSize(MAX_FILE_SIZE)} • Up to {MAX_FILES} files
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={[...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_VIDEO_TYPES, ...SUPPORTED_AUDIO_TYPES].join(',')}
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
        />

        {/* Progress Bar */}
        {uploadState.uploading && (
          <div style={{ marginBottom: '16px' }}>
            <ProgressBar
              value={uploadState.progress / 100}
              animate={true}
              stripes={true}
            />
            <div style={{
              fontSize: '11px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              Uploading... {Math.round(uploadState.progress)}%
            </div>
          </div>
        )}

        {/* Error Alert */}
        {uploadState.error && (
          <Alert
            intent="danger"
            onClose={() => setUploadState(prev => ({ ...prev, error: null }))}
            style={{ marginBottom: '16px' }}
          >
            {uploadState.error}
          </Alert>
        )}

        {/* Success Alert */}
        {uploadState.success && (
          <Alert
            intent="success"
            onClose={() => setUploadState(prev => ({ ...prev, success: null }))}
            style={{ marginBottom: '16px' }}
          >
            {uploadState.success}
          </Alert>
        )}

        {/* Upload Button */}
        <Button
          onClick={openFileDialog}
          disabled={uploadState.uploading}
          fill
          large
          icon="upload"
        >
          {uploadState.uploading ? 'Uploading...' : 'Select Files'}
        </Button>
      </div>

      {/* File Type Information */}
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
          Supported File Types
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Images */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: theme.colors?.textPrimary || '#f5f8fa',
              marginBottom: '6px'
            }}>
              Images
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              lineHeight: 1.4
            }}>
              JPEG, PNG, GIF, WebP, SVG
            </div>
          </div>

          {/* Videos */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: theme.colors?.textPrimary || '#f5f8fa',
              marginBottom: '6px'
            }}>
              Videos
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              lineHeight: 1.4
            }}>
              MP4, WebM, OGG
            </div>
          </div>

          {/* Audio */}
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 500,
              color: theme.colors?.textPrimary || '#f5f8fa',
              marginBottom: '6px'
            }}>
              Audio
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              lineHeight: 1.4
            }}>
              MP3, WAV, OGG
            </div>
          </div>
        </div>

        {/* Upload Tips */}
        <div style={{ marginTop: '24px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            color: theme.colors?.textPrimary || '#f5f8fa',
            marginBottom: '12px'
          }}>
            Tips
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              lineHeight: 1.4
            }}>
              • Images will be resized to fit the canvas while maintaining aspect ratio
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              lineHeight: 1.4
            }}>
              • Videos and audio files include playback controls
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              lineHeight: 1.4
            }}>
              • Maximum file size: {formatFileSize(MAX_FILE_SIZE)}
            </div>
            <div style={{
              fontSize: '10px',
              color: theme.colors?.textSecondary || '#a7b6c2',
              lineHeight: 1.4
            }}>
              • Upload up to {MAX_FILES} files at once
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

UploadPanel.displayName = 'UploadPanel';