
import React, { memo } from 'react';

interface OrganicShapeProps {
  color: string;
  size: number;
  top: string;
  left: string;
  delay: string;
  opacity?: number;
}

const OrganicShape: React.FC<OrganicShapeProps> = memo(({ 
  color, 
  size, 
  top, 
  left, 
  delay,
  opacity = 0.6
}) => {
  // Geramos um ID único para o filtro baseado no delay para evitar conflitos
  const filterId = `lava-filter-${delay.replace(/[^a-z0-9]/gi, '')}`;
  const noiseId = `noise-${delay.replace(/[^a-z0-9]/gi, '')}`;

  return (
    <div 
      className="absolute pointer-events-none mix-blend-screen will-change-transform"
      style={{
        top, left,
        width: `${size}px`, height: `${size}px`,
        opacity,
        animation: `lava-float 40s ease-in-out infinite alternate ${delay}`,
      }}
    >
      <svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          {/* Filtro de distorção orgânica que simula o efeito de fluido sem precisar de IA */}
          <filter id={filterId}>
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.015" 
              numOctaves="3" 
              result="noise" 
            >
              <animate 
                attributeName="baseFrequency" 
                values="0.015;0.02;0.015" 
                dur="30s" 
                repeatCount="indefinite" 
              />
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="60" />
          </filter>

          {/* Filtro de textura granulada para dar profundidade */}
          <filter id={noiseId}>
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" opacity="0.5" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="multiply" />
          </filter>
        </defs>

        <g filter={`url(#${filterId})`}>
          <circle 
            cx="250" cy="250" r="160" 
            fill={color}
            style={{ 
              animation: `lava-morph 25s linear infinite ${delay}`,
              transformOrigin: 'center'
            }} 
          />
          {/* Camada de brilho interno para simular volume */}
          <circle 
            cx="220" cy="220" r="80" 
            fill="white" 
            opacity="0.2" 
            filter="blur(30px)"
          />
        </g>
      </svg>
      
      <style>{`
        @keyframes lava-float {
          0% { transform: translate(0, 0) rotate(0deg) scale(1); }
          50% { transform: translate(40px, -20px) rotate(5deg) scale(1.1); }
          100% { transform: translate(-20px, 40px) rotate(-5deg) scale(0.95); }
        }
        @keyframes lava-morph {
          0% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; transform: rotate(0deg); }
          50% { border-radius: 60% 40% 40% 60% / 60% 60% 40% 40%; transform: rotate(180deg); }
          100% { border-radius: 40% 60% 60% 40% / 40% 40% 60% 60%; transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

export default OrganicShape;
