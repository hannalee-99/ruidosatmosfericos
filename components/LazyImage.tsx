
import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = "",
  objectFit = 'cover' 
}) => {
  const [isInView, setIsInView] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    // Verificação de segurança para imagens já em cache
    if (imgRef.current && imgRef.current.complete) {
      setIsLoaded(true);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            // Uma vez visível, paramos de observar este elemento específico
            if (containerRef.current) {
              observer.unobserve(containerRef.current);
            }
            observer.disconnect();
          }
        });
      },
      { 
        rootMargin: '100px', // Inicia o carregamento 100px antes de entrar na tela
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
      className={`relative w-full h-full overflow-hidden bg-[#050505] [.light-mode_&]:bg-neutral-200/50 ${className}`}
    >
      {/* Placeholder Atmosférico (Fade Out) */}
      <div 
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-1000 ease-out ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
      >
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="w-full h-full bg-gradient-to-br from-neutral-900 via-neutral-800 to-black [.light-mode_&]:from-neutral-100 [.light-mode_&]:via-neutral-200 [.light-mode_&]:to-white animate-pulse"></div>
      </div>

      {/* Imagem Real - Opacity 100% e Sem Filtros */}
      {isInView && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          className={`
            w-full h-full 
            transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]
            ${isLoaded ? 'opacity-100 scale-100 blur-0 grayscale-0' : 'opacity-0 scale-105 blur-lg grayscale'}
            group-hover:scale-105
          `}
          style={{ objectFit }}
        />
      )}
    </div>
  );
};

export default LazyImage;
