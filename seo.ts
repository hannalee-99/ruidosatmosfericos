// Lógica compartilhada de SEO / meta tags para redes sociais.
// Usada tanto pelo servidor de desenvolvimento (server.ts) quanto pelo
// script de prerender (prerender.ts) que gera o HTML estático de produção.

const SITE_URL = 'https://ruidosatmosfericos.online';
const SITE_NAME = 'ruídos atmosféricos';
const DEFAULT_IMAGE =
  'https://64.media.tumblr.com/2469fc83feaecaf0b7a97fa55f6793d6/670f92e2b0934e32-bb/s2048x3072/3b1cf9f39410af90a8d0607d572f83c0024b2472.jpg';
const DEFAULT_DESCRIPTION =
  'uma experiência imersiva de arte digital e manifesto artístico. registros de presença, sensações e desequilíbrio controlado entre o físico e o digital.';

export interface SeoMeta {
  title: string;
  description: string;
  image: string;
  url: string;
}

export function escapeHtmlAttr(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function getSignalDescription(signal: any): string {
  if (signal.seoDescription) return signal.seoDescription;
  if (signal.subtitle) return signal.subtitle;
  if (Array.isArray(signal.blocks)) {
    const textBlock = signal.blocks.find(
      (b: any) => (b.type === 'paragraph' || b.type === 'text') && b.content
    );
    if (textBlock && textBlock.content) {
      const clean = String(textBlock.content).replace(/\s+/g, ' ').trim();
      return clean.substring(0, 160) + (clean.length > 160 ? '...' : '');
    }
  }
  return '';
}

// Resolve o título, descrição e imagem corretos para uma dada rota.
export function resolveSeoMeta(
  reqPath: string,
  works: any[],
  signals: any[],
  aboutSeo?: { title?: string; description?: string; image?: string } | null
): SeoMeta {
  const cleanPath = reqPath.replace(/\/$/, ''); // remove barra final

  let title = aboutSeo?.title || SITE_NAME;
  let description = aboutSeo?.description || DEFAULT_DESCRIPTION;
  let image = aboutSeo?.image || DEFAULT_IMAGE;

  // Fallback: primeira obra em destaque, caso não haja imagem configurada
  if (!image || image.trim() === '') {
    const firstFeatured = works.find((w) => w.isFeatured && w.imageUrl);
    if (firstFeatured) image = firstFeatured.imageUrl;
  }

  const isMateria = cleanPath.startsWith('/materia/');
  const isSinais =
    cleanPath.startsWith('/sinais/') || cleanPath.startsWith('/sinal/');

  if (isMateria) {
    const slug = cleanPath.substring('/materia/'.length);
    const work = works.find((w) => w.slug === slug || w.id === slug);
    if (work) {
      title = `${work.seoTitle || work.title} — ${SITE_NAME}`;
      description =
        work.seoDescription || work.description || work.technique || description;
      image = work.seoImage || work.imageUrl || image;
    }
  } else if (isSinais) {
    const prefix = cleanPath.startsWith('/sinais/') ? '/sinais/' : '/sinal/';
    const slug = cleanPath.substring(prefix.length);
    const signal = signals.find((s) => s.slug === slug || s.id === slug);
    if (signal) {
      title = `${signal.seoTitle || signal.title} — ${SITE_NAME}`;
      description = getSignalDescription(signal) || description;
      image = signal.seoImage || signal.coverImageUrl || image;
    }
  }

  // Normaliza descrição multi-linha para uma linha limpa
  description = String(description).replace(/\s+/g, ' ').trim();

  return {
    title,
    description,
    image,
    url: `${SITE_URL}${cleanPath || '/'}`,
  };
}

// Injeta as meta tags resolvidas dentro de um HTML base.
export function injectSeoIntoHtml(html: string, meta: SeoMeta): string {
  const t = escapeHtmlAttr(meta.title);
  const d = escapeHtmlAttr(meta.description);
  const img = escapeHtmlAttr(meta.image);
  const url = escapeHtmlAttr(meta.url);

  let out = html;

  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${t}</title>`);
  out = out.replace(
    /<meta name="description" content="[^"]*">/i,
    `<meta name="description" content="${d}">`
  );
  // Canonical: substitui se existir; senão INSERE após o <title>.
  // (Auto-curável: se o index.html for reescrito sem o canonical, o
  // prerender o repõe no build.)
  if (/<link rel="canonical"[^>]*>/i.test(out)) {
    out = out.replace(
      /<link rel="canonical" href="[^"]*">/i,
      `<link rel="canonical" href="${url}">`
    );
  } else {
    out = out.replace(
      /(<title>[^<]*<\/title>)/i,
      `$1\n    <link rel="canonical" href="${url}">`
    );
  }

  out = out.replace(
    /<meta property="og:title" content="[^"]*">/i,
    `<meta property="og:title" content="${t}">`
  );
  out = out.replace(
    /<meta property="og:description" content="[^"]*">/i,
    `<meta property="og:description" content="${d}">`
  );
  out = out.replace(
    /<meta property="og:image" content="[^"]*">/i,
    `<meta property="og:image" content="${img}">`
  );
  out = out.replace(
    /<meta property="og:url" content="[^"]*">/i,
    `<meta property="og:url" content="${url}">`
  );

  out = out.replace(
    /<meta name="twitter:title" content="[^"]*">/i,
    `<meta name="twitter:title" content="${t}">`
  );
  out = out.replace(
    /<meta name="twitter:description" content="[^"]*">/i,
    `<meta name="twitter:description" content="${d}">`
  );
  out = out.replace(
    /<meta name="twitter:image" content="[^"]*">/i,
    `<meta name="twitter:image" content="${img}">`
  );
  out = out.replace(
    /<meta name="twitter:url" content="[^"]*">/i,
    `<meta name="twitter:url" content="${url}">`
  );

  // Remove dimensões fixas de og:image — erradas para imagens de proporção
  // variável; os robôs medem sozinhos. (Auto-curável: se o index.html
  // reintroduzir essas tags, o prerender as remove no build.)
  out = out.replace(
    /\s*<meta property="og:image:(?:width|height)" content="[^"]*">/gi,
    ''
  );

  return out;
}

export { SITE_URL, SITE_NAME };
