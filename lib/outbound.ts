// Rastreador global de cliques em links de saída (externos).
//
// Dispara UM evento uniforme ("Outbound Click") tanto no Mixpanel quanto no
// GA4 para todo clique em <a> que leva para outro domínio — incluindo links
// renderizados dinamicamente pelo React e futuros links criados no AI Studio.
//
// Não substitui os eventos já existentes (Ecos usa "Outbound Link Clicked",
// Conectar usa "Social Link Clicked"); este é um evento novo e independente,
// então não há dupla contagem. Use "Outbound Click" como a métrica única e
// completa de "para onde meu tráfego sai".

import mixpanel from 'mixpanel-browser';

const SITE_HOSTS = ['ruidosatmosfericos.online', 'localhost', '127.0.0.1'];

function currentViewFromHash(): string {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').replace(/\/$/, '');
  return raw.split('/')[0] || 'home';
}

function externalDestination(href: string): URL | null {
  if (!href) return null;
  if (/^(#|\/#|mailto:|tel:|javascript:|data:)/i.test(href)) return null;
  try {
    const u = new URL(href, window.location.origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    const internal = SITE_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith('.' + h)
    );
    return internal ? null : u;
  } catch {
    return null;
  }
}

function handleClick(e: Event) {
  const target = e.target as Element | null;
  const anchor = target?.closest?.('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return;

  const href = anchor.getAttribute('href') || '';
  const dest = externalDestination(href);
  if (!dest) return;

  const linkText = (anchor.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  const from = currentViewFromHash();

  // Mixpanel
  try {
    mixpanel.track('Outbound Click', {
      'Destination URL': href,
      'Destination Host': dest.hostname,
      'Link Text': linkText,
      'Clicked From': from,
    });
  } catch {
    /* mixpanel ainda não inicializado — ignora */
  }

  // GA4 (gtag já carregado no index.html)
  try {
    (window as any).gtag?.('event', 'outbound_click', {
      link_url: href,
      link_domain: dest.hostname,
      link_text: linkText,
      clicked_from: from,
    });
  } catch {
    /* gtag indisponível — ignora */
  }
}

/**
 * Ativa o rastreamento global. Chame uma vez no boot do app.
 * Retorna uma função de cleanup.
 */
export function initOutboundTracking(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }
  // Fase de captura para pegar o clique mesmo se algo interromper a propagação.
  document.addEventListener('click', handleClick, true);
  document.addEventListener('auxclick', handleClick, true); // clique do meio (nova aba)
  return () => {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('auxclick', handleClick, true);
  };
}
