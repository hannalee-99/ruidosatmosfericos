
import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { Work, ViewState } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE } from '../constants';
import { useMeta } from '../lib/hooks';
import LazyImage from './LazyImage';

interface PageMateriaProps {
  isDarkMode: boolean;
  workSlug: string | null;
  onNavigate: (view: ViewState) => void;
  onWorkSelect: (slug: string | null) => void;
}

const PageMateria: React.FC<PageMateriaProps> = ({ isDarkMode, workSlug, onNavigate, onWorkSelect }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [filterYear, setFilterYear] = useState<string>('todos');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const { updateMeta, resetMeta } = useMeta();

  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const all: Work[] = await storage.getAll('works');
        const visible = all.filter(w => w.isVisible).sort((a, b) => b.date.localeCompare(a.date));
        setWorks(visible);
        
        if (workSlug) {
          const work = visible.find(w => w.slug === workSlug || w.id === workSlug);
          if (work) {
            setSelectedWork(work);
            updateMeta({
              title: work.seoTitle || work.title,
              description: work.seoDescription || work.description || `${work.technique}, ${work.year}`,
              image: work.imageUrl
            });
          }
        } else {
          setSelectedWork(null);
          resetMeta();
        }
      } catch (e) {
        console.error("Erro ao carregar obras:", e);
      }
    };
    fetchWorks();
  }, [workSlug, updateMeta, resetMeta]);

  const filteredWorks = useMemo(() => {
    let result = works;
    if (filterYear !== 'todos') {
      result = result.filter(w => w.year === filterYear);
    }
    return result;
  }, [works, filterYear]);

  const navigation = useMemo(() => {
    if (!selectedWork || filteredWorks.length <= 1) return { next: null, prev: null };
    const currentIndex = filteredWorks.findIndex(w => w.id === selectedWork.id);
    const prev = currentIndex > 0 ? filteredWorks[currentIndex - 1] : null;
    const next = currentIndex < filteredWorks.length - 1 ? filteredWorks[currentIndex + 1] : null;
    return { prev, next };
  }, [selectedWork, filteredWorks]);

  const years = useMemo(() => {
    const y = new Set<string>();
    works.forEach(w => y.add(w.year));
    return ['todos', ...Array.from(y).sort((a, b) => b.localeCompare(a))];
  }, [works]);

  const formatImageUrl = (url: string): string => {
    if (!url || url.trim() === '') return DEFAULT_IMAGE;
    return url;
  };

  const handleWorkClick = (work: Work) => {
    onWorkSelect(work.slug || work.id);
  };

  const handleBack = () => {
    onWorkSelect(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedWork) return;
      if (e.key === 'ArrowRight' && navigation.next) handleWorkClick(navigation.next);
      if (e.key === 'ArrowLeft' && navigation.prev) handleWorkClick(navigation.prev);
      if (e.key === 'Escape') handleBack();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWork, navigation]);

  if (selectedWork) {
    return (
      <div className="relative min-h-screen w-full flex flex-col items-center justify-center animate-in fade-in duration-700 bg-[var(--bg)]">
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.08] blur-[80px] z-0 transition-all duration-1000"
          style={{ backgroundImage: `url(${formatImageUrl(selectedWork.imageUrl)})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        ></div>

        <button 
          onClick={handleBack}
          className="fixed top-24 right-6 md:right-12 z-[110] w-12 h-12 flex items-center justify-center rounded-full bg-white/5 hover:bg-[var(--accent)] hover:text-black border border-white/10 transition-all group"
          title="fechar visualização (esc)"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="fixed inset-y-0 left-4 md:left-8 flex items-center z-[100]">
          {navigation.prev && (
            <button 
              onClick={() => handleWorkClick(navigation.prev!)}
              className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white/5 hover:bg-[var(--accent)] hover:text-black border border-white/5 transition-all group opacity-20 hover:opacity-100"
              title="obra anterior (←)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
          )}
        </div>

        <div className="fixed inset-y-0 right-4 md:right-8 flex items-center z-[100]">
          {navigation.next && (
            <button 
              onClick={() => handleWorkClick(navigation.next!)}
              className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full bg-white/5 hover:bg-[var(--accent)] hover:text-black border border-white/5 transition-all group opacity-20 hover:opacity-100"
              title="próxima obra (→)"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          )}
        </div>

        <div className="relative z-10 w-full max-w-7xl px-6 md:px-20 py-32 flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center lg:items-start">
          <div className="lg:col-span-8 w-full flex justify-center">
            <div className="relative group max-h-[75vh] w-full flex justify-center">
              <img 
                src={formatImageUrl(selectedWork.imageUrl)} 
                alt={selectedWork.title}
                key={selectedWork.id}
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-500"
              />
            </div>
          </div>

          <div className="lg:col-span-4 w-full space-y-10 lg:pl-8">
            <header className="space-y-4">
               <div className="flex items-center gap-4">
                  <span className="font-vt text-sm tracking-widest text-[var(--accent)] uppercase">{MONTH_NAMES[parseInt(selectedWork.month)-1]} / {selectedWork.year}</span>
                  <div className="h-px flex-grow bg-current opacity-10"></div>
               </div>
               <h1 className="font-electrolize text-4xl md:text-5xl leading-[0.95] lowercase text-white [.light-mode_&]:text-black">
                {selectedWork.title}
               </h1>
            </header>

            <div className="space-y-6 font-mono text-xs md:text-sm lowercase">
              <div className="pb-4 border-b border-current border-opacity-5 flex justify-between items-baseline">
                <span className="opacity-40 uppercase tracking-widest text-[9px]">técnica</span>
                <span className="opacity-80 text-right">{selectedWork.technique}</span>
              </div>
              <div className="pb-4 border-b border-current border-opacity-5 flex justify-between items-baseline">
                <span className="opacity-40 uppercase tracking-widest text-[9px]">dimensões</span>
                <span className="opacity-80 text-right">{selectedWork.dimensions}</span>
              </div>
              
              {selectedWork.description && (
                <div className="pt-2">
                   <span className="opacity-40 block mb-3 uppercase tracking-widest text-[9px]">contemplação</span>
                   <p className="opacity-60 leading-relaxed text-justify whitespace-pre-wrap">
                     {selectedWork.description}
                   </p>
                </div>
              )}
            </div>

            <div className="pt-4 opacity-30 hover:opacity-100 transition-opacity flex gap-6">
               <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert("link copiado para compartilhar.");
                  }}
                  className="font-vt text-[10px] tracking-widest flex items-center gap-2 uppercase border-b border-current border-opacity-20 pb-1"
               >
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                 link
               </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-40 px-6 md:px-12 max-w-[1800px] mx-auto min-h-screen">
      <header className="mb-16 md:mb-24 flex flex-col gap-12 items-start">
        <div className="flex-shrink-0 space-y-4">
          <h2 className="font-nabla text-7xl md:text-9xl lowercase" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>matéria</h2>
          <p className="font-mono text-sm opacity-60 lowercase tracking-widest">registros de presença física e digital</p>
        </div>
        
        <div className="flex flex-col gap-6 w-full max-w-2xl">
          <div className="space-y-3">
            <span className="font-vt text-[10px] tracking-widest opacity-40 uppercase">cronologia</span>
            <div className="flex flex-wrap gap-3">
              {years.map(y => (
                <button
                  key={y}
                  onClick={() => setFilterYear(y)}
                  className={`font-electrolize text-[10px] uppercase tracking-[0.2em] px-3 py-1.5 border rounded-full transition-all ${
                    filterYear === y 
                      ? 'bg-[var(--accent)] border-[var(--accent)] text-black' 
                      : 'border-white/10 opacity-40 hover:opacity-100 hover:border-white [.light-mode_&]:border-black/10 [.light-mode_&]:hover:border-black'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <div className="columns-1 md:columns-2 lg:columns-3 gap-8 space-y-8 max-w-[1600px] mx-auto">
        {filteredWorks.map((work) => (
          <div 
            key={work.id} 
            className="break-inside-avoid mb-8 group relative flex flex-col gap-4 cursor-pointer"
            onClick={() => handleWorkClick(work)}
          >
            <div className="overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 [.light-mode_&]:bg-neutral-200">
              <LazyImage 
                src={formatImageUrl(work.imageUrl)} 
                alt={work.title}
                className="w-full h-auto group-hover:scale-[1.03] transition-transform duration-1000"
                autoHeight={true}
              />
            </div>
            <div className="flex flex-col gap-1 px-2">
              <div className="flex justify-between items-baseline">
                <h3 className="font-electrolize text-xl md:text-2xl lowercase leading-none">{work.title}</h3>
                <span className="font-mono text-[10px] opacity-40">{work.year}</span>
              </div>
              <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest">{work.technique}</p>
              <div className="h-px bg-[var(--accent)] w-0 group-hover:w-full transition-all duration-700 mt-2"></div>
            </div>
          </div>
        ))}

        {filteredWorks.length === 0 && (
          <div className="col-span-full py-40 text-center">
            <p className="font-vt text-lg opacity-20 tracking-widest">nenhuma frequência encontrada para esta combinação.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageMateria;
