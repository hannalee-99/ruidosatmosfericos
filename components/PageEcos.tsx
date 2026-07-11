import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { storage } from '../lib/storage';
import { EcosConfig, ViewState } from '../types';
import NeobrutalistButton from './NeobrutalistButton';
import { trackExternalClicked, trackSocialLinkClicked } from './analytics';
import { ArrowUpRight, Radio, ExternalLink } from 'lucide-react';

interface PageEcosProps {
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
}

const PageEcos: React.FC<PageEcosProps> = ({ onNavigate, isDarkMode }) => {
  const [ecosConfig, setEcosConfig] = useState<EcosConfig>({ id: 'ecos_config', links: [] });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const config = await storage.get('about', 'ecos_config') as EcosConfig | null;
        if (config) {
          setEcosConfig(config);
        } else {
          // Fallback inicial idêntico ao original
          setEcosConfig({
            id: 'ecos_config',
            links: [
              { 
                id: '01', 
                title: 'colab55', 
                description: 'impressões e objetos de ritos',
                url: 'https://www.colab55.com/@ruidosatmosfericos',
                status: 'ativo'
              },
              { 
                id: '02', 
                title: 'pinterest', 
                description: 'fragmentos de processo e ruídos',
                url: 'https://br.pinterest.com/ruidosatmosfericos01/',
                status: 'ativo'
              },
              { 
                id: '03', 
                title: 'redbubble', 
                description: 'suportes e artefatos globais',
                url: 'https://www.redbubble.com/people/rdsatmosfericos/',
                status: 'ativo'
              },
            ]
          });
        }
      } catch (e) {
        console.error("Erro ao carregar ecos", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const activeLinks = (ecosConfig.links || []).filter(l => l.status === 'ativo');

  const handleLinkClick = (title: string, url: string) => {
    trackExternalClicked(title, url);
    trackSocialLinkClicked(title, url, title.toLowerCase());
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-start py-24 md:py-32 px-6 md:px-12 overflow-hidden animate-in fade-in duration-700">
      <Helmet>
        <title>ecos — ruídos atmosféricos</title>
        <meta name="description" content="canais de transmissão, suportes físicos e ecos no espaço digital de ruídos atmosféricos" />
        <meta property="og:title" content="ecos — ruídos atmosféricos" />
        <meta property="og:description" content="canais de transmissão, suportes físicos e ecos no espaço digital de ruídos atmosféricos" />
      </Helmet>

      {/* Immersive Background Layers */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none mix-blend-screen [.light-mode_&]:mix-blend-multiply"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col md:grid md:grid-cols-12 gap-8 md:gap-16 items-start">
        
        {/* Left Column: Title and concept */}
        <div className="md:col-span-5 space-y-6 md:sticky md:top-32">
          <header className="space-y-4">
            <h1 className={`font-nabla text-7xl md:text-9xl lowercase tracking-tighter leading-[0.9] ${isDarkMode ? 'palette-matrix' : 'palette-matrix-blue'}`}>
              ecos
            </h1>
          </header>
          
          <div className="space-y-4 max-w-sm">
            <p className="font-mono text-xs uppercase tracking-[0.25em] text-[var(--accent)] flex items-center gap-2">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              canais de propagação
            </p>
            <p className="font-mono text-sm leading-relaxed opacity-70 lowercase text-justify text-neutral-300 [.light-mode_&]:text-neutral-700">
              pontos de sintonização, ritos estendidos, suportes físicos e vestígios analógicos dispersos no espaço digital.
            </p>
          </div>
        </div>

        {/* Right Column: Channels Grid/List */}
        <div className="md:col-span-7 w-full space-y-8 mt-12 md:mt-0">
          {isLoaded ? (
            activeLinks.length > 0 ? (
              <div className="grid grid-cols-1 gap-8">
                {activeLinks.map((link) => (
                  <div 
                    key={link.id} 
                    className="group relative bg-transparent border border-transparent rounded-xl p-6 hover:bg-white/[0.01] [.light-mode_&]:hover:bg-black/[0.01] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] [.light-mode_&]:hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.03)] hover:-translate-y-1.5 transition-all duration-500 ease-out overflow-hidden"
                  >
                    {/* Subtle aesthetic background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent)]/0 to-[var(--accent)]/[0.005] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10 w-full">
                      <div className="flex items-start gap-4 min-w-0 flex-1">
                        {link.emoji ? (
                          <span className="text-2xl select-none mt-0.5" role="img" aria-label={link.title}>
                            {link.emoji}
                          </span>
                        ) : (
                          <span className="text-xl text-[var(--accent)] select-none mt-0.5">🔗</span>
                        )}
                        <div className="space-y-1 min-w-0">
                          <h3 className="font-electrolize text-xl md:text-2xl tracking-tight text-white [.light-mode_&]:text-black lowercase">
                            {link.title}
                          </h3>
                          {link.description && (
                            <p className="font-mono text-[11px] md:text-xs opacity-50 lowercase max-w-md leading-relaxed">
                              {link.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 flex items-center">
                        <button 
                          onClick={() => handleLinkClick(link.title, link.url)}
                          className="group/cli relative flex items-center gap-2 font-mono text-[10px] md:text-xs tracking-widest lowercase transition-all duration-300 active:scale-95 text-left bg-transparent border-none outline-none pb-2 pt-1 cursor-pointer"
                        >
                          <span className="text-[var(--accent)] font-bold">visitante@ruidos:~$</span>
                          <span className="text-white [.light-mode_&]:text-black opacity-85 group-hover/cli:opacity-100 text-glow-accent">
                            sintonizar --{link.title.replace(/\s+/g, '-').toLowerCase()}
                          </span>
                          <span className="w-1.5 h-3.5 bg-[var(--accent)] animate-cursor-blink shadow-[0_0_8px_var(--accent)]"></span>
                          
                          {/* Pulsing neon underline line */}
                          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--accent)] animate-neon-line shadow-[0_0_10px_var(--accent)] rounded-full"></div>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl opacity-40 font-mono text-xs lowercase">
                nenhum canal de transmissão ativo no momento.
              </div>
            )
          ) : (
            <div className="flex justify-center py-20">
              <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .text-glow-accent {
          text-shadow: 0 0 8px var(--accent);
        }
        @keyframes neon-line-pulse {
          0%, 100% {
            opacity: 0.35;
            box-shadow: 0 0 3px rgba(var(--accent-rgb), 0.2);
            background-color: rgba(var(--accent-rgb), 0.4);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 14px rgba(var(--accent-rgb), 0.95), 0 0 6px rgba(var(--accent-rgb), 0.5);
            background-color: rgba(var(--accent-rgb), 1);
          }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 1; }
        }
        .animate-neon-line {
          animation: neon-line-pulse 2s infinite ease-in-out;
        }
        .animate-cursor-blink {
          animation: cursor-blink 0.8s infinite steps(2, start);
        }
      `}</style>
    </div>
  );
};

export default PageEcos;
