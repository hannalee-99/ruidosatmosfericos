
import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'none';
  autoHeight?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "",
  objectFit = 'cover',
  autoHeight = false
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

  return (
    <div 
      ref={containerRef}
      className={`relative w-full overflow-hidden ${autoHeight ? 'h-auto' : 'h-full'} ${className}`}
    >
      {/* Placeholder Minimalista */}
      {!isLoaded && (
        <div 
          className="absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ease-out flex items-center justify-center opacity-10"
        >
          <div className="w-4 h-4 rounded-full border border-current animate-ping"></div>
        </div>
      )}

      {/* Imagem Real */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          className={`
            w-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
            ${autoHeight ? 'h-auto block' : 'h-full object-cover'}
            ${isLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-lg scale-95'}
          `}
          style={!autoHeight ? { objectFit } : {}}
        />
      )}
    </div>
  );
};

export default LazyImage;
