
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storage } from './storage';
import LazyImage from './LazyImage';
import { Work, GalleryItem } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE } from '../constants';

// --- CONSTANTES ---
const RUIDOS_OFFICIAL_IMG = 'https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg';
const TARGET_WORK_ID = 'seed-work-1732073295300-470b4o69';
const WORKS_PER_PAGE = 6;

// --- HELPERS DE SEGURANÇA ---

const safeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  return String(value).trim();
};

const formatImageUrl = (url: any): string => {
  const safeUrl = safeString(url);
  if (!safeUrl) return DEFAULT_IMAGE;
  if (safeUrl.startsWith('data:image')) return safeUrl;
  
  if (safeUrl.includes('drive.google.com')) {
    const match = safeUrl.match(/\/d\/(.+?)\/(view|edit)?/) || safeUrl.match(/[?&]id=(.+?)(&|$)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return safeUrl;
};

const getWorkCover = (work: Work): string => {
  if (!work) return DEFAULT_IMAGE;
  
  const title = safeString(work.title).toLowerCase();
  const workId = safeString(work.id);
  const imageUrl = safeString(work.imageUrl);

  if (workId === TARGET_WORK_ID || title === 'ruídos de perto') {
    if (!imageUrl || imageUrl === DEFAULT_IMAGE || imageUrl === RUIDOS_OFFICIAL_IMG) {
      return RUIDOS_OFFICIAL_IMG;
    }
  }
  
  return formatImageUrl(imageUrl);
};

const getEmbedUrl = (input: any, autoplay: boolean = false): string => {
  let url = safeString(input);
  if (!url) return '';
  
  if (url.includes('<iframe')) {
      const srcMatch = url.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) url = srcMatch[1];
  }

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([\w-]{11}))/)?.[1];
    if (videoId) {
        return `https://www.youtube.com/embed/${videoId}${autoplay ? '?autoplay=1&mute=0' : ''}`;
    }
  }
  
  if (url.includes('vimeo.com')) {
      const videoId = url.match(/(?:vimeo\.com\/|video\/)(\d+)/)?.[1];
      if (videoId) {
          return `https://player.vimeo.com/video/${videoId}${autoplay ? '?autoplay=1' : ''}`;
      }
  }

  if (url.includes('spotify.com') && !url.includes('/embed/')) {
      url = url.replace('spotify.com/', 'spotify.com/embed/');
  }
  
  return url;
};

// --- SUB-COMPONENTES ---

const BackToTop = ({ targetId }: { targetId?: string }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    
    const handleScroll = () => {
      if (!scrollTarget) return;
      const currentScroll = targetId && scrollTarget instanceof HTMLElement 
         ? scrollTarget.scrollTop 
         : window.scrollY;
      setVisible(currentScroll > 300);
    };

    if (scrollTarget) scrollTarget.addEventListener('scroll', handleScroll);
    return () => {
        if (scrollTarget) scrollTarget.removeEventListener('scroll', handleScroll);
    };
  }, [targetId]);

  const scrollToTop = () => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    if (scrollTarget) scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-[80] w-12 h-12 rounded-full flex items-center justify-center bg-white/10 [.light-mode_&]:bg-black/5 hover:bg-[var(--accent)] [.light-mode_&]:hover:bg-[var(--accent)] text-white [.light-mode_&]:text-black hover:text-black border border-white/10 [.light-mode_&]:border-black/10 hover:border-transparent transition-all duration-500 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}
      title="voltar ao topo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
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
    if (newScale === 1) { transform.current.x = 0; transform.current.y = 0; } else { clampPosition(); }
    updateTransform();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const t1 = e.touches[0]; const t2 = e.touches[1];
      lastTouchDistance.current = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      startPan.current = { x: e.touches[0].clientX - transform.current.x, y: e.touches[0].clientY - transform.current.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistance.current !== null) {
      const t1 = e.touches[0]; const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const delta = dist - lastTouchDistance.current;
      transform.current.scale = Math.min(Math.max(1, transform.current.scale + delta * 0.005), 5);
      lastTouchDistance.current = dist;
      if (transform.current.scale === 1) { transform.current.x = 0; transform.current.y = 0; } else { clampPosition(); }
      updateTransform(); e.stopPropagation();
    } else if (e.touches.length === 1 && isDragging.current && transform.current.scale > 1) {
      e.stopPropagation();
      transform.current.x = e.touches[0].clientX - startPan.current.x;
      transform.current.y = e.touches[0].clientY - startPan.current.y;
      clampPosition();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (transform.current.scale > 1) {
      isDragging.current = true;
      startPan.current = { x: e.clientX - transform.current.x, y: e.clientY - transform.current.y };
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging.current && transform.current.scale > 1) {
      e.preventDefault();
      transform.current.x = e.clientX - startPan.current.x;
      transform.current.y = e.clientY - startPan.current.y;
      clampPosition();
    }
  };

  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    if (transform.current.scale > 1) { transform.current = { scale: 1, x: 0, y: 0 }; } else { transform.current = { scale: 2.5, x: 0, y: 0 }; }
    updateTransform();
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center touch-none ${className}`}
      onWheel={handleWheel} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={() => {isDragging.current = false; lastTouchDistance.current = null; clampPosition();}}
      onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={() => isDragging.current = false} onMouseLeave={() => isDragging.current = false} onDoubleClick={handleDoubleTap}
    >
      <img ref={imgRef} src={src} alt={alt} onClick={onClick} className="max-w-full max-h-full object-contain transition-transform duration-75 ease-linear will-change-transform cursor-grab active:cursor-grabbing" draggable={false} />
    </div>
  );
};

const GalleryItemRenderer: React.FC<{ item: GalleryItem | string; alt: string; isActive: boolean; onClick?: () => void }> = ({ item, alt, isActive, onClick }) => {
    if (!item) return null;

    const isObject = typeof item === 'object';
    const type = isObject ? (item as GalleryItem).type : 'image';
    const rawUrl = isObject ? (item as GalleryItem).url : (item as string);
    const cover = isObject ? (item as GalleryItem).coverUrl : null;
    const [isPlaying, setIsPlaying] = useState(false);

    useEffect(() => { if (!isActive) setIsPlaying(false); }, [isActive]);

    const safeUrl = safeString(rawUrl);

    if (type === 'video') {
        const embedUrl = getEmbedUrl(safeUrl, true);
        return (
            <div className="w-full h-full flex items-center justify-center bg-black relative overflow-hidden group">
                {(cover && !isPlaying) ? (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center cursor-pointer z-10" onClick={(e) => { e.stopPropagation(); setIsPlaying(true); }}>
                        <img src={formatImageUrl(cover)} className="w-full h-full object-contain opacity-60 transition-all duration-500 group-hover:opacity-80 group-hover:scale-[1.02]" alt={alt} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl"><svg width="32" height="32" viewBox="0 0 24 24" fill="white" className="ml-1"><path d="M8 5v14l11-7z"/></svg></div></div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-full max-h-full aspect-video shadow-2xl bg-black">
                        <iframe src={isPlaying ? embedUrl : getEmbedUrl(safeUrl, false)} className="absolute inset-0 w-full h-full" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={alt}></iframe>
                    </div>
                )}
            </div>
        );
    }

    if (safeUrl.includes('gradient')) {
        return <div className="w-full h-full cursor-pointer" style={{ background: safeUrl }} onClick={onClick}></div>;
    }

    return <ZoomableImage src={formatImageUrl(safeUrl)} alt={alt} className="w-full h-full" onClick={onClick} />;
};

const updateMetaTags = (work: Work | null) => {
    if (!work) {
        document.title = 'ruídos atmosféricos';
        return;
    }
    
    // Título: Prioriza SEO Title, depois Título da Obra
    const pageTitle = work.seoTitle || `${safeString(work.title || 'obra').toLowerCase()} // ruídos atmosféricos`;
    document.title = pageTitle;
    
    try {
        const setMeta = (property: string, content: string) => {
            let tag = document.querySelector(`meta[property="${property}"]`);
            if (!tag) {
                tag = document.createElement('meta');
                tag.setAttribute('property', property);
                document.head.appendChild(tag);
            }
            tag.setAttribute('content', content);
        };

        // Open Graph
        setMeta('og:title', work.seoTitle || safeString(work.title).toLowerCase());
        setMeta('og:description', work.seoDescription || safeString(work.description) || 'sistemas vivos operam em desequilíbrio controlado.');
        setMeta('og:image', getWorkCover(work));
        
        // URL Update
        const workSlug = safeString(work.slug);
        const shareId = workSlug || safeString(work.id);
        const newUrl = `${window.location.pathname}?work=${encodeURIComponent(shareId)}`;
        window.history.pushState({ path: newUrl }, '', newUrl);
    } catch (e) {
        console.warn("Metadata update failed", e);
    }
};

// --- MODAL DE OBRA ---

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
    if (!work) return [];
    
    const items: (GalleryItem | string)[] = [];
    const cover = getWorkCover(work);
    
    if (cover) items.push({ type: 'image', url: cover });
    
    if (work.gallery && Array.isArray(work.gallery)) {
        work.gallery.forEach(item => {
            if (item) items.push(item);
        });
    }
    
    return items.filter(item => {
        if (!item) return false;
        if (typeof item === 'string') return safeString(item) !== '';
        if (typeof item === 'object') {
            return safeString(item.url) !== '';
        }
        return false;
    });
  }, [work]);

  useEffect(() => {
    setCurrentSlide(0);
    setIsGalleryOpen(false);
    if (work) updateMetaTags(work);
    
    return () => {
        document.title = 'ruídos atmosféricos';
        try {
            window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
        } catch(e) { console.warn("History push failed", e); }
    }
  }, [work]);

  const handleNextSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryItems.length > 0) setCurrentSlide(prev => (prev + 1) % galleryItems.length);
  };

  const handlePrevSlide = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryItems.length > 0) setCurrentSlide(prev => (prev - 1 + galleryItems.length) % galleryItems.length);
  };

  const handleShare = () => {
    const workSlug = safeString(work.slug);
    const shareId = workSlug || safeString(work.id);
    const url = `${window.location.origin}${window.location.pathname}?work=${encodeURIComponent(shareId)}`;
    navigator.clipboard.writeText(url).then(() => {
        setShareLabel('copiado!');
        setTimeout(() => setShareLabel('compartilhar'), 2000);
        if (window.mixpanel) {
            window.mixpanel.track('Work Shared', { work: work.title });
        }
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
          // Modal Aberto (View Padrão)
          if (e.key === 'Escape') {
              onClose();
          } 
          else if (e.key === 'ArrowRight') {
              onNext();
          }
          else if (e.key === 'ArrowLeft') {
              onPrev();
          }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isGalleryOpen, isFullscreen, onClose, onNext, onPrev, galleryItems.length]);

  const hasMultipleImages = galleryItems.length > 1;
  const currentItem = galleryItems[currentSlide];

  if (!currentItem) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-[#050505] [.light-mode_&]:bg-[#fafafa] text-white [.light-mode_&]:text-black flex flex-col md:flex-row animate-in fade-in duration-500 font-sans pt-20 md:pt-28">
      
      <button onClick={onClose} className="fixed top-24 right-4 md:right-8 z-[400] w-8 h-8 flex items-center justify-center text-white [.light-mode_&]:text-black hover:opacity-50 transition-opacity" title="fechar [esc]">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      {!isGalleryOpen && !isFullscreen && (
        <>
          <button onClick={onPrev} className="fixed top-1/2 left-2 md:left-4 -translate-y-1/2 z-[250] w-8 h-8 flex items-center justify-center bg-transparent transition-opacity hover:opacity-50 text-white [.light-mode_&]:text-black pointer-events-auto" title="obra anterior [seta esquerda]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
          <button onClick={onNext} className="fixed top-1/2 right-2 md:right-4 -translate-y-1/2 z-[250] w-8 h-8 flex items-center justify-center bg-transparent transition-opacity hover:opacity-50 text-white [.light-mode_&]:text-black pointer-events-auto" title="próxima obra [seta direita]"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
        </>
      )}

      {/* Main Visual Container */}
      <div className={`w-full md:w-[60%] h-[55vh] md:h-full relative bg-[#050505] [.light-mode_&]:bg-[#e5e5e5] group overflow-hidden flex items-center justify-center p-0`}>
          <GalleryItemRenderer item={currentItem} alt={safeString(work.title)} isActive={true} onClick={hasMultipleImages ? handleNextSlide : undefined} />
          {hasMultipleImages && (<div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 z-30 font-mono text-[10px] md:text-xs tracking-widest bg-black/60 [.light-mode_&]:bg-white/80 backdrop-blur border border-white/10 [.light-mode_&]:border-black/10 px-3 py-1 rounded-full text-[var(--accent)] pointer-events-none">{currentSlide + 1} / {galleryItems.length}</div>)}
      </div>

      {/* Info Container */}
      <div className="w-full md:w-[40%] h-[45vh] md:h-full bg-black [.light-mode_&]:bg-white border-l border-white/5 [.light-mode_&]:border-black/5 flex flex-col justify-start md:justify-center px-6 md:px-20 relative overflow-y-auto no-scrollbar">
          <div className="flex flex-col gap-6 md:gap-10 max-w-md pt-6 pb-20 md:pt-36 md:pb-20">
              <div className="space-y-4 md:space-y-6"><h2 className="font-electrolize text-3xl md:text-5xl lowercase leading-tight text-white [.light-mode_&]:text-black">{safeString(work.title)}</h2></div>
              <div className="w-8 h-px bg-[var(--accent)]"></div>
              
              <div className="flex flex-wrap gap-4">
                  <button onClick={() => setIsFullscreen(true)} className="flex items-center gap-2 text-[10px] font-mono lowercase tracking-widest opacity-60 hover:opacity-100 transition-opacity border border-white/20 [.light-mode_&]:border-black/20 rounded-full px-4 py-2 hover:bg-white/5"><span>⤢</span> ampliar tela</button>
                  {hasMultipleImages && (<button onClick={() => setIsGalleryOpen(true)} className="flex items-center gap-2 text-[10px] font-mono lowercase tracking-widest opacity-60 hover:opacity-100 transition-opacity border border-white/20 [.light-mode_&]:border-black/20 rounded-full px-4 py-2 hover:bg-white/5"><span>+</span> ver galeria ({galleryItems.length})</button>)}
                  <button onClick={handleShare} className="flex items-center gap-2 text-[10px] font-mono lowercase tracking-widest opacity-60 hover:opacity-100 transition-opacity border border-white/20 [.light-mode_&]:border-black/20 rounded-full px-4 py-2 hover:bg-white/5"><span>∞</span> {shareLabel}</button>
              </div>

              {work.description && (<div className="font-sans text-sm md:text-base leading-relaxed opacity-80 whitespace-pre-wrap lowercase text-neutral-300 [.light-mode_&]:text-neutral-700">{safeString(work.description)}</div>)}

              <div className="font-mono text-xs space-y-2 md:space-y-3 leading-relaxed opacity-60 pt-4">
                  <div className="flex gap-4"><span className="opacity-50 min-w-[60px]">técnica</span><span>{safeString(work.technique)}</span></div>
                  <div className="flex gap-4"><span className="opacity-50 min-w-[60px]">dimensões</span><span>{safeString(work.dimensions)}</span></div>
                  <div className="flex gap-4"><span className="opacity-50 min-w-[60px]">ano</span><span>{work.month && MONTH_NAMES[parseInt(safeString(work.month))] ? MONTH_NAMES[parseInt(safeString(work.month))] : ''} {safeString(work.year)}</span></div>
              </div>
          </div>
      </div>

      {isGalleryOpen && (
         <div className="fixed inset-0 z-[300] bg-[#050505] [.light-mode_&]:bg-[#f2f2f2] overflow-y-auto animate-in fade-in slide-in-from-bottom-10 duration-500">
            <div className="sticky top-0 z-50 flex justify-between items-center p-6 md:p-8 mb-8 bg-black/80 [.light-mode_&]:bg-white/80 backdrop-blur-md border-b border-white/10 [.light-mode_&]:border-black/10">
               <h3 className="font-electrolize text-lg md:text-xl lowercase opacity-80">{safeString(work.title)} <span className="opacity-40">// galeria</span></h3>
               <button onClick={() => setIsGalleryOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-900/10 text-white hover:bg-white hover:text-black border border-white/20 transition-all [.light-mode_&]:text-black [.light-mode_&]:border-black/20 shadow-sm" title="fechar galeria"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            </div>
            <div className="px-6 pb-20 pt-4 md:px-20 md:pb-32 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
               {galleryItems.map((item, idx) => {
                  const isObj = typeof item === 'object';
                  const type = isObj ? (item as GalleryItem).type : 'image';
                  const url = isObj ? (item as GalleryItem).url : (item as string);
                  const cover = isObj ? (item as GalleryItem).coverUrl : null;
                  return (
                    <div key={idx} className="group relative break-inside-avoid">
                        <div className="w-full bg-neutral-900 [.light-mode_&]:bg-neutral-200 rounded-2xl overflow-hidden border border-white/5 [.light-mode_&]:border-black/5 aspect-square flex items-center justify-center cursor-pointer" onClick={() => { setCurrentSlide(idx); setIsGalleryOpen(false); setIsFullscreen(true); }}>
                            {type === 'image' ? (
                                <img src={formatImageUrl(url)} className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500" loading="lazy" />
                            ) : (
                                <div className="relative w-full h-full">{cover ? (<img src={formatImageUrl(cover)} className="w-full h-full object-cover opacity-80" />) : (<div className="w-full h-full bg-black/50 flex items-center justify-center"><span className="opacity-50">video_embed</span></div>)}<div className="absolute inset-0 flex items-center justify-center"><div className="w-12 h-12 rounded-full border border-white/50 flex items-center justify-center bg-black/50">▶</div></div></div>
                            )}
                        </div>
                        <div className="mt-2 text-[10px] font-mono opacity-30 group-hover:opacity-100 transition-opacity text-right lowercase">{type}_{idx + 1}</div>
                    </div>
                  );
               })}
            </div>
         </div>
      )}

      {isFullscreen && (
          <div className="fixed inset-0 z-[300] bg-black/95 [.light-mode_&]:bg-white/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in zoom-in-95" onClick={(e) => { e.stopPropagation(); setIsFullscreen(false); }}>
              <button onClick={() => setIsFullscreen(false)} className="fixed top-8 right-8 z-[350] bg-black/50 text-white border border-white/20 rounded-full px-4 py-2 text-xs font-mono lowercase tracking-widest hover:bg-white hover:text-black transition-colors">[esc] fechar</button>
              {hasMultipleImages && (
                <>
                  <button onClick={handlePrevSlide} className="fixed left-2 md:left-8 top-1/2 -translate-y-1/2 z-[350] w-12 h-12 flex items-center justify-center bg-transparent text-white [.light-mode_&]:text-black hover:opacity-50 pointer-events-auto transition-opacity" title="anterior"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
                  <button onClick={handleNextSlide} className="fixed right-2 md:right-8 top-1/2 -translate-y-1/2 z-[350] w-12 h-12 flex items-center justify-center bg-transparent text-white [.light-mode_&]:text-black hover:opacity-50 pointer-events-auto transition-opacity" title="próxima"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
                  <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[350] font-mono text-xs opacity-50 text-white [.light-mode_&]:text-black">{currentSlide + 1} / {galleryItems.length}</div>
                </>
              )}
              <div className="relative w-full h-full p-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                  <GalleryItemRenderer item={currentItem} alt="visualização em tela cheia" isActive={true} onClick={undefined} />
              </div>
          </div>
      )}
    </div>
  );
};

// --- COMPONENTE PRINCIPAL ---

interface PageMateriaProps {
  isDarkMode?: boolean;
  setBreadcrumb?: (value: string | null) => void;
}

const PageMateria: React.FC<PageMateriaProps> = ({ isDarkMode = true, setBreadcrumb }) => {
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [visibleCount, setVisibleCount] = useState(WORKS_PER_PAGE);
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [filterMonth, setFilterMonth] = useState<string>('todos');

  // Update breadcrumb
  useEffect(() => {
    if (setBreadcrumb) {
      setBreadcrumb(selectedWork ? (selectedWork.title || 'obra') : null);
    }
  }, [selectedWork, setBreadcrumb]);

  useEffect(() => {
    const fetchData = async () => {
      try {
          let all: Work[] = await storage.getAll('works');
          if (!Array.isArray(all)) all = [];
          
          const updatedWorks = await Promise.all(all.map(async (w) => {
            if (!w) return null;
            const title = safeString(w.title).toLowerCase();
            const id = safeString(w.id);
            
            if (id === TARGET_WORK_ID || title === 'ruídos de perto') {
               if (!w.imageUrl || w.imageUrl === DEFAULT_IMAGE) {
                 const updated = { ...w, imageUrl: RUIDOS_OFFICIAL_IMG };
                 await storage.save('works', updated);
                 return updated;
               }
            }
            return w;
          }));
          
          setAllWorks(updatedWorks.filter((w): w is Work => !!w && w.isVisible));
      } catch (e) {
          console.error("Erro ao carregar obras:", e);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (allWorks.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const workParam = params.get('work');
    
    if (workParam) {
        const found = allWorks.find(w => safeString(w.id) === workParam || safeString(w.slug) === workParam);
        if (found) handleSelectWork(found);
    }
  }, [allWorks]);

  const availableYears = useMemo(() => {
    const years = Array.from(new Set(allWorks.map(w => safeString(w.year)))).filter(y => y !== '').sort((a, b) => Number(b) - Number(a));
    return years;
  }, [allWorks]);

  const displayedWorks = useMemo(() => {
    let filtered = allWorks.filter(work => {
      const matchYear = filterYear === 'todos' || safeString(work.year) === filterYear;
      const matchMonth = filterMonth === 'todos' || safeString(work.month) === filterMonth;
      return matchYear && matchMonth;
    });

    return filtered.sort((a, b) => {
        const idA = Number(a.id);
        const idB = Number(b.id);
        if (!isNaN(idA) && !isNaN(idB)) return idB - idA;
        return safeString(b.id).localeCompare(safeString(a.id));
    });
  }, [allWorks, filterYear, filterMonth]);

  useEffect(() => {
    setFocusedIndex(-1);
    setVisibleCount(WORKS_PER_PAGE);
  }, [filterYear, filterMonth]);

  const renderedWorks = useMemo(() => {
    return displayedWorks.slice(0, visibleCount);
  }, [displayedWorks, visibleCount]);

  // Teclado para Grade (Quando Modal fechado)
  useEffect(() => {
    if (selectedWork) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (renderedWorks.length === 0) return;
      let cols = 1;
      if (window.innerWidth >= 1024) cols = 3;
      else if (window.innerWidth >= 768) cols = 2;

      if (focusedIndex === -1 && ['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault(); setFocusedIndex(0); return;
      }

      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); setFocusedIndex(prev => Math.min(prev + 1, renderedWorks.length - 1)); break;
        case 'ArrowLeft': e.preventDefault(); setFocusedIndex(prev => Math.max(prev - 1, 0)); break;
        case 'ArrowDown': e.preventDefault(); setFocusedIndex(prev => Math.min(prev + cols, renderedWorks.length - 1)); break;
        case 'ArrowUp': e.preventDefault(); setFocusedIndex(prev => Math.max(prev - cols, 0)); break;
        case 'Enter': e.preventDefault(); if (focusedIndex >= 0 && renderedWorks[focusedIndex]) handleSelectWork(renderedWorks[focusedIndex]); break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWork, renderedWorks, focusedIndex]);

  const handleSelectWork = async (work: Work) => {
    if (!work) return;
    try {
        setSelectedWork(work);
        
        // Track Analytics
        if (window.mixpanel) {
            window.mixpanel.track('Work Viewed', { 
                title: work.title, 
                id: work.id, 
                technique: work.technique 
            });
        }

        const updated = { ...work, views: (work.views || 0) + 1 };
        storage.save('works', updated).catch(console.error);
    } catch (e) {
        console.error("Erro seguro ao selecionar:", e);
        setSelectedWork(work);
    }
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
    return <WorkModal work={selectedWork} onClose={() => setSelectedWork(null)} onNext={handleNextWork} onPrev={handlePrevWork} />;
  }

  return (
    <div className="pt-32 md:pt-40 px-6 md:px-16 pb-32 min-h-screen max-w-[1800px] mx-auto">
      <BackToTop targetId="main-scroll" />

      {/* HEADER */}
      <div className="mb-12 md:mb-20 mt-8 md:mt-0 animate-in fade-in slide-in-from-bottom-2 duration-700">
         <h2 className="font-nabla text-5xl md:text-7xl lowercase" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>
            matéria
         </h2>
         <p className="font-vt text-sm opacity-40 tracking-[0.3em] mt-2 lowercase">arquivo visual</p>
      </div>

      {/* FILTROS */}
      <div className="sticky top-20 md:top-24 z-40 mb-12 md:mb-16 flex flex-wrap items-center gap-4 md:gap-6 bg-transparent mix-blend-exclusion [.light-mode_&]:mix-blend-normal">
        <div className="flex items-center gap-3">
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="bg-transparent border-b border-white/20 text-xs font-mono outline-none cursor-pointer py-1 px-2 hover:border-[var(--accent)] transition-colors focus:text-[var(--accent)] [.light-mode_&]:border-black/20 text-white [.light-mode_&]:text-black">
            <option value="todos" className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">ano: todos</option>
            {availableYears.map(y => <option key={y} value={y} className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">{y}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="bg-transparent border-b border-white/20 text-xs font-mono outline-none cursor-pointer py-1 px-2 hover:border-[var(--accent)] transition-colors focus:text-[var(--accent)] [.light-mode_&]:border-black/20 text-white [.light-mode_&]:text-black">
            <option value="todos" className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">mês: todos</option>
            {MONTH_NAMES.map((m, i) => <option key={i} value={i.toString()} className="bg-neutral-900 text-white [.light-mode_&]:bg-white [.light-mode_&]:text-black">{m}</option>)}
          </select>
        </div>
        {(filterYear !== 'todos' || filterMonth !== 'todos') && (
          <button onClick={clearFilters} className="text-[9px] font-terminal lowercase tracking-widest text-[var(--accent)] border border-[var(--accent)]/50 px-3 py-1 rounded-full hover:bg-[var(--accent)] hover:text-black transition-colors">limpar</button>
        )}
      </div>

      {/* GALERIA */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 animate-in fade-in duration-1000">
        {renderedWorks.map((work, index) => {
          const coverImage = getWorkCover(work);
          const isGradient = coverImage.includes('gradient');
          const isFocused = index === focusedIndex;
          const monthIdx = parseInt(safeString(work.month));
          const monthName = !isNaN(monthIdx) && MONTH_NAMES[monthIdx] ? MONTH_NAMES[monthIdx] : '';

          return (
            <div 
              key={work.id}
              id={`work-card-${index}`}
              className={`group relative cursor-pointer break-inside-avoid mb-8 transition-all duration-300 ease-out ${isFocused ? 'opacity-100 scale-[1.02] z-10' : 'opacity-100 hover:opacity-100'}`}
              onClick={() => { setFocusedIndex(index); handleSelectWork(work); }}
            >
              <div className={`relative w-full bg-[#050505] overflow-hidden rounded-2xl [.light-mode_&]:bg-neutral-100 shadow-2xl transition-all duration-700 border ${isFocused ? 'border-[var(--accent)] shadow-[0_0_15px_rgba(159,248,93,0.3)]' : 'border-white/5 [.light-mode_&]:border-black/5 group-hover:border-white/20 [.light-mode_&]:group-hover:border-black/20 group-hover:-translate-y-2'}`}>
                {isGradient ? (
                    <div className="w-full aspect-square" style={{ background: coverImage }}></div>
                ) : (
                    <LazyImage src={coverImage} alt={safeString(work.title) || 'sem título'} className="w-full h-auto object-cover" />
                )}
              </div>
              <div className="mt-4 px-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                      <h4 className={`font-electrolize text-lg leading-tight transition-colors ${isFocused ? 'text-[var(--accent)]' : 'group-hover:text-[var(--accent)]'}`}>{safeString(work.title)}</h4>
                      <span className={`text-[var(--accent)] transition-all duration-300 ${isFocused ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`}>→</span>
                  </div>
                  <div className="flex justify-between items-center opacity-40 text-[10px] font-mono tracking-widest lowercase group-hover:opacity-80 transition-opacity">
                      <span>{safeString(work.year)}</span>
                      <span>{monthName}</span>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {displayedWorks.length > visibleCount && (
        <div className="flex justify-center mt-12 mb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <button onClick={() => setVisibleCount(prev => prev + WORKS_PER_PAGE)} className="group flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
                <span className="font-vt text-xs tracking-[0.2em] lowercase text-[var(--accent)]">carregar mais</span>
                <div className="w-px h-8 bg-current group-hover:h-12 transition-all duration-500"></div>
            </button>
        </div>
      )}

      {displayedWorks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-40 gap-6 opacity-20">
          <span className="font-vt tracking-[0.4em] lowercase">vazio.</span>
        </div>
      )}
    </div>
  );
};

export default PageMateria;
