import mixpanel from 'mixpanel-browser';
import { MIXPANEL_TOKEN } from '../constants';

const isDev = false; // Mude para true se não quiser rastrear localmente

// Tipagem global para o Mixpanel injetado via script tag
declare global {
  interface Window {
    mixpanel: any;
  }
}

export const Analytics = {
  init: () => {
    // Se o Mixpanel já foi inicializado pelo script no HTML (Autocapture), não fazemos nada.
    if (typeof window !== 'undefined' && window.mixpanel && window.mixpanel.__SV) {
      console.log("Mixpanel (Global) detectado e ativo.");
      return;
    }

    // Fallback: Inicializa via módulo se o script do HTML falhar ou não estiver presente (dev/teste)
    if (MIXPANEL_TOKEN && (MIXPANEL_TOKEN as string) !== "SEU_TOKEN_AQUI") {
      mixpanel.init(MIXPANEL_TOKEN, {
        debug: isDev,
        track_pageview: true,
        persistence: 'localStorage'
      });
    } else {
      console.warn("Mixpanel Token não configurado ou script ausente.");
    }
  },

  track: (eventName: string, properties?: any) => {
    if (typeof window !== 'undefined' && window.mixpanel) {
      // Usa a instância global do Mixpanel (do snippet HTML)
      try {
        window.mixpanel.track(eventName, properties);
      } catch (e) {
        console.error("Erro ao enviar evento Mixpanel Global:", e);
      }
    } else if (MIXPANEL_TOKEN && (MIXPANEL_TOKEN as string) !== "SEU_TOKEN_AQUI") {
      // Fallback para a instância do módulo
      try {
        mixpanel.track(eventName, properties);
      } catch (e) {
        console.error("Erro ao enviar evento Mixpanel Module:", e);
      }
    } else if (isDev) {
        console.log(`[Analytics Dev] Event: ${eventName}`, properties);
    }
  },

  identify: (id: string) => {
    if (typeof window !== 'undefined' && window.mixpanel) {
        window.mixpanel.identify(id);
    } else if (MIXPANEL_TOKEN && (MIXPANEL_TOKEN as string) !== "SEU_TOKEN_AQUI") {
        mixpanel.identify(id);
    }
  }
};
