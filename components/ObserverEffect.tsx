
import React, { useState, useEffect, useRef } from 'react';
import { COLORS } from '../constants';

interface EyeEntity {
  id: number;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

const ObserverEffect: React.FC = () => {
  const [eyes, setEyes] = useState<EyeEntity[]>([]);
  const lastPos = useRef({ x: 0, y: 0 });
  const distanceTraveled = useRef(0);
  const clickCount = useRef(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      
      // Calcular distância percorrida
      const dx = clientX - lastPos.current.x;
      const dy = clientY - lastPos.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      distanceTraveled.current += dist;
      lastPos.current = { x: clientX, y: clientY };

      // Spawn rate ajustado
      if (distanceTraveled.current > 300) {
        if (Math.random() < 0.15) {
            spawnEye(clientX, clientY);
            distanceTraveled.current = 0; 
        } else {
            distanceTraveled.current = 150; 
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
        clickCount.current += 1;
        if (clickCount.current % 3 === 0 || Math.random() > 0.5) {
            spawnEye(e.clientX, e.clientY);
        }
    };

    const spawnEye = (x: number, y: number) => {
      const id = Date.now() + Math.random();
      const sizeRandom = 0.5 + Math.random() * 0.8; 
      const rotationRandom = (Math.random() - 0.5) * 30; 

      const newEye: EyeEntity = {
        id,
        x,
        y,
        scale: sizeRandom,
        rotation: rotationRandom
      };

      setEyes(prev => [...prev, newEye]);

      setTimeout(() => {
        setEyes(prev => prev.filter(e => e.id !== id));
      }, 2500);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[50] overflow-hidden">
      {eyes.map((eye) => (
        <div
          key={eye.id}
          className="absolute w-12 h-8 flex items-center justify-center will-change-transform"
          style={{
            left: eye.x,
            top: eye.y,
            transform: `translate(-50%, -50%) scale(${eye.scale}) rotate(${eye.rotation}deg)`,
          }}
        >
          <svg
            viewBox="0 0 100 60"
            className="w-full h-full overflow-visible drop-shadow-[0_0_8px_rgba(159,248,93,0.5)] [.light-mode_&]:drop-shadow-[0_0_8px_rgba(41,63,207,0.5)]"
          >
             {/* 
                OTIMIZAÇÃO: 
                Filtro <feTurbulence> removido. 
                Isso reduz drasticamente o uso da CPU quando múltiplos olhos estão na tela.
             */}

             {/* Animação de Entrada e Saída */}
             <g className="animate-[eyeBrief_2.5s_ease-in-out_forwards] origin-center">
                
                {/* Esclera */}
                <path 
                  d="M 0 30 Q 50 -10 100 30 Q 50 70 0 30 Z" 
                  fill="black" 
                  stroke="var(--accent)" 
                  strokeWidth="2"
                  className="opacity-90 [.light-mode_&]:fill-white [.light-mode_&]:stroke-black"
                />

                {/* Íris */}
                <g className="animate-[eyeLook_2s_ease-in-out_infinite]">
                   <circle cx="50" cy="30" r="14" stroke="var(--accent)" strokeWidth="1" fill="none" className="[.light-mode_&]:stroke-black">
                      <animate attributeName="r" values="14;12;14" dur="3s" repeatCount="indefinite" />
                   </circle>
                   <circle cx="50" cy="30" r="8" fill="var(--accent)" className="[.light-mode_&]:fill-black" />
                   <circle cx="53" cy="27" r="2" fill="white" />
                </g>

                {/* Pálpebra */}
                <path d="M 0 30 Q 50 -10 100 30 Z" fill="#000" className="animate-[blink_2.4s_linear_forwards] opacity-0 [.light-mode_&]:fill-white" /> 
             </g>
          </svg>
        </div>
      ))}

      <style>{`
        @keyframes eyeBrief {
          0% { opacity: 0; transform: scale(0.8); }
          15% { opacity: 1; transform: scale(1.1); }
          25% { transform: scale(1); }
          75% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0) translateY(10px); }
        }
        @keyframes eyeLook {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(-3px, 1px); }
          50% { transform: translate(3px, -1px); }
          75% { transform: translate(0, 2px); }
        }
        @keyframes blink {
           0%, 45%, 55%, 100% { transform: translateY(-100%); opacity: 0; }
           50% { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ObserverEffect;
