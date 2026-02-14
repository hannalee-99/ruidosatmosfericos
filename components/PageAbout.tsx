
import React, { useState, useEffect } from 'react';
import { storage } from '../lib/storage';
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
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0"></div>
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-[var(--accent)]/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-10 w-64 h-64 bg-yellow-500/5 rounded-full blur-[80px] pointer-events-none mix-blend-screen [.light-mode_&]:mix-blend-multiply"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col md:grid md:grid-cols-12 gap-8 md:gap-24 items-center md:items-start lg:items-center">
        
        {/* Título Mobile */}
        <header className="md:hidden w-full text-left mb-8">
          <h1 className="font-nabla text-7xl lowercase tracking-tighter leading-[0.9]" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>
            esse<br/>eu
          </h1>
        </header>

        {/* Coluna da Imagem: Ajusta-se ao tamanho da imagem (fit-content) */}
        <div className="md:col-span-5 flex justify-center md:justify-end order-1 md:order-2 w-full mt-4 md:mt-0">
            <div 
              className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl transition-all duration-500"
              style={{ 
                animation: `imageReveal 1s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
                opacity: 0,
                transform: 'translateY(20px)',
                width: 'fit-content',
                maxWidth: '100%'
              }}
            >
               <img 
                 src={imageSrc} 
                 alt="perfil"
                 className="max-w-full h-auto block object-contain md:max-h-[75vh]"
               />
            </div>
        </div>

        {/* Coluna de Texto */}
        <div className="md:col-span-7 flex flex-col text-left space-y-10 order-2 md:order-1 relative w-full">
           <header className="hidden md:block space-y-4">
             <h1 className="font-nabla text-7xl md:text-9xl lowercase tracking-tighter leading-[0.9]" style={{ fontPalette: isDarkMode ? '--matrix' : '--matrix-blue' }}>
               esse<br/>eu
             </h1>
           </header>

           <div className="font-mono text-sm md:text-lg leading-loose opacity-80 whitespace-pre-wrap lowercase max-w-xl text-justify md:text-left text-neutral-300 [.light-mode_&]:text-neutral-700">
             {isLoaded ? (data.text || "configure este texto no backoffice.") : "carregando dados..."}
           </div>

           <div className="pt-4 md:pt-8 flex items-center">
             <NeobrutalistButton 
                onClick={() => onNavigate(ViewState.CONNECT)}
                variant="matrix"
                className="text-[10px] md:text-xs tracking-[0.2em] px-6 py-2.5 md:px-10 md:py-4 lowercase font-bold opacity-70 md:opacity-100 hover:opacity-100 transition-opacity"
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
