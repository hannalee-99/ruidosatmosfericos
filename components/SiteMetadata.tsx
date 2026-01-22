
import { useEffect, useState } from 'react';
import { COLORS } from '../constants';
import { storage } from './storage';
import { SiteConfig } from '../types';

const SiteMetadata = () => {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  // Carrega configurações do Backoffice
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const stored = await storage.get('about', 'site_config');
        if (stored) {
          setConfig(stored);
        }
      } catch (e) {
        console.error("Erro ao carregar configurações do site", e);
      }
    };
    loadConfig();
  }, []);

  // Aplica SEO Global (Título e Descrição)
  useEffect(() => {
    if (!config) return;

    // Atualiza Título se não estiver em uma página específica (lógica de página específica sobrescreve isso depois)
    if (document.title === 'ruídos atmosféricos' && config.siteTitle) {
      document.title = config.siteTitle;
    }

    // Atualiza Meta Description
    const metaDesc = document.querySelector("meta[name='description']");
    if (metaDesc && config.siteDescription) {
      metaDesc.setAttribute("content", config.siteDescription);
    } else if (!metaDesc && config.siteDescription) {
      const meta = document.createElement('meta');
      meta.name = "description";
      meta.content = config.siteDescription;
      document.head.appendChild(meta);
    }

    // Atualiza OG Image Global
    if (config.ogImageUrl) {
       let ogImage = document.querySelector("meta[property='og:image']");
       if (!ogImage) {
          ogImage = document.createElement('meta');
          ogImage.setAttribute("property", "og:image");
          document.head.appendChild(ogImage);
       }
       // Só atualiza se não for um deep link de obra/sinal (que já setam a imagem)
       if (!window.location.search.includes('?')) {
           ogImage.setAttribute("content", config.ogImageUrl);
       }
    }

  }, [config]);

  // Lógica do Favicon (Customizado ou Generativo)
  useEffect(() => {
    const updateFavicon = () => {
      const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement || document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);

      // CASO 1: Favicon Customizado (Upload do Usuário)
      if (config?.faviconUrl) {
        link.href = config.faviconUrl;
        return;
      }

      // CASO 2: Favicon Generativo (Padrão do Sistema)
      // Gera valores aleatórios para garantir que cada sessão tenha uma "assinatura" única
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

      link.href = `data:image/svg+xml;utf8,${svgString}`;
    };

    updateFavicon();
  }, [config]);

  return null;
};

export default SiteMetadata;
