
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storage } from '../lib/storage';
import { Signal, SignalBlock } from '../types';
import { DEFAULT_IMAGE } from '../constants';
import { useMeta } from '../lib/hooks';
import { getOptimizedUrl } from '../lib/media';
import SignalRenderer from './SignalRenderer';
import JsonLd from './JsonLd';

const calculateReadingTime = (blocks: SignalBlock[]): string => {
  const text = blocks
    .filter(b => b.type === 'text')
    .map(b => b.content)
    .join(' ');
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min de leitura`;
};

const ReadingProgress = () => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const modalScroll = document.getElementById('post-modal-scroll');
    const updateProgress = () => {
      if (!modalScroll) return;
      const scrollTop = modalScroll.scrollTop;
      const docHeight = modalScroll.scrollHeight - modalScroll.clientHeight;
      const scrolled = (scrollTop / docHeight) * 100;
      setWidth(scrolled);
    };
    if (modalScroll) modalScroll.addEventListener("scroll", updateProgress, { passive: true });
    return () => { if (modalScroll) modalScroll.removeEventListener("scroll", updateProgress); };
  }, []);
  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[210] bg-white/10 [.light-mode_&]:bg-black/10">
      <div className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] transition-all duration-100 ease-out" style={{ width: `${width}%` }} />
    </div>
  );
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
  const scrollToTop = () => {
    const scrollTarget = targetId ? document.getElementById(targetId) : window;
    if (scrollTarget) scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 z-[80] w-12 h-12 rounded-full flex items-center justify-center bg-black/80 [.light-mode_&]:bg-white/80 backdrop-blur-md hover:bg-[var(--accent)] text-white [.light-mode_&]:text-black hover:text-black border border-white/10 transition-all duration-500 transform ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-90 pointer-events-none'}`}
      title="voltar ao topo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    </button>
  );
};

interface PageSinaisProps {
  isDarkMode?: boolean;
  activeSignalSlug?: string | null;
  onSignalSelect?: (slug: string | null) => void;
}

const PageSinais: React.FC<PageSinaisProps> = ({ 
  isDarkMode = true, 
  activeSignalSlug,
  onSignalSelect 
}) => {
  const [posts, setPosts] = useState<Signal[]>([]);
  const [selectedPost, setSelectedPost] = useState<Signal | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);
  const [showBackButton, setShowBackButton] = useState(true);
  const lastScrollY = useRef(0);
  const { updateMeta, resetMeta } = useMeta();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const all: Signal[] = await storage.getAll('signals');
        const published = all.filter((p: Signal) => p.status === 'publicado').sort((a,b) => {
           const dA = a.date.split('/').reverse().join('-');
           const dB = b.date.split('/').reverse().join('-');
           return dB.localeCompare(dA);
        });
        setPosts(published);

        if (activeSignalSlug) {
          const post = published.find(p => p.slug === activeSignalSlug || p.id === activeSignalSlug);
          if (post) {
            setSelectedPost(post);
            const firstImage = post.coverImageUrl || post.blocks.find(b => b.type === 'image')?.content;
            updateMeta({
              title: post.seoTitle || post.title,
              description: post.seoDescription || post.subtitle || 'captura de frequências e registros de campo',
              image: post.seoImage || firstImage
            });
          }
        } else {
          setSelectedPost(null);
          resetMeta();
        }
      } catch (e) { console.error("Erro ao carregar sinais", e); }
    };
    fetchData();
  }, [activeSignalSlug, updateMeta, resetMeta]);

  useEffect(() => {
    const scrollContainer = document.getElementById('post-modal-scroll');
    if (!scrollContainer || !selectedPost) return;

    const handleScroll = () => {
      const currentScrollY = scrollContainer.scrollTop;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowBackButton(false);
      } else {
        setShowBackButton(true);
      }
      lastScrollY.current = currentScrollY;
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [selectedPost]);

  const articleSchema = useMemo(() => {
    if (!selectedPost) return null;
    const firstImage = selectedPost.coverImageUrl || selectedPost.blocks.find(b => b.type === 'image')?.content;
    const isoDate = selectedPost.date.split('/').reverse().join('-'); 
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": selectedPost.title,
      "image": [selectedPost.seoImage || firstImage || DEFAULT_IMAGE],
      "datePublished": isoDate,
      "author": [{ "@type": "Person", "name": "ruídos atmosféricos", "url": window.location.origin }]
    };
  }, [selectedPost]);

  const postImages = useMemo(() => {
    if (!selectedPost) return [];
    return selectedPost.blocks.filter(b => b.type === 'image');
  }, [selectedPost]);

  const viewingBlock = lightboxIndex >= 0 && postImages[lightboxIndex] ? postImages[lightboxIndex] : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== -1) {
        if (e.key === 'Escape') setLightboxIndex(-1);
        if (e.key === 'ArrowRight') setLightboxIndex(prev => (prev + 1) % postImages.length);
        if (e.key === 'ArrowLeft') setLightboxIndex(prev => (prev - 1 + postImages.length) % postImages.length);
      } else if (selectedPost && e.key === 'Escape') {
        handleClosePost();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, postImages.length, selectedPost]);

  const groupedPosts = useMemo(() => {
    const groups: Record<string, Signal[]> = {};
    posts.forEach(post => {
      const dateParts = post.date.split('/');
      let year = dateParts.length === 3 ? dateParts[2] : 'antigo';
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });
    return groups;
  }, [posts]);

  const years = Object.keys(groupedPosts).filter(y => groupedPosts[y].length > 0).sort((a, b) => Number(b) - Number(a));

  const handleOpenPost = async (post: Signal) => {
    if (onSignalSelect) {
      onSignalSelect(post.slug || post.id);
    } else {
      setSelectedPost(post);
    }
    const updated = { ...post, views: (post.views || 0) + 1 };
    await storage.save('signals', updated);
  };

  const handleClosePost = () => {
    if (onSignalSelect) {
      onSignalSelect(null);
    } else {
      setSelectedPost(null);
    }
  };

  if (selectedPost) {
    const readingTime = calculateReadingTime(selectedPost.blocks);
    return (
      <div id="post-modal-scroll" className="fixed inset-0 z-50 bg-[#050505] [.light-mode_&]:bg-[#f4f4f4] text-white [.light-mode_&]:text-[#111] overflow-y-auto animate-in fade-in duration-500 selection:bg-[var(--accent)] selection:text-black scroll-smooth no-scrollbar">
         {articleSchema && <JsonLd data={articleSchema} />}
         <ReadingProgress />
         <BackToTop targetId="post-modal-scroll" />
         
         <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
         
         <div 
           className={`fixed top-24 left-6 md:top-32 md:left-12 z-[110] flex items-center gap-6 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${showBackButton ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-8 pointer-events-none blur-sm'}`}
         >
            <button 
              onClick={handleClosePost} 
              className="group flex items-center gap-3 bg-black/60 [.light-mode_&]:bg-white/60 backdrop-blur-xl p-1 pr-6 rounded-full border border-white/10 [.light-mode_&]:border-black/10 hover:border-[var(--accent)] transition-all shadow-2xl"
            >
               <div className="w-10 h-10 rounded-full bg-[var(--accent)] text-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
               </div>
               <span className="font-mono text-[10px] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">voltar para sinais</span>
            </button>
         </div>

         <div className="relative z-10 max-w-6xl mx-auto pt-48 md:pt-64 px-6 md:px-12 pb-40">
            {selectedPost.coverImageUrl && (
              <div className="w-full h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden mb-16 relative">
                 <img src={getOptimizedUrl(selectedPost.coverImageUrl)} className="w-full h-full object-cover animate-in zoom-in-105 duration-1000" alt="capa" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            )}

            <header className="mb-16 md:mb-24 relative max-w-4xl mx-auto text-left">
               <div className="flex flex-col md:flex-row md:items-end justify-between border-t border-white/20 pt-4 mb-8 gap-4">
                 <div className="flex flex-wrap gap-4 font-mono text-[10px] md:text-xs tracking-widest lowercase opacity-60 items-center">
                    <span className="bg-white/10 px-2 py-1 rounded">data: {selectedPost.date}</span>
                    <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded font-bold">{readingTime}</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        alert("link copiado para compartilhar.");
                      }}
                      className="flex items-center gap-2 hover:text-[var(--accent)] transition-colors border-b border-transparent hover:border-[var(--accent)] pb-0.5"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                      compartilhar
                    </button>
                 </div>
               </div>
               <h1 className="font-electrolize text-4xl md:text-7xl lg:text-8xl leading-[1.1] md:leading-[0.9] text-[var(--accent)] mb-8 lowercase">{selectedPost.title}</h1>
               {selectedPost.subtitle && (
                 <p className="font-mono text-lg md:text-xl opacity-60 italic max-w-2xl">{selectedPost.subtitle}</p>
               )}
            </header>
            <article className="max-w-4xl mx-auto pb-32">
               <SignalRenderer signal={selectedPost} onImageClick={setLightboxIndex} />
            </article>
         </div>

         {viewingBlock && (
           <div className="fixed inset-0 z-[300] bg-[#050505]/98 flex flex-col items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setLightboxIndex(-1)}>
              <button onClick={() => setLightboxIndex(-1)} className="absolute top-8 right-8 z-[310] text-white/50 hover:text-white transition-colors">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
              {postImages.length > 1 && (
                <>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev - 1 + postImages.length) % postImages.length); }}
                    className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all z-[310]"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => (prev + 1) % postImages.length); }}
                    className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-16 h-16 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-all z-[310]"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </>
              )}
              <div className="relative max-w-full max-h-[85vh] flex flex-col items-center gap-8 px-4" onClick={e => e.stopPropagation()}>
                <img 
                  key={viewingBlock.id}
                  src={getOptimizedUrl(viewingBlock.content)} 
                  className="max-w-full max-h-[75vh] object-contain animate-in zoom-in-95 duration-500" 
                  alt="view"
                />
                {viewingBlock.caption && (
                  <div className="max-w-2xl text-center">
                    <span className="font-vt text-lg md:text-2xl text-[var(--accent)] tracking-widest lowercase border-b border-[var(--accent)]/30 pb-2 inline-block">
                      {viewingBlock.caption}
                    </span>
                  </div>
                )}
                <div className="font-mono text-[10px] opacity-40 uppercase tracking-[0.4em]">
                  {lightboxIndex + 1} / {postImages.length}
                </div>
              </div>
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="pt-32 pb-40 px-6 md:px-12 max-w-[1800px] mx-auto min-h-screen">
      <header className="mb-16 md:mb-24 flex flex-col gap-12 items-start">
        <div className="flex-shrink-0 space-y-4">
          <h2 className="font-nabla text-7xl md:text-9xl lowercase" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>sinais</h2>
          <p className="font-mono text-sm opacity-60 lowercase tracking-widest">captura de frequências e registros de campo</p>
        </div>
      </header>

      <div className="space-y-32">
        {years.map((year) => (
          <div key={year} className="relative group md:pl-24 lg:pl-32">
            <div 
              className="absolute -top-12 md:-top-16 left-0 text-6xl md:text-[10rem] font-bold font-nabla leading-none select-none pointer-events-none z-0 transition-all duration-700 opacity-10 md:group-hover:opacity-20 md:group-hover:scale-105" 
              style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}
            >
              {year}
            </div>
            <div className="relative z-10 pt-8 md:pt-16">
              {groupedPosts[year].map((post) => (
                    <div key={post.id} className="relative group/item cursor-pointer mb-24 last:mb-0" onClick={() => handleOpenPost(post)}>
                      <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-start">
                         <div className="md:w-32 flex-shrink-0 flex md:flex-col items-start md:items-start pt-2">
                            <div className="font-vt text-2xl md:text-3xl text-[var(--accent)] opacity-80">{post.date.split('/').slice(0,2).join('/')}</div>
                         </div>
                         <div className="flex-grow pl-6 md:pl-8 border-l border-white/10 md:group-hover/item:border-[var(--accent)] transition-colors py-1 flex flex-col md:flex-row gap-8 items-start md:items-center">
                            <div className="flex-grow">
                              <h3 className="text-3xl md:text-5xl font-electrolize mb-4 lowercase text-[var(--accent)]">{post.title}</h3>
                              {post.subtitle && <p className="font-mono text-sm opacity-60 lowercase line-clamp-2">{post.subtitle}</p>}
                              <p className="text-[10px] opacity-20 font-mono mt-2 tracking-widest">/{post.slug || '...'}</p>
                            </div>
                            {post.coverImageUrl && (
                              <div className="w-full md:w-48 aspect-video md:aspect-square rounded-xl overflow-hidden border border-white/10 flex-shrink-0 transition-all duration-700">
                                <img src={getOptimizedUrl(post.coverImageUrl, 300)} className="w-full h-full object-cover" alt="thumb" />
                              </div>
                            )}
                         </div>
                      </div>
                    </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageSinais;
