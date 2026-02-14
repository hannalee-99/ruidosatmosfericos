
import React, { useState, useEffect } from 'react';
import { COLORS } from '../constants';
import NeobrutalistButton from './NeobrutalistButton';

interface Fragment {
  id: number;
  text: string;
  x: number;
  y: number;
  delay: number;
  color: string;
}

const FieldView: React.FC = () => {
  const [fragments, setFragments] = useState<Fragment[]>([]);

  const fieldTexts = [
    "presença",
    "matéria",
    "tempo",
    "ruído",
    "interferência",
    "densidade",
    "profundidade",
    "instável",
    "biológico",
    "contido",
    "silencioso"
  ];

  useEffect(() => {
    const newFragments = fieldTexts.map((text, i) => ({
      id: i,
      text,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 80,
      delay: Math.random() * 1.5, // Delay aleatório entre 0s e 1.5s
      color: Math.random() > 0.8 ? COLORS.matrixGreen : COLORS.white
    }));
    setFragments(newFragments);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden text-white bg-black">
      {/* Background estático simplificado para máxima performance */}
      <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <div className="max-w-2xl text-center space-y-8 px-6">
          <p className="text-2xl md:text-4xl font-light leading-relaxed mix-blend-difference">
            O ambiente emerge da <span style={{ color: COLORS.matrixGreen }}>presença</span>.
          </p>
          <p className="text-lg opacity-60 font-mono tracking-tight">
            Navegue pelo ruído. Sinta a densidade do campo.
          </p>
        </div>
      </div>

      {/* Floating interactive text fragments */}
      {fragments.map((frag) => (
        <div
          key={frag.id}
          className="absolute font-mono text-sm hover:opacity-100 hover:text-matrixGreen hover:scale-110 hover:tracking-widest transition-all duration-300 select-none pointer-events-auto cursor-help mix-blend-overlay md:mix-blend-normal"
          style={{
            top: `${frag.y}%`,
            left: `${frag.x}%`,
            color: frag.color,
            opacity: 0, // Começa invisível, controlado pela animação
            animation: `glitch-entry 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${frag.delay}s forwards`
          }}
        >
          [{frag.text}]
        </div>
      ))}

      {/* Persistent Call to Action */}
      <div className="fixed bottom-12 right-12 z-50">
        <NeobrutalistButton variant="matrix" onClick={() => window.location.reload()}>
          Reiniciar Campo
        </NeobrutalistButton>
      </div>

      <style>{`
        @keyframes glitch-entry {
          0% {
            opacity: 0;
            transform: translate(-10px, 0) skewX(60deg) scaleY(0.1);
            filter: blur(5px);
          }
          20% {
            opacity: 1;
            transform: translate(5px, 0) skewX(-20deg) scaleY(1.2);
            filter: blur(0);
            color: ${COLORS.matrixGreen};
          }
          40% {
            transform: translate(-2px, 0) skewX(10deg);
            opacity: 0.8;
          }
          60% {
            transform: translate(0, 0) skewX(0);
            opacity: 1;
          }
          80% {
            opacity: 0.5;
          }
          100% {
            opacity: 0.3; /* Estado final de repouso */
            transform: translate(0, 0);
          }
        }
      `}</style>
    </div>
  );
};

export default FieldView;
