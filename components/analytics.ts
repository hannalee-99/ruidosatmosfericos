import mixpanel from 'mixpanel-browser';
import { MIXPANEL_TOKEN } from '../constants';

const isDev = false; // Mude para true se quiser ver logs no console localmente

export const Analytics = {
  init: () => {
    if (MIXPANEL_TOKEN && (MIXPANEL_TOKEN as string) !== "SEU_TOKEN_AQUI") {
      try {
        mixpanel.init(MIXPANEL_TOKEN, {
          debug: isDev,
          track_pageview: true,
          persistence: 'localStorage',
          ignore_dnt: true // Opcional: ignora Do Not Track se necessário para analytics crítica
        });
        console.log("Mixpanel initialized.");
      } catch (e) {
        console.error("Mixpanel init failed:", e);
      }
    } else {
      console.warn("Mixpanel Token não configurado.");
    }
  },

  track: (eventName: string, properties?: any) => {
    if (MIXPANEL_TOKEN && (MIXPANEL_TOKEN as string) !== "SEU_TOKEN_AQUI") {
      try {
        mixpanel.track(eventName, properties);
      } catch (e) {
        console.error("Erro ao enviar evento Mixpanel:", e);
      }
    } else if (isDev) {
        console.log(`[Analytics Dev] Event: ${eventName}`, properties);
    }
  },

  identify: (id: string) => {
    if (MIXPANEL_TOKEN && (MIXPANEL_TOKEN as string) !== "SEU_TOKEN_AQUI") {
        mixpanel.identify(id);
    }
  }
};