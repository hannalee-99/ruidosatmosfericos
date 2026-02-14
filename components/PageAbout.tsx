import React, { useState, useEffect } from 'react';
import { storage } from './storage';
import { AboutData, ViewState } from '../types';
import { DEFAULT_IMAGE } from '../constants';
import NeobrutalistButton from './NeobrutalistButton';

interface PageAboutProps {
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
}

const PageAbout: React.FC<PageAboutProps> = ({ onNavigate, isDarkMode }) => {
  const [data, setData] = useState<AboutData>({
    id: 'profile',
    text: '',
    imageUrl: DEFAULT_IMAGE
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await storage.get('about', 'profile');
        if (result) {
          setData(result);
        }
      } catch (e) {
        console.error("Failed to load profile data", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const formatImageUrl = (url: string) => {
    if (!url || url.trim() === '') return DEFAULT_IMAGE;
    return url;
  };

  const imageSrc = formatImageUrl(data.imageUrl);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 md:py-32 px-6 md:px-12 overflow-hidden animate-in fade-in duration-700">
      
      {/* Background Decorativo Sutil (Mantido apenas no fundo da página, longe da imagem) */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
      
      {/* Elementos Gráficos de Fundo */}
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none mix-blend-screen [.light-mode_&]:mix-blend-multiply"></div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-24 items-center">
        
        {/* COLUNA DA IMAGEM */}
        <div className="md:col-span-5 flex justify-center md:justify-end order-1 md:order-2">
            <div 
              className="relative w-full max-w-md rounded-2xl md:rounded-3xl overflow-hidden"
              style={{ 
                animation: `imageReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                opacity: 0,
                transform: 'translateY(20px)'
              }}
            >
               {/* Imagem Crua: Sem filtros, sem zoom, sem overlay. Altura automática. */}
               <img 
                 src={imageSrc} 
                 alt="perfil"
                 className="w-full h-auto object-contain"
               />
            </div>
        </div>

        {/* COLUNA DE TEXTO */}
        <div className="md:col-span-7 flex flex-col text-left space-y-10 order-2 md:order-1 relative">
           
           <header className="space-y-4">
             <h1 className="font-nabla text-7xl md:text-9xl lowercase tracking-tighter leading-[0.9]" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>
               esse<br/>eu
             </h1>
           </header>

           <div className="w-16 h-1 bg-[var(--accent)]"></div>

           {/* Texto vindo do Backoffice */}
           <div className="font-mono text-sm md:text-lg leading-loose opacity-80 whitespace-pre-wrap lowercase max-w-xl text-justify md:text-left text-neutral-300 [.light-mode_&]:text-neutral-700">
             {isLoaded ? (data.text || "configure este texto no backoffice.") : "carregando dados..."}
           </div>

           <div className="pt-8 flex items-center">
             <NeobrutalistButton 
                onClick={() => onNavigate(ViewState.CONNECT)}
                variant="matrix"
                className="text-xs tracking-[0.2em] px-10 py-4 lowercase font-bold"
             >
               iniciar contato
             </NeobrutalistButton>
           </div>
        </div>

      </div>

      <style>{`
        @keyframes imageReveal {
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default PageAbout;