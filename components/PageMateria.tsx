
import React, { useState, useEffect, useMemo } from 'react';
import { storage } from '../lib/storage';
import { Work } from '../types';
import { MONTH_NAMES, DEFAULT_IMAGE } from '../constants';
import LazyImage from './LazyImage';

interface PageMateriaProps {
  isDarkMode: boolean;
}

// Componente para a visualização da galeria de obras
const PageMateria: React.FC<PageMateriaProps> = ({ isDarkMode }) => {
  const [works, setWorks] = useState<Work[]>([]);
  const [filter, setFilter] = useState<string>('todos');

  // Busca obras do banco de dados local
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const all: Work[] = await storage.getAll('works');
        setWorks(all.filter(w => w.isVisible).sort((a, b) => b.date.localeCompare(a.date)));
      } catch (e) {
        console.error("Erro ao carregar obras:", e);
      }
    };
    fetchWorks();
  }, []);

  // Filtra as obras baseadas na técnica selecionada
  const filteredWorks = useMemo(() => {
    if (filter === 'todos') return works;
    return works.filter(w => w.technique.toLowerCase().includes(filter.toLowerCase()));
  }, [works, filter]);

  // Extrai técnicas únicas para o filtro
  const techniques = useMemo(() => {
    const t = new Set<string>();
    works.forEach(w => t.add(w.technique));
    return ['todos', ...Array.from(t)];
  }, [works]);

  const formatImageUrl = (url: string): string => {
    if (!url || url.trim() === '') return DEFAULT_IMAGE;
    return url;
  };

  return (
    <div className="pt-32 pb-40 px-6 md:px-12 max-w-[1800px] mx-auto min-h-screen">
      <header className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h2 className="font-nabla text-7xl md:text-9xl lowercase" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>matéria</h2>
          <p className="font-mono text-sm opacity-60 mt-4 lowercase tracking-widest">registros de presença física e digital</p>
        </div>
        
        {/* Navegação de Filtros Neobrutalista */}
        <div className="flex flex-wrap gap-4">
          {techniques.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`font-electrolize text-xs uppercase tracking-[0.2em] px-4 py-2 border rounded-full transition-all ${
                filter === t 
                  ? 'bg-[var(--accent)] border-[var(--accent)] text-black' 
                  : 'border-white/20 opacity-40 hover:opacity-100 hover:border-white [.light-mode_&]:border-black/20 [.light-mode_&]:hover:border-black'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      {/* Grid de Obras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {filteredWorks.map((work) => (
          <div key={work.id} className="group relative flex flex-col gap-4">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900 border border-white/5 [.light-mode_&]:bg-neutral-200">
              <LazyImage 
                src={formatImageUrl(work.imageUrl)} 
                alt={work.title}
                className="group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-baseline">
                <h3 className="font-electrolize text-xl lowercase">{work.title}</h3>
                <span className="font-mono text-[10px] opacity-40">{work.year}</span>
              </div>
              <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest">{work.technique}</p>
              <p className="font-mono text-[10px] opacity-40 uppercase tracking-widest">{work.dimensions}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PageMateria;
