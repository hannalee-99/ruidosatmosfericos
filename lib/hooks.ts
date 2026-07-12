
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

        const isCodeUpdated = codeVersion > lastSync;

        if (isCodeUpdated) {
          console.log(`[DataSeeding] Código atualizado detectado (versão ${codeVersion} > ${lastSync}). Forçando atualização dos dados locais e do servidor.`);
          
          // 1. Remover itens locais órfãos que não estão mais no INITIAL_DATA
          const initialWorksIds = new Set((INITIAL_DATA.works || []).map((w: any) => w.id));
          for (const lw of localWorks) {
            if (!initialWorksIds.has(lw.id)) {
              await storage.delete('works', lw.id);
            }
          }
          const initialSignalsIds = new Set((INITIAL_DATA.signals || []).map((s: any) => s.id));
          for (const ls of localSignals) {
            if (!initialSignalsIds.has(ls.id)) {
              await storage.delete('signals', ls.id);
            }
          }

          // 2. Salvar todos do INITIAL_DATA no IndexedDB
          if (INITIAL_DATA.works) {
            for (const w of INITIAL_DATA.works) {
              await storage.save('works', w);
            }
          }
          if (INITIAL_DATA.signals) {
            for (const s of INITIAL_DATA.signals) {
              await storage.save('signals', s);
            }
          }

          // 3. Persistir nova versão no servidor
          try {
            await fetch('/api/save-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'works', data: INITIAL_DATA.works })
            });
            await fetch('/api/save-data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'signals', data: INITIAL_DATA.signals })
            });
          } catch (e) {
            console.error("Erro ao sincronizar INITIAL_DATA atualizado para o servidor:", e);
          }
        } else {
          // Sincronização em estado normal (codeVersion <= lastSync)
          if (serverFetched) {
            // Sincronização estrita com o servidor (deleta localmente o que foi deletado do servidor)
            if (serverWorks !== null) {
              const serverWorksIds = new Set(serverWorks.map((w: any) => w.id));
              for (const lw of localWorks) {
                if (!serverWorksIds.has(lw.id)) {
                  await storage.delete('works', lw.id);
                }
              }
              for (const w of serverWorks) {
                await storage.save('works', w);
              }
            }

            if (serverSignals !== null) {
              const serverSignalsIds = new Set(serverSignals.map((s: any) => s.id));
              for (const ls of localSignals) {
                if (!serverSignalsIds.has(ls.id)) {
                  await storage.delete('signals', ls.id);
                }
              }
              for (const s of serverSignals) {
                await storage.save('signals', s);
              }
            }
          } else {
            // Se o servidor não pôde ser consultado, carrega do INITIAL_DATA sem apagar locais
            if (INITIAL_DATA.works) {
              for (const w of INITIAL_DATA.works) {
                await storage.save('works', w);
              }
            }
            if (INITIAL_DATA.signals) {
              for (const s of INITIAL_DATA.signals) {
                await storage.save('signals', s);
              }
            }
          }
        }

        // Sincroniza metadados estruturais do 'about' apenas se houver atualização de código ou se o bio_config estiver ausente
        const existingBioConfig = await storage.get('about', 'bio_config');
        const forceBioConfigSync = !existingBioConfig;

        if (isCodeUpdated || forceBioConfigSync) {
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
          if (INITIAL_DATA.about.bio_config) {
            await storage.save('about', INITIAL_DATA.about.bio_config);
          }
          if (INITIAL_DATA.about.seo_config) {
            await storage.save('about', INITIAL_DATA.about.seo_config);
          }
          localStorage.setItem('ra_last_sync', Math.max(codeVersion, lastSync || 0).toString());
        }

        console.log("Sincronização inteligente concluída.");
      } catch (e) {
        console.error("Data seed error", e);
      }
    };
    seed();
  }, []);
};
