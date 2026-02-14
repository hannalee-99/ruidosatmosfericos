
import React, { useState, useEffect, useRef, memo } from 'react';

interface EyeEntity {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const MAX_EYES = 5;

const ObserverEffect: React.FC = memo(() => {
  const [eyes, setEyes] = useState<EyeEntity[]>([]);
  const [hasHover, setHasHover] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const distanceTraveled = useRef(0);
  const lastSpawnTime = useRef(0);

  useEffect(() => {
    const hoverMedia = window.matchMedia('(hover: hover)');
    setHasHover(hoverMedia.matches);

    if (!hoverMedia.matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const now = Date.now();
      
      const dx = clientX - lastPos.current.x;
      const dy = clientY - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      distanceTraveled.current += dist;
      lastPos.current = { x: clientX, y: clientY };

      if (distanceTraveled.current > 400 && now - lastSpawnTime.current > 500) {
        spawnEye(clientX, clientY);
        distanceTraveled.current = 0;
        lastSpawnTime.current = now;
      }
    };

    const spawnEye = (x: number, y: number) => {
      const id = Date.now();
      const sizeRandom = 0.6 + Math.random() * 0.4; 
      const rotationRandom = (Math.random() - 0.5) * 40; 

      setEyes(prev => {
        const next = [...prev, { id, x, y, scale: sizeRandom, rotation: rotationRandom }];
        return next.length > MAX_EYES ? next.slice(next.length - MAX_EYES) : next;
      });

      setTimeout(() => {
        setEyes(prev => prev.filter(e => e.id !== id));
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (!hasHover) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden">
      {eyes.map((eye) => (
        <div
          key={eye.id}
          className="absolute w-12 h-8 will-change-transform"
          style={{
            left: eye.x,
            top: eye.y,
            transform: `translate(-50%, -50%) scale(${eye.scale}) rotate(${eye.rotation}deg)`,
          }}
        >
          <svg
            viewBox="0 0 100 60"
            className="w-full h-full overflow-visible drop-shadow-[0_0_5px_rgba(159,248,93,0.3)] [.light-mode_&]:drop-shadow-[0_0_5px_rgba(41,63,207,0.3)]"
          >
             <g className="animate-[eyeBrief_2s_ease-out_forwards] origin-center">
                <path 
                  d="M 0 30 Q 50 -10 100 30 Q 50 70 0 30 Z" 
                  fill="black" 
                  stroke="var(--accent)" 
                  strokeWidth="2"
                  className="opacity-90 [.light-mode_&]:fill-white [.light-mode_&]:stroke-black"
                />
                <g className="animate-[eyeLook_2s_ease-in-out_infinite]">
                   <circle cx="50" cy="30" r="14" stroke="var(--accent)" strokeWidth="1" fill="none" className="[.light-mode_&]:stroke-black" />
                   <circle cx="50" cy="30" r="8" fill="var(--accent)" className="[.light-mode_&]:fill-black" />
                   <circle cx="53" cy="27" r="2" fill="white" />
                </g>
             </g>
          </svg>
        </div>
      ))}

      <style>{`
        @keyframes eyeBrief {
          0% { opacity: 0; transform: scale(0.5); }
          20% { opacity: 1; transform: scale(1.1); }
          80% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes eyeLook {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(4px, -2px); }
        }
      `}</style>
    </div>
  );
});

export default ObserverEffect;
