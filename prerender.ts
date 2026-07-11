// Gera páginas HTML estáticas por post (obras e sinais) com as meta tags
// de redes sociais já embutidas. Roda DEPOIS do `vite build`, sobre o
// dist/index.html final (com os assets já com hash).
//
// Isso faz o compartilhamento social funcionar em qualquer host estático
// (Vercel, Netlify, etc.) sem precisar de um servidor Node em produção:
// o robô do WhatsApp/Facebook/X/LinkedIn recebe um HTML real já com a
// imagem, título e descrição corretos do post.

import fs from 'fs';
import path from 'path';
import { INITIAL_DATA } from './initialData';
import { resolveSeoMeta, injectSeoIntoHtml } from './seo';

const DIST = path.join(process.cwd(), 'dist');
const TEMPLATE_PATH = path.join(DIST, 'index.html');

function loadJsonOr<T>(fileName: string, fallback: T): T {
  try {
    const p = path.join(process.cwd(), fileName);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf-8')) as T;
    }
  } catch (e) {
    console.warn(`[prerender] Não foi possível ler ${fileName}, usando initialData.`, e);
  }
  return fallback;
}

const SITE_URL = 'https://ruidosatmosfericos.online';

function writePage(routePath: string, html: string) {
  // /materia/slug  ->  dist/materia/slug/index.html  (URL limpa)
  const outDir = path.join(DIST, routePath.replace(/^\//, ''));
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf-8');
}

// Gera um sitemap.xml apenas com URLs limpas e reais (que o Google indexa).
// Substitui o sitemap estático antigo, que usava URLs com hash (ignoradas
// pelo Google).
function writeSitemap(routes: string[]) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map(
      (r) =>
        `  <url>\n    <loc>${SITE_URL}${r}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
    )
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml, 'utf-8');
  console.log(`[prerender] sitemap.xml gerado com ${routes.length} URLs.`);
}

function run() {
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error('[prerender] dist/index.html não encontrado. Rode o vite build antes.');
    process.exit(1);
  }

  let template = fs.readFileSync(TEMPLATE_PATH, 'utf-8');

  // Auto-cura de roteamento: garante que a rota /bio esteja no redirect do
  // index.html (o AI Studio nem sempre inclui 'bio' em validViews, o que faria
  // o link da bio do Instagram cair na home em vez de abrir a página bio).
  if (!/validViews\s*=\s*\[[^\]]*'bio'/.test(template)) {
    template = template.replace(
      /(var validViews = \[[^\]]*)\]/,
      `$1, 'bio']`
    );
  }

  const aboutSeo = INITIAL_DATA.about.seo_config;

  // Dados para o card dedicado da página bio (link-in-bio do Instagram).
  const bioCfg: any = (INITIAL_DATA.about as any).bio_config;
  const profile: any = INITIAL_DATA.about.profile;
  const bioMeta = {
    title: bioCfg?.profileTitle || undefined, // cai no nome do site se vazio
    description: bioCfg?.bio || undefined,
    image: profile?.imageUrl || aboutSeo?.image || undefined,
  };

  const works = loadJsonOr('works-db.json', INITIAL_DATA.works) as any[];
  const signals = loadJsonOr('signals-db.json', INITIAL_DATA.signals) as any[];

  let count = 0;
  const sitemapRoutes: string[] = ['/']; // home

  // Home: cura o próprio dist/index.html (canonical + remove og:image dims),
  // já que o index.html de origem é controlado pelo AI Studio e pode voltar
  // sem esses ajustes.
  const homeMeta = resolveSeoMeta('/', works, signals, aboutSeo);
  fs.writeFileSync(TEMPLATE_PATH, injectSeoIntoHtml(template, homeMeta), 'utf-8');

  // Bio: card dedicado (foto de perfil + bio) para o link da bio do Instagram.
  const bioSeo = resolveSeoMeta('/bio', works, signals, aboutSeo, bioMeta);
  writePage('/bio', injectSeoIntoHtml(template, bioSeo));
  sitemapRoutes.push('/bio');

  // Obras (matérias)
  for (const work of works) {
    if (work.isVisible === false) continue;
    const slug = work.slug || work.id;
    if (!slug) continue;
    const route = `/materia/${slug}`;
    const meta = resolveSeoMeta(route, works, signals, aboutSeo);
    writePage(route, injectSeoIntoHtml(template, meta));
    sitemapRoutes.push(route);
    count++;
  }

  // Sinais (matéria/blog) — gera tanto /sinais/ quanto /sinal/ por segurança
  for (const signal of signals) {
    if (signal.status && signal.status !== 'publicado') continue;
    const slug = signal.slug || signal.id;
    if (!slug) continue;
    for (const prefix of ['/sinais/', '/sinal/']) {
      const route = `${prefix}${slug}`;
      const meta = resolveSeoMeta(route, works, signals, aboutSeo);
      writePage(route, injectSeoIntoHtml(template, meta));
    }
    // Só a URL canônica (/sinais/) entra no sitemap; /sinal/ é alias
    sitemapRoutes.push(`/sinais/${slug}`);
    count++;
  }

  writeSitemap(sitemapRoutes);
  console.log(`[prerender] ${count} posts pré-renderizados com SEO em dist/.`);
}

run();
