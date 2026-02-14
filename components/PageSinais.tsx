
import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { storage } from './storage';
import { Signal, SignalBlock } from '../types';
import { COLORS, MONTH_NAMES } from '../constants';
import LazyImage from './LazyImage';

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

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  
  return (
    <div className="space-y-6 text-left font-mono text-base md:text-lg font-normal leading-[1.8] opacity-80 text-neutral-300 [.light-mode_&]:text-neutral-800">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('# ')) {
          return <h2 key={index} className="font-electrolize text-3xl md:text-4xl text-white [.light-mode_&]:text-black mt-10 mb-6 opacity-100 lowercase">{trimmed.substring(2)}</h2>;
        }
        
        if (trimmed.startsWith('## ')) {
          return <h3 key={index} className="font-electrolize text-2xl md:text-3xl text-white [.light-mode_&]:text-black mt-8 mb-4 opacity-90 lowercase">{trimmed.substring(3)}</h3>;
        }
        
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={index} className="border-l-2 border-[var(--accent)] pl-6 py-2 my-8 italic opacity-70 bg-white/5 [.light-mode_&]:bg-black/5 rounded-r-lg">
              {parseInline(trimmed.substring(2))}
            </blockquote>
          );
        }

        if (trimmed === '---') {
          return <hr key={index} className="border-t border-white/10 [.light-mode_&]:border-black/10 my-8" />;
        }

        if (trimmed === '') {
          return <div key={index} className="h-4"></div>;
        }

        return <p key={index} className="lowercase">{parseInline(line)}</p>;
      })}
    </div>
  );
};

const parseInline = (text: string) => {
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

  return parts.map((part, i) => {
    if (part.type === 'link') {
      return (
        <a key={i} href={part.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline hover:no-underline font-bold">
          {part.content}
        </a>
      );
    }

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
        modalScroll.addEventListener("scroll", updateProgress, { passive: true });
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
        scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
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
        bg-white/10 [.light-mode_&]:bg-black/5 hover:bg-[var(--accent)]
        text-white [.light-mode_&]:text-black hover:text-black
        border border-white/10 transition-all duration-500 transform
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}
      `}
      title="voltar ao topo"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
    </button>
  );
};

type RenderGroup = 
  | { type: 'text'; id: string; content: string }
  | { type: 'gallery'; id: string; images: SignalBlock[] }
  | { type: 'embed'; id: string; content: string };

const PageSinais: React.FC<{ isDarkMode?: boolean }> = ({ isDarkMode = true }) => {
  const [posts, setPosts] = useState<Signal[]>([]);
  const [selectedPost, setSelectedPost] = useState<Signal | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(2000);
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  useEffect(() => {
    const fetchData = async () => {
      const all: Signal[] = await storage.getAll('signals');
      setPosts(all.filter((p: Signal) => p.status === 'publicado').sort((a,b) => Number(b.id) - Number(a.id)));
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
    const updated = { ...post, views: (post.views || 0) + 1 };
    await storage.save('signals', updated);
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
            className="fixed top-6 left-6 md:top-8 md:left-8 z-[60] group flex items-center gap-3 mix-blend-difference"
         >
            <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all duration-300">
               ←
            </div>
            <span className="font-vt text-xs tracking-widest opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0 text-white [.light-mode_&]:text-black hidden md:inline">voltar</span>
         </button>

         <div className="relative z-10 max-w-6xl mx-auto pt-24 md:pt-32 px-6 md:px-12 pb-40">
            <header className="mb-16 md:mb-24 relative max-w-4xl mx-auto text-left">
               <div className="flex flex-col md:flex-row md:items-end justify-between border-t border-white/20 pt-4 mb-8 gap-4">
                 <div className="flex gap-4 font-mono text-[10px] md:text-xs tracking-widest lowercase opacity-60">
                    <span className="bg-white/10 px-2 py-1 rounded">data: {selectedPost.date}</span>
                    <span className="bg-white/10 px-2 py-1 rounded">tempo: {readingTime}</span>
                 </div>
                 <div className="font-vt text-xs opacity-40 lowercase">/// transmissão segura</div>
               </div>
               <h1 className="font-electrolize text-4xl md:text-7xl lg:text-8xl leading-[1.1] md:leading-[0.9] tracking-tight text-white [.light-mode_&]:text-black mb-8 lowercase">
                  {selectedPost.title}
               </h1>
               {selectedPost.subtitle && (
                 <p className="text-xs md:text-sm font-mono opacity-60 leading-relaxed max-w-2xl border-l-2 border-[var(--accent)] pl-6 py-2 lowercase">
                   {selectedPost.subtitle}
                 </p>
               )}
            </header>

            <article className="space-y-12">
               {processedBlocks.map((group, index) => (
                 <div key={group.id}>
                    {group.type === 'text' && (
                       <div className="relative md:pl-12 group my-8 max-w-4xl mx-auto">
                         <MarkdownRenderer content={group.content} />
                       </div>
                    )}
                    {group.type === 'gallery' && (
                       <div className={`my-12 grid gap-6 md:gap-8 ${group.images.length === 1 ? 'grid-cols-1' : group.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                          {group.images.map((imgBlock) => (
                            <figure key={imgBlock.id} className="relative group w-full flex flex-col">
                                <div 
                                  className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 cursor-zoom-in active:scale-[0.98] transition-transform"
                                  onClick={() => { const idx = postImages.findIndex(b => b.id === imgBlock.id); if (idx >= 0) setLightboxIndex(idx); }}
                                >
                                  <LazyImage 
                                    src={formatImageUrl(imgBlock.content)} 
                                    alt="registro visual"
                                    className={`w-full group-hover:scale-105 transition-all duration-700 ease-out ${group.images.length > 1 ? 'aspect-[4/3]' : 'h-auto'}`}
                                  />
                                </div>
                                {imgBlock.caption && (
                                  <figcaption className="mt-3 flex items-center gap-3 px-2">
                                      <div className="h-px bg-white/20 w-4"></div>
                                      <span className="font-vt text-xs tracking-[0.2em] opacity-60 lowercase truncate">{imgBlock.caption}</span>
                                  </figcaption>
                                )}
                            </figure>
                          ))}
                       </div>
                    )}
                    {group.type === 'embed' && (
                        <div className="my-12 max-w-4xl mx-auto aspect-video rounded-xl overflow-hidden bg-black/10 border border-white/10">
                            <iframe src={group.content} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                        </div>
                    )}
                 </div>
               ))}
            </article>
         </div>

         {viewingBlock && (
           <div className="fixed inset-0 z-[300] bg-[#050505] flex flex-col animate-in fade-in duration-300 pt-32 md:pt-40" onClick={() => setLightboxIndex(-1)}>
              <div className="relative w-full h-full p-4 md:p-12 flex flex-col items-center justify-start overflow-y-auto">
                 <img src={formatImageUrl(viewingBlock.content)} className="max-w-full max-h-[60vh] object-contain shadow-2xl cursor-zoom-out" />
                 {viewingBlock.caption && <span className="mt-8 font-vt text-lg text-white block">{viewingBlock.caption}</span>}
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
          <svg width="60" height="100%" className="overflow-visible">
            <path d={wavePath} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="flex-1 md:pl-24 md:pr-12 relative z-10">
          <div className="mb-12 md:mb-20 mt-8 md:mt-0">
             <h2 className="font-nabla text-7xl md:text-9xl lowercase" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>sinais</h2>
          </div>
          <div className="space-y-32">
            {years.map((year) => (
              <div key={year} className="relative group">
                <div className="absolute -top-16 -left-16 text-[8rem] font-bold font-nabla leading-none select-none pointer-events-none z-0 transition-opacity duration-500 opacity-10" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>{year}</div>
                <div className="relative z-10">
                  {groupedPosts[year].map((post) => (
                        <div key={post.id} className="relative group/item cursor-pointer mb-24 last:mb-0" onClick={() => handleOpenPost(post)}>
                          <div className="flex flex-col md:flex-row gap-6 md:gap-12">
                             <div className="md:w-48 flex-shrink-0 flex md:flex-col items-center md:items-end pt-2">
                                <div className="font-vt text-2xl md:text-3xl text-[var(--accent)] opacity-80">{post.date.split('/').slice(0,2).join('/')}</div>
                             </div>
                             <div className="flex-grow pl-6 md:pl-8 border-l border-white/10 group-hover/item:border-[var(--accent)] transition-colors py-1">
                                <h3 className="text-3xl md:text-5xl font-electrolize mb-4 lowercase">{post.title}</h3>
                                {post.subtitle && <p className="font-mono text-sm opacity-60 lowercase">{post.subtitle}</p>}
                             </div>
                          </div>
                        </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageSinais;
