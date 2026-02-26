
import { useEffect } from 'react';
import { storage } from '../lib/storage';

const FaviconManager = () => {
  useEffect(() => {
    const applyFavicon = async () => {
      try {
        // Busca o perfil no IndexedDB para obter o faviconUrl definido no backoffice
        const profile = await storage.get('about', 'profile');
        
        if (profile && profile.faviconUrl && profile.faviconUrl.trim() !== '') {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = profile.faviconUrl;
            // Se for SVG, atualiza o tipo também
            if (profile.faviconUrl.includes('image/svg+xml') || profile.faviconUrl.endsWith('.svg')) {
              link.type = 'image/svg+xml';
            } else {
              link.type = 'image/x-icon';
            }
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = profile.faviconUrl;
            document.head.appendChild(newLink);
          }
        }
      } catch (e) {
        console.error("Erro ao aplicar favicon do backoffice:", e);
      }
    };

    applyFavicon();
  }, []);

  return null; 
};

export default FaviconManager;
