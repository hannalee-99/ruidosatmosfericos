
import { useEffect } from 'react';
import { COLORS } from '../constants';

const GenerativeFavicon = () => {
  useEffect(() => {
    // Otimização: Delay para não bloquear a thread principal durante o carregamento inicial da página
    const timeoutId = setTimeout(() => {
        const generateFavicon = () => {
          const seed = Math.floor(Math.random() * 1000);
          const turbulenceFreq = 0.15 + Math.random() * 0.25; 
          const displacementScale = 8 + Math.random() * 12;   
          
          const matrixGreenEncoded = encodeURIComponent(COLORS.matrixGreen); 
          const blackEncoded = encodeURIComponent('#050505');

          const svgString = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
              <rect width="64" height="64" fill="${blackEncoded}"/>
              
              <defs>
                <filter id="atmosphere-${seed}">
                  <feTurbulence type="fractalNoise" baseFrequency="${turbulenceFreq}" numOctaves="2" seed="${seed}"/>
                  <feDisplacementMap in="SourceGraphic" scale="${displacementScale}"/>
                </filter>
                <filter id="glow-${seed}">
                   <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                   <feMerge>
                       <feMergeNode in="coloredBlur"/>
                       <feMergeNode in="SourceGraphic"/>
                   </feMerge>
                </filter>
              </defs>

              <g filter="url(#atmosphere-${seed})">
                <circle cx="32" cy="32" r="24" fill="${matrixGreenEncoded}" opacity="0.3"/>
              </g>

              <g filter="url(#atmosphere-${seed})">
                <circle cx="32" cy="32" r="16" fill="none" stroke="${matrixGreenEncoded}" stroke-width="3" opacity="0.9"/>
              </g>

              <circle cx="32" cy="32" r="5" fill="${matrixGreenEncoded}" filter="url(#glow-${seed})"/>
            </svg>
          `.trim().replace(/\s+/g, ' '); 

          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = `data:image/svg+xml;utf8,${svgString}`;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = `data:image/svg+xml;utf8,${svgString}`;
            document.head.appendChild(newLink);
          }
        };

        generateFavicon();
    }, 1000); // 1 segundo de delay para priorizar renderização da UI

    return () => clearTimeout(timeoutId);
  }, []);

  return null; 
};

export default GenerativeFavicon;
