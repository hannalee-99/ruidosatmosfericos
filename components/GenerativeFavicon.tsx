
import { useEffect } from 'react';
import { storage } from '../lib/storage';

const GenerativeFavicon = () => {
  useEffect(() => {
    const applyFavicon = async () => {
      try {
        // Busca o perfil no IndexedDB
        const profile = await storage.get('about', 'profile');
        
        if (profile && profile.faviconUrl && profile.faviconUrl.trim() !== '') {
          const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
          if (link) {
            link.href = profile.faviconUrl;
          } else {
            const newLink = document.createElement('link');
            newLink.rel = 'icon';
            newLink.href = profile.faviconUrl;
            document.head.appendChild(newLink);
          }
        }
      } catch (e) {
        console.error("Erro ao aplicar favicon customizado:", e);
      }
    };

    applyFavicon();
    
    // Ouve mudanças no storage para atualização em tempo real se necessário
    // (Simplificado: apenas no mount já resolve a maioria dos casos de navegação)
  }, []);

  return null; 
};

export default GenerativeFavicon;
