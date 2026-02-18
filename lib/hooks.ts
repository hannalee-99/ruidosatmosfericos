
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';
import { INITIAL_DATA } from '../initialData';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  return { isDarkMode, toggleTheme };
};

export const useMeta = () => {
  const updateMeta = useCallback((data: { 
    title?: string; 
    description?: string; 
    image?: string;
    url?: string;
  }) => {
    const siteName = 'ruídos atmosféricos';
    const finalTitle = data.title ? `${data.title} | ${siteName}` : siteName;
    
    // Atualiza o título do documento (browser tab)
    document.title = finalTitle.toLowerCase();

    // Protocolo OG e Twitter Meta Tags
    const metaMapping: Record<string, string | undefined> = {
      'description': data.description,
      // Open Graph / Facebook
      'og:site_name': siteName,
      'og:title': finalTitle,
      'og:description': data.description,
      'og:image': data.image,
      'og:url': data.url || window.location.href,
      'og:type': 'website',
      // Twitter
      'twitter:card': 'summary_large_image',
      'twitter:title': finalTitle,
      'twitter:description': data.description,
      'twitter:image': data.image,
    };

    Object.entries(metaMapping).forEach(([prop, content]) => {
      if (content === undefined || content === null) return;
      
      // Tenta encontrar por property (OG) ou name (Standard/Twitter)
      let element = document.querySelector(`meta[property="${prop}"]`) || 
                    document.querySelector(`meta[name="${prop}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        if (prop.startsWith('og:')) {
          element.setAttribute('property', prop);
        } else {
          element.setAttribute('name', prop);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    });
  }, []);

  const resetMeta = useCallback(() => {
    document.title = 'ruídos atmosféricos';
    // Em SPAs, idealmente voltamos para as metas base do index.html
  }, []);

  return { updateMeta, resetMeta };
};

export const useDataSeeding = () => {
  useEffect(() => {
    const seed = async () => {
      try {
        const lastSync = parseInt(localStorage.getItem('ra_last_sync') || '0');
        const codeVersion = INITIAL_DATA.lastUpdated || 0;

        if (codeVersion > lastSync) {
          console.log("Detectada nova versão do núcleo. Sincronizando...");
          
          if (INITIAL_DATA.works) {
            for (const w of INITIAL_DATA.works) await storage.save('works', w);
          }
          if (INITIAL_DATA.signals) {
            for (const s of INITIAL_DATA.signals) await storage.save('signals', s);
          }
          if (INITIAL_DATA.about.profile) {
            await storage.save('about', INITIAL_DATA.about.profile);
          }
          if (INITIAL_DATA.about.connect_config) {
            await storage.save('about', INITIAL_DATA.about.connect_config);
          }
          if (INITIAL_DATA.about.landing_manifesto) {
            await storage.save('about', INITIAL_DATA.about.landing_manifesto);
          }

          localStorage.setItem('ra_last_sync', codeVersion.toString());
          console.log("Sincronização concluída.");
        } else {
          const works = await storage.getAll('works');
          if (works.length === 0) {
            for (const w of INITIAL_DATA.works) await storage.save('works', w);
            for (const s of INITIAL_DATA.signals) await storage.save('signals', s);
            if (INITIAL_DATA.about.profile) await storage.save('about', INITIAL_DATA.about.profile);
            if (INITIAL_DATA.about.connect_config) await storage.save('about', INITIAL_DATA.about.connect_config);
            if (INITIAL_DATA.about.landing_manifesto) await storage.save('about', INITIAL_DATA.about.landing_manifesto);
            localStorage.setItem('ra_last_sync', codeVersion.toString());
          }
        }
      } catch (e) {
        console.error("Data seed error", e);
      }
    };
    seed();
  }, []);
};
