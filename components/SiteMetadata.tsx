
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

  // Helper para atualizar tags com segurança
  const setMeta = (property: string, content: string, attributeName: 'name' | 'property' = 'property') => {
    if (!content) return;
    
    let tag = document.querySelector(`meta[${attributeName}="${property}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attributeName, property);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  };

  // Aplica SEO e Open Graph
  useEffect(() => {
    if (!config) return;

    // --- BASE SEO ---
    // Atualiza Título apenas se não estiver em página específica (evita sobrescrever títulos de posts muito rápido)
    if (document.title === 'ruídos atmosféricos' && config.siteTitle) {
      document.title = config.siteTitle;
    }

    // Meta Description
    setMeta('description', config.siteDescription || '', 'name');
    
    // Meta Keywords
    if (config.siteKeywords) {
        setMeta('keywords', config.siteKeywords, 'name');
    }

    // --- PROTOCOLO OPEN GRAPH (FB, LinkedIn, WhatsApp) ---
    setMeta('og:type', 'website');
    setMeta('og:url', window.location.href);
    setMeta('og:site_name', config.siteName || config.siteTitle || 'ruídos atmosféricos');
    setMeta('og:title', config.siteTitle || 'ruídos atmosféricos');
    setMeta('og:description', config.siteDescription || '');

    // OG Image Global (só define se não tiver query string, para não sobrescrever card de obras)
    if (config.ogImageUrl && !window.location.search.includes('?')) {
        setMeta('og:image', config.ogImageUrl);
    }

    // --- TWITTER CARDS ---
    setMeta('twitter:card', 'summary_large_image', 'name');
    setMeta('twitter:title', config.siteTitle || 'ruídos atmosféricos', 'name');
    setMeta('twitter:description', config.siteDescription || '', 'name');
    
    if (config.ogImageUrl && !window.location.search.includes('?')) {
        setMeta('twitter:image', config.ogImageUrl, 'name');
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
