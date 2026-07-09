
import React, { useState, useEffect, useRef } from 'react';
import { getOptimizedUrl } from '../lib/media';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
  objectFit?: 'cover' | 'contain' | 'none';
  autoHeight?: boolean;
  overflowHidden?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "",
  imgClassName = "",
  objectFit = 'cover',
  autoHeight = false,
  overflowHidden = true
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            if (containerRef.current) {
              observer.unobserve(containerRef.current);
            }
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '200px', 
        threshold: 0.01 
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  // Otimiza a URL baseada no container (estimativa de largura para mobile/desktop)
  const optimizedSrc = getOptimizedUrl(src, window.innerWidth > 768 ? 1200 : 800);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${overflowHidden ? 'overflow-hidden' : 'overflow-visible'} bg-transparent ${autoHeight ? 'h-auto' : 'h-full'} ${className}`}
    >
      {!isLoaded && (
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ease-out flex items-center justify-center opacity-10 bg-transparent"
        >
          <div className="w-4 h-4 rounded-full border border-current animate-ping"></div>
        </div>
      )}

      {isInView && (
            <img
              ref={imgRef}
              src={optimizedSrc}
              alt={alt}
              onLoad={handleImageLoad}
              className={`w-full select-none ${autoHeight ? 'h-auto block' : 'h-full object-cover'} ${isLoaded ? 'opacity-100' : 'opacity-0'} ${imgClassName}`}
              style={!autoHeight ? { objectFit } : {}}
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
      )}
    </div>
  );
};

export default LazyImage;
