
import React, { useEffect, useRef, useState, memo } from 'react';

interface Ripple {
  id: number;
  x: number;
  y: number;
}

interface TrailPoint {
  id: number;
  x: number;
  y: number;
  size: number;
}

const CustomCursor: React.FC = memo(() => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [trail, setTrail] = useState<TrailPoint[]>([]);
  const [hasHover, setHasHover] = useState(false);
  const [isHoveredInteractive, setIsHoveredInteractive] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const lastRippleTime = useRef(0);
  const lastPos = useRef({ x: 0, y: 0 });

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

      // Initialize on first movement
      if (lastPos.current.x === 0 && lastPos.current.y === 0) {
        lastPos.current = { x: e.clientX, y: e.clientY };
        return;
      }

      // Calculate distance to generate trail
      const dx = e.clientX - lastPos.current.x;
      const dy = e.clientY - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 12) {
        const id = Math.random();
        const size = Math.random() * 2 + 1.5; // microscopic (1.5px to 3.5px)
        
        // Slight electromagnetic jitter/drift
        const offsetDist = Math.random() * 4;
        const offsetAngle = Math.random() * Math.PI * 2;
        const px = e.clientX + Math.cos(offsetAngle) * offsetDist;
        const py = e.clientY + Math.sin(offsetAngle) * offsetDist;

        setTrail(prev => [...prev.slice(-25), { id, x: px, y: py, size }]);
        lastPos.current = { x: e.clientX, y: e.clientY };

        setTimeout(() => {
          setTrail(prev => prev.filter(t => t.id !== id));
        }, 500);
      }
    };

    const handleMouseLeave = () => { if (cursorRef.current) cursorRef.current.style.opacity = '0'; };
    const handleMouseEnter = () => { if (cursorRef.current) cursorRef.current.style.opacity = '1'; };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const isInteractive = target.closest('a, button, [role="button"], input, select, textarea, .cursor-pointer, [onclick]') !== null;
      setIsHoveredInteractive(isInteractive);
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', moveCursor, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    window.addEventListener('mouseover', handleMouseOver, { passive: true });
    window.addEventListener('mousedown', handleMouseDown, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });

    return () => {
      hoverMedia.removeEventListener('change', handleChange);
      window.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
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
        @keyframes electromagnetic-fade {
            0% { transform: scale(1.3); opacity: 0.85; filter: drop-shadow(0 0 2px currentColor); }
            100% { transform: scale(0.1); opacity: 0; }
        }
      `}</style>

      {trail.map(t => (
         <div
            key={t.id}
            className="fixed pointer-events-none z-[9998] rounded-full bg-[#9ff85d] [.light-mode_&]:bg-teal-500 shadow-[0_0_6px_#9ff85d] [.light-mode_&]:shadow-[0_0_5px_rgba(20,184,166,0.5)]"
            style={{
                left: t.x, top: t.y, width: `${t.size}px`, height: `${t.size}px`,
                marginLeft: `-${t.size / 2}px`, marginTop: `-${t.size / 2}px`,
                animation: 'electromagnetic-fade 0.5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards'
            }}
         />
      ))}

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
        <div
          style={{
            transform: `scale(${isClicked ? 0.85 : (isHoveredInteractive ? 1.7 : 1)})`,
            transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
            filter: isHoveredInteractive ? 'drop-shadow(0 0 8px currentColor)' : 'none',
          }}
        >
          <svg 
            width="32" 
            height="32" 
            viewBox="0 0 32 32" 
            fill="currentColor" 
            xmlns="http://www.w3.org/2000/svg"
            style={{ 
              animation: isHoveredInteractive ? 'vortex-rotate 1.5s linear infinite' : 'vortex-rotate 4s linear infinite' 
            }}
          >
            <g>
              {renderBlades()}
            </g>
            <circle cx="16" cy="16" r="1.5" fill="currentColor" />
          </svg>
        </div>
      </div>
    </>
  );
});

export default CustomCursor;
