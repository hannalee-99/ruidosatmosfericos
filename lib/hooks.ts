
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
        const { INITIAL_DATA } = await import('../initialData');
        const codeVersion = INITIAL_DATA.lastUpdated || 0;

        // 1. Obter dados locais atuais no IndexedDB
        const localWorks = await storage.getAll('works');
        const localSignals = await storage.getAll('signals');

        // 2. Tentar obter os dados mais atualizados do servidor
        let serverWorks = null;
        let serverSignals = null;
        let serverFetched = false;

        try {
          const resWorks = await fetch('/api/works');
          if (resWorks.ok) {
            serverWorks = await resWorks.json();
            serverFetched = true;
          }
          const resSignals = await fetch('/api/signals');
          if (resSignals.ok) {
            serverSignals = await resSignals.json();
            serverFetched = true;
          }
        } catch (err) {
          console.warn("Não foi possível buscar dados do servidor, usando dados locais de seed:", err);
        }

        const finalWorks = serverWorks || INITIAL_DATA.works;
        const finalSignals = serverSignals || INITIAL_DATA.signals;

        // 3. Sincronização inteligente NÃO-DESTRUTIVA (Upsert)
        // Salva os dados do servidor ou seed localmente sem apagar os outros existentes
        if (finalWorks) {
          for (const w of finalWorks) {
            await storage.save('works', w);
          }
        }
        if (finalSignals) {
          for (const s of finalSignals) {
            await storage.save('signals', s);
          }
        }

        // 4. Sincronização Automática Servidor-Cliente Bidirecional
        // Se temos novos registros locais no IndexedDB que não estão no servidor,
        // nós os enviamos ao servidor para mantê-lo atualizado e persistido.
        if (serverFetched) {
          const updatedLocalWorks = await storage.getAll('works');
          const updatedLocalSignals = await storage.getAll('signals');

          const serverWorksIds = new Set((serverWorks || []).map((w: any) => w.id));
          const hasNewLocalWorks = updatedLocalWorks.some(w => !serverWorksIds.has(w.id));

          const serverSignalsIds = new Set((serverSignals || []).map((s: any) => s.id));
          const hasNewLocalSignals = updatedLocalSignals.some(s => !serverSignalsIds.has(s.id));

          if (hasNewLocalWorks && serverWorks !== null) {
            console.log("Detectadas obras locais novas. Sincronizando com o servidor...");
            try {
              await fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'works', data: updatedLocalWorks })
              });
            } catch (e) {
              console.error("Erro ao sincronizar obras locais para o servidor:", e);
            }
          }

          if (hasNewLocalSignals && serverSignals !== null) {
            console.log("Detectados posts de sinais locais novos. Sincronizando com o servidor...");
            try {
              await fetch('/api/save-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'signals', data: updatedLocalSignals })
              });
            } catch (e) {
              console.error("Erro ao sincronizar sinais locais para o servidor:", e);
            }
          }
        }

        // Sincroniza metadados estruturais do 'about' apenas se houver atualização de código
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

        console.log("Sincronização inteligente concluída.");
      } catch (e) {
        console.error("Data seed error", e);
      }
    };
    seed();
  }, []);
};
