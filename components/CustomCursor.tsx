
import React, { useEffect, useRef, useState } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        // Uso de translate3d para melhor performance (GPU acceleration)
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    window.addEventListener('mousemove', moveCursor);
    
    // Tratamento para quando o mouse sai da janela
    const handleMouseLeave = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '0';
    };
    const handleMouseEnter = () => {
      if (cursorRef.current) cursorRef.current.style.opacity = '1';
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  // Efeito de Ripple ao Clicar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
        const id = Date.now();
        setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
        
        // Remove o ripple após a animação
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 800);
    };

    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <>
      {/* Esconde o cursor em mobile/touch devices para não atrapalhar */}
      <style>{`
        @media (hover: none) {
          .custom-cursor-container { display: none; }
        }
        @keyframes ripple-expand {
            0% { transform: scale(0.2); opacity: 1; border-width: 4px; }
            100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
        }
      `}</style>

      {/* Camada de Ripples (Feedback de Clique) */}
      {ripples.map(r => (
         <div
            key={r.id}
            className="fixed pointer-events-none z-[9999] rounded-full border border-[var(--accent)] box-border"
            style={{
                left: r.x,
                top: r.y,
                width: '40px',
                height: '40px',
                marginLeft: '-20px',
                marginTop: '-20px',
                animation: 'ripple-expand 0.6s cubic-bezier(0.215, 0.61, 0.355, 1) forwards'
            }}
         />
      ))}

      <div 
        ref={cursorRef}
        className="custom-cursor-container fixed top-0 left-0 pointer-events-none z-[10000] transition-opacity duration-300"
        style={{ 
          marginLeft: '-16px', 
          marginTop: '-16px',
          willChange: 'transform' 
        }}
      >
        {/* Container que gira - Ajustado para 2s linear para suavidade atmosférica */}
        <div className="w-8 h-8 animate-[spin_2s_linear_infinite]">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="none" 
            strokeLinecap="round"
          >
            <g transform="translate(16,16)">
               {/* Camada de Contorno (Preto) para contraste */}
               {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                 <path 
                    key={`bg-${angle}`} 
                    d="M0 0 C 2 -6 6 -8 10 -4" 
                    transform={`rotate(${angle})`} 
                    stroke="black" 
                    strokeWidth="3.5" 
                    opacity="0.8"
                  />
               ))}
               
               {/* Camada Principal (Branca) */}
               {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
                 <path 
                    key={`fg-${angle}`} 
                    d="M0 0 C 2 -6 6 -8 10 -4" 
                    transform={`rotate(${angle})`} 
                    stroke="white" 
                    strokeWidth="1.5" 
                  />
               ))}
               
               {/* Miolo */}
               <circle r="2.5" fill="black" opacity="0.8" />
               <circle r="1.5" fill="white" />
            </g>
          </svg>
        </div>
      </div>
    </>
  );
};

export default CustomCursor;
