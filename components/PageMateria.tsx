import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { storage } from './storage';
import { Work, GalleryItem, GalleryItemType } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE } from '../constants';
import LazyImage from './LazyImage';

const RUIDOS_OFFICIAL_IMG = 'https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg';
const TARGET_WORK_ID = 'seed-work-1';

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
    return RUIDOS_OFFICIAL_IMG;
  }
  return formatImageUrl(work.imageUrl);
};

const getEmbedUrl = (input: string): string => {
  if (!input) return input;
  const cleanInput = input.trim();
  if (cleanInput.includes('<iframe')) {
      const srcMatch = cleanInput.match(/src=["']([^"']+)["']/);
      if (srcMatch && srcMatch[1]) return srcMatch[1];
  }
  if (cleanInput.includes('youtube.com') || cleanInput.includes('youtu.be')) {
    const videoId = cleanInput.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)([\w-]{11}))/)?.[1];
    if (videoId) return `https://www.youtube.com/embed/${videoId}`;
  }
  return cleanInput;
};

const BackToTop = ({ targetId }: { targetId?: string }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    const handleScroll = () => {
      const currentScroll = targetId && scrollTarget instanceof HTMLElement ? scrollTarget.scrollTop : window.scrollY;
      setVisible(currentScroll > 300);
    };
    if (scrollTarget) scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    return () => { if (scrollTarget) scrollTarget.removeEventListener('scroll', handleScroll); };
  }, [targetId]);
  return (
    <button onClick={() => (targetId ? document.getElementById(targetId) : window)?.scrollTo({ top: 0, behavior: 'smooth' })}
      className={`fixed bottom-8 right-8 z-[80] w-12 h-12 rounded-full flex items-center justify-center bg-white/10 [.light-mode_&]:bg-black/5 hover:bg-[var(--accent)] text-white [.light-mode_&]:text-black hover:text-black border border-white/10 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    </button>
  );
};

const GalleryItemRenderer: React.FC<{ item: GalleryItem | string; alt: string; isActive: boolean; onClick?: () => void }> = ({ item, alt, isActive, onClick }) => {
    const isObject = typeof item === 'object' && item !== null;
    const type = isObject ? (item as GalleryItem).type : 'image';
    const url = isObject ? (item as GalleryItem).url : (item as string);
    if (type === 'video') {
        return <div className="w-full h-full bg-black flex items-center justify-center"><iframe src={getEmbedUrl(url)} className="w-full h-full aspect-video" frameBorder="0" allowFullScreen></iframe></div>;
    }
    return <LazyImage src={formatImageUrl(url)} alt={alt} className="w-full h-full" objectFit="contain" />;
};

const WorkModal: React.FC<{ work: Work; onClose: () => void; onNext: () => void; onPrev: () => void }> = memo(({ work, onClose, onNext, onPrev }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [shareLabel, setShareLabel] = useState('compartilhar');
  
  const galleryItems = useMemo(() => {
    const items: (string | GalleryItem)[] = [
      { type: 'image' as const, url: getWorkCover(work) },
      ...(work.gallery || [])
    ];
    return items.filter(i => i !== null && i !== undefined);
  }, [work]);

  const handleShare = () => {
      const shareParam = work.slug || work.id;
      const shareUrl = `${window.location.origin}${window.location.pathname}?v=${shareParam}`;
      navigator.clipboard.writeText(shareUrl);
      setShareLabel('copiado!');
      setTimeout(() => setShareLabel('compartilhar'), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#050505] [.light-mode_&]:bg-[#fafafa] text-white [.light-mode_&]:text-black block md:flex md:flex-row animate-in fade-in duration-700 font-sans pt-20 lg:pt-24 overflow-y-auto md:overflow-hidden no-scrollbar">
      
      <button onClick={onClose} className="fixed top-24 right-6 md:top-28 md:right-8 z-[160] w-10 h-10 flex items-center justify-center bg-white/5 backdrop-blur-xl rounded-full text-white [.light-mode_&]:text-black border border-white/10 hover:bg-[var(--accent)] hover:text-black transition-all">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div className="w-full md:w-[60%] h-[60vh] md:h-full relative bg-[#020202] flex items-center justify-center overflow-hidden shrink-0">
          <GalleryItemRenderer item={galleryItems[currentSlide]} alt={work.title} isActive={true} onClick={() => galleryItems.length > 1 && setCurrentSlide((currentSlide + 1) % galleryItems.length)} />
          {galleryItems.length > 1 && (
            <div className="absolute bottom-8 left-8 z-30 font-mono text-[10px] tracking-[0.5em] text-[var(--accent)] bg-black/80 px-4 py-2 rounded-full border border-white/5">
              sinal {currentSlide + 1} / {galleryItems.length}
            </div>
          )}
      </div>

      <div className="w-full md:w-[40%] min-h-[50vh] md:h-full bg-black [.light-mode_&]:bg-white border-l border-white/5 flex flex-col justify-start md:justify-center px-8 md:px-12 lg:px-20 relative md:overflow-y-auto no-scrollbar animate-in slide-in-from-right duration-1000">
          <div className="flex flex-col gap-8 max-w-md pt-12 pb-24">
              <div className="space-y-3">
                <span className="font-vt text-xs tracking-[0.4em] opacity-40 uppercase">documentação técnica</span>
                <h2 className="font-electrolize text-4xl md:text-5xl lg:text-6xl lowercase leading-none tracking-tighter">{work.title}</h2>
              </div>
              <div className="w-12 h-px bg-[var(--accent)]"></div>
              {work.description && <div className="text-sm md:text-base leading-relaxed opacity-70 whitespace-pre-wrap lowercase font-mono text-neutral-300 [.light-mode_&]:text-neutral-700">{work.description}</div>}
              
              <div className="grid grid-cols-1 gap-6 pt-4 border-t border-white/5">
                <div className="flex flex-col gap-1"><span className="font-vt text-[10px] tracking-widest opacity-30 uppercase">técnica</span><span className="font-mono text-xs opacity-80">{work.technique}</span></div>
                <div className="flex flex-col gap-1"><span className="font-vt text-[10px] tracking-widest opacity-30 uppercase">dimensões</span><span className="font-mono text-xs opacity-80">{work.dimensions}</span></div>
                <div className="flex flex-col gap-1"><span className="font-vt text-[10px] tracking-widest opacity-30 uppercase">frequência/ano</span><span className="font-mono text-xs opacity-80">{MONTH_NAMES[parseInt(work.month)]} {work.year}</span></div>
              </div>
              
              <div className="flex flex-wrap gap-3 pt-6">
                  <button onClick={() => setIsFullscreen(true)} className="text-[10px] font-mono tracking-widest bg-white/5 hover:bg-[var(--accent)] hover:text-black border border-white/10 rounded-full px-6 py-3 transition-all">ampliar</button>
                  <button onClick={handleShare} className="text-[10px] font-mono tracking-widest bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-6 py-3 transition-all">{shareLabel}</button>
              </div>
          </div>
      </div>
      {isFullscreen && <div className="fixed inset-0 z-[500] bg-black flex items-center justify-center animate-in fade-in" onClick={() => setIsFullscreen(false)}><GalleryItemRenderer item={galleryItems[currentSlide]} alt={work.title} isActive={true} /></div>}
    </div>
  );
});

const PageMateria: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [allWorks, setAllWorks] = useState<Work[]>([]);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [filterYear, setFilterYear] = useState('todos');
  const [filterMonth, setFilterMonth] = useState('todos');

  useEffect(() => {
    storage.getAll('works').then(all => {
      const works = all.filter((w: Work) => w.isVisible);
      setAllWorks(works);
      
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('v');
      if (viewParam) {
          const matchedWork = works.find(w => w.slug === viewParam || w.id === viewParam);
          if (matchedWork) {
              setSelectedWork(matchedWork);
          }
      }
    });
  }, []);

  const displayedWorks = useMemo(() => {
    return allWorks.filter(w => (filterYear === 'todos' || w.year === filterYear) && (filterMonth === 'todos' || w.month === filterMonth))
      .sort((a, b) => {
          const dateA = a.date || `${a.year}-${(parseInt(a.month) + 1).toString().padStart(2, '0')}-01`;
          const dateB = b.date || `${b.year}-${(parseInt(b.month) + 1).toString().padStart(2, '0')}-01`;
          return dateB.localeCompare(dateA);
      });
  }, [allWorks, filterYear, filterMonth]);

  const handleSelectWork = async (work: Work) => {
    setSelectedWork(work);
    storage.save('works', { ...work, views: (work.views || 0) + 1 });
    
    const shareParam = work.slug || work.id;
    try {
      if (window.location.protocol !== 'blob:') {
        window.history.pushState({}, '', `${window.location.pathname}?v=${shareParam}`);
      }
    } catch (e) {
      console.warn("History pushState bloqueado pelo ambiente:", e);
    }
  };

  const handleCloseModal = () => {
      setSelectedWork(null);
      try {
        if (window.location.protocol !== 'blob:') {
          window.history.pushState({}, '', window.location.pathname);
        }
      } catch (e) {
        console.warn("History pushState bloqueado pelo ambiente:", e);
      }
  };

  const handleNextWork = () => {
    if (!selectedWork) return;
    const idx = displayedWorks.findIndex(w => w.id === selectedWork.id);
    handleSelectWork(displayedWorks[(idx + 1) % displayedWorks.length]);
  };

  const handlePrevWork = () => {
    if (!selectedWork) return;
    const idx = displayedWorks.findIndex(w => w.id === selectedWork.id);
    handleSelectWork(displayedWorks[(idx - 1 + displayedWorks.length) % displayedWorks.length]);
  };

  if (selectedWork) return <WorkModal work={selectedWork} onClose={handleCloseModal} onNext={handleNextWork} onPrev={handlePrevWork} />;

  return (
    <div className="pt-32 md:pt-40 px-6 md:px-16 pb-32 min-h-screen max-w-[1800px] mx-auto animate-in fade-in duration-1000">
      <BackToTop targetId="main-scroll" />
      <div className="mb-12 md:mb-20">
          <h2 className="font-nabla text-7xl md:text-9xl lowercase" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>matéria</h2>
          <p className="font-vt text-sm opacity-40 tracking-[0.3em] mt-2">acervo visual unificado</p>
      </div>
      <div className="sticky top-20 z-40 mb-12 flex flex-wrap gap-4 mix-blend-exclusion [.light-mode_&]:mix-blend-normal">
        <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="bg-black/20 backdrop-blur-md border border-white/10 text-xs font-mono py-2 px-4 rounded-full outline-none text-white [.light-mode_&]:text-black">
          <option value="todos" className="bg-neutral-900">ano: todos</option>
          {Array.from(new Set(allWorks.map(w => w.year))).sort().reverse().map(y => <option key={y} value={y} className="bg-neutral-900">{y}</option>)}
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="bg-black/20 backdrop-blur-md border border-white/10 text-xs font-mono py-2 px-4 rounded-full outline-none text-white [.light-mode_&]:text-black">
          <option value="todos" className="bg-neutral-900">mês: todos</option>
          {MONTH_NAMES.map((m, i) => <option key={i} value={i.toString()} className="bg-neutral-900">{m}</option>)}
        </select>
      </div>
      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8">
        {displayedWorks.map((work) => (
          <div key={work.id} className="group relative cursor-pointer break-inside-avoid mb-8" onClick={() => handleSelectWork(work)}>
            <div className="relative w-full bg-[#050505] rounded-3xl overflow-hidden border border-white/5 transition-all duration-700 group-hover:-translate-y-2 group-hover:border-[var(--accent)]">
              <LazyImage src={getWorkCover(work)} alt={work.title} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100" />
            </div>
            <div className="mt-4 px-2 flex flex-col gap-1">
                <h4 className="font-electrolize text-xl group-hover:text-[var(--accent)] transition-colors">{work.title}</h4>
                <div className="flex justify-between opacity-30 text-[10px] font-mono tracking-widest uppercase"><span>{work.year}</span><span>{work.technique}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageMateria;