
import { useState, useEffect } from 'react';
import { storage } from './storage';
import { INITIAL_DATA } from '../initialData';

export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  return { isDarkMode, toggleTheme };
};

export const useDataSeeding = () => {
  useEffect(() => {
    const seed = async () => {
      try {
        const works = await storage.getAll('works');
        if (works.length === 0) {
          for (const w of INITIAL_DATA.works) await storage.save('works', w);
        }
        const signals = await storage.getAll('signals');
        if (signals.length === 0) {
          for (const s of INITIAL_DATA.signals) await storage.save('signals', s);
        }
        const profile = await storage.get('about', 'profile');
        if (!profile && INITIAL_DATA.about.profile) await storage.save('about', INITIAL_DATA.about.profile);
        
        const config = await storage.get('about', 'connect_config');
        if (!config && INITIAL_DATA.about.connect_config) await storage.save('about', INITIAL_DATA.about.connect_config);
      } catch (e) {
        console.error("Data seed error", e);
      }
    };
    seed();
  }, []);
};
