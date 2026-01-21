
import React, { useState, useEffect, useRef } from 'react';
import { ViewState } from '../types';
import { COLORS } from '../constants';
import Logo from './Logo';
import Toast from './Toast';

interface NavigationProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, 
  onNavigate, 
  isDarkMode, 
  onToggleTheme,
}) => {
  const [showToast, setShowToast] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Estado para a "porta dos fundos" (Backoffice Secreto)
  const [secretClicks, setSecretClicks] = useState(0);
  const secretTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (currentView === ViewState.BACKOFFICE) return null;

  useEffect(() => {
    const mainScroll = document.getElementById('main-scroll');
    
    const handleScroll = () => {
      if (!mainScroll) return;
      const currentScrollY = mainScroll.scrollTop;
      
      if (isMobileMenuOpen) {
          setIsVisible(true);
          return;
      }
      
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else {
        if (currentScrollY > lastScrollY && currentScrollY > 50) {
           setIsVisible(false);
        } else {
           setIsVisible(true);
        }
      }
      setLastScrollY(currentScrollY);
    };

    if (mainScroll) {
      mainScroll.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (mainScroll) {
        mainScroll.removeEventListener('scroll', handleScroll);
      }
    };
  }, [lastScrollY, isMobileMenuOpen]);

  const items = Object.values(ViewState).filter(item => 
    item !== ViewState.BACKOFFICE && 
    item !== ViewState.INTERACTIVE
  );

  const triggerSecretStep = () => {
    const newCount = secretClicks + 1;
    setSecretClicks(newCount);

    if (secretTimerRef.current) clearTimeout(secretTimerRef.current);
    
    if (newCount >= 5) {
      onNavigate(ViewState.BACKOFFICE);
      setSecretClicks(0);
      setIsMobileMenuOpen(false);
    } else {
      secretTimerRef.current = setTimeout(() => {
        setSecretClicks(0);
      }, 2000); 
    }
  };

  const handleLogoClick = () => {
    onNavigate(ViewState.LANDING);
    setIsMobileMenuOpen(false);
    triggerSecretStep();
  };

  const handleMobileNavigate = (view: ViewState) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const activeColor = isDarkMode ? COLORS.matrixGreen : COLORS.deepBlue;
  
  const gradientStart = isDarkMode ? 'rgba(5,5,5,0.98)' : 'rgba(242,242,242,0.98)';
  const gradientMid = isDarkMode ? 'rgba(5,5,5,0.9)' : 'rgba(242,242,242,0.9)';
  
  const smoothTransition = 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full z-[100] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}
      >
        <div 
          className="absolute inset-0 pointer-events-none transition-colors duration-1000"
          style={{ 
            background: `linear-gradient(to bottom, ${gradientStart} 0%, ${gradientMid} 60%, transparent 100%)`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)'
          }}
        ></div>

        {/* Container Principal - Padding e Max-Width ajustados para alinhar com o conteúdo da página */}
        <div className="relative px-4 md:px-8 h-20 lg:h-24 flex justify-between items-center max-w-[1800px] mx-auto w-full">
          
          {/* LEFT: Logo & Breadcrumb */}
          <div className="flex items-center gap-6 flex-shrink-0 z-50">
            <div 
              onClick={handleLogoClick}
              className="cursor-pointer hover:scale-110 transition-transform flex items-center"
            >
              <Logo size={24} color={activeColor} className="md:w-[28px] md:h-[28px]" />
            </div>

             {/* Breadcrumb Otimizado */}
             <div 
              onClick={triggerSecretStep}
              className="font-vt text-lg tracking-[0.2em] opacity-60 hidden md:block lowercase cursor-pointer hover:opacity-100 transition-opacity leading-none"
             >
              ruídos / <span className="opacity-100 transition-colors duration-500" style={{ color: activeColor }}>{currentView}</span>
            </div>
          </div>
          
          {/* RIGHT: Desktop Nav & Mobile Toggle */}
          <div className="flex justify-end items-center h-full z-50">
            
            {/* DESKTOP MENU - Visible only on LG+ */}
            <div className="hidden lg:flex gap-12 xl:gap-24 items-center pl-8">
              {items.map((item) => {
                const isSelected = currentView === item;
                return (
                  <button
                    key={item}
                    onClick={() => onNavigate(item)}
                    className={`
                      font-vt text-lg tracking-[0.2em] pb-1 border-b leading-none whitespace-nowrap flex-shrink-0 lowercase
                      ${isSelected ? 'opacity-100 border-current' : 'opacity-40 border-transparent hover:opacity-100'}
                    `}
                    style={{ 
                      color: isSelected ? activeColor : 'inherit',
                      transition: smoothTransition
                    }}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
            
            {/* THEME TOGGLE & MOBILE CONTROLS */}
            <div className="flex items-center gap-4 md:gap-0 lg:pl-10 lg:ml-8 lg:border-l border-current border-opacity-10">
              
              {/* Botão de Tema Minimalista (Sem Borda) */}
              <button 
                onClick={onToggleTheme}
                className="w-8 h-8 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
                title={isDarkMode ? 'ativar modo claro' : 'ativar modo escuro'}
              >
                {isDarkMode ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Mobile Menu Toggle - Visible on Mobile & Tablet (hidden on LG+) */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden w-10 h-10 flex items-center justify-center border border-current/20 rounded-full relative overflow-hidden group z-[60] ml-4"
                style={{ color: activeColor }}
              > 
                <div className={`transition-all duration-500 ease-in-out absolute ${isMobileMenuOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <div className={`transition-all duration-500 ease-in-out absolute ${isMobileMenuOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'}`}>
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </div>
              </button>

            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE/TABLET MENU OVERLAY */}
      <div 
        className={`
          fixed inset-0 z-[90] bg-black/98 [.light-mode_&]:bg-[#f2f2f2]/98 backdrop-blur-3xl lg:hidden
          flex flex-col items-start justify-center
          transition-[clip-path] duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]
        `}
        style={{
           clipPath: isMobileMenuOpen ? 'circle(150% at calc(100% - 40px) 40px)' : 'circle(0% at calc(100% - 40px) 40px)',
           pointerEvents: isMobileMenuOpen ? 'auto' : 'none',
           willChange: 'clip-path'
        }}
        onClick={() => setIsMobileMenuOpen(false)}
      >
         <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
         
         <div 
           className="flex flex-col items-start gap-8 relative z-10 p-12 w-full"
           onClick={(e) => {
             e.stopPropagation();
           }}
         >
            {items.map((item, index) => {
               const isSelected = currentView === item;
               return (
                 <button
                   key={item}
                   onClick={() => handleMobileNavigate(item)}
                   className={`
                     font-electrolize text-3xl lowercase tracking-wider text-left origin-left
                     transition-all duration-700 transform
                     ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-12 opacity-0'}
                     ${isSelected ? 'text-[var(--accent)] scale-110' : 'text-neutral-500 hover:text-white [.light-mode_&]:hover:text-black'}
                   `}
                   style={{ 
                     transitionDelay: isMobileMenuOpen ? `${150 + (index * 60)}ms` : '0ms',
                     textShadow: isSelected ? '0 0 20px var(--accent)' : 'none'
                   }}
                 >
                   {item}
                 </button>
               );
            })}
         </div>

         <div 
            className={`
              absolute bottom-12 left-12 font-mono text-[10px] opacity-30 lowercase tracking-[0.4em]
              transition-opacity duration-1000 delay-500
              ${isMobileMenuOpen ? 'opacity-30' : 'opacity-0'}
            `}
         >
            ruídos atmosféricos /// mobile uplink
         </div>
      </div>

      <Toast 
        message="e-mail copiado" 
        isVisible={showToast} 
        onClose={() => setShowToast(false)} 
        isDarkMode={isDarkMode}
      />
    </>
  );
};

export default Navigation;
