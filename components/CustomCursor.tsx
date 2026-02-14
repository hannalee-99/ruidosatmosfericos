
import React, { useEffect, useRef, useState, memo } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

const CustomCursor: React.FC = memo(() => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [hasHover, setHasHover] = useState(false);
  const lastRippleTime = useRef(0);

  useEffect(() => {
    const hoverMedia = window.matchMedia('(hover: hover)');
    setHasHover(hoverMedia.matches);

    const handleChange = (e: MediaQueryListEvent) => setHasHover(e.matches);
    hoverMedia.addEventListener('change', handleChange);

    if (!hoverMedia.matches) return;

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    };

    const handleMouseLeave = () => { if (cursorRef.current) cursorRef.current.style.opacity = '0'; };
    const handleMouseEnter = () => { if (cursorRef.current) cursorRef.current.style.opacity = '1'; };

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      hoverMedia.removeEventListener('change', handleChange);
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  useEffect(() => {
    if (!hasHover) return;

    const handleClick = (e: MouseEvent) => {
        const now = Date.now();
        if (now - lastRippleTime.current < 200) return; 

        const id = now;
        setRipples(prev => [...prev.slice(-3), { id, x: e.clientX, y: e.clientY }]);
        lastRippleTime.current = now;

        setTimeout(() => {
            setRipples(prev => prev.filter(r => r.id !== id));
        }, 500);
    };

    window.addEventListener('mousedown', handleClick, { passive: true });
    return () => window.removeEventListener('mousedown', handleClick);
  }, [hasHover]);

  if (!hasHover) return null;

  const renderBlades = () => {
    const blades = [];
    for (let i = 0; i < 6; i++) {
      blades.push(
        <path
          key={i}
          d="M16 16C16 16 18 10 24 8C20 10 16 14 16 16Z"
          transform={`rotate(${i * 60} 16 16)`}
          opacity={0.8 - (i * 0.1)}
        />
      );
    }
    return blades;
  };

  return (
    <>
      <style>{`
        @keyframes ripple-minimal {
            0% { transform: scale(0.5); opacity: 0.5; }
            100% { transform: scale(2); opacity: 0; }
        }
        @keyframes vortex-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
      `}</style>

      {ripples.map(r => (
         <div
            key={r.id}
            className="fixed pointer-events-none z-[9999] rounded-full border border-current opacity-20"
            style={{
                left: r.x, top: r.y, width: '20px', height: '20px',
                marginLeft: '-10px', marginTop: '-10px',
                animation: 'ripple-minimal 0.4s ease-out forwards'
            }}
         />
      ))}

      <div 
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[10000] transition-opacity duration-500 text-white [.light-mode_&]:text-black"
        style={{ marginLeft: '-16px', marginTop: '-16px', transform: 'translate3d(-100px, -100px, 0)', willChange: 'transform' }}
      >
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 32 32" 
          fill="currentColor" 
          xmlns="http://www.w3.org/2000/svg"
          style={{ animation: 'vortex-rotate 4s linear infinite' }}
        >
          <g>
            {renderBlades()}
          </g>
          <circle cx="16" cy="16" r="1.5" fill="currentColor" />
        </svg>
      </div>
    </>
  );
});

export default CustomCursor;
