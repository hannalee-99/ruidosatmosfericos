
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { storage } from '../lib/storage';
import { Signal, SignalBlock } from '../types';
import { DEFAULT_IMAGE } from '../constants';
import { useMeta } from '../lib/hooks';
import { getOptimizedUrl } from '../lib/media';
import SignalRenderer from './SignalRenderer';
import JsonLd from './JsonLd';
import BackToTop from './BackToTop';
import Toast from './Toast';
import { trackSignalOpened, trackLinkShared, trackSignalSelected } from './analytics';

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
  const [showBackButton, setShowBackButton] = useState(true);
  const [showToast, setShowToast] = useState(false);
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
    if (selectedPost) {
      trackSignalOpened(selectedPost.title, selectedPost.slug || selectedPost.id);
      trackSignalSelected(selectedPost.slug || selectedPost.id, selectedPost.title);
    }
  }, [selectedPost]);

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

  const navigation = useMemo(() => {
    if (!selectedPost || posts.length <= 1) return { next: null, prev: null };
    const currentIndex = posts.findIndex(p => p.id === selectedPost.id || p.slug === selectedPost.slug);
    const prev = currentIndex > 0 ? posts[currentIndex - 1] : null;
    const next = currentIndex < posts.length - 1 ? posts[currentIndex + 1] : null;
    return { prev, next };
  }, [selectedPost, posts]);

  // Teclado para navegar entre sinais e fechar detalhe
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable
      ) {
        return;
      }

      if (!selectedPost) return;

      if (e.key === 'ArrowRight' && navigation.next) {
        e.preventDefault();
        handleOpenPost(navigation.next);
      } else if (e.key === 'ArrowLeft' && navigation.prev) {
        e.preventDefault();
        handleOpenPost(navigation.prev);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClosePost();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, navigation]);

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
    const firstImage = selectedPost.coverImageUrl || selectedPost.blocks.find(b => b.type === 'image')?.content || DEFAULT_IMAGE;
    return (
      <div id="post-modal-scroll" className="fixed inset-0 z-[150] bg-[#050505] [.light-mode_&]:bg-[#f4f4f4] text-white [.light-mode_&]:text-[#111] overflow-y-auto animate-in fade-in duration-500 selection:bg-[var(--accent)] selection:text-black scroll-smooth no-scrollbar">
         <Helmet>
           <title>{`${selectedPost.seoTitle || selectedPost.title} — ruídos atmosféricos`}</title>
           <meta name="description" content={selectedPost.seoDescription || selectedPost.subtitle || 'captura de frequências e registros de campo'} />
           <meta property="og:title" content={`${selectedPost.seoTitle || selectedPost.title} — ruídos atmosféricos`} />
           <meta property="og:description" content={selectedPost.seoDescription || selectedPost.subtitle || 'captura de frequências e registros de campo'} />
           <meta property="og:image" content={selectedPost.seoImage || firstImage} />
           <meta property="og:url" content={`${window.location.origin}/#/sinal/${selectedPost.slug || selectedPost.id}`} />
         </Helmet>
         {articleSchema && <JsonLd data={articleSchema} />}
         <ReadingProgress />
         <BackToTop targetId="post-modal-scroll" bottom="bottom-20" zIndex="z-[160]" />

         {/* Navegação por setas otimizada para Desktop/Web (combinando com Matéria) */}
         <div className="fixed inset-y-0 left-2 md:left-8 flex items-center z-[160]">
           {navigation.prev && (
             <button 
               onClick={() => handleOpenPost(navigation.prev!)}
               className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/40 md:bg-white/5 backdrop-blur-sm hover:bg-[var(--accent)] hover:text-black border border-white/10 transition-all group opacity-60 md:opacity-20 hover:opacity-100"
               title="sinal anterior (←)"
             >
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
             </button>
           )}
         </div>

         <div className="fixed inset-y-0 right-2 md:right-8 flex items-center z-[160]">
           {navigation.next && (
             <button 
               onClick={() => handleOpenPost(navigation.next!)}
               className="w-10 h-10 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-black/40 md:bg-white/5 backdrop-blur-sm hover:bg-[var(--accent)] hover:text-black border border-white/10 transition-all group opacity-60 md:opacity-20 hover:opacity-100"
               title="próximo sinal (→)"
             >
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
             </button>
           )}
         </div>
         
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

         <div className="relative z-10 max-w-5xl mx-auto pt-64 md:pt-80 px-6 md:px-12 pb-40">
            {selectedPost.coverImageUrl && (
              <div className="w-full h-[40vh] md:h-[60vh] rounded-3xl overflow-hidden mb-16 relative">
                 <img src={getOptimizedUrl(selectedPost.coverImageUrl)} className="w-full h-full object-cover animate-in zoom-in-105 duration-1000" alt="capa" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            )}

            <header className="mb-16 md:mb-24 relative max-w-3xl mx-auto text-left">
               <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                 <div className="flex flex-wrap gap-4 font-mono text-[10px] md:text-xs tracking-widest lowercase opacity-60 items-center">
                    <span className="bg-white/10 px-2 py-1 rounded">data: {selectedPost.date}</span>
                    <span className="bg-[var(--accent)]/10 text-[var(--accent)] px-2 py-1 rounded font-bold">{readingTime}</span>
                 </div>
               </div>
               <h1 className="font-electrolize text-4xl md:text-7xl lg:text-8xl leading-[1.1] md:leading-[0.9] text-[var(--accent)] mb-8 lowercase">{selectedPost.title}</h1>
               {selectedPost.subtitle && (
                 <p className="font-mono text-lg md:text-xl opacity-60 italic max-w-2xl">{selectedPost.subtitle}</p>
               )}
            </header>
            <article className="max-w-3xl mx-auto pb-32">
               <SignalRenderer signal={selectedPost} />

               {/* Botão de Compartilhar no Final do Artigo */}
               <div className="mt-16 flex items-center justify-start">
                  <button 
                    onClick={() => {
                      const cleanUrl = `${window.location.origin}/sinais/${selectedPost.slug || selectedPost.id}`;
                      navigator.clipboard.writeText(cleanUrl);
                      setShowToast(true);
                      if (selectedPost) {
                        trackLinkShared('signal', selectedPost.title);
                      }
                    }}
                    className="flex items-center gap-3 bg-[var(--accent)]/10 text-[var(--accent)] [.light-mode_&]:bg-teal-500/10 [.light-mode_&]:text-teal-600 px-5 py-2.5 rounded-full hover:bg-[var(--accent)] hover:text-black [.light-mode_&]:hover:bg-teal-500 [.light-mode_&]:hover:text-white transition-all text-xs font-mono tracking-widest lowercase"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    copiar link para compartilhar
                  </button>
               </div>
            </article>
            <Toast message="link copiado" isVisible={showToast} onClose={() => setShowToast(false)} isDarkMode={isDarkMode} />
         </div>
      </div>
    );
  }

  return (
    <div className="pt-32 md:pt-40 pb-40 px-6 md:px-12 max-w-[1800px] mx-auto min-h-screen">
      <Helmet>
        <title>sinais — ruídos atmosféricos</title>
        <meta name="description" content="captura de frequências e registros de campo do rito ruídos atmosféricos" />
        <meta property="og:title" content="sinais — ruídos atmosféricos" />
        <meta property="og:description" content="captura de frequências e registros de campo do rito ruídos atmosféricos" />
      </Helmet>
      <header className="mb-16 md:mb-20 flex flex-col gap-8 items-start">
        <div className="flex-shrink-0 space-y-4">
          <h1 className={`font-nabla text-7xl md:text-9xl lowercase ${isDarkMode ? 'palette-matrix' : 'palette-matrix-blue'}`}>sinais</h1>
          <p className="font-mono text-sm opacity-60 lowercase tracking-widest">captura de frequências e registros de campo</p>
        </div>
      </header>

      <div className="space-y-32">
        {years.map((year) => (
          <div key={year} className="relative group md:pl-24 lg:pl-32">
          <div 
            className={`absolute -top-12 md:-top-16 left-0 text-6xl md:text-[10rem] font-bold font-nabla leading-none select-none pointer-events-none z-0 transition-all duration-700 opacity-10 md:group-hover:opacity-20 md:group-hover:scale-105 ${isDarkMode ? 'palette-matrix' : 'palette-matrix-blue'}`} 
          >
            {year}
          </div>
            <div className="relative z-10 pt-8 md:pt-16">
              {groupedPosts[year].map((post) => (
                    <div key={post.id} className="relative group/item cursor-pointer mb-32 last:mb-0" onClick={() => handleOpenPost(post)}>
                      <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start">
                         {/* Data Column */}
                         <div className="md:w-20 flex-shrink-0 pt-4">
                            <div className="font-vt text-2xl text-[var(--accent)] opacity-30 group-hover/item:opacity-100 transition-opacity">
                              {post.date.split('/').slice(0,2).join('.')}
                            </div>
                         </div>

                         {/* Content & Image Wrapper */}
                         <div className="flex-grow flex flex-col md:flex-row gap-10 items-start md:items-center pl-8 md:pl-12 transition-all duration-500">
                            
                            {/* Image - Now on the left of the text on desktop */}
                            {post.coverImageUrl && (
                              <div className="w-full md:w-72 aspect-[4/3] rounded-2xl overflow-hidden flex-shrink-0 relative group-hover/item:shadow-[0_0_30px_rgba(var(--accent-rgb),0.1)] transition-all duration-700">
                                <img 
                                  src={getOptimizedUrl(post.coverImageUrl, 400)} 
                                  className="w-full h-full object-cover" 
                                  alt="thumb" 
                                />
                                <div className="absolute inset-0 bg-transparent group-hover/item:bg-transparent transition-colors"></div>
                              </div>
                            )}

                            <div className="flex-grow space-y-6">
                              <h2 className="text-4xl md:text-6xl font-electrolize lowercase text-white [.light-mode_&]:text-black group-hover/item:text-[var(--accent)] transition-colors leading-[0.9]">
                                {post.title}
                              </h2>
                              {post.subtitle && (
                                <p className="font-mono text-sm opacity-40 group-hover/item:opacity-80 transition-opacity lowercase leading-relaxed max-w-lg">
                                  {post.subtitle}
                                </p>
                              )}
                            </div>
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
