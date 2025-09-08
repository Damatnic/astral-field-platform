'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff, Loader2 } from 'lucide-react';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholderClassName?: string;
  sizes?: string;
  priority?: boolean;
  quality?: number;
  blur?: boolean;
  fallbackSrc?: string;
  onLoad?: () => void;
  onError?: (error: string) => void;
  style?: React.CSSProperties;
  loading?: 'lazy' | 'eager';
  decoding?: 'sync' | 'async' | 'auto';
}

// Generate responsive image URLs for different screen sizes
const generateResponsiveUrls = (src: string, quality: number = 75) => {
  // For production, you'd integrate with your CDN/image optimization service
  // This is a mock implementation
  const baseUrl = src.split('?')[0];
  const params = new URLSearchParams();
  params.set('q', quality.toString());
  
  return {
    mobile: `${baseUrl}?${params.toString()}&w=400&h=400`,
    tablet: `${baseUrl}?${params.toString()}&w=800&h=600`,
    desktop: `${baseUrl}?${params.toString()}&w=1200&h=800`,
    retina: `${baseUrl}?${params.toString()}&w=2400&h=1600&dpr=2`
  };
};

// Generate blur placeholder
const generateBlurDataURL = (width: number = 8, height: number = 6): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Create a simple gradient blur placeholder
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#64748b20');
    gradient.addColorStop(0.5, '#475569 30');
    gradient.addColorStop(1, '#334155 40');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

export default function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderClassName = '',
  sizes = '(max-width: 480px) 400px, (max-width: 768px) 800px, 1200px',
  priority = false,
  quality = 75,
  blur = true,
  fallbackSrc,
  onLoad,
  onError,
  style,
  loading = 'lazy',
  decoding = 'async'
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [isIntersecting, setIsIntersecting] = useState(priority);

  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isIntersecting) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
        threshold: 0.01
      }
    );

    if (containerRef.current) {
      observerRef.current.observe(containerRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, isIntersecting]);

  // Load image when it enters viewport
  useEffect(() => {
    if (!isIntersecting || isLoaded || isLoading) return;

    const loadImage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Generate responsive URLs
        const responsiveUrls = generateResponsiveUrls(src, quality);
        
        // Determine best image URL based on screen size and device pixel ratio
        const screenWidth = window.innerWidth;
        const devicePixelRatio = window.devicePixelRatio || 1;
        
        let bestUrl = src;
        
        if (devicePixelRatio >= 2) {
          bestUrl = responsiveUrls.retina;
        } else if (screenWidth <= 480) {
          bestUrl = responsiveUrls.mobile;
        } else if (screenWidth <= 768) {
          bestUrl = responsiveUrls.tablet;
        } else {
          bestUrl = responsiveUrls.desktop;
        }

        // Preload the image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.decoding = decoding;
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = bestUrl;
        });

        setCurrentSrc(bestUrl);
        setIsLoaded(true);
        setIsLoading(false);
        onLoad?.();
        
      } catch (error) {
        console.error('Failed to load image:', error);
        
        // Try fallback image
        if (fallbackSrc && fallbackSrc !== src) {
          try {
            const fallbackImg = new Image();
            await new Promise((resolve, reject) => {
              fallbackImg.onload = resolve;
              fallbackImg.onerror = reject;
              fallbackImg.src = fallbackSrc;
            });
            
            setCurrentSrc(fallbackSrc);
            setIsLoaded(true);
            setIsLoading(false);
          } catch (fallbackError) {
            const errorMsg = 'Failed to load image and fallback';
            setError(errorMsg);
            setIsLoading(false);
            onError?.(errorMsg);
          }
        } else {
          const errorMsg = 'Failed to load image';
          setError(errorMsg);
          setIsLoading(false);
          onError?.(errorMsg);
        }
      }
    };

    loadImage();
  }, [isIntersecting, src, fallbackSrc, quality, onLoad, onError, decoding]);

  const blurDataURL = blur ? generateBlurDataURL() : undefined;

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1f2937',
    ...(width && height ? { width, height } : {}),
    ...style
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={containerStyle}
    >
      <AnimatePresence mode="wait">
        {error ? (
          // Error state
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 flex items-center justify-center bg-gray-800 ${placeholderClassName}`}
          >
            <div className="flex flex-col items-center space-y-2 text-gray-400">
              <ImageOff className="w-8 h-8" />
              <span className="text-xs text-center">Image failed to load</span>
            </div>
          </motion.div>
        ) : !isLoaded ? (
          // Loading/Placeholder state
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 ${placeholderClassName}`}
          >
            {/* Blur placeholder */}
            {blur && blurDataURL && (
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-sm scale-105"
                style={{ backgroundImage: `url(${blurDataURL})` }}
              />
            )}
            
            {/* Loading spinner */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50">
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
              </div>
            )}
            
            {/* Skeleton loader */}
            {!isIntersecting && (
              <div className="absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 animate-pulse" />
            )}
          </motion.div>
        ) : (
          // Loaded image
          <motion.img
            key="image"
            ref={imgRef}
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            sizes={sizes}
            loading={priority ? 'eager' : 'lazy'}
            decoding={decoding}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth animation
            }}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              filter: isLoaded ? 'none' : 'blur(4px)',
              transition: 'filter 0.3s ease-out'
            }}
            onLoad={() => {
              setIsLoaded(true);
              setIsLoading(false);
              onLoad?.();
            }}
            onError={(e) => {
              const errorMsg = 'Image failed to load';
              setError(errorMsg);
              setIsLoading(false);
              onError?.(errorMsg);
            }}
          />
        )}
      </AnimatePresence>

      {/* Optional loading overlay for better UX */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="bg-gray-800/80 rounded-full p-3">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Hook for preloading critical images
export const usePreloadImages = (images: string[], quality: number = 85) => {
  useEffect(() => {
    if (!images.length) return;

    const preloadPromises = images.map(src => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = resolve;
        img.onerror = reject;
        
        // Generate optimized URL
        const responsiveUrls = generateResponsiveUrls(src, quality);
        const isMobile = window.innerWidth <= 480;
        img.src = isMobile ? responsiveUrls.mobile : responsiveUrls.desktop;
      });
    });

    Promise.allSettled(preloadPromises).then(results => {
      const failed = results.filter(result => result.status === 'rejected').length;
      if (failed > 0) {
        console.warn(`Failed to preload ${failed} out of ${images.length} images`);
      }
    });
  }, [images, quality]);
};

// Component for hero images with priority loading
export const HeroImage: React.FC<LazyImageProps> = (props) => (
  <LazyImage
    {...props}
    priority={true}
    loading="eager"
    quality={90}
    sizes="100vw"
  />
);

// Component for thumbnail images with aggressive lazy loading
export const ThumbnailImage: React.FC<LazyImageProps> = (props) => (
  <LazyImage
    {...props}
    priority={false}
    loading="lazy"
    quality={60}
    sizes="(max-width: 480px) 120px, 200px"
  />
);