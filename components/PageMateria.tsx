
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storage } from './storage';
import LazyImage from './LazyImage';
import { Work, GalleryItem } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE } from '../constants';

// Imagem oficial permanente para 'ruídos de perto'
const RUIDOS_OFFICIAL_IMG = 'https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg';
const TARGET_WORK_ID = 'seed-work-1732073295300-470b4o69';

const formatImageUrl = (url: string): string => {
  if (!url || url.trim() === '') return DEFAULT_IMAGE;
  if (url.startsWith('data:image')) return url;
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit)?/) || url.match(/[?&]id=(.+?)(&|$)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
};

const getWorkCover = (work: Work): string => {
  if (work.id === TARGET_WORK_ID || work.title.toLowerCase().trim() === 'ruídos de perto') {
    if (!work.imageUrl || work.imageUrl === DEFAULT_IMAGE || work.imageUrl === RUIDOS_OFFICIAL_IMG) {
      return RUIDOS_OFFICIAL_IMG;
    }
  }
  return formatImageUrl(work.imageUrl);
};

// Embed Helper Function Inteligente (Reutilizado)
const getEmbedUrl = (input: string): string => {
  if (!input) return input;
  const cleanInput = input.trim();
  if (cleanInput.includes('<iframe')) {
      const srcMatch = cleanInput.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) {
          let url = srcMatch[1];
          if (url.includes('open.spotify.com') && !url.includes('/embed/')) {
              url = url.replace('spotify.com/', 'spotify.com/embed/');
          }
          return url;
      }
  }
  if (cleanInput.includes('youtube.com') || cleanInput.includes('youtu.be')) {
    const videoId = cleanInput.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([\w-]{11}))/)?.[1];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  if (cleanInput.includes('spotify.com') && !cleanInput.includes('/embed/')) {
      const baseUrl = cleanInput.split('?')[0]; 
      return baseUrl.replace('spotify.com/', 'spotify.com/embed/');
  }
  return cleanInput;
};

// Componente Botão Voltar ao Topo
const BackToTop = ({ targetId }: { targetId?: string }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    
    const handleScroll = () => {
      const currentScroll = targetId && scrollTarget instanceof HTMLElement 
         ? scrollTarget.scrollTop 
         : window.scrollY;
         
      setVisible(currentScroll > 300);
    };

    if (scrollTarget) {
        scrollTarget.addEventListener('scroll', handleScroll);
    }
    return () => {
        if (scrollTarget) scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [targetId]);

  const scrollToTop = () => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    if (scrollTarget) {
       scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={`
        fixed bottom-8 right-8 z-[80] w-12 h-12 rounded-full 
        flex items-center justify-center 
        bg-white/10 [.light-mode_&]:bg-black/5 hover:bg-[var(--accent)] [.light-mode_&]:hover:bg-[var(--accent)]
        text-white [.light-mode_&]:text-black hover:text-black
        border border-white/10 [.light-mode_&]:border-black/10 hover:border-transparent
        transition-all duration-500 transform
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
      `}
      title="voltar ao topo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </button>
  );
};

interface ZoomableImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, className, onClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const transform = useRef({ scale: 1, x: 0, y: 0 });
  const isDragging = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef<number | null>(null);

  const updateTransform = () => {
    if (imgRef.current) {
      const { scale, x, y } = transform.current;
      imgRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    }
  };

  const clampPosition = () => {
    if (!imgRef.current || !containerRef.current) return;
    
    const { scale, x, y } = transform.current;
    const containerRect = containerRef.current.getBoundingClientRect();
    
    const scaledWidth = imgRef.current.offsetWidth * scale;
    const scaledHeight = imgRef.current.offsetHeight * scale;

    const maxOffsetX = Math.max(0, (scaledWidth - containerRect.width) / 2);
    const maxOffsetY = Math.max(0, (scaledHeight - containerRect.height) / 2);

    transform.current.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, x));
    transform.current.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, y));
    
    updateTransform();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const delta = -e.deltaY * 0.002;
    const newScale = Math.min(Math.max(1, transform.current.scale + delta), 5);
    
    transform.current.scale = newScale;
    
    if (newScale === 1) {
      transform.current.x = 0;
      transform.current.y = 0;
    } else {
       clampPosition();
    }
    
    updateTransform();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      startPan.current = { 
        x: e.touches[0].clientX - transform.current.x, 
        y: e.touches[0].clientY - transform.current.y 
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
      
      const delta = dist - lastTouchDistance.current;
      const zoomSpeed = 0.005;
      const newScale = Math.min(Math.max(1, transform.current.scale + delta * zoomSpeed), 5);
      
      transform.current.scale = newScale;
      lastTouchDistance.current = dist;
      
      if (newScale === 1) {
        transform.current.x = 0;
        transform.current.y = 0;
      } else {
        clampPosition();
      }
      updateTransform();
      e.stopPropagation(); 
    } else if (e.touches.length === 1 && isDragging.current && transform.current.scale > 1) {
      e.preventDefault(); 
      e.stopPropagation(); 
      const x = e.touches[0].clientX - startPan.current.x;
      const y = e.touches[0].clientY - startPan.current.y;
      
      transform.current.x = x;
      transform.current.y = y;
      clampPosition(); 
    }
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
    lastTouchDistance.current = null;
    clampPosition();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (transform.current.scale > 1) {
      isDragging.current = true;
      startPan.current = { 
        x: e.clientX - transform.current.x, 
        y: e.clientY - transform.current.y 
      };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && transform.current.scale > 1) {
      e.preventDefault();
      const x = e.clientX - startPan.current.x;
      const y = e.clientY - startPan.current.y;
      
      transform.current.x = x;
      transform.current.y = y;
      clampPosition();
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (transform.current.scale > 1) {
        transform.current = { scale: 1, x: 0, y: 0 };
    } else {
        transform.current = { scale: 2.5, x: 0, y: 0 };
    }
    updateTransform();
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center touch-none ${className}`}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleTap}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        onClick={onClick}
        className="max-w-full max-h-full object-contain transition-transform duration-75 ease-linear will-change-transform cursor-grab active:cursor-grabbing"
        style={{ 
          transformOrigin: 'center center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
        draggable={false}
      />
    </div>
  );
};

// Componente para renderizar item da galeria (Imagem ou Vídeo)
const GalleryItemRenderer: React.FC<{ 
    item: GalleryItem | string; 
    alt: string; 
    isActive: boolean;
    onClick?: () => void 
}> = ({ item, alt, isActive, onClick }) => {
    const isObject = typeof item === 'object';
    const type = isObject ? (item as GalleryItem).type : 'image';
    const url = isObject ? (item as GalleryItem).url : (item as string);
    const cover = isObject ? (item as GalleryItem).coverUrl : null;
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => {
        if (!isActive) setIsPlaying(false);
    }, [isActive]);

    if (type === 'video') {
        const embedUrl = getEmbedUrl(url);
        
        if (cover && !isPlaying) {
            return (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                    <img src={formatImageUrl(cover)} className="w-full h-full object-contain opacity-70" />
                    <button 
                        onClick={() => setIsPlaying(true)}
                        className="absolute inset-0 flex items-center justify-center group"
                    >
                        <div className="w-16 h-16 rounded-full border border-white/20 bg-black/50 backdrop-blur flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M8 5v14l11-7z"/></svg>
                        </div>
                    </button>
                </div>
            );
        }

        return (
            <div className="w-full h-full bg-black flex items-center justify-center">
                <iframe 
                    src={embedUrl} 
                    className="w-full h-full max-w-full max-h-full aspect-video" 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                ></iframe>
            </div>
        );
    }

    // Default Image
    const isGradient = url.includes('gradient');
    if (isGradient) {
        return <div className="w-full h-full cursor-pointer" style={{ background: url }} onClick={onClick}></div>;
    }

    return (
        <ZoomableImage 
            src={formatImageUrl(url)}
            alt={alt}
            className="w-full h-full"
            onClick={onClick}
        />
    );
};

interface WorkModalProps {
  work: Work;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const WorkModal: React.FC<WorkModalProps> = ({ work, onClose, onNext, onPrev }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareLabel, setShareLabel] = useState('compartilhar');

  const galleryItems = useMemo(() => {
    // Normaliza tudo para GalleryItem
    const items: (GalleryItem | string)[] = [];
    items.push({ type: 'image', url: getWorkCover(work) }); // Capa sempre primeiro
    
    if (work.gallery && Array.isArray(work.gallery)) {
        items.push(...work.gallery);
    }
    
    // Filter empty URLs just in case
    return items.filter(item => {
        if (typeof item === 'string') return item.trim() !== '';
        return item.url && item.url.trim() !== '';
    });
  }, [work]);

  useEffect(() => {
    setCurrentSlide(0);
    setIsGalleryOpen(false);
  }, [work]);

  // Navegação interna da galeria (Slides)
  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentSlide(prev => (prev + 1) % galleryItems.length);
  };

  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentSlide(prev => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const handleShare = () => {
    const url = `${window.location.origin}?work=${work.id}`;
    navigator.clipboard.writeText(url).then(() => {
        setShareLabel('copiado!');
        setTimeout(() => setShareLabel('compartilhar'), 2000);
    });
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (isFullscreen) {
         if (e.key === 'Escape') setIsFullscreen(false);
         if (e.key === 'ArrowRight') handleNextSlide();
         if (e.key === 'ArrowLeft') handlePrevSlide();
      } else if (isGalleryOpen) {
          if (e.key === 'Escape') setIsGalleryOpen(false);
      } else {
          if (e.key === 'Escape') onClose();
          if (e.key === 'ArrowRight') onNext();
          if (e.key === 'ArrowLeft') onPrev();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isGalleryOpen, isFullscreen, onClose, onNext, onPrev, galleryItems.length]);

  const hasMultipleImages = galleryItems.length > 1;
  const currentItem = galleryItems[currentSlide];

  return (
    <div className="fixed inset-0 z-[90] bg-[#050505] [.light-mode_&]:bg-[#fafafa] text-white [.light-mode_&]:text-black flex flex-col md:flex-row animate-in fade-in duration-500 font-sans pt-20 md:pt-28">
      
      {/* Botão Fechar Minimalista */}
      <button 
        onClick={onClose} 
        className="fixed top-24 right-4 md:right-8 z-[400] w-8 h-8 flex items-center justify-center text-white [.light-mode_&]:text-black hover:opacity-50 transition-opacity"
        title="fechar [esc]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      {!isGalleryOpen && !isFullscreen && (
        <>
          <button 
             onClick={onPrev}
             className="fixed top-1/2 left-2 md:left-4 -translate-y-1/2 z-[250] w-8 h-8 flex items-center justify-center bg-transparent transition-opacity hover:opacity-50 text-white [.light-mode_&]:text-black pointer-events-auto"
             title="obra anterior"
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button 
             onClick={onNext}
             className="fixed top-1/2 right-2 md:right-4 -translate-y-1/2 z-[250] w-8 h-8 flex items-center justify-center bg-transparent transition-opacity hover:opacity-50 text-white [.light-mode_&]:text-black pointer-events-auto"
             title="próxima obra"
          >
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </>
      )}

      {/* Container da Imagem/Vídeo */}
      <div className={`w-full md:w-[60%] h-[55vh] md:h-full relative bg-[#050505] [.light-mode_&]:bg-[#e5e5e5] group overflow-hidden flex items-center justify-center p-0`}>
          <GalleryItemRenderer 
             item={currentItem}
             alt={work.title}
             isActive={true}
             onClick={hasMultipleImages ? handleNextSlide : undefined}
          />
          
          {hasMultipleImages && (
              <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-30 font-mono text-[10px] md:text-xs tracking-widest bg-black/60 [.light-mode_&]:bg-white/80 backdrop-blur border border-white/10 [.light-mode_&]:border-black/10 px-3 py-1 rounded-full text-[var(--accent)] pointer-events-none">
                  {currentSlide + 1} / {galleryItems.length}
              </div>
          )}
      </div>

      <div className="w-full md:w-[40%] h-[45vh] md:h-full bg-black [.light-mode_&]:bg-white border-l border-white/5 [.light-mode_&]:border-black/5 flex flex-col justify-start md:justify-center px-6 md:px-20 relative overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-6 md:gap-10 max-w-md pt-6 pb-20 md:pt-36 md:pb-20">
              <div className="space-y-4 md:space-y-6">
                  <h2 className="font-electrolize text-3xl md:text-5xl lowercase leading-tight text-white [.light-mode_&]:text-black">
                      {work.title}
                  </h2>
              </div>

              <div className="w-8 h-px bg-[var(--accent)]"></div>
              
              <div className="flex flex-wrap gap-4">
                  <button 
                    onClick={() => setIsFullscreen(true)}
                    className="flex items-center gap-2 text-[10px] font-mono lowercase tracking-widest opacity-60 hover:opacity-100 transition-opacity border border-white/20 [.light-mode_&]:border-black/20 rounded-full px-4 py-2 hover:bg-white/5"
                  >
                    <span>⤢</span> ampliar tela
                  </button>

                  {hasMultipleImages && (
                    <button 
                      onClick={() => setIsGalleryOpen(true)}
                      className="flex items-center gap-2 text-[10px] font-mono lowercase tracking-widest opacity-60 hover:opacity-100 transition-opacity border border-white/20 [.light-mode_&]:border-black/20 rounded-full px-4 py-2 hover:bg-white/5"
                    >
                      <span>+</span> ver galeria ({galleryItems.length})
                    </button>
                  )}

                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 text-[10px] font-mono lowercase tracking-widest opacity-60 hover:opacity-100 transition-opacity border border-white/20 [.light-mode_&]:border-black/20 rounded-full px-4 py-2 hover:bg-white/5"
                  >
                    <span>∞</span> {shareLabel}
                  </button>
              </div>

              {work.description && (
                <div className="font-sans text-sm md:text-base leading-relaxed opacity-80 whitespace-pre-wrap lowercase text-neutral-300 [.light-mode_&]:text-neutral-700">
                  {work.description}
                </div>
              )}

              <div className="font-mono text-xs space-y-2 md:space-y-3 leading-relaxed opacity-60 pt-4">
                  <div className="flex gap-4">
                      <span className="opacity-50 min-w-[60px]">técnica</span>
                      <span>{work.technique}</span>
                  </div>
                  <div className="flex gap-4">
                      <span className="opacity-50 min-w-[60px]">dimensões</span>
                      <span>{work.dimensions}</span>
                  </div>
                  <div className="flex gap-4">
                      <span className="opacity-50 min-w-[60px]">ano</span>
                      <span>{MONTH_NAMES[parseInt(work.month)]} {work.year}</span>
                  </div>
              </div>
          </div>
      </div>

      {isGalleryOpen && (
         <div className="fixed inset-0 z-[300] bg-[#050505] [.light-mode_&]:bg-[#f2f2f2] overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="sticky top-0 z-50 flex justify-between items-center p-6 md:p-8 mb-8 bg-black/80 [.light-mode_&]:bg-white/80 backdrop-blur-md border-b border-white/10 [.light-mode_&]:border-black/10">
               <h3 className="font-electrolize text-lg md:text-xl lowercase opacity-80">{work.title} <span className="opacity-40">// galeria</span></h3>
               <button 
                 onClick={() => setIsGalleryOpen(false)}
                 className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900/10 text-white hover:bg-white hover:text-black border border-white/20 transition-all [.light-mode_&]:text-black [.light-mode_&]:border-black/20 [.light-mode_&]:hover:bg-black [.light-mode_&]:hover:text-white shadow-sm"
                 title="fechar galeria"
               >
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                   <line x1="18" y1="6" x2="6" y2="18"></line>
                   <line x1="6" y1="6" x2="18" y2="18"></line>
                 </svg>
               </button>
            </div>

            <div className="px-6 pb-20 pt-4 md:px-20 md:pb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
               {galleryItems.map((item, idx) => {
                  const isObj = typeof item === 'object';
                  const type = isObj ? (item as GalleryItem).type : 'image';
                  const url = isObj ? (item as GalleryItem).url : (item as string);
                  const cover = isObj ? (item as GalleryItem).coverUrl : null;

                  return (
                    <div key={idx} className="group relative break-inside-avoid">
                        <div 
                            className="w-full bg-neutral-900 [.light-mode_&]:bg-neutral-200 rounded-2xl overflow-hidden border border-white/5 [.light-mode_&]:border-black/5 aspect-square flex items-center justify-center cursor-pointer"
                            onClick={() => {
                                setCurrentSlide(idx);
                                setIsGalleryOpen(false);
                                setIsFullscreen(true);
                            }}
                        >
                            {type === 'image' ? (
                                <img 
                                    src={formatImageUrl(url)} 
                                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="relative w-full h-full">
                                    {cover ? (
                                        <img src={formatImageUrl(cover)} className="w-full h-full object-cover opacity-80" />
                                    ) : (
                                        <div className="w-full h-full bg-black/50 flex items-center justify-center">
                                            <span className="opacity-50">video_embed</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center bg-black/50">▶</div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="mt-2 text-[10px] font-mono opacity-30 group-hover:opacity-100 transition-opacity text-right lowercase">
                            {type}_{idx + 1}
                        </div>
                    </div>
                  );
               })}
            </div>
         </div>
      )}

      {isFullscreen && (
          <div 
              className="fixed inset-0 z-[300] bg-black/95 [.light-mode_&]:bg-white/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in zoom-in-95"
              onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}
          >
              <button 
                 onClick={() => setIsFullscreen(false)}
                 className="fixed top-8 right-8 z-[350] bg-black/50 text-white border border-white/20 rounded-full px-4 py-2 text-xs font-mono lowercase tracking-widest hover:bg-white hover:text-black transition-colors"
              >
                  [esc] fechar
              </button>

              {hasMultipleImages && (
                <>
                  <button 
                    onClick={handlePrevSlide}
                    className="fixed left-2 md:left-8 top-1/2 -translate-y-1/2 z-[350] w-12 h-12 flex items-center justify-center bg-transparent text-white [.light-mode_&]:text-black hover:opacity-50 pointer-events-auto transition-opacity"
                    title="anterior"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button 
                    onClick={handleNextSlide}
                    className="fixed right-2 md:right-8 top-1/2 -translate-y-1/2 z-[350] w-12 h-12 flex items-center justify-center bg-transparent text-white [.light-mode_&]:text-black hover:opacity-50 pointer-events-auto transition-opacity"
                    title="próxima"
                  >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[350] font-mono text-xs opacity-50 text-white [.light-mode_&]:text-black">
                     {currentSlide + 1} / {galleryItems.length}
                  </div>
                </>
              )}

              <div 
                className="relative w-full h-full p-0 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()} 
              >
                  <GalleryItemRenderer 
                     item={currentItem}
                     alt="visualização em tela cheia"
                     isActive={true}
                     onClick={undefined} // Desativa clique para avançar, priorizando zoom/pan da ZoomableImage
                  />
              </div>
          </div>
      )}
    </div>
  );
};

interface PageMateriaProps {
  isDarkMode?: boolean;
}

const PageMateria: React.FC<PageMateriaProps> = ({ isDarkMode = true }) => {
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [filterMonth, setFilterMonth] = useState<string>('todos');

  useEffect(() => {
    const fetchData = async () => {
      let all: Work[] = await storage.getAll('works');
      const updatedWorks = await Promise.all(all.map(async (w) => {
        if (w.id === TARGET_WORK_ID || w.title.toLowerCase().trim() === 'ruídos de perto') {
           if (!w.imageUrl || w.imageUrl === DEFAULT_IMAGE) {
             const updated = { ...w, imageUrl: RUIDOS_OFFICIAL_IMG };
             await storage.save('works', updated);
             return updated;
           }
        }
        return w;
      }));
      setAllWorks(updatedWorks.filter((w: Work) => w.isVisible));
    };
    fetchData();
  }, []);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(allWorks.map(w => w.year))).sort((a, b) => Number(b) - Number(a));
    return years;
  }, [allWorks]);

  // Lista de Obras Filtrada e Ordenada
  const displayedWorks = useMemo(() => {
    let filtered = allWorks.filter(work => {
      const matchYear = filterYear === 'todos' || work.year === filterYear;
      const matchMonth = filterMonth === 'todos' || work.month === filterMonth;
      return matchYear && matchMonth;
    });

    // Ordenação Padrão (Mais recente primeiro)
    return filtered.sort((a, b) => Number(b.id) - Number(a.id));
  }, [allWorks, filterYear, filterMonth]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [filterYear, filterMonth]);

  useEffect(() => {
    if (selectedWork) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (displayedWorks.length === 0) return;

      let cols = 1;
      if (window.innerWidth >= 1024) cols = 3;
      else if (window.innerWidth >= 768) cols = 2;

      if (focusedIndex === -1 && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault();
        setFocusedIndex(0);
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + 1, displayedWorks.length - 1));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(prev + cols, displayedWorks.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(prev - cols, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && displayedWorks[focusedIndex]) {
            handleSelectWork(displayedWorks[focusedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWork, displayedWorks, focusedIndex]);

  const handleSelectWork = async (work: Work) => {
    setSelectedWork(work);
    const updated = { ...work, views: (work.views || 0) + 1 };
    await storage.save('works', updated);
  };

  const handleNextWork = () => {
    if (!selectedWork || displayedWorks.length === 0) return;
    const currentIndex = displayedWorks.findIndex(w => w.id === selectedWork.id);
    const nextIndex = (currentIndex + 1) % displayedWorks.length;
    handleSelectWork(displayedWorks[nextIndex]);
  };

  const handlePrevWork = () => {
    if (!selectedWork || displayedWorks.length === 0) return;
    const currentIndex = displayedWorks.findIndex(w => w.id === selectedWork.id);
    const prevIndex = (currentIndex - 1 + displayedWorks.length) % displayedWorks.length;
    handleSelectWork(displayedWorks[prevIndex]);
  };

  const clearFilters = () => {
    setFilterYear('todos');
    setFilterMonth('todos');
    setFocusedIndex(-1);
  };

  if (selectedWork) {
    return (
      <WorkModal 
        work={selectedWork} 
        onClose={() => setSelectedWork(null)} 
        onNext={handleNextWork} 
        onPrev={handlePrevWork} 
      />
    );
  }

  return (
    <div className="pt-32 md:pt-40 px-6 md:px-16 pb-32 min-h-screen max-w-[1800px] mx-auto">
      <BackToTop targetId="main-scroll" />

      {/* FILTROS */}
      <div className="sticky top-20 md:top-24 z-40 mb-12 md:mb-16 flex flex-wrap items-center gap-4 md:gap-6 bg-transparent mix-blend-exclusion [.light-mode_&]:mix-blend-normal">
        <div className="flex items-center gap-3">
          <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="bg-transparent border-b border-white/20 text-xs font-mono outline-none cursor-pointer py-1 px-2 hover:border-[var(--accent)] transition-colors focus:text-[var(--accent)] [.light-mode_&]:border-black/20 text-white [.light-mode_&]:text-black"
          >
            <option value="todos" className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">ano: todos</option>
            {availableYears.map(y => <option key={y} value={y} className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">{y}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="bg-transparent border-b border-white/20 text-xs font-mono outline-none cursor-pointer py-1 px-2 hover:border-[var(--accent)] transition-colors focus:text-[var(--accent)] [.light-mode_&]:border-black/20 text-white [.light-mode_&]:text-black"
          >
            <option value="todos" className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">mês: todos</option>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i.toString()} className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">{m}</option>)}
          </select>
        </div>

        {(filterYear !== 'todos' || filterMonth !== 'todos') && (
          <button 
            onClick={clearFilters}
            className="text-[9px] font-terminal lowercase tracking-widest text-[var(--accent)] border border-[var(--accent)]/50 px-3 py-1 rounded-full hover:bg-[var(--accent)] hover:text-black transition-colors"
          >
            limpar
          </button>
        )}
      </div>

      {/* GALERIA MASONRY (MUSEUM WALL) */}
      {/* CSS Columns para criar o efeito de mosaico vertical */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 animate-in fade-in duration-1000">
        {displayedWorks.map((work) => {
          const coverImage = getWorkCover(work);
          const isGradient = coverImage.includes('gradient');
          const globalIndex = displayedWorks.findIndex(w => w.id === work.id);
          const isFocused = globalIndex === focusedIndex;
          const monthName = MONTH_NAMES[parseInt(work.month)];

          return (
            <div 
              key={work.id}
              id={`work-card-${globalIndex}`}
              className={`
                  group relative cursor-pointer break-inside-avoid mb-8
                  transition-all duration-500 ease-out 
                  ${isFocused ? 'opacity-100' : 'opacity-100 hover:opacity-100'}
              `}
              onClick={() => {
                  setFocusedIndex(globalIndex);
                  handleSelectWork(work);
              }}
            >
              {/* Imagem Container - Sem Aspect Ratio fixo, altura automática */}
              <div className="relative w-full bg-[#050505] overflow-hidden rounded-2xl [.light-mode_&]:bg-neutral-100 shadow-2xl transition-transform duration-700 group-hover:-translate-y-2 border border-white/5 [.light-mode_&]:border-black/5 group-hover:border-white/20 [.light-mode_&]:group-hover:border-black/20">
                {isGradient ? (
                    <div className="w-full aspect-square" style={{ background: coverImage }}></div>
                ) : (
                    // Ajuste na LazyImage para h-auto
                    <LazyImage 
                      src={coverImage} 
                      alt={work.title}
                      className="w-full h-auto object-cover" 
                    />
                )}
              </div>

              {/* Informações da Obra (Minimalista) */}
              <div className="mt-4 px-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                      <h4 className={`font-electrolize text-lg leading-tight transition-colors ${isFocused ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]'}`}>
                          {work.title}
                      </h4>
                      <span className="text-[var(--accent)] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                         →
                      </span>
                  </div>
                  <div className="flex justify-between items-center opacity-40 text-[10px] font-mono tracking-widest lowercase group-hover:opacity-80 transition-opacity">
                      <span>{work.year}</span>
                      <span>{monthName}</span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedWorks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-20">
          <span className="font-vt tracking-[0.4em] lowercase">vazio.</span>
        </div>
      )}
    </div>
  );
};

export default PageMateria;
