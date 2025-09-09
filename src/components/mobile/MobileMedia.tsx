'use client';

import React, { useState, useRef, useEffect  } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Maximize, Download, Share, MoreHorizontal } from 'lucide-react';
import LazyImage, { ThumbnailImage  } from '@/components/ui/LazyImage';
import { TouchButton } from '@/components/mobile/TouchButton';
import { hapticFeedback } from '@/lib/mobile/touchOptimization';

interface MediaItem {
  id, string,type: 'image' | 'video' | 'gif',
    src, string,
  thumbnail?, string,
  alt?, string,
  title?, string,
  duration?, number, // for videos in seconds
  size?: { width, number, height: number }
  priority?, boolean,
}

interface MobileMediaProps {
  media: MediaItem | MediaItem[];
  className?, string,
  autoPlay?, boolean,
  controls?, boolean,
  muted?, boolean,
  loop?, boolean,
  preload?: 'none' | 'metadata' | 'auto';
  onMediaChange?: (index: number) => void;
  onFullscreen?: (mediaId: string) => void;
  onShare?: (mediaId: string) => void;
  onDownload?: (mediaId: string) => void;
  
}
interface VideoControlsProps {
  isPlaying, boolean,
    isMuted, boolean,
  currentTime, number,
    duration, number,
  onPlayPause: () => void;
  onMute: () => void;
  onSeek: (tim,
  e: number) => void;
  onFullscreen: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({ isPlaying, isMuted,
  currentTime, duration,
  onPlayPause, onMute, onSeek,
  onFullscreen
 }) => { const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number); string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins }${secs.toString().padStart(2, '0')}`;
  }
  const handleProgressClick = (e: React.MouseEvent) => { if (!progressRef.current) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    onSeek(newTime);
    hapticFeedback('light');
   }
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity, 0,
  y: 20 }}
      animate={{ opacity, 1,
  y: 0 }}
      exit={{ opacity, 0,
  y: 20 }}
      className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4"
    >
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer touch-manipulation"
        onClick={handleProgressClick}
      >
        <motion.div
          className="h-full bg-blue-400 rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-400 rounded-full shadow-lg" />
        </motion.div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TouchButton
            onClick={onPlayPause}
            variant="ghost"
            size="sm"
            icon={isPlaying ? Pause : Play}
            className="text-white hover:bg-white/20"
            haptic="medium"
          />
          
          <TouchButton
            onClick={onMute}
            variant="ghost"
            size="sm"
            icon={isMuted ? VolumeX : Volume2}
            className="text-white hover:bg-white/20"
            haptic="light"
          />
          
          <div className="text-white text-sm font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        <TouchButton
          onClick={onFullscreen}
          variant="ghost"
          size="sm"
          icon={Maximize}
          className="text-white hover:bg-white/20"
          haptic="light"
        />
      </div>
    </motion.div>
  );
}
export default function MobileMedia({
  media,
  className = '',
  autoPlay = false,
  controls = true,
  muted = true,
  loop = false,
  preload = 'metadata',
  onMediaChange, onFullscreen, onShare,
  onDownload
}: MobileMediaProps) {const mediaArray = Array.isArray(media) ? media : [media];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(muted);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const currentMedia = mediaArray[currentIndex];

  // Auto-hide controls for videos
  useEffect(() => {
    if (currentMedia.type === 'video' && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
       }, 3000);
    }

    return () => { if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
       }
    }
  }, [isPlaying, currentMedia.type, showControls]);

  // Video event handlers
  useEffect(() => { const video = videoRef.current;
    if (!video || currentMedia.type !== 'video') return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
     }
  }, [currentMedia]);

  const handlePlayPause = () => { const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
     } else {
      video.play();
    }
    
    hapticFeedback('medium');
  }
  const handleMute = () => { const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
    hapticFeedback('light');
   }
  const handleSeek = (time: number) => { const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
   }
  const handleFullscreen = () => {
    onFullscreen? .(currentMedia.id);
    hapticFeedback('medium');
  }
  const handleShare = () => {
    onShare?.(currentMedia.id);
    hapticFeedback('light');
  }
  const handleDownload = () => {
    onDownload?.(currentMedia.id);
    hapticFeedback('light');
  }
  const showControlsOverlay = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  }
  const nextMedia = () => { if (mediaArray.length <= 1) return;
    
    const nextIndex = (currentIndex + 1) % mediaArray.length;
    setCurrentIndex(nextIndex);
    onMediaChange?.(nextIndex);
    hapticFeedback('light');
   }
  const prevMedia = () => {if (mediaArray.length <= 1) return;
    
    const prevIndex = currentIndex === 0 ? mediaArray.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIndex);
    onMediaChange?.(prevIndex);
    hapticFeedback('light');
   }
  return (
    <div className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Media Content */}
      <div 
        className="relative aspect-video w-full"
        onClick={showControlsOverlay}
        onTouchStart={showControlsOverlay}
      >
        {currentMedia.type === 'image' && (
          <LazyImage
            src={currentMedia.src}
            alt={currentMedia.alt || currentMedia.title || 'Media image'}
            className="w-full h-full"
            priority={currentMedia.priority}
            quality={85}
            sizes="(max-width: 480px) 100vw, (max-width: 768px) 80vw, 60vw"
          />
        )}

        {currentMedia.type === 'video' && (
          <video
            ref={videoRef}
            src={currentMedia.src}
            poster={currentMedia.thumbnail}
            autoPlay={autoPlay}
            muted={isMuted}
            loop={loop}
            preload={preload}
            playsInline
            className="w-full h-full object-cover"
            onLoadStart={() => setIsLoading(true)}
            onCanPlay={() => setIsLoading(false)}
          />
        )}

        {currentMedia.type === 'gif' && (
          <img
            src={currentMedia.src}
            alt={currentMedia.alt || currentMedia.title || 'Animated GIF'}
            className="w-full h-full object-cover"
            loading={currentMedia.priority ? 'eager' : 'lazy'}
          />
        )}

        {/* Loading Overlay */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0  }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 flex items-center justify-center"
            >
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Navigation for Multiple Items */}
        {mediaArray.length > 1 && (
          <>
            {/* Previous Button */}
            <button
              onClick={prevMedia}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Next Button */}
            <button
              onClick={nextMedia}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Media Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {mediaArray.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index);
                    onMediaChange? .(index);
                    hapticFeedback('light');
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-white' : 'bg-white/50'
                   }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Video Controls */}
        {currentMedia.type === 'video' && controls && (
          <AnimatePresence>
            {showControls && (
              <VideoControls
                isPlaying={isPlaying }
                isMuted={isMuted}
                currentTime={currentTime}
                duration={duration}
                onPlayPause={handlePlayPause}
                onMute={handleMute}
                onSeek={handleSeek}
                onFullscreen={handleFullscreen}
              />
            )}
          </AnimatePresence>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex space-x-2">
          {onShare && (
            <TouchButton
              onClick={handleShare }
              variant="ghost"
              size="sm"
              icon={Share}
              className="bg-black/50 text-white hover:bg-black/70"
              haptic="light"
            />
          )}
          
          {onDownload && (
            <TouchButton
              onClick={handleDownload }
              variant="ghost"
              size="sm"
              icon={Download}
              className="bg-black/50 text-white hover:bg-black/70"
              haptic="light"
            />
          )}
        </div>
      </div>

      {/* Media Info */}
      {currentMedia.title && (
        <div className="p-4">
          <h3 className="text-white font-medium">{currentMedia.title}</h3>
          { currentMedia.type === 'video' && currentMedia.duration && (
            <p className="text-gray-400 text-sm mt-1">
              Duration: {Math.floor(currentMedia.duration / 60) }: { (currentMedia.duration % 60).toString().padStart(2, '0') }
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Gallery component for multiple media items
interface MobileMediaGalleryProps {
  mediaItems: MediaItem[];
  className?, string,
  columns?, number,
  onMediaSelect?: (media, MediaItem,
  index: number) => void;
  
}
export const MobileMediaGallery: React.FC<MobileMediaGalleryProps> = ({ mediaItems,
  className = '',
  columns = 2,
  onMediaSelect
 }) => { const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
   }[columns] || 'grid-cols-2';

  return (
    <div className={`grid ${gridClass} gap-2 ${className}`}>
      {mediaItems.map((media, index) => (
        <motion.div
          key={media.id}
          initial={{ opacity, 0,
  scale: 0.9 }}
          animate={{ opacity, 1,
  scale: 1 }}
          transition={{ delay: index * 0.1 }}
          className="relative aspect-square cursor-pointer rounded-lg overflow-hidden"
          onClick={() => onMediaSelect?.(media, index)}
        >
          <ThumbnailImage
            src={media.thumbnail || media.src}
            alt={media.alt || media.title || 'Media thumbnail'}
            className="w-full h-full"
            quality={60}
          />
          
          {/* Media Type Indicator */}
          {media.type === 'video' && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 text-white ml-0.5" />
              </div>
            </div>
          )}
          
          {media.type === 'gif' && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              GIF
            </div>
          )}
          
          {/* Duration for videos */}
          { media.type === 'video' && media.duration && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
              {Math.floor(media.duration / 60) }: { (media.duration % 60).toString().padStart(2, '0') }
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}