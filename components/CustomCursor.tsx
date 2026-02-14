
import React, { useEffect, useRef, useState, memo } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const CustomCursor: React.FC = memo(() => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        // translate3d para máxima performance (GPU)
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseLeave = () => { if (cursorRef.current) cursorRef.current.style.opacity = '0'; };
    const handleMouseEnter = () => { if (cursorRef.current) cursorRef.current.style.opacity = '1'; };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
        const id = Date.now();
        setRipples(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 500);
    };

    window.addEventListener('mousedown', handleClick, { passive: true });
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  // Gerador de lâminas para o vórtex (simetria perfeita)
  const renderBlades = () => {
    const blades = [];
    for (let i = 0; i < 8; i++) {
      blades.push(
        <path
          key={i}
          d="M16 16C16 16 18 10 24 8C20 10 16 14 16 16Z"
          transform={`rotate(${i * 45} 16 16)`}
          opacity={0.8 - (i * 0.05)}
        />
      );
    }
    return blades;
  };

  return (
    <>
      <style>{`
        @media (hover: none) { .custom-cursor-container { display: none; } }
        
        @keyframes ripple-minimal {
            0% { transform: scale(0.5); opacity: 0.5; }
            100% { transform: scale(2); opacity: 0; }
        }

        @keyframes vortex-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Ripple minimalista no clique */}
      {ripples.map(r => (
         <div
            key={r.id}
            className="fixed pointer-events-none z-[9999] rounded-full border border-current opacity-20"
            style={{
                left: r.x, top: r.y, width: '24px', height: '24px',
                marginLeft: '-12px', marginTop: '-12px',
                animation: 'ripple-minimal 0.4s ease-out forwards'
            }}
         />
      ))}

      {/* Cursor Vórtex */}
      <div 
        ref={cursorRef}
        className="custom-cursor-container fixed top-0 left-0 pointer-events-none z-[10000] transition-opacity duration-500 text-white [.light-mode_&]:text-black"
        style={{ marginLeft: '-16px', marginTop: '-16px', willChange: 'transform' }}
      >
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 32 32" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'vortex-rotate 3s linear infinite' }}
        >
          <g>
            {renderBlades()}
          </g>
          <circle cx="16" cy="16" r="1" fill="currentColor" />
        </svg>
      </div>
    </>
  );
});

export default CustomCursor;
