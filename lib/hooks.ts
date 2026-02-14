
import { useState, useEffect } from 'react';
import { storage } from './storage';
import { INITIAL_DATA } from '../initialData';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  // A lógica de manipulação da classe .light-mode no body foi movida para o App.tsx
  // para garantir que o Backoffice permaneça sempre em modo escuro.
  
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  return { isDarkMode, toggleTheme };
};

export const useDataSeeding = () => {
  useEffect(() => {
    const seed = async () => {
      try {
        const lastSync = parseInt(localStorage.getItem('ra_last_sync') || '0');
        const codeVersion = INITIAL_DATA.lastUpdated || 0;

        // Se o código for mais novo que o que o navegador já sincronizou, atualiza
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
          if (INITIAL_DATA.about.sensor_metrics) {
            await storage.save('about', INITIAL_DATA.about.sensor_metrics);
          }

          localStorage.setItem('ra_last_sync', codeVersion.toString());
          console.log("Sincronização concluída.");
        } else {
          // Se for a primeira vez e não tiver dados (fallback), faz o seed básico
          const works = await storage.getAll('works');
          if (works.length === 0) {
            for (const w of INITIAL_DATA.works) await storage.save('works', w);
            for (const s of INITIAL_DATA.signals) await storage.save('signals', s);
            if (INITIAL_DATA.about.profile) await storage.save('about', INITIAL_DATA.about.profile);
            if (INITIAL_DATA.about.connect_config) await storage.save('about', INITIAL_DATA.about.connect_config);
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
