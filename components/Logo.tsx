
import React from 'react';

interface LogoProps {
  size?: number;
  color?: string;
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, color = 'currentColor', className = '' }) => {
  // IDs únicos para evitar conflitos de filtro se houver múltiplos logos
  const idSuffix = Math.random().toString(36).substr(2, 9);
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
    >
      <defs>
        <filter id={`glitch-${idSuffix}`}>
           <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="1" result="warp">
             <animate attributeName="baseFrequency" values="0.15;0.05;0.15" dur="8s" repeatCount="indefinite"/>
           </feTurbulence>
           <feDisplacementMap in="SourceGraphic" in2="warp" scale="8" />
        </filter>
      </defs>

      <g filter={`url(#glitch-${idSuffix})`}>
         {/* Anel Externo Ruído */}
         <circle cx="50" cy="50" r="40" stroke={color} strokeWidth="1" strokeDasharray="4 2" opacity="0.5">
            <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="60s" repeatCount="indefinite"/>
         </circle>
         
         {/* Núcleo Sólido */}
         <circle cx="50" cy="50" r="20" fill={color} opacity="0.9" />
         
         {/* Interferência Central (Pupila/Vazio) */}
         <circle cx="50" cy="50" r="8" fill="black" className="mix-blend-destination-out" />
      </g>

      {/* Linha de Sinal Horizontal */}
      <line x1="0" y1="50" x2="100" y2="50" stroke={color} strokeWidth="1" opacity="0.3">
        <animate attributeName="opacity" values="0.3;0;0.3" dur="0.2s" repeatCount="indefinite" />
      </line>
    </svg>
  );
};

export default Logo;
