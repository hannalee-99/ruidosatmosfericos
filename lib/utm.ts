// Decorador global de UTM para links de saída.
//
// Adiciona parâmetros UTM automaticamente a TODO link (<a>) que aponta para
// fora do site, incluindo links renderizados dinamicamente pelo React e
// qualquer link novo que apareça depois. Um MutationObserver cuida disso.
//
// Regras:
// - só mexe em links http(s) para um domínio DIFERENTE do seu;
// - ignora âncoras internas (#/...), mailto:, tel:, etc.;
// - respeita UTMs que você já tenha colocado manualmente (não sobrescreve);
// - utm_content reflete a página onde o link foi clicado (ex.: ecos, conectar).

// ⚙️ Ajuste aqui como o tráfego aparece na sua análise:
const UTM_DEFAULTS: Record<string, string> = {
  utm_source: 'ruidosatmosfericos',
  utm_medium: 'site',
  utm_campaign: 'organico',
};

// Hosts considerados "internos" (não recebem UTM).
const SITE_HOSTS = ['ruidosatmosfericos.online', 'localhost', '127.0.0.1'];

function isExternalHttpUrl(href: string): boolean {
  if (!href) return false;
  if (/^(#|\/#|mailto:|tel:|javascript:|data:)/i.test(href)) return false;
  try {
    const u = new URL(href, window.location.origin);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    return !SITE_HOSTS.some(
      (h) => u.hostname === h || u.hostname.endsWith('.' + h)
    );
  } catch {
    return false;
  }
}

function currentViewFromHash(): string {
  const raw = (window.location.hash || '').replace(/^#\/?/, '').replace(/\/$/, '');
  const first = raw.split('/')[0];
  return first || 'home';
}

/**
 * Retorna a URL com os UTMs adicionados (se for link externo).
 * Pura — pode ser usada avulsa se necessário.
 */
export function appendUtm(href: string, extra?: Record<string, string>): string {
  if (!isExternalHttpUrl(href)) return href;
  try {
    const u = new URL(href, window.location.origin);
    // Respeita UTMs definidos manualmente.
    if (u.searchParams.has('utm_source')) return href;
    const params = {
      ...UTM_DEFAULTS,
      utm_content: currentViewFromHash(),
      ...extra,
    };
    for (const [k, v] of Object.entries(params)) {
      if (v) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    return href;
  }
}

function decorateAnchor(a: HTMLAnchorElement) {
  // Guarda o href original (uma vez) para poder re-decorar ao trocar de página.
  const original = a.dataset.utmOrig ?? a.getAttribute('href') ?? '';
  if (!isExternalHttpUrl(original)) return;
  if (a.dataset.utmOrig === undefined) a.dataset.utmOrig = original;
  const decorated = appendUtm(original);
  if (decorated !== a.getAttribute('href')) a.setAttribute('href', decorated);
}

function decorate(root: ParentNode) {
  if (!(root as Element).querySelectorAll) return;
  (root as Element)
    .querySelectorAll('a[href]')
    .forEach((el) => decorateAnchor(el as HTMLAnchorElement));
}

/**
 * Ativa o decorador. Chame uma vez no boot do app.
 * Retorna uma função de cleanup.
 */
export function initUtm(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  decorate(document);

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      m.addedNodes.forEach((n) => {
        if (n.nodeType === 1) decorate(n as Element);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Ao trocar de página, re-decora para atualizar o utm_content.
  const onNav = () => decorate(document);
  window.addEventListener('hashchange', onNav);

  return () => {
    observer.disconnect();
    window.removeEventListener('hashchange', onNav);
  };
}
