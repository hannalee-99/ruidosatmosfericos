
import React, { useState, useEffect } from 'react';
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
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Contador simples sem timer de expiração
  const [clickCount, setClickCount] = useState(0);

  if (currentView === ViewState.BACKOFFICE) return null;

  useEffect(() => {
    const mainScroll = document.getElementById('main-scroll');
    
    const handleScroll = () => {
      if (!mainScroll) return;
      const currentScrollY = mainScroll.scrollTop;
      if (currentScrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    if (mainScroll) {
      mainScroll.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (mainScroll) {
        mainScroll.removeEventListener('scroll', handleScroll);
      }
    };
  }, []);

  const items = Object.values(ViewState).filter(item => 
    item !== ViewState.BACKOFFICE && 
    item !== ViewState.INTERACTIVE
  );

  const handleLogoClick = () => {
    // Só conta cliques se estiver na tela de entrada
    if (currentView === ViewState.LANDING) {
      const nextCount = clickCount + 1;
      
      if (nextCount >= 5) {
        setClickCount(0); // Reseta o contador
        const accessKey = prompt("insira a chave de uplink para autorizar o fluxo:");
        
        if (accessKey === 'Gengibre26#') {
          onNavigate(ViewState.BACKOFFICE);
          setIsMobileMenuOpen(false);
        } else if (accessKey !== null) {
          alert("acesso negado. sinal interrompido.");
        }
      } else {
        setClickCount(nextCount);
      }
    } else {
      // Se estiver em outra tela, apenas volta para a entrada
      onNavigate(ViewState.LANDING);
      setClickCount(0);
    }
  };

  const handleItemClick = (item: ViewState) => {
    onNavigate(item);
    setIsMobileMenuOpen(false);
    setClickCount(0); // Reseta contador ao navegar
  };

  const activeColor = isDarkMode ? COLORS.matrixGreen : COLORS.deepBlue;
  const gradientStart = isDarkMode ? 'rgba(5,5,5,0.98)' : 'rgba(242,242,242,0.98)';
  const gradientMid = isDarkMode ? 'rgba(5,5,5,0.9)' : 'rgba(242,242,242,0.9)';
  const smoothTransition = 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)';

  return (
    <>
      <nav 
        className="fixed top-0 left-0 w-full z-[200] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] translate-y-0"
      >
        <div 
          className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ease-out ${isScrolled ? 'opacity-0' : 'opacity-100'}`}
          style={{ 
            background: `linear-gradient(to bottom, ${gradientStart} 0%, ${gradientMid} 60%, transparent 100%)`,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)'
          }}
        ></div>

        <div 
           className={`
             absolute inset-0 pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
             ${isScrolled 
               ? 'opacity-100 bg-black/80 [.light-mode_&]:bg-white/80 backdrop-blur-md shadow-[0_4px_30px_rgba(0,0,0,0.3)] [.light-mode_&]:shadow-[0_4px_30px_rgba(0,0,0,0.05)] border-b border-white/5 [.light-mode_&]:border-black/5' 
               : 'opacity-0 bg-transparent backdrop-blur-none shadow-none border-transparent'}
           `}
        ></div>

        <div className="relative px-4 md:px-8 h-20 lg:h-24 flex justify-between items-center max-w-[1800px] mx-auto w-full">
          <div className="flex items-center gap-6 flex-shrink-0 z-50">
            <div 
              onClick={handleLogoClick}
              className="cursor-pointer md:hover:scale-110 transition-transform flex items-center p-2"
              title={currentView === ViewState.LANDING ? "uplink" : "voltar para entrada"}
            >
              <Logo size={24} color={activeColor} className="md:w-[28px] md:h-[28px]" />
            </div>
          </div>
          
          <div className="flex justify-end items-center h-full z-50">
            <div className="hidden lg:flex gap-10 xl:gap-20 items-center pl-8">
              {items.map((item) => {
                const isSelected = currentView === item;

                return (
                  <button
                    key={item}
                    onClick={() => handleItemClick(item)}
                    className={`
                      font-electrolize text-base tracking-widest pb-1 border-b leading-none whitespace-nowrap flex-shrink-0 lowercase
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
            
            <div className="flex items-center gap-4 md:gap-0 lg:pl-10 lg:ml-8 lg:border-l border-current border-opacity-10">
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

      <div 
        className={`
          fixed inset-0 z-[190] bg-black/98 [.light-mode_&]:bg-[#f2f2f2]/98 backdrop-blur-3xl lg:hidden
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
           onClick={(e) => { e.stopPropagation(); }}
         >
            {items.map((item, index) => {
               const isSelected = currentView === item;
               return (
                 <button
                   key={item}
                   onClick={() => handleItemClick(item)}
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
