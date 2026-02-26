
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGesture } from '@use-gesture/react';

interface LightboxProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
}

const Lightbox: React.FC<LightboxProps> = ({ isOpen, onClose, src, alt }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1 });

  // Reset zoom when closed
  useEffect(() => {
    if (!isOpen) {
      setCrop({ x: 0, y: 0, scale: 1 });
    }
  }, [isOpen]);

  const bind = useGesture(
    {
      onPinch: ({ offset: [d, a], memo }) => {
        // d is the distance between fingers
        // We want to scale based on that
        setCrop(prev => ({ ...prev, scale: 1 + d / 100 }));
        return memo;
      },
      onDrag: ({ offset: [x, y] }) => {
        if (crop.scale > 1) {
          setCrop(prev => ({ ...prev, x, y }));
        }
      },
      onWheel: ({ event, memo }) => {
        // Desktop zoom with wheel
        const delta = event.deltaY;
        setCrop(prev => ({
          ...prev,
          scale: Math.min(Math.max(1, prev.scale - delta / 500), 5)
        }));
      },
      onDoubleClick: () => {
        // Toggle zoom on double click
        setCrop(prev => ({
          ...prev,
          scale: prev.scale > 1 ? 1 : 2.5,
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-sm touch-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
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
              className="max-w-[90vw] max-h-[90vh] object-contain select-none pointer-events-none rounded-sm shadow-2xl"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Lightbox;
