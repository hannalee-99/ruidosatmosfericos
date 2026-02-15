
import { useEffect } from 'react';
import { COLORS } from '../constants';
import { storage } from '../lib/storage';

const GenerativeFavicon = () => {
  useEffect(() => {
    const applyFavicon = async () => {
      try {
        // Primeiro, tenta carregar o favicon customizado do banco
        const profile = await storage.get('about', 'profile');
        
        if (profile && profile.faviconUrl && profile.faviconUrl.trim() !== '') {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = profile.faviconUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = profile.faviconUrl;
            document.head.appendChild(newLink);
          }
          return; // Favicon customizado aplicado, encerra
        }
      } catch (e) {
        console.error("Erro ao carregar favicon customizado:", e);
      }

      // Se não houver customizado, gera o randômico (com delay para não travar)
      setTimeout(() => {
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
      }, 500);
    };

    applyFavicon();
  }, []);

  return null; 
};

export default GenerativeFavicon;
