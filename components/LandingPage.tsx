
import React, { useState, useEffect, useRef } from 'react';
import { COLORS, DEFAULT_IMAGE } from '../constants';
import { ViewState, Work } from '../types';
import { storage } from '../lib/storage';
import LazyImage from './LazyImage';

// Componente para efeito de escrita suave
const Typewriter: React.FC<{ 
  text: string; 
  delay?: number; 
  speed?: number; 
  isDarkMode: boolean;
  onComplete?: () => void;
  shrinkI?: boolean;
}> = ({ 
  text, 
  delay = 0, 
  speed = 45, 
  isDarkMode,
  onComplete,
  shrinkI = false
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    
    if (displayedText.length < text.length) {
      const randomSpeed = speed + Math.random() * 30;
      timerRef.current = setTimeout(() => {
        setDisplayedText(text.substring(0, displayedText.length + 1));
      }, randomSpeed);
    } else if (onComplete) {
      onComplete();
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [displayedText, text, speed, started, onComplete]);

  return (
    <span>
      {displayedText.split('').map((char, index) => {
        if (shrinkI && ['i', 'í', 'I', 'Í'].includes(char)) {
          return (
            <span 
              key={index} 
              style={{ 
                fontSize: '0.75em', 
                display: 'inline-block',
                verticalAlign: '0.05em'
              }}
            >
              {char}
            </span>
          );
        }
        return <span key={index}>{char}</span>;
      })}
      {displayedText.length < text.length && started && (
        <span 
          className="inline-block w-1.5 h-4 ml-1 animate-pulse align-middle bg-[var(--accent)]"
        ></span>
      )}
    </span>
  );
};

// Componente Wrapper para Animação de Entrada na Viewport
const ScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  style?: React.CSSProperties;
}> = ({ children, className = "", delay = 0, onClick, style }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`${className} transition-all duration-[1000ms] ease-[cubic-bezier(0.22,1,0.36,1)] transform ${
        isVisible ? 'opacity-100 translate-y-0 blur-0 scale-100' : 'opacity-0 translate-y-12 blur-sm scale-[0.98]'
      }`}
      style={{ ...style, transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

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

// Formata data de dd/mm/aaaa para mmm/aa (ex: jan/26)
const formatSignalDate = (dateStr: string): string => {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  const monthIndex = parseInt(parts[1], 10) - 1;
  const year = parts[2].slice(2);
  const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  return `${months[monthIndex]}/${year}`;
};

interface LandingPageProps {
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, isDarkMode }) => {
  const [featuredWorks, setFeaturedWorks] = useState<Work[]>([]);
  const [latestSignals, setLatestSignals] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const works: Work[] = await storage.getAll('works');
        const visibleWorks = works.filter(w => w.isVisible);
        const featured = visibleWorks.filter(w => w.isFeatured);
        
        // RESTRITO A 2 OBRAS NA LANDING PAGE PARA FOCO VISUAL
        if (featured.length > 0) {
          setFeaturedWorks(featured.slice(0, 2));
        } else {
          setFeaturedWorks(visibleWorks.sort((a,b) => b.date.localeCompare(a.date)).slice(0, 2));
        }

        const signals = await storage.getAll('signals');
        const sortedSignals = signals.filter((s: any) => s.status === 'publicado').sort((a,b) => {
          const dA = a.date.split('/').reverse().join('-');
          const dB = b.date.split('/').reverse().join('-');
          return dB.localeCompare(dA);
        });
        setLatestSignals(sortedSignals);
      } catch (e) {
        console.error("Erro ao carregar dados da Landing", e);
      }
      
      setTimeout(() => setIsVisible(true), 150);
    };

    fetchData();
  }, []);

  const manifestoText = "opero em \ndesconformidade controlada\nresistindo à (des)ordem \ncriando padrões temporários\o modo dominante de existir \ngera angústia por natureza\nos limita a poucos sentidos\nenquanto transitamos \pela impermanência";

  const transitionBase = "transition-all duration-[1200ms] ease-[cubic-bezier(0.2,0.8,0.2,1)]";
  const headerState = isVisible ? 'opacity-100 translate-y-0 blur-0' : 'opacity-0 -translate-y-8 blur-sm';

  const MAX_SIGNALS = 5;
  const displayedSignals = latestSignals.slice(0, MAX_SIGNALS);
  const hasMoreSignals = latestSignals.length > MAX_SIGNALS;

  return (
    <div className="relative min-h-screen w-full bg-transparent text-white [.light-mode_&]:text-black selection:bg-[var(--accent)] selection:text-black pb-24">
      <div className="relative z-10 px-4 md:px-8 pt-24 md:pt-32 max-w-[1800px] mx-auto flex flex-col gap-4">
        
        {/* HEADER */}
        <header className={`mt-4 md:mt-8 mb-4 md:mb-16 relative border-b border-white/10 pb-8 [.light-mode_&]:border-black/10 ${transitionBase} ${headerState}`}>
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between">
            <div className="flex flex-col gap-4 w-full">
              {/* Título com Tipografia Fluida para evitar quebra no Desktop */}
              <h1 
                className={`font-nabla lowercase md:leading-[0.8] -ml-1 whitespace-nowrap overflow-visible ${
                  isDarkMode 
                    ? 'mix-blend-screen' 
                    : 'drop-shadow-[3px_3px_0px_rgba(0,0,0,0.25)] opacity-100'
                }`} 
                style={{ 
                  fontPalette: isDarkMode ? '--matrix' : '--matrix-blue',
                  fontSize: 'clamp(3.5rem, 9.5vw, 10rem)' 
                }}
              >
                <div className="flex flex-col md:hidden leading-[0.8] w-full" style={{ fontSize: '12vw' }}>
                    <span>
                      <Typewriter 
                        text="ruídos" 
                        speed={80} 
                        delay={400} 
                        isDarkMode={isDarkMode} 
                        shrinkI={true}
                      />
                    </span>
                    <span className="-mt-1">
                      <Typewriter 
                        text="atmosféricos" 
                        speed={80} 
                        delay={1000} 
                        isDarkMode={isDarkMode} 
                        shrinkI={true}
                      />
                    </span>
                </div>
                <div className="hidden md:block">
                  <Typewriter 
                    text="ruídos atmosféricos" 
                    speed={80} 
                    delay={400} 
                    isDarkMode={isDarkMode} 
                    shrinkI={true}
                  />
                </div>
              </h1>
            </div>
            
            <div className="flex flex-col items-start md:items-end gap-1 mt-12 md:mt-0 font-mono text-[10px] text-left md:text-right w-full md:w-auto">
                <div className="flex items-center gap-1.5 opacity-60 hover:opacity-100 transition-opacity cursor-default mb-4">
                  <span className="font-vt text-[10px] tracking-[0.2em] text-[var(--accent)]">
                    sinal estável
                  </span>
                </div>
                <div className="flex flex-col items-start md:items-end opacity-40 gap-1">
                    <div className="tracking-widest">ciclo 21</div>
                </div>
            </div>
          </div>
        </header>

        {/* MASONRY GRID PRINCIPAL DA LANDING */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* AREA DE OBRAS (MASONRY PAREDE DE QUADROS) - RESTRITO A 2 OBRAS */}
          <div className="lg:col-span-8">
            <div className="columns-1 md:columns-2 gap-8 space-y-8">
              {featuredWorks.map((work, index) => {
                 const isGradient = work.imageUrl.includes('gradient');
                 const delay = 100 + (index * 150); 
                 
                 return (
                   <ScrollReveal
                     key={work.id}
                     delay={delay}
                     onClick={() => onNavigate(ViewState.MATERIA)}
                     className="break-inside-avoid relative group cursor-pointer flex flex-col bg-white/0 hover:bg-white/[0.01] [.light-mode_&]:hover:bg-black/[0.01] transition-colors duration-500 mb-8"
                   >
                     <div className="w-full relative overflow-hidden rounded-2xl mb-4 bg-[#0a0a0a] [.light-mode_&]:bg-neutral-200 border border-white/5 [.light-mode_&]:border-black/5">
                        {isGradient ? (
                           <div className="w-full h-32 opacity-100 md:group-hover:scale-105 transition-transform duration-1000" style={{ background: work.imageUrl }}></div>
                        ) : (
                           <LazyImage
                            src={formatImageUrl(work.imageUrl)}
                            alt={work.title}
                            className="transition-transform duration-1000 md:group-hover:scale-[1.02]"
                            autoHeight={true} 
                           />
                        )}
                        {work.isFeatured && (
                           <div className="absolute top-4 right-4 z-20 text-[var(--accent)] opacity-60 group-hover:opacity-100 transition-opacity">
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                                  <circle cx="12" cy="12" r="6" />
                              </svg>
                           </div>
                        )}
                     </div>
                     
                     <div className="flex flex-col items-start px-2 relative z-10">
                        <h3 className="font-electrolize text-2xl md:text-3xl opacity-90 group-hover:opacity-100 transition-opacity duration-300 leading-tight lowercase">
                          {work.title}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 font-mono text-[9px] text-[var(--accent)] tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">
                          <span>{work.technique}</span>
                          <span>///</span>
                          <span>ver</span>
                        </div>
                     </div>
                   </ScrollReveal>
                 );
              })}
            </div>
          </div>

          {/* COLUNA LATERAL (SINAIS + MANIFESTO) */}
          <div className="lg:col-span-4 flex flex-col gap-8">
             <ScrollReveal
                delay={300}
                className="relative border border-white/5 p-6 group flex flex-col rounded-3xl bg-black/10 [.light-mode_&]:bg-white/50 [.light-mode_&]:border-black/5"
                style={{ height: 'fit-content' }} 
             >
                <div 
                    className="flex justify-between items-start cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onNavigate(ViewState.SINAIS)}
                >
                  <h2 className="font-electrolize text-lg opacity-80 lowercase text-[var(--accent)]">
                      sinais captados
                    </h2>
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                </div>
                
                <div className="flex flex-col mt-4">
                  {displayedSignals.length > 0 ? (
                    <>
                        {displayedSignals.map((sinal, i) => (
                            <div 
                                key={i} 
                                onClick={() => onNavigate(ViewState.SINAIS)}
                                className="flex justify-between items-center border-b border-white/5 py-3 group-hover:border-white/20 transition-colors [.light-mode_&]:border-black/5 [.light-mode_&]:group-hover:border-black/20 cursor-pointer"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <span className="font-vt text-[10px] tracking-widest text-[var(--accent)] opacity-80 flex-shrink-0">
                                        {formatSignalDate(sinal.date)}
                                    </span>
                                    <span className="font-mono text-xs opacity-60 truncate group-hover:opacity-100 transition-opacity lowercase">
                                        {sinal.title}
                                    </span>
                                </div>
                                <span className="font-vt text-[10px] opacity-30">&gt;</span>
                            </div>
                        ))}
                        
                        {hasMoreSignals && (
                            <div 
                                onClick={() => onNavigate(ViewState.SINAIS)}
                                className="mt-4 pt-2 flex items-center justify-end gap-2 font-mono text-[10px] text-[var(--accent)] tracking-widest opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
                            >
                                <span>ver todos os sinais</span>
                                <span>→</span>
                            </div>
                        )}
                    </>
                  ) : (
                    <div className="py-8 flex items-center justify-center">
                        <span className="font-vt text-[10px] opacity-20">buscando frequências...</span>
                    </div>
                  )}
                </div>
             </ScrollReveal>

             <ScrollReveal
                delay={400}
                onClick={() => onNavigate(ViewState.MANIFESTO)}
                className="relative border border-white/5 p-6 cursor-pointer flex flex-col justify-center items-start text-left group rounded-3xl bg-black/10 hover:bg-black/20 [.light-mode_&]:bg-white/50 [.light-mode_&]:hover:bg-white/80 [.light-mode_&]:border-black/5"
             >
                <div 
                  className="font-electrolize text-xl leading-relaxed text-white transition-colors duration-500 lowercase whitespace-pre-wrap [.light-mode_&]:text-black"
                >
                  {isVisible && <Typewriter text={manifestoText} speed={60} delay={800} isDarkMode={isDarkMode} />}
                </div>
                
                <div 
                  className="mt-6 flex items-center gap-3 opacity-60 group-hover:opacity-100 transition-opacity"
                >
                    <div className="h-px w-8 bg-[var(--accent)]"></div>
                    <span className="font-mono text-[10px] tracking-widest text-[var(--accent)] lowercase">ler manifesto</span>
                </div>
             </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
