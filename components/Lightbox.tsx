
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  images?: { src: string; alt: string }[];
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

const Lightbox: React.FC<LightboxProps> = ({ 
  isOpen, 
  onClose, 
  src, 
  alt, 
  images, 
  currentIndex, 
  onIndexChange 
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1 });

  // Reset zoom when closed or when active image changes
  useEffect(() => {
    setCrop({ x: 0, y: 0, scale: 1 });
  }, [isOpen, src]);

  const bind = useGesture(
    {
      onPinch: ({ offset: [d, a], memo }) => {
        // d is the distance between fingers
        // Limit maximum scale to 1.8 to avoid extreme, pixelated zoom
        const rawScale = 1 + d / 100;
        const limitedScale = Math.min(Math.max(1, rawScale), 1.8);
        setCrop(prev => ({ ...prev, scale: limitedScale }));
        return memo;
      },
      onDrag: ({ offset: [x, y] }) => {
        if (crop.scale > 1) {
          setCrop(prev => ({ ...prev, x, y }));
        }
      },
      onWheel: ({ event, memo }) => {
        // Desktop zoom with wheel - limited to max 1.8 for clean, polished detailing
        const delta = event.deltaY;
        setCrop(prev => ({
          ...prev,
          scale: Math.min(Math.max(1, prev.scale - delta / 500), 1.8)
        }));
      },
      onDoubleClick: () => {
        // Toggle zoom on double click - toggle to a safe 1.5 scale
        setCrop(prev => ({
          ...prev,
          scale: prev.scale > 1 ? 1 : 1.5,
          x: 0,
          y: 0
        }));
      }
    },
    {
      drag: { from: () => [crop.x, crop.y] }
    }
  );

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Handle keyboard events (Escape to close, Left/Right for gallery navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'ArrowRight' && images && currentIndex !== undefined && onIndexChange) {
        e.stopPropagation();
        if (currentIndex < images.length - 1) {
          onIndexChange(currentIndex + 1);
        } else {
          onIndexChange(0);
        }
      } else if (e.key === 'ArrowLeft' && images && currentIndex !== undefined && onIndexChange) {
        e.stopPropagation();
        if (currentIndex > 0) {
          onIndexChange(currentIndex - 1);
        } else {
          onIndexChange(images.length - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose, images, currentIndex, onIndexChange]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-sm touch-none select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 z-[1010] w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Gallery Navigation Arrows */}
          {images && images.length > 1 && currentIndex !== undefined && onIndexChange && (
            <>
              {/* Left Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentIndex > 0) {
                    onIndexChange(currentIndex - 1);
                  } else {
                    onIndexChange(images.length - 1);
                  }
                }}
                className="absolute left-4 md:left-8 z-[1010] w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/25 text-white hover:text-[var(--accent)] transition-all border border-white/10"
                title="imagem anterior (←)"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              {/* Right Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentIndex < images.length - 1) {
                    onIndexChange(currentIndex + 1);
                  } else {
                    onIndexChange(0);
                  }
                }}
                className="absolute right-4 md:right-8 z-[1010] w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/25 text-white hover:text-[var(--accent)] transition-all border border-white/10"
                title="próxima imagem (→)"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>

              {/* Counter indicator */}
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-[1010] font-mono text-[10px] uppercase tracking-[0.25em] text-white/50 bg-black/40 px-3 py-1 rounded-full border border-white/5">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Zoom Info (Mobile) */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[1010] font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 pointer-events-none">
            {crop.scale > 1 ? 'arraste para navegar // duplo clique para resetar' : 'pinça para zoom // duplo clique para ampliar'}
          </div>

          <motion.div
            {...(bind() as any)}
            style={{
              x: crop.x,
              y: crop.y,
              scale: crop.scale,
              cursor: crop.scale > 1 ? 'grab' : 'zoom-in'
            }}
            className="relative max-w-full max-h-full flex items-center justify-center"
          >
            <img
              src={src}
              alt={alt}
              className="max-w-[90vw] max-h-[90vh] object-contain select-none pointer-events-none"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;
