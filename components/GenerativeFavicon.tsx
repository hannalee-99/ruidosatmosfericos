
import { useEffect } from 'react';
import { COLORS } from '../constants';

const GenerativeFavicon = () => {
  useEffect(() => {
    const generateFavicon = () => {
      // Parâmetros de Desequilíbrio Controlado
      // Gera valores aleatórios para garantir que cada sessão tenha uma "assinatura" única
      const seed = Math.floor(Math.random() * 1000);
      const turbulenceFreq = 0.15 + Math.random() * 0.25; // Entre 0.15 e 0.40 (Ruído atmosférico)
      const displacementScale = 8 + Math.random() * 12;   // Distorção da forma
      
      // Cor codificada para URL
      const matrixGreenEncoded = encodeURIComponent(COLORS.matrixGreen); // #9ff85d
      const blackEncoded = encodeURIComponent('#050505');

      // Construção do SVG
      // 1. Fundo Preto (Vazio)
      // 2. Filtro de Turbulência (Ruído)
      // 3. Camadas de Matéria (Círculos distorcidos)
      // 4. Ponto de Estabilidade (Centro sólido)
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

          <!-- Camada Atmosférica (Ruído de Fundo) -->
          <g filter="url(#atmosphere-${seed})">
            <circle cx="32" cy="32" r="24" fill="${matrixGreenEncoded}" opacity="0.3"/>
          </g>

          <!-- Camada de Matéria (Forma Principal) -->
          <g filter="url(#atmosphere-${seed})">
            <circle cx="32" cy="32" r="16" fill="none" stroke="${matrixGreenEncoded}" stroke-width="3" opacity="0.9"/>
          </g>

          <!-- Núcleo (Sinal Estável) -->
          <circle cx="32" cy="32" r="5" fill="${matrixGreenEncoded}" filter="url(#glow-${seed})"/>
        </svg>
      `.trim().replace(/\s+/g, ' '); // Remove espaços extras para o Data URI

      // Atualiza o DOM
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
  }, []);

  return null; // Componente lógico, sem renderização visual no corpo
};

export default GenerativeFavicon;
