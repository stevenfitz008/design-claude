import React, { forwardRef, useState, useCallback } from 'react';
import { observer } from 'mobx-react-lite';
// we need observer to update component automatically on any store changes
import { styled, keyframes } from '@styles/goober-setup';
import { useTheme } from '@/contexts/ThemeProvider';
import { useImageLoader, UseImageLoaderOptions } from '@/hooks/useImageLoader';
import type { UnsplashPhoto } from '@/services/unsplashService';
import { Spinner } from '@blueprintjs/core';

// Animations
const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
`;

const blurToSharp = keyframes`
  from {
    filter: blur(10px);
    opacity: 0.8;
  }
  to {
    filter: blur(0px);
    opacity: 1;
  }
`;

const scaleIn = keyframes`
  from {
    transform: scale(1.05);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
`;

// Styled Components
const ImageContainer = styled.div<{ 
  theme: any; 
  aspectRatio?: number;
  isLoading: boolean;
}>`
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: ${props => props.aspectRatio || 'auto'};
  overflow: hidden;
  border-radius: 8px;
  background: ${props => props.theme.colors.cardBg};
  
  ${props => props.isLoading && `
    background: linear-gradient(90deg, 
      ${props.theme.colors.cardBg} 0%, 
      ${props.theme.colors.border} 50%, 
      ${props.theme.colors.cardBg} 100%
    );
    background-size: 400% 100%;
    animation: ${shimmer} 1.2s ease-in-out infinite;
  `}
`;

const ImageElement = styled.img<{
  isPlaceholder: boolean;
  isVisible: boolean;
  animationType: 'fade' | 'blur' | 'scale';
}>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  transition: all 0.3s ease;
  
  opacity: ${props => props.isVisible ? 1 : 0};
  
  ${props => props.isVisible && props.animationType === 'fade' && `
    animation: ${fadeIn} 0.4s ease-out;
  `}
  
  ${props => props.isVisible && props.animationType === 'blur' && !props.isPlaceholder && `
    animation: ${blurToSharp} 0.6s ease-out;
  `}
  
  ${props => props.isVisible && props.animationType === 'scale' && `
    animation: ${scaleIn} 0.5s ease-out;
  `}
  
  ${props => props.isPlaceholder && `
    filter: blur(5px);
    transform: scale(1.02);
  `}
`;

const LoadingOverlay = styled.div<{ theme: any; isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(2px);
  opacity: ${props => props.isVisible ? 1 : 0};
  pointer-events: ${props => props.isVisible ? 'auto' : 'none'};
  transition: opacity 0.3s ease;
  
  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    
    .loading-text {
      font-size: 12px;
      color: ${props => props.theme.colors.textSecondary};
      font-weight: 500;
    }
  }
`;

const ErrorOverlay = styled.div<{ theme: any; isVisible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  opacity: ${props => props.isVisible ? 1 : 0};
  pointer-events: ${props => props.isVisible ? 'auto' : 'none'};
  transition: opacity 0.3s ease;
  
  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 16px;
    text-align: center;
    
    .error-icon {
      font-size: 24px;
      opacity: 0.7;
    }
    
    .error-message {
      font-size: 12px;
      opacity: 0.9;
      max-width: 200px;
      line-height: 1.4;
    }
    
    .error-retry {
      background: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: white;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      cursor: pointer;
      transition: background 0.2s ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }
`;

const ImageInfo = styled.div<{ theme: any; isVisible: boolean }>`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: white;
  padding: 16px 12px 12px;
  opacity: ${props => props.isVisible ? 1 : 0};
  transform: translateY(${props => props.isVisible ? 0 : '100%'});
  transition: all 0.3s ease;
  
  .info-content {
    .photographer {
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 2px;
    }
    
    .dimensions {
      font-size: 10px;
      opacity: 0.8;
    }
    
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
      margin-top: 6px;
      
      .tag {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 9px;
        opacity: 0.9;
      }
    }
  }
`;

export interface ProgressiveImageProps {
  photo: UnsplashPhoto;
  width?: number;
  height?: number;
  aspectRatio?: number;
  animationType?: 'fade' | 'blur' | 'scale';
  showInfo?: boolean;
  showInfoOnHover?: boolean;
  enablePlaceholder?: boolean;
  loadingStrategy?: 'eager' | 'lazy' | 'viewport';
  className?: string;
  alt?: string;
  onClick?: (photo: UnsplashPhoto) => void;
  onLoad?: (src: string) => void;
  onError?: (error: string) => void;
}

export const ProgressiveImage = observer(forwardRef<HTMLDivElement, ProgressiveImageProps>(({
  photo,
  width,
  height,
  aspectRatio,
  animationType = 'blur',
  showInfo = false,
  showInfoOnHover = true,
  enablePlaceholder = true,
  loadingStrategy = 'lazy',
  className,
  alt,
  onClick,
  onLoad,
  onError,
}, ref) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const [imageElementRef, setImageElementRef] = useState<HTMLImageElement | null>(null);

  const imageLoaderOptions: UseImageLoaderOptions = {
    enablePlaceholder,
    loadingStrategy,
    onLoad,
    onError,
  };

  const {
    status,
    error,
    placeholderLoaded,
    fullImageLoaded,
    src,
    placeholderSrc,
    fullSrc,
    retry,
    setImageRef,
  } = useImageLoader(photo, width, height, imageLoaderOptions);

  const handleImageRef = useCallback((element: HTMLImageElement | null) => {
    setImageElementRef(element);
    setImageRef(element);
  }, [setImageRef]);

  const handleClick = useCallback(() => {
    onClick?.(photo);
  }, [onClick, photo]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const calculatedAspectRatio = aspectRatio || (photo.height / photo.width);
  const displayAlt = alt || photo.alt_description || photo.description || `Photo by ${photo.user.name}`;
  const shouldShowInfo = showInfo || (showInfoOnHover && isHovered);

  return (
    <ImageContainer
      ref={ref}
      theme={theme}
      aspectRatio={calculatedAspectRatio}
      isLoading={status === 'loading' && !placeholderLoaded}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Add ${displayAlt}` : displayAlt}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {/* Placeholder Image */}
      {enablePlaceholder && placeholderSrc && (
        <ImageElement
          ref={!fullImageLoaded ? handleImageRef : undefined}
          src={placeholderSrc}
          alt=""
          isPlaceholder
          isVisible={placeholderLoaded && !fullImageLoaded}
          animationType={animationType}
          draggable={false}
        />
      )}

      {/* Full Resolution Image */}
      {fullSrc && (
        <ImageElement
          ref={handleImageRef}
          src={fullSrc}
          alt={displayAlt}
          isPlaceholder={false}
          isVisible={fullImageLoaded}
          animationType={animationType}
          draggable={false}
        />
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        theme={theme}
        isVisible={status === 'loading' && !placeholderLoaded}
      >
        <div className="loading-content">
          <Spinner size={20} />
          <span className="loading-text">Loading...</span>
        </div>
      </LoadingOverlay>

      {/* Error Overlay */}
      <ErrorOverlay
        theme={theme}
        isVisible={status === 'error'}
      >
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <div className="error-message">{error || 'Failed to load image'}</div>
          <button className="error-retry" onClick={retry}>
            Retry
          </button>
        </div>
      </ErrorOverlay>

      {/* Image Info Overlay */}
      {shouldShowInfo && fullImageLoaded && (
        <ImageInfo theme={theme} isVisible={shouldShowInfo}>
          <div className="info-content">
            <div className="photographer">
              Photo by {photo.user.name}
            </div>
            <div className="dimensions">
              {photo.width.toLocaleString()} × {photo.height.toLocaleString()}
            </div>
            {photo.tags && photo.tags.length > 0 && (
              <div className="tags">
                {photo.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className="tag">
                    {tag.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </ImageInfo>
      )}
    </ImageContainer>
  );
}));

ProgressiveImage.displayName = 'ProgressiveImage';