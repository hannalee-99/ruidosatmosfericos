
import React, { useEffect, useRef } from 'react';

const CustomCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      {/* Esconde o cursor em mobile/touch devices para não atrapalhar */}
      <style>{`
        @media (hover: none) {
          .custom-cursor-container { display: none; }
        }
      `}</style>

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
