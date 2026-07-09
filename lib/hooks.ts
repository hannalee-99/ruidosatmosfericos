
import { useState, useEffect, useCallback } from 'react';
import { storage } from './storage';

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
        
        // Carrega o initialData dinamicamente apenas quando necessário
        // Isso remove o peso dos dados do bundle principal do site
        const { INITIAL_DATA } = await import('../initialData');
        const codeVersion = INITIAL_DATA.lastUpdated || 0;

        // Sempre tenta buscar os dados mais recentes do servidor primeiro
        let serverWorks = null;
        let serverSignals = null;
        try {
          const resWorks = await fetch('/api/works');
          if (resWorks.ok) serverWorks = await resWorks.json();
          const resSignals = await fetch('/api/signals');
          if (resSignals.ok) serverSignals = await resSignals.json();
        } catch (err) {
          console.warn("Não foi possível buscar dados do servidor, usando dados locais de seed:", err);
        }

        const finalWorks = serverWorks || INITIAL_DATA.works;
        const finalSignals = serverSignals || INITIAL_DATA.signals;

        if (codeVersion > lastSync || serverWorks || serverSignals) {
          console.log("Detectada sincronização de dados. Atualizando base local...");
          
          if (finalWorks) {
            // Limpa antigos para garantir integridade caso venha do servidor
            const currentWorks = await storage.getAll('works');
            for (const w of currentWorks) await storage.delete('works', w.id);
            for (const w of finalWorks) await storage.save('works', w);
          }
          if (finalSignals) {
            const currentSignals = await storage.getAll('signals');
            for (const s of currentSignals) await storage.delete('signals', s.id);
            for (const s of finalSignals) await storage.save('signals', s);
          }
          
          if (codeVersion > lastSync) {
            if (INITIAL_DATA.about.profile) {
              await storage.save('about', INITIAL_DATA.about.profile);
            }
            if (INITIAL_DATA.about.connect_config) {
              await storage.save('about', INITIAL_DATA.about.connect_config);
            }
            if (INITIAL_DATA.about.landing_manifesto) {
              await storage.save('about', INITIAL_DATA.about.landing_manifesto);
            }
            if (INITIAL_DATA.about.ecos_config) {
              await storage.save('about', INITIAL_DATA.about.ecos_config);
            }
            if (INITIAL_DATA.about.seo_config) {
              await storage.save('about', INITIAL_DATA.about.seo_config);
            }
            localStorage.setItem('ra_last_sync', codeVersion.toString());
          }
          console.log("Sincronização concluída.");
        } else {
          const works = await storage.getAll('works');
          if (works.length === 0) {
            for (const w of finalWorks) await storage.save('works', w);
            for (const s of finalSignals) await storage.save('signals', s);
            if (INITIAL_DATA.about.profile) await storage.save('about', INITIAL_DATA.about.profile);
            if (INITIAL_DATA.about.connect_config) await storage.save('about', INITIAL_DATA.about.connect_config);
            if (INITIAL_DATA.about.landing_manifesto) await storage.save('about', INITIAL_DATA.about.landing_manifesto);
            if (INITIAL_DATA.about.ecos_config) await storage.save('about', INITIAL_DATA.about.ecos_config);
            if (INITIAL_DATA.about.seo_config) await storage.save('about', INITIAL_DATA.about.seo_config);
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
