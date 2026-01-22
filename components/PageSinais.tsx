
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { storage } from './storage';
import { Signal, SignalBlock } from '../types';
import { MONTH_NAMES } from '../constants';
import { Analytics } from './analytics';

const formatImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('data:image')) return url;
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/(.+?)\/(view|edit)?/) || url.match(/[?&]id=(.+?)(&|$)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?export=view&id=${match[1]}`;
    }
  }
  return url;
};

// --- MARKDOWN PARSER SIMPLES & ROBUSTO ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  
  return (
    <div className="space-y-4 text-left font-sans text-lg md:text-xl font-light leading-[1.8] opacity-80 text-neutral-300 [.light-mode_&]:text-neutral-800">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        // H1 (# )
        if (trimmed.startsWith('# ')) {
          return <h2 key={index} className="font-electrolize text-3xl md:text-4xl text-white [.light-mode_&]:text-black mt-8 mb-4 opacity-100 lowercase">{trimmed.substring(2)}</h2>;
        }
        
        // H2 (## )
        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="font-electrolize text-2xl md:text-3xl text-white [.light-mode_&]:text-black mt-6 mb-3 opacity-90 lowercase">{trimmed.substring(3)}</h3>;
        }
        
        // Blockquote (> )
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-4 border-[var(--accent)] pl-6 py-2 my-6 italic opacity-70 bg-white/5 [.light-mode_&]:bg-black/5 rounded-r-lg">
              {parseInline(trimmed.substring(2))}
            </blockquote>
          );
        }

        // Horizontal Rule (---)
        if (trimmed === '---') {
          return <hr key={index} className="border-t border-white/10 [.light-mode_&]:border-black/10 my-8" />;
        }

        // Parágrafo vazio (quebra de linha)
        if (trimmed === '') {
          return <div key={index} className="h-4"></div>;
        }

        // Parágrafo padrão
        return <p key={index} className="lowercase">{parseInline(line)}</p>;
      })}
    </div>
  );
};

// Parser Inline (Bold, Italic, Link)
const parseInline = (text: string) => {
  // 1. Links: [text](url)
  // 2. Bold: **text**
  // 3. Italic: *text*
  
  // Dividir primeiro por links para evitar conflitos
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.substring(lastIndex, match.index) });
    }
    parts.push({ type: 'link', content: match[1], url: match[2] });
    lastIndex = linkRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.substring(lastIndex) });
  }

  // Agora processa bold/italic em cada parte de texto
  return parts.map((part, i) => {
    if (part.type === 'link') {
      return (
        <a key={i} href={part.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline hover:no-underline font-mono text-[0.9em]">
          {part.content}
        </a>
      );
    }

    // Processamento de texto normal para bold/italic
    const subParts = part.content.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return subParts.map((sub, j) => {
      if (sub.startsWith('**') && sub.endsWith('**')) {
        return <strong key={`${i}-${j}`} className="font-bold text-[var(--accent)] opacity-100">{sub.slice(2, -2)}</strong>;
      }
      if (sub.startsWith('*') && sub.endsWith('*')) {
        return <em key={`${i}-${j}`} className="italic opacity-80">{sub.slice(1, -1)}</em>;
      }
      return sub;
    });
  });
};

const calculateReadingTime = (blocks: SignalBlock[]): string => {
  const text = blocks
    .filter(b => b.type === 'text')
    .map(b => b.content)
    .join(' ');
  
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min`;
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

    if (modalScroll) {
        modalScroll.addEventListener("scroll", updateProgress);
    }
    return () => {
        if (modalScroll) modalScroll.removeEventListener("scroll", updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-white/10 [.light-mode_&]:bg-black/10">
      <div 
        className="h-full bg-[var(--accent)] shadow-[0_0_10px_var(--accent)] transition-all duration-100 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

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

// --- HELPER PARA ATUALIZAR METADADOS ---
const updateSignalMetaTags = (signal: Signal | null) => {
    if (!signal) {
        document.title = 'ruídos atmosféricos';
        return;
    }
    
    // Usa Título SEO ou o título padrão
    const title = signal.seoTitle || signal.title;
    document.title = `${title} // ruídos atmosféricos`;
    
    const setMeta = (property: string, content: string) => {
        let tag = document.querySelector(`meta[property="${property}"]`);
        if (!tag) {
            tag = document.createElement('meta');
            tag.setAttribute('property', property);
            document.head.appendChild(tag);
        }
        tag.setAttribute('content', content);
    };

    setMeta('og:title', title);
    setMeta('og:description', signal.seoDescription || signal.subtitle || 'sinal captado na frequência atmosférica.');
    
    // Tenta encontrar a primeira imagem para usar como capa se não houver uma definida
    const firstImage = signal.blocks.find(b => b.type === 'image');
    if (firstImage) {
        setMeta('og:image', formatImageUrl(firstImage.content));
    }
    
    // Atualiza URL
    const shareId = signal.slug || signal.id;
    const newUrl = `${window.location.pathname}?post=${encodeURIComponent(shareId)}`;
    try {
        window.history.pushState({ path: newUrl }, '', newUrl);
    } catch(e) { console.warn("History push failed", e); }
};

type RenderGroup = 
  | { type: 'text'; id: string; content: string }
  | { type: 'gallery'; id: string; images: SignalBlock[] }
  | { type: 'embed'; id: string; content: string };

interface PageSinaisProps {
    isDarkMode?: boolean;
    setBreadcrumb?: (value: string | null) => void;
}

const PageSinais: React.FC<PageSinaisProps> = ({ isDarkMode = true, setBreadcrumb }) => {
  const [posts, setPosts] = useState<Signal[]>([]);
  const [selectedPost, setSelectedPost] = useState<Signal | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(2000);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchData = async () => {
      const all: Signal[] = await storage.getAll('signals');
      const loadedPosts = all.filter((p: Signal) => p.status === 'publicado').sort((a,b) => Number(b.id) - Number(a.id));
      setPosts(loadedPosts);

      // Deep Linking Check for Posts
      const params = new URLSearchParams(window.location.search);
      const postParam = params.get('post');
      if (postParam && !selectedPost) {
          const found = loadedPosts.find(p => p.id === postParam || p.slug === postParam);
          if (found) {
              setSelectedPost(found);
              updateSignalMetaTags(found);
          }
      }
    };
    fetchData();
  }, []);

  const postImages = useMemo(() => {
    if (!selectedPost) return [];
    return selectedPost.blocks.filter(b => b.type === 'image');
  }, [selectedPost]);

  const viewingBlock = lightboxIndex >= 0 && postImages[lightboxIndex] ? postImages[lightboxIndex] : null;

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (postImages.length <= 1) return;
    setLightboxIndex(prev => (prev + 1) % postImages.length);
  };

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (postImages.length <= 1) return;
    setLightboxIndex(prev => (prev - 1 + postImages.length) % postImages.length);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex !== -1) {
        if (e.key === 'Escape') setLightboxIndex(-1);
        if (e.key === 'ArrowRight') handleNextImage();
        if (e.key === 'ArrowLeft') handlePrevImage();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, postImages.length]);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(containerRef.current.scrollHeight);
    }
  }, [posts]);

  // Atualiza metadados quando o post selecionado muda
  useEffect(() => {
      if (selectedPost) {
          updateSignalMetaTags(selectedPost);
      } else {
          document.title = 'ruídos atmosféricos';
          // Limpa URL ao fechar
          try {
             window.history.pushState({ path: window.location.pathname }, '', window.location.pathname);
          } catch(e) {}
      }
  }, [selectedPost]);

  // Update breadcrumb when selectedPost changes
  useEffect(() => {
    if (setBreadcrumb) {
        setBreadcrumb(selectedPost ? (selectedPost.title || 'sinal') : null);
    }
  }, [selectedPost, setBreadcrumb]);

  const groupedPosts = useMemo(() => {
    const groups: Record<string, Signal[]> = {};
    posts.forEach(post => {
      const dateParts = post.date.split('/');
      let year = 'antigo';
      if (dateParts.length === 3) year = dateParts[2];
      else if (post.date.length === 4) year = post.date;
      
      if (!groups[year]) groups[year] = [];
      groups[year].push(post);
    });
    return groups;
  }, [posts]);

  const years = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a));

  const wavePath = useMemo(() => {
    const width = 60;
    const amplitude = 15;
    const frequency = 0.02;
    let path = `M ${width/2} 0`;
    for (let y = 0; y <= containerHeight; y += 10) {
      const x = (width / 2) + Math.sin(y * frequency) * amplitude;
      path += ` L ${x} ${y}`;
    }
    return path;
  }, [containerHeight]);

  const processedBlocks = useMemo(() => {
    if (!selectedPost) return [];
    
    const result: RenderGroup[] = [];
    let currentGallery: SignalBlock[] = [];

    selectedPost.blocks.forEach((block, index) => {
      if (block.type === 'image') {
        currentGallery.push(block);
      } else {
        if (currentGallery.length > 0) {
          result.push({ type: 'gallery', id: `gallery-${index}`, images: [...currentGallery] });
          currentGallery = [];
        }
        
        if (block.type === 'text') {
            result.push({ type: 'text', id: block.id, content: block.content });
        } else if (block.type === 'embed') {
            result.push({ type: 'embed', id: block.id, content: block.content });
        }
      }
    });

    if (currentGallery.length > 0) {
      result.push({ type: 'gallery', id: `gallery-end`, images: [...currentGallery] });
    }

    return result;
  }, [selectedPost]);

  const handleOpenPost = async (post: Signal) => {
    setSelectedPost(post);
    // Track Analytics
    Analytics.track('Signal Read', { 
        title: post.title, 
        id: post.id 
    });
    const updated = { ...post, views: (post.views || 0) + 1 };
    await storage.save('signals', updated);
  };

  const handleImageClick = (blockId: string) => {
    const idx = postImages.findIndex(b => b.id === blockId);
    if (idx >= 0) setLightboxIndex(idx);
  };

  const getGridClass = (count: number) => {
    if (count === 1) return 'grid-cols-1';
    if (count === 2) return 'grid-cols-1 md:grid-cols-2';
    return 'grid-cols-1 md:grid-cols-3';
  };

  if (selectedPost) {
    const readingTime = calculateReadingTime(selectedPost.blocks);

    return (
      <div 
        id="post-modal-scroll"
        className="fixed inset-0 z-50 bg-[#050505] [.light-mode_&]:bg-[#f4f4f4] text-white [.light-mode_&]:text-[#111] overflow-y-auto animate-in fade-in duration-500 selection:bg-[var(--accent)] selection:text-black scroll-smooth"
      >
         <ReadingProgress />
         <BackToTop targetId="post-modal-scroll" />
         
         <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
         
         <button 
            onClick={() => setSelectedPost(null)}
            className="fixed top-6 left-6 md:top-8 md:left-8 z-[60] group flex items-center gap-3 mix-blend-difference [.light-mode_&]:mix-blend-normal"
         >
            <div className="w-10 h-10 rounded-full border border-white/20 [.light-mode_&]:border-black/20 flex items-center justify-center group-hover:bg-white [.light-mode_&]:group-hover:bg-black group-hover:text-black [.light-mode_&]:group-hover:text-white transition-all duration-300">
               ←
            </div>
            <span className="font-vt text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-white [.light-mode_&]:text-black hidden md:inline">voltar</span>
         </button>

         <div className="relative z-10 max-w-6xl mx-auto pt-24 md:pt-32 px-6 md:px-12 pb-40">
            
            <header className="mb-16 md:mb-24 relative max-w-4xl mx-auto text-left">
               <div className="flex flex-col md:flex-row md:items-end justify-between border-t border-white/20 [.light-mode_&]:border-black/20 pt-4 mb-8 gap-4">
                 <div className="flex gap-4 font-mono text-[10px] md:text-xs tracking-widest lowercase opacity-60">
                    <span className="bg-white/10 [.light-mode_&]:bg-black/5 px-2 py-1 rounded">data: {selectedPost.date}</span>
                    <span className="bg-white/10 [.light-mode_&]:bg-black/5 px-2 py-1 rounded">tempo: {readingTime}</span>
                 </div>
                 <div className="font-vt text-xs opacity-40 lowercase">
                    /// transmissão segura
                 </div>
               </div>

               <h1 className="font-electrolize text-4xl md:text-7xl lg:text-8xl leading-[1.1] md:leading-[0.9] tracking-tight text-white [.light-mode_&]:text-black mb-8 lowercase">
                  {selectedPost.title}
               </h1>
               
               {selectedPost.subtitle && (
                 <p className="text-lg md:text-2xl font-light opacity-60 leading-relaxed font-sans max-w-2xl border-l-2 border-[var(--accent)] pl-6 py-1 lowercase">
                   {selectedPost.subtitle}
                 </p>
               )}
            </header>

            <article className="space-y-12">
               {processedBlocks.map((group, index) => (
                 <div key={group.id} className="animate-in fade-in slide-in-from-bottom-8 duration-1000" style={{ animationDelay: `${index * 50}ms` }}>
                    
                    {group.type === 'text' && (
                       <div className="relative md:pl-12 group my-8 max-w-4xl mx-auto">
                         <div className="absolute left-0 top-2 w-1 h-0 group-hover:h-full bg-[var(--accent)]/50 transition-all duration-500 hidden md:block"></div>
                         <MarkdownRenderer content={group.content} />
                       </div>
                    )}

                    {group.type === 'embed' && (
                        <div className="my-12 max-w-4xl mx-auto">
                            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black/10 border border-white/10 [.light-mode_&]:border-black/10 shadow-lg">
                                <iframe 
                                    src={group.content} 
                                    className="w-full h-full" 
                                    frameBorder="0" 
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                    allowFullScreen
                                ></iframe>
                            </div>
                        </div>
                    )}

                    {group.type === 'gallery' && (
                       <div className={`my-12 grid gap-6 md:gap-8 ${getGridClass(group.images.length)}`}>
                          {group.images.map((imgBlock) => (
                            <figure key={imgBlock.id} className="relative group w-full flex flex-col">
                                <div 
                                  className="relative overflow-hidden rounded-3xl border border-white/10 [.light-mode_&]:border-black/10 bg-neutral-900 [.light-mode_&]:bg-gray-200 h-full w-full cursor-zoom-in active:scale-[0.98] transition-transform"
                                  onClick={() => handleImageClick(imgBlock.id)}
                                >
                                  <img 
                                    src={formatImageUrl(imgBlock.content)} 
                                    className={`
                                      w-full object-cover group-hover:scale-105 transition-all duration-700 ease-out opacity-100
                                      ${group.images.length > 1 ? 'aspect-[4/3] h-full' : 'h-auto'}
                                    `} 
                                    alt="registro visual" 
                                  />
                                </div>
                                
                                {imgBlock.caption && (
                                  <figcaption className="mt-3 flex items-center gap-3 px-2">
                                      <div className="h-px bg-white/20 [.light-mode_&]:bg-black/20 w-4"></div>
                                      <span className="font-vt text-xs tracking-[0.2em] opacity-60 lowercase truncate">{imgBlock.caption}</span>
                                  </figcaption>
                                )}
                            </figure>
                          ))}
                       </div>
                    )}
                 </div>
               ))}
            </article>

            <div className="mt-40 pt-12 border-t border-white/10 [.light-mode_&]:border-black/10 flex flex-col items-start md:items-center justify-center gap-6">
               <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shadow-[0_0_10px_var(--accent)]"></div>
               <div className="text-left md:text-center font-vt text-[10px] opacity-30 flex flex-col gap-2 lowercase">
                  <span className="tracking-[0.5em]">fim da transmissão</span>
               </div>
               <button 
                 onClick={() => setSelectedPost(null)}
                 className="mt-4 px-8 py-3 border border-white/20 [.light-mode_&]:border-black/20 rounded-full hover:bg-white hover:text-black [.light-mode_&]:hover:bg-black [.light-mode_&]:hover:text-white hover:border-white [.light-mode_&]:hover:border-black transition-all duration-300 font-mono text-xs lowercase tracking-widest"
               >
                 fechar frequência
               </button>
            </div>
         </div>

         {viewingBlock && (
           <div 
             className="fixed inset-0 z-[300] bg-[#050505] [.light-mode_&]:bg-[#f4f4f4] flex flex-col animate-in fade-in zoom-in-95 duration-300 pt-32 md:pt-40"
             onClick={() => setLightboxIndex(-1)}
           >
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>
              
              <button 
                onClick={() => setLightboxIndex(-1)}
                className="fixed top-24 right-4 md:right-8 z-[350] w-10 h-10 flex items-center justify-center text-white [.light-mode_&]:text-black hover:opacity-50 transition-opacity bg-white/5 [.light-mode_&]:bg-black/5 rounded-full backdrop-blur-sm"
                title="fechar [esc]"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {postImages.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevImage}
                    className="fixed left-2 md:left-8 top-1/2 -translate-y-1/2 z-[350] w-12 h-12 flex items-center justify-center bg-transparent text-white [.light-mode_&]:text-black hover:opacity-50 pointer-events-auto transition-opacity"
                    title="anterior"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <button 
                    onClick={handleNextImage}
                    className="fixed right-2 md:right-8 top-1/2 -translate-y-1/2 z-[350] w-12 h-12 flex items-center justify-center bg-transparent text-white [.light-mode_&]:text-black hover:opacity-50 pointer-events-auto transition-opacity"
                    title="próxima"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </>
              )}

              <div className="relative w-full h-full p-4 md:p-12 flex flex-col items-center justify-start overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                 <img 
                   key={viewingBlock.id}
                   src={formatImageUrl(viewingBlock.content)} 
                   className="max-w-full max-h-[60vh] object-contain shadow-2xl drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] [.light-mode_&]:drop-shadow-[0_0_20px_rgba(0,0,0,0.1)] cursor-zoom-out animate-in fade-in zoom-in-95 duration-500 opacity-100"
                   onClick={() => setLightboxIndex(-1)}
                 />
                 
                 {viewingBlock.caption && (
                   <div className="mt-12 text-center max-w-[90vw] pb-12">
                     <div className="font-mono text-xs text-[var(--accent)] mb-2 opacity-60">/// registro</div>
                     <span className="font-vt text-lg tracking-[0.1em] lowercase text-white [.light-mode_&]:text-black block">{viewingBlock.caption}</span>
                     {postImages.length > 1 && (
                       <div className="mt-4 opacity-30 text-[9px] font-mono">{lightboxIndex + 1} / {postImages.length}</div>
                     )}
                   </div>
                 )}
              </div>
           </div>
         )}
      </div>
    );
  }

  return (
    <div className="pt-24 md:pt-32 pb-24 max-w-5xl mx-auto min-h-screen px-6 md:px-0">
      <div className="relative flex" ref={containerRef}>
        <div className="absolute left-0 top-0 bottom-0 w-[60px] hidden md:block overflow-visible pointer-events-none z-0">
          <svg 
            width="60" 
            height="100%" 
            className="overflow-visible"
            style={{ minHeight: '100vh' }}
          >
            <defs>
              <filter id="glow-wave">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <path 
              d={wavePath} 
              fill="none" 
              stroke="currentColor" 
              strokeOpacity="0.2"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
            <path 
              d={wavePath} 
              fill="none" 
              stroke="var(--accent)" 
              strokeWidth="1"
              strokeOpacity="0.3"
              transform="translate(2, 0)"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        <div className="flex-1 md:pl-24 md:pr-12 relative z-10">
          <div className="mb-12 md:mb-20 mt-8 md:mt-0">
             <h2 className="font-nabla text-5xl md:text-7xl lowercase" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>
               sinais
             </h2>
             <p className="font-vt text-sm opacity-40 tracking-[0.3em] mt-2 lowercase">timeline de ruídos</p>
          </div>

          <div className="space-y-32">
            {years.map((year) => (
              <div key={year} className="relative group">
                <div 
                  className="absolute -top-6 -left-4 md:-top-16 md:-left-16 text-[3rem] md:text-[8rem] font-bold font-nabla leading-none select-none pointer-events-none z-0 transition-opacity duration-500 group-hover:opacity-[0.2] lowercase opacity-10"
                  style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}
                >
                  {year}
                </div>

                <div className="relative z-10">
                  {groupedPosts[year].map((post, index) => {
                     const readingTime = calculateReadingTime(post.blocks);
                     
                     return (
                        <div 
                          key={post.id} 
                          className="relative group/item cursor-pointer mb-24 last:mb-0"
                          onClick={() => handleOpenPost(post)}
                        >
                          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                             <div className="md:w-48 flex-shrink-0 flex md:flex-col items-center md:items-end justify-start gap-2 pt-2">
                                <div className="font-vt text-2xl md:text-3xl text-[var(--accent)] opacity-80 group-hover/item:opacity-100 transition-opacity">
                                   {post.date.split('/').slice(0,2).join('/')}
                                </div>
                                <div className="border border-white/20 [.light-mode_&]:border-black/20 rounded-full px-3 py-1 text-[10px] font-mono opacity-50 uppercase tracking-widest group-hover/item:border-[var(--accent)] group-hover/item:text-[var(--accent)] transition-colors whitespace-nowrap">
                                   {readingTime} de leitura
                                </div>
                             </div>

                             <div className="flex-grow pl-6 md:pl-8 border-l border-white/10 [.light-mode_&]:border-black/10 group-hover/item:border-[var(--accent)] transition-colors duration-500 py-1">
                                <h3 className="text-3xl md:text-5xl font-electrolize leading-none mb-4 group-hover/item:text-white [.light-mode_&]:group-hover/item:text-black transition-colors lowercase">
                                   {post.title}
                                </h3>
                                
                                {post.subtitle && (
                                  <p className="font-mono text-sm md:text-base opacity-60 group-hover/item:opacity-90 max-w-2xl leading-relaxed lowercase">
                                    {post.subtitle}
                                  </p>
                                )}
                                
                                <div className="mt-6 flex items-center gap-3 opacity-0 group-hover/item:opacity-100 transition-all transform translate-y-2 group-hover/item:translate-y-0 duration-500">
                                   <span className="text-[var(--accent)] text-xs font-mono tracking-widest uppercase">acessar sinal</span>
                                   <span className="text-[var(--accent)]">→</span>
                                </div>
                             </div>
                          </div>
                        </div>
                     );
                  })}
                </div>
              </div>
            ))}
          </div>

          {years.length === 0 && (
            <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl opacity-30 font-vt tracking-widest lowercase [.light-mode_&]:border-black/10">
               nenhum sinal registrado na timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageSinais;
